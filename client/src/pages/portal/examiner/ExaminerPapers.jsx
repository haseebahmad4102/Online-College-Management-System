import { useEffect, useState } from 'react';
import api from '../../../api/client';
import { Card, Table, Button, useFlash, errText } from '../../../components/ui';

import ExaminationsTable from './ExaminationsTable';

export default function ExaminerPapers() {
  const [exams, setExams] = useState([]);
  const [papers, setPapers] = useState([]);
  const [flash, flashEl] = useFlash();

  const load = () => {
    api.get('/examiner/exams').then(r => setExams(r.data.exams));
    api.get('/examiner/papers/submitted').then(r => setPapers(r.data.papers));
  };
  useEffect(() => { load(); }, []);

  async function markPrinted(id) {
    try {
      await api.put(`/examiner/papers/${id}/printed`);
      load();
    } catch (e) { flash({ type: 'error', text: errText(e) }); }
  }

  async function toggle(id) {
    await api.put(`/examiner/exams/${id}/toggle`).catch(e => flash({ type: 'error', text: errText(e) }));
    load();
  }

  async function handleDelete(id) {
    try {
      await api.delete(`/examiner/exams/${id}`);
      flash({ type: 'ok', text: 'Examination deleted.' });
      load();
    } catch (e) { flash({ type: 'error', text: errText(e) }); }
  }

  function printPaper(paper) {
    // A quick hack to print the paper applying the template
    const newWin = window.open('', '_blank');
    newWin.document.write(`
      <html>
        <head>
          <title>Print - ${paper.subject.title}</title>
          <style>
            body { font-family: 'Times New Roman', serif; margin: 40px; }
            .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 20px; margin-bottom: 20px; }
            .header h1 { margin: 0; font-size: 24px; text-transform: uppercase; }
            .header h2 { margin: 5px 0; font-size: 18px; }
            .meta { display: flex; justify-content: space-between; font-weight: bold; margin-bottom: 20px; }
            .section-title { font-size: 16px; font-weight: bold; text-decoration: underline; margin-top: 30px; margin-bottom: 15px; }
            .question { margin-bottom: 15px; }
            .q-meta { font-size: 12px; float: right; font-weight: bold; }
            .options { margin-top: 5px; padding-left: 20px; }
            .options div { margin-bottom: 3px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Govt. Graduate College Muzaffargarh</h1>
            <h2>${paper.exam.name}</h2>
            <div>Subject: ${paper.subject.title} (${paper.subject.code})</div>
            ${paper.instructions ? `<div><em>Instructions: ${paper.instructions}</em></div>` : ''}
          </div>
          <div class="meta">
            <div>Time Allowed: ${paper.time_allowed_minutes || paper.timeAllowedMinutes ? (paper.time_allowed_minutes || paper.timeAllowedMinutes) + ' Minutes' : 'N/A'}</div>
            <div>Total Marks: ${paper.questions.reduce((sum, q) => sum + parseFloat(q.marks), 0)}</div>
          </div>
          
          <div class="questions">
            ${paper.questions.map((q, i) => `
              <div class="question">
                <span class="q-meta">[${q.marks} Marks]</span>
                <strong>Q${i + 1}.</strong> ${q.question_text || q.questionText || q.text}
                ${q.type === 'mcq' && q.options ? `
                  <div class="options">
                    ${Object.entries(q.options).filter(([k]) => k !== 'correct').map(([k, v]) => `<div>${k}) ${v}</div>`).join('')}
                  </div>
                ` : ''}
              </div>
            `).join('')}
          </div>
          
          <script>
            window.onload = () => { window.print(); window.close(); }
          </script>
        </body>
      </html>
    `);
    newWin.document.close();
  }

  return (
    <div className="space-y-6">
      {flashEl}
      <h1 className="text-2xl font-bold text-slate-900">Question Paper Inbox</h1>

      <Card title="Active Examinations" className="mb-8">
        <ExaminationsTable exams={exams.filter(e => e.isActive)} onToggle={toggle} onDelete={handleDelete} />
      </Card>

      <Card title="Submitted Question Papers">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500 bg-slate-50/50">
                <th className="py-3 px-4 font-medium">Exam</th>
                <th className="py-3 px-4 font-medium">Subject</th>
                <th className="py-3 px-4 font-medium">Submitted By</th>
                <th className="py-3 px-4 font-medium">Questions</th>
                <th className="py-3 px-4 font-medium">Status</th>
                <th className="py-3 px-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {papers.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-slate-400 italic">No submitted papers yet.</td>
                </tr>
              ) : papers.map(p => (
                <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3 px-4 font-medium text-slate-800">{p.exam?.name}</td>
                  <td className="px-4">{p.subject?.title}</td>
                  <td className="px-4">{p.teacher?.user?.name}</td>
                  <td className="px-4 text-center">{p.questions?.length}</td>
                  <td className="px-4">
                    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${p.status === 'printed' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 'bg-blue-100 text-blue-800 border border-blue-200'}`}>
                      {p.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-4 text-right space-x-2">
                    <Button variant="outline" size="sm" onClick={() => printPaper(p)}>
                      Print Template
                    </Button>
                    {p.status !== 'printed' && (
                      <Button size="sm" onClick={() => markPrinted(p.id)}>
                        Mark Printed
                      </Button>
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
