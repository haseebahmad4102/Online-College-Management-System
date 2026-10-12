import { useEffect, useState } from 'react';
import api from '../../api/client';
import { Card, Table, Badge, Button, Input, Select, Modal, Field, Textarea, useFlash, errText, fmtDateTime } from '../../components/ui';
import { useAuth } from '../../context/AuthContext';
import { printPaper } from '../../utils/paper';

const emptyQuestion = () => ({ text: '', options: ['', ''], correct: 0 });

export default function TeacherClasswork() {
  const { user } = useAuth();
  const [classworks, setClassworks] = useState(null);
  const [allocations, setAllocations] = useState([]);
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({ type: 'assignment', isPublished: true });
  const [file, setFile] = useState(null);
  // Online-quiz builder state: null = classic file-based classwork
  const [quizMode, setQuizMode] = useState(false);
  const [questions, setQuestions] = useState([emptyQuestion()]);
  const [subs, setSubs] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [flash, flashEl] = useFlash();

  const load = () => api.get('/classwork').then((r) => setClassworks(r.data.classworks));
  useEffect(() => {
    load();
    api.get('/attendance/my-classes').then((r) => setAllocations(r.data.allocations));
  }, []);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const isQuizBuilder = form.type === 'quiz' && quizMode;

  function patchQuestion(i, patch) {
    setQuestions((qs) => qs.map((q, idx) => (idx === i ? { ...q, ...patch } : q)));
  }

  const quizErrors = isQuizBuilder
    ? questions.flatMap((q, i) => {
        const errs = [];
        if (!q.text.trim()) errs.push(`Question ${i + 1}: text is required.`);
        if (q.options.some((o) => !o.trim())) errs.push(`Question ${i + 1}: fill every option.`);
        return errs;
      })
    : [];

  async function create() {
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      if (file) fd.append('attachment', file);
      if (isQuizBuilder) fd.append('questions', JSON.stringify(questions));
      await api.post('/classwork', fd);
      flash({ type: 'ok', text: 'Posted — students notified.' });
      setCreateOpen(false); setForm({ type: 'assignment', isPublished: true }); setFile(null);
      setQuizMode(false); setQuestions([emptyQuestion()]);
      load();
    } catch (e) { flash({ type: 'error', text: errText(e) }); }
  }

  async function remove(c) {
    try {
      setDeletingId(c.id);
      await api.delete(`/classwork/${c.id}`);
      flash({ type: 'ok', text: `"${c.title}" deleted.` });
      load();
    } catch (e) { flash({ type: 'error', text: errText(e) }); }
    finally { setDeletingId(null); }
  }

  async function openSubs(c) {
    const r = await api.get(`/classwork/${c.id}/submissions`);
    setSubs(r.data.classwork);
  }

  async function grade(sub, obtained, feedback) {
    try {
      await api.put(`/classwork/submissions/${sub.id}/grade`, { obtained, feedback });
      flash({ type: 'ok', text: 'Graded.' });
      openSubs(subs);
    } catch (e) { flash({ type: 'error', text: errText(e) }); }
  }

  async function download(sub) {
    const res = await api.get(`/classwork/submissions/${sub.id}/download`, { responseType: 'blob' });
    window.open(URL.createObjectURL(res.data), '_blank');
  }

  return (
    <div className="space-y-6">
      {flashEl}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Quizzes & Assignments</h1>
        <Button onClick={() => setCreateOpen(true)}>+ Post classwork</Button>
      </div>

      <Card>
        <Table
          columns={[
            { header: 'Title', cell: (c) => c.title },
            { header: 'Type', cell: (c) => <Badge value={c.questions ? 'online quiz' : c.type} /> },
            { header: 'Class', cell: (c) => `${c.allocation.classSection.program.code} Semester ${c.allocation.classSection.termNo} (${c.allocation.classSection.shift}) — ${c.allocation.subject.title}` },
            { header: 'Due', cell: (c) => fmtDateTime(c.dueAt) },
            { header: 'Submissions', cell: (c) => c._count.submissions },
            {
              header: 'Actions',
              cell: (c) => (
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => openSubs(c)}>Submissions</Button>
                  <Button variant="outline" onClick={() => printPaper({
                    title: c.title,
                    typeLabel: c.questions ? 'Online Quiz' : c.type,
                    allocation: c.allocation,
                    date: c.dueAt,
                    totalMarks: c.totalMarks,
                    teacherName: user.name,
                    instructions: c.instructions,
                    questions: c.questions,
                  })}>Print paper</Button>
                  <Button variant="danger" disabled={deletingId === c.id} onClick={() => remove(c)}>
                    {deletingId === c.id ? 'Deleting…' : 'Delete'}
                  </Button>
                </div>
              ),
            },
          ]}
          rows={classworks ?? []}
          empty={classworks === null ? 'Loading…' : 'Nothing posted yet.'}
        />
      </Card>

      <Modal open={createOpen} wide title="Post quiz / assignment" onClose={() => setCreateOpen(false)}>
        <div className="max-h-[70vh] space-y-3 overflow-y-auto pr-1">
          <Field label="Class">
            <Select value={form.allocationId ?? ''} onChange={set('allocationId')}>
              <option value="">Select…</option>
              {allocations.map((a) => (
                <option key={a.id} value={a.id}>{a.subject.title} — {a.classSection.program.code} Semester {a.classSection.termNo} ({a.classSection.shift})</option>
              ))}
            </Select>
          </Field>
          <Field label="Type">
            <Select value={form.type} onChange={(e) => { setForm({ ...form, type: e.target.value }); if (e.target.value !== 'quiz') setQuizMode(false); }}>
              <option value="assignment">Assignment</option><option value="quiz">Quiz</option>
            </Select>
          </Field>
          {form.type === 'quiz' && (
            <label className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-3 py-2.5 text-sm font-medium text-primary">
              <input type="checkbox" checked={quizMode} onChange={(e) => setQuizMode(e.target.checked)} />
              Build an online quiz — add questions & options here; students attempt it in the portal and it is graded automatically (1 mark per question).
            </label>
          )}
          <Field label="Title"><Input value={form.title ?? ''} onChange={set('title')} /></Field>
          <Field label="Instructions"><Textarea value={form.instructions ?? ''} onChange={set('instructions')} /></Field>

          {/* Universal quiz template: custom questions, options, correct answer */}
          {isQuizBuilder && (
            <div className="space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
              {questions.map((q, i) => (
                <div key={i} className="rounded-lg border border-slate-200 bg-white p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <div className="text-sm font-semibold text-slate-700">Question {i + 1}</div>
                    {questions.length > 1 && (
                      <button className="text-xs font-medium text-red-600 hover:underline"
                        onClick={() => setQuestions((qs) => qs.filter((_, idx) => idx !== i))}>
                        Remove
                      </button>
                    )}
                  </div>
                  <Input placeholder="Question text…" value={q.text} onChange={(e) => patchQuestion(i, { text: e.target.value })} />
                  <div className="mt-2 space-y-1.5">
                    {q.options.map((opt, oi) => (
                      <div key={oi} className="flex items-center gap-2">
                        <input
                          type="radio"
                          name={`correct-${i}`}
                          checked={q.correct === oi}
                          onChange={() => patchQuestion(i, { correct: oi })}
                          title="Mark as the correct answer"
                        />
                        <Input
                          placeholder={`Option ${String.fromCharCode(65 + oi)}`}
                          value={opt}
                          onChange={(e) => patchQuestion(i, { options: q.options.map((o, idx) => (idx === oi ? e.target.value : o)) })}
                        />
                        {q.options.length > 2 && (
                          <button className="text-slate-400 hover:text-red-600" title="Remove option"
                            onClick={() => patchQuestion(i, {
                              options: q.options.filter((_, idx) => idx !== oi),
                              correct: q.correct === oi ? 0 : q.correct > oi ? q.correct - 1 : q.correct,
                            })}>
                            ✕
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    {q.options.length < 6 ? (
                      <button className="text-xs font-medium text-primary hover:underline"
                        onClick={() => patchQuestion(i, { options: [...q.options, ''] })}>
                        + Add option
                      </button>
                    ) : <span />}
                    <span className="text-[11px] text-slate-400">Correct: option {String.fromCharCode(65 + q.correct)}</span>
                  </div>
                </div>
              ))}
              <Button variant="outline" onClick={() => setQuestions((qs) => [...qs, emptyQuestion()])}>+ Add question</Button>
              <p className="text-xs text-slate-500">Total marks: {questions.length} (1 per question, graded automatically)</p>
            </div>
          )}

          {!isQuizBuilder && (
            <Field label="Attachment (optional, jpg/png/pdf ≤ 2 MB)">
              <input type="file" accept=".jpg,.jpeg,.png,.pdf" onChange={(e) => setFile(e.target.files[0])} className="text-sm" />
            </Field>
          )}
          <div className="grid grid-cols-2 gap-3">
            {!isQuizBuilder && (
              <Field label="Total marks (optional)"><Input type="number" value={form.totalMarks ?? ''} onChange={set('totalMarks')} /></Field>
            )}
            <Field label={isQuizBuilder ? 'Deadline (required)' : 'Due date/time'}>
              <Input type="datetime-local" value={form.dueAt ?? ''} onChange={set('dueAt')} />
            </Field>
          </div>

          {quizErrors.length > 0 && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
              <ul className="list-inside list-disc space-y-0.5">{quizErrors.map((e) => <li key={e}>{e}</li>)}</ul>
            </div>
          )}
          <div className="flex justify-end">
            <Button onClick={create} disabled={!form.allocationId || !form.title || (isQuizBuilder && (quizErrors.length > 0 || !form.dueAt))}>
              Post
            </Button>
          </div>
        </div>
      </Modal>

      <Modal open={!!subs} wide title={subs ? `Submissions — ${subs.title}` : ''} onClose={() => setSubs(null)}>
        {subs && (
          <div className="max-h-[60vh] space-y-2 overflow-y-auto">
            {subs.submissions.length === 0 && <p className="py-8 text-center text-sm text-slate-400">No submissions yet.</p>}
            {subs.submissions.map((sub) => (
              <SubmissionRow key={sub.id} sub={sub} classwork={subs} onGrade={grade} onDownload={download} />
            ))}
          </div>
        )}
      </Modal>
    </div>
  );
}

function SubmissionRow({ sub, classwork, onGrade, onDownload }) {
  const [obtained, setObtained] = useState(sub.obtained ?? '');
  const [feedback, setFeedback] = useState(sub.feedback ?? '');
  const [showAnswers, setShowAnswers] = useState(false);
  const isQuizAttempt = !!sub.answers;
  const total = classwork.totalMarks;
  return (
    <div className="rounded-lg border border-slate-200 p-3">
      <div className="flex items-center justify-between">
        <div className="text-sm font-medium text-slate-800">
          {sub.student.name} <span className="font-mono text-xs text-slate-400">{sub.student.rollNumber}</span>
          {isQuizAttempt && (
            <span className="ml-2 rounded bg-green-50 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-primary">
              auto-graded {Number(sub.obtained)}/{total}
            </span>
          )}
        </div>
        <div className="text-xs text-slate-400">{fmtDateTime(sub.submittedAt)}</div>
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        {isQuizAttempt
          ? <Button variant="outline" onClick={() => setShowAnswers((v) => !v)}>{showAnswers ? 'Hide answers' : 'View answers'}</Button>
          : <Button variant="outline" onClick={() => onDownload(sub)}>Download file</Button>}
        {total && <Input type="number" placeholder={`/ ${total}`} value={obtained} onChange={(e) => setObtained(e.target.value)} style={{ width: 90 }} />}
        <Input placeholder="Feedback" value={feedback} onChange={(e) => setFeedback(e.target.value)} style={{ width: 220 }} />
        <Button onClick={() => onGrade(sub, obtained === '' ? null : obtained, feedback)}>Save</Button>
      </div>
      {isQuizAttempt && showAnswers && classwork.questions && (
        <div className="mt-3 space-y-2 rounded-lg bg-slate-50 p-3">
          {classwork.questions.map((q, i) => {
            const picked = sub.answers[i];
            const right = picked === q.correct;
            return (
              <div key={i} className="text-xs">
                <div className="font-medium text-slate-700">{i + 1}. {q.text}</div>
                <div className={right ? 'text-green-700' : 'text-red-600'}>
                  {right ? '✓' : '✗'} Answered: {picked === null || picked === undefined ? '—' : q.options[picked]}
                  {!right && <span className="text-slate-500"> · correct: {q.options[q.correct]}</span>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
