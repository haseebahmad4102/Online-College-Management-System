import { useEffect, useState } from 'react';
import api from '../../api/client';
import { Card, Table, Button, Input, Field, Select, useFlash, errText } from '../../components/ui';

export default function TeacherQuestionPapers() {
  const [exams, setExams] = useState([]);
  const [papers, setPapers] = useState([]);
  
  // Form State
  const [examId, setExamId] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [instructions, setInstructions] = useState('');
  const [timeAllowed, setTimeAllowed] = useState(180);
  
  // Teachers subjects list (from profile)
  const [subjects, setSubjects] = useState([]);
  
  const [questions, setQuestions] = useState([]);
  
  const [flash, flashEl] = useFlash();

  const load = () => {
    api.get('/teacher/exams/active').then(r => {
      setExams(r.data.exams);
      if (r.data.exams.length > 0) setExamId(r.data.exams[0].id.toString());
    });
    api.get('/teacher/exams/papers').then(r => setPapers(r.data.papers));
    api.get('/teacher/subjects').then(r => {
      setSubjects(r.data.subjects || []);
    });
  };
  useEffect(() => { load(); }, []);

  function addQuestion(type) {
    setQuestions([...questions, { type, text: '', marks: type === 'mcq' ? 1 : (type === 'short' ? 2 : 10), options: type === 'mcq' ? { A: '', B: '', C: '', D: '', correct: 'A' } : null }]);
  }

  function updateQuestion(i, field, val) {
    const q = [...questions];
    q[i][field] = val;
    setQuestions(q);
  }

  function updateOption(i, optKey, val) {
    const q = [...questions];
    q[i].options[optKey] = val;
    setQuestions(q);
  }

  function removeQuestion(i) {
    setQuestions(questions.filter((_, idx) => idx !== i));
  }

  async function saveDraft() {
    if (!examId || !subjectId || questions.length === 0) {
      flash({ type: 'error', text: 'Select exam, subject, and add at least 1 question.' });
      return;
    }
    try {
      await api.post('/teacher/exams/papers', {
        examId,
        subjectId,
        instructions,
        timeAllowedMinutes: timeAllowed,
        questions
      });
      flash({ type: 'ok', text: 'Paper drafted successfully.' });
      setQuestions([]); setInstructions(''); setTimeAllowed(180);
      load();
    } catch (e) { flash({ type: 'error', text: errText(e) }); }
  }

  async function submitPaper(id) {
    if (!confirm('Are you sure? You cannot edit this once submitted to the CE.')) return;
    try {
      await api.put(`/teacher/exams/papers/${id}/submit`);
      flash({ type: 'ok', text: 'Paper submitted to Controller Examiner.' });
      load();
    } catch (e) { flash({ type: 'error', text: errText(e) }); }
  }

  return (
    <div className="space-y-6">
      {flashEl}
      <h1 className="text-2xl font-bold text-slate-900">Question Papers builder</h1>

      <Card title="Draft New Question Paper">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <Field label="Examination">
            <Select value={examId} onChange={e => setExamId(e.target.value)}>
              <option value="">Select Exam</option>
              {exams.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
            </Select>
          </Field>
          <Field label="Subject">
            <Select value={subjectId} onChange={e => setSubjectId(e.target.value)}>
              <option value="">Select Subject</option>
              {subjects.map(s => <option key={s.id} value={s.id}>{s.title}</option>)}
            </Select>
          </Field>
          <Field label="Time Allowed (Minutes)">
            <Input type="number" value={timeAllowed} onChange={e => setTimeAllowed(e.target.value)} />
          </Field>
          <Field label="Instructions (Optional)">
            <Input value={instructions} onChange={e => setInstructions(e.target.value)} placeholder="e.g. Attempt all questions" />
          </Field>
        </div>

        <div className="border-t border-slate-200 pt-4 mt-4">
          <h3 className="font-semibold mb-2">Paper Sections</h3>
          <div className="flex gap-2 mb-4">
            <Button size="sm" variant="outline" onClick={() => addQuestion('mcq')}>+ Add MCQ</Button>
            <Button size="sm" variant="outline" onClick={() => addQuestion('short')}>+ Add Short Question</Button>
            <Button size="sm" variant="outline" onClick={() => addQuestion('long')}>+ Add Long Question</Button>
          </div>

          <div className="space-y-4">
            {questions.map((q, i) => (
              <div key={i} className="p-4 border rounded bg-slate-50 relative">
                <button onClick={() => removeQuestion(i)} className="absolute top-2 right-2 text-red-500 font-bold hover:text-red-700">✕</button>
                <div className="flex justify-between items-center mb-2">
                  <span className="font-semibold uppercase text-sm text-slate-500">{q.type} Question</span>
                  <div className="flex items-center gap-2">
                    <label className="text-xs">Marks:</label>
                    <Input type="number" className="w-20 h-8" value={q.marks} onChange={e => updateQuestion(i, 'marks', e.target.value)} />
                  </div>
                </div>
                
                <textarea 
                  className="w-full border p-2 rounded mb-2 text-sm" 
                  rows="2" 
                  placeholder="Enter question text here..."
                  value={q.text} 
                  onChange={e => updateQuestion(i, 'text', e.target.value)}
                />

                {q.type === 'mcq' && (
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <Field label="Option A"><Input value={q.options.A} onChange={e => updateOption(i, 'A', e.target.value)} /></Field>
                    <Field label="Option B"><Input value={q.options.B} onChange={e => updateOption(i, 'B', e.target.value)} /></Field>
                    <Field label="Option C"><Input value={q.options.C} onChange={e => updateOption(i, 'C', e.target.value)} /></Field>
                    <Field label="Option D"><Input value={q.options.D} onChange={e => updateOption(i, 'D', e.target.value)} /></Field>
                    <Field label="Correct Answer">
                      <Select value={q.options.correct} onChange={e => updateOption(i, 'correct', e.target.value)}>
                        <option value="A">A</option><option value="B">B</option>
                        <option value="C">C</option><option value="D">D</option>
                      </Select>
                    </Field>
                  </div>
                )}
              </div>
            ))}
          </div>

          {questions.length > 0 && (
            <Button className="mt-6 w-full" onClick={saveDraft}>Save Paper Draft</Button>
          )}
        </div>
      </Card>

      <Card title="My Question Papers">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500 bg-slate-50/50">
                <th className="py-3 px-4 font-medium">Exam</th>
                <th className="py-3 px-4 font-medium">Subject</th>
                <th className="py-3 px-4 font-medium">Total Questions</th>
                <th className="py-3 px-4 font-medium">Total Marks</th>
                <th className="py-3 px-4 font-medium">Status</th>
                <th className="py-3 px-4 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {papers.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-slate-400 italic">Nothing here yet.</td>
                </tr>
              ) : papers.map(p => (
                <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3 px-4 font-semibold text-slate-800">{p.exam.name}</td>
                  <td className="px-4">{p.subject.title}</td>
                  <td className="px-4 text-center">{p.questions.length}</td>
                  <td className="px-4 text-center font-mono">{p.questions.reduce((sum, q) => sum + parseFloat(q.marks), 0)}</td>
                  <td className="px-4">
                    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${p.status === 'draft' ? 'bg-amber-100 text-amber-800 border border-amber-200' : 'bg-emerald-100 text-emerald-800 border border-emerald-200'}`}>
                      {p.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-4 text-right">
                    {p.status === 'draft' && (
                      <div className="flex justify-end gap-2">
                        <Button size="sm" variant="outline" className="text-red-600 hover:bg-red-50 hover:border-red-200" onClick={async () => {
                          if (!confirm('Delete this draft paper?')) return;
                          try {
                            await api.delete(`/teacher/exams/papers/${p.id}`);
                            flash({ type: 'ok', text: 'Draft deleted.' });
                            load();
                          } catch (e) { flash({ type: 'error', text: errText(e) }); }
                        }}>Delete</Button>
                        <Button size="sm" onClick={() => submitPaper(p.id)}>Submit to CE</Button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
