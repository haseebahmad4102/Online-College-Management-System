import { useEffect, useState } from 'react';
import api from '../../../api/client';
import { Card, Table, Button, Field, Select, useFlash, errText } from '../../../components/ui';

import ExaminationsTable from './ExaminationsTable';

export default function ExaminerSlips() {
  const [exams, setExams] = useState([]);
  const [examId, setExamId] = useState('');
  const [students, setStudents] = useState([]);
  const [slips, setSlips] = useState({});
  const [flash, flashEl] = useFlash();

  useEffect(() => {
    api.get('/examiner/exams').then(r => {
      setExams(r.data.exams);
      const active = r.data.exams.filter(e => e.isActive);
      if (active.length > 0) setExamId(active[0].id.toString());
    });
  }, []);

  useEffect(() => {
    if (!examId) return;
    api.get(`/examiner/exams/${examId}/students`).then(r => {
      setStudents(r.data.students);
      setSlips(r.data.generatedSlips);
    });
  }, [examId]);

  async function generate(studentId) {
    try {
      const res = await api.post(`/examiner/exams/${examId}/slips`, { studentId });
      setSlips(prev => ({ ...prev, [studentId]: res.data.slip }));
      flash({ type: 'ok', text: 'Slip generated successfully.' });
    } catch (e) { flash({ type: 'error', text: errText(e) }); }
  }

  async function notify(studentId) {
    try {
      await api.post(`/examiner/students/notify-unpaid`, { studentId });
      flash({ type: 'ok', text: 'Notification sent to student.' });
    } catch (e) { flash({ type: 'error', text: errText(e) }); }
  }

  async function toggle(id) {
    await api.put(`/examiner/exams/${id}/toggle`).catch(e => flash({ type: 'error', text: errText(e) }));
    api.get('/examiner/exams').then(r => setExams(r.data.exams));
  }

  async function handleDelete(id) {
    try {
      await api.delete(`/examiner/exams/${id}`);
      flash({ type: 'ok', text: 'Examination deleted.' });
      api.get('/examiner/exams').then(r => setExams(r.data.exams));
    } catch (e) { flash({ type: 'error', text: errText(e) }); }
  }

  return (
    <div className="space-y-6">
      {flashEl}
      <h1 className="text-2xl font-bold text-slate-900">Roll Number Slips</h1>

      <Card title="Active Examinations" className="mb-8">
        <ExaminationsTable exams={exams.filter(e => e.isActive)} onToggle={toggle} onDelete={handleDelete} />
      </Card>

      <Card>
        <Field label="Select Active Exam">
          <Select value={examId} onChange={e => setExamId(e.target.value)}>
            {exams.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
          </Select>
        </Field>
      </Card>

      {examId && (
        <Card title="Students">
          <div className="overflow-x-auto">
            <Table>
              <thead>
                <tr>
                  <th>Roll #</th>
                  <th>Name</th>
                  <th>Program</th>
                  <th>Fee Status</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {students.map(s => {
                  const slip = slips[s.id];
                  return (
                    <tr key={s.id}>
                      <td className="font-mono text-slate-600">{s.rollNumber}</td>
                      <td className="font-medium text-slate-800">{s.name}</td>
                      <td>{s.program.name} Sem {s.classSection?.termNo} ({s.classSection?.shift})</td>
                      <td>
                        {s.has_unpaid_fees ? (
                          <span className="rounded-full bg-red-100 text-red-800 px-2 py-1 text-xs font-semibold">Unpaid Challans</span>
                        ) : (
                          <span className="rounded-full bg-green-100 text-green-800 px-2 py-1 text-xs font-semibold">Cleared</span>
                        )}
                      </td>
                      <td className="text-right space-x-2">
                        {slip ? (
                          <span className="text-sm text-slate-500 mr-2">Generated</span>
                        ) : s.has_unpaid_fees ? (
                          <Button variant="outline" size="sm" onClick={() => notify(s.id)} className="text-orange-600 border-orange-200 hover:bg-orange-50">
                            Notify Unpaid
                          </Button>
                        ) : (
                          <Button size="sm" onClick={() => generate(s.id)}>Generate Slip</Button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </Table>
          </div>
        </Card>
      )}
    </div>
  );
}
