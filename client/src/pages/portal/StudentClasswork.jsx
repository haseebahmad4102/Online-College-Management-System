import { useEffect, useState } from 'react';
import api from '../../api/client';
import { Card, Badge, Button, Modal, useFlash, errText, fmtDateTime } from '../../components/ui';

export default function StudentClasswork() {
  const [items, setItems] = useState(null);
  const [quiz, setQuiz] = useState(null); // the online quiz being attempted
  const [answers, setAnswers] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [flash, flashEl] = useFlash();

  const load = () => api.get('/classwork/mine').then((r) => setItems(r.data.classworks));
  useEffect(() => { load(); }, []);

  async function submit(cw, file) {
    try {
      const fd = new FormData();
      fd.append('file', file);
      await api.post(`/classwork/${cw.id}/submit`, fd);
      flash({ type: 'ok', text: 'Submitted. You may replace it until the due time.' });
      load();
    } catch (e) { flash({ type: 'error', text: errText(e) }); }
  }

  async function downloadAttachment(cw) {
    const res = await api.get(`/classwork/${cw.id}/attachment`, { responseType: 'blob' });
    window.open(URL.createObjectURL(res.data), '_blank');
  }

  async function startQuiz(cw) {
    try {
      const r = await api.get(`/classwork/${cw.id}/attempt`);
      setQuiz(r.data.quiz);
      setAnswers(new Array(r.data.quiz.questions.length).fill(null));
      setResult(null);
    } catch (e) { flash({ type: 'error', text: errText(e) }); }
  }

  async function submitQuiz() {
    try {
      setSubmitting(true);
      const r = await api.post(`/classwork/${quiz.id}/attempt`, { answers });
      setResult(r.data.result);
      load();
    } catch (e) { flash({ type: 'error', text: errText(e) }); }
    finally { setSubmitting(false); }
  }

  const unanswered = answers.filter((a) => a === null).length;

  if (!items) return <div className="py-20 text-center text-slate-400">Loading…</div>;

  return (
    <div className="space-y-6">
      {flashEl}
      <h1 className="text-2xl font-bold text-slate-900">Quizzes & Assignments</h1>
      <div className="space-y-4">
        {items.length === 0 && <Card><p className="py-6 text-center text-sm text-slate-400">Nothing posted for your class shift yet.</p></Card>}
        {items.map((cw) => (
          <Card key={cw.id}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <Badge value={cw.isOnlineQuiz ? 'online quiz' : cw.type} />
                  <h2 className="font-semibold text-slate-800">{cw.title}</h2>
                </div>
                <p className="mt-1 text-sm text-slate-500">
                  {cw.subject}
                  {cw.totalMarks ? ` · ${cw.totalMarks} marks` : ''}
                  {cw.isOnlineQuiz && cw.questionCount ? ` · ${cw.questionCount} questions` : ''}
                </p>
                {cw.instructions && <p className="mt-2 max-w-xl text-sm text-slate-600">{cw.instructions}</p>}
                <p className={`mt-2 text-xs ${cw.overdue ? 'text-red-500' : 'text-slate-400'}`}>
                  {cw.dueAt ? `Due ${fmtDateTime(cw.dueAt)}${cw.overdue ? ' — closed' : ''}` : 'No deadline'}
                </p>
              </div>
              <div className="flex flex-col items-end gap-2">
                {cw.hasAttachment && <Button variant="outline" onClick={() => downloadAttachment(cw)}>Download task</Button>}
                {cw.submission ? (
                  <div className="text-right text-sm">
                    <Badge value="approved" />
                    <div className="mt-1 text-xs text-slate-400">Submitted {fmtDateTime(cw.submission.submittedAt)}</div>
                    {cw.submission.obtained !== null && (
                      <div className="font-semibold text-primary">Marks: {Number(cw.submission.obtained)}{cw.totalMarks ? ` / ${cw.totalMarks}` : ''}</div>
                    )}
                    {cw.submission.feedback && <div className="text-xs text-slate-500">"{cw.submission.feedback}"</div>}
                  </div>
                ) : null}
                {!cw.overdue && !cw.submission && cw.isOnlineQuiz && (
                  <Button onClick={() => startQuiz(cw)}>Attempt quiz</Button>
                )}
                {!cw.overdue && !cw.isOnlineQuiz && (
                  <label className="cursor-pointer rounded-lg bg-primary px-3.5 py-2 text-sm font-medium text-white hover:bg-primary-dark">
                    {cw.submission ? 'Replace file' : 'Upload submission'}
                    <input type="file" accept=".jpg,.jpeg,.png,.pdf" className="hidden"
                      onChange={(e) => e.target.files[0] && submit(cw, e.target.files[0])} />
                  </label>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Online-quiz attempt */}
      <Modal open={!!quiz} wide title={quiz ? `Quiz — ${quiz.title}` : ''} onClose={() => { if (!submitting) { setQuiz(null); setResult(null); } }}>
        {quiz && !result && (
          <div className="max-h-[65vh] space-y-4 overflow-y-auto pr-1">
            <div className="rounded-lg bg-amber-50 p-3 text-xs text-amber-800">
              <b>One attempt only.</b> {quiz.questions.length} questions · 1 mark each
              {quiz.dueAt ? ` · closes ${fmtDateTime(quiz.dueAt)}` : ''}. Your score is shown immediately after submitting.
            </div>
            {quiz.instructions && <p className="text-sm text-slate-600">{quiz.instructions}</p>}
            {quiz.questions.map((q, i) => (
              <div key={i} className="rounded-lg border border-slate-200 p-4">
                <div className="mb-2 text-sm font-semibold text-slate-800">{i + 1}. {q.text}</div>
                <div className="space-y-1.5">
                  {q.options.map((opt, oi) => (
                    <label key={oi} className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm ${answers[i] === oi ? 'border-primary bg-green-50 text-primary' : 'border-slate-200 text-slate-700 hover:border-slate-300'}`}>
                      <input
                        type="radio"
                        name={`q-${i}`}
                        checked={answers[i] === oi}
                        onChange={() => setAnswers((a) => a.map((v, idx) => (idx === i ? oi : v)))}
                      />
                      {String.fromCharCode(65 + oi)}. {opt}
                    </label>
                  ))}
                </div>
              </div>
            ))}
            <div className="flex items-center justify-between border-t border-slate-100 pt-3">
              <span className="text-xs text-slate-500">{unanswered > 0 ? `${unanswered} question${unanswered === 1 ? '' : 's'} unanswered` : 'All questions answered'}</span>
              <Button disabled={submitting || unanswered > 0} onClick={submitQuiz}>
                {submitting ? 'Submitting…' : 'Submit quiz'}
              </Button>
            </div>
          </div>
        )}
        {result && (
          <div className="py-8 text-center">
            <div className="text-5xl">{result.obtained / result.total >= 0.5 ? '🎉' : '📝'}</div>
            <div className="mt-3 text-2xl font-bold text-primary">{result.obtained} / {result.total}</div>
            <p className="mt-1 text-sm text-slate-500">Your quiz has been submitted and graded automatically.</p>
            <Button className="mt-4" onClick={() => { setQuiz(null); setResult(null); }}>Close</Button>
          </div>
        )}
      </Modal>
    </div>
  );
}
