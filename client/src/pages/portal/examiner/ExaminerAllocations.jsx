import { useEffect, useState } from 'react';
import api from '../../../api/client';
import { Card, Table, Button, Input, Field, Select, useFlash, errText } from '../../../components/ui';

import ExaminationsTable from './ExaminationsTable';

export default function ExaminerAllocations() {
  const [exams, setExams] = useState([]);
  const [examId, setExamId] = useState('');
  const [allocations, setAllocations] = useState([]);
  
  const [sections, setSections] = useState([]);
  const [rooms, setRooms] = useState([]);
  
  const [sectionId, setSectionId] = useState('');
  const [roomId, setRoomId] = useState('');
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  
  const [flash, flashEl] = useFlash();

  useEffect(() => {
    api.get('/examiner/exams').then(r => {
      setExams(r.data.exams);
      const active = r.data.exams.filter(e => e.isActive);
      if (active.length > 0) setExamId(active[0].id.toString());
    });
    api.get('/academic/sections').then(r => setSections(r.data.sections));
    api.get('/timetable/rooms').then(r => setRooms(r.data.rooms));
  }, []);

  useEffect(() => {
    if (!examId) return;
    api.get(`/examiner/exams/${examId}/allocations`).then(r => setAllocations(r.data.allocations));
  }, [examId]);

  async function create() {
    if (!sectionId || !roomId || !start || !end) return;
    try {
      const res = await api.post(`/examiner/exams/${examId}/allocations`, {
        classSectionId: sectionId,
        roomId,
        startSerial: start,
        endSerial: end
      });
      setAllocations([...allocations, res.data.allocation]);
      setStart(''); setEnd('');
      flash({ type: 'ok', text: 'Allotment saved successfully.' });
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
      <h1 className="text-2xl font-bold text-slate-900">Exam Rooms & Sheets Allotment</h1>

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
        <Card title="Allot Room & Answer Sheets">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Field label="Class Section">
              <Select value={sectionId} onChange={e => setSectionId(e.target.value)}>
                <option value="">Select section...</option>
                {sections.map(s => <option key={s.id} value={s.id}>{s.program.name} Sem {s.termNo || s.term_no} ({s.shift})</option>)}
              </Select>
            </Field>
            <Field label="Room">
              <Select value={roomId} onChange={e => setRoomId(e.target.value)}>
                <option value="">Select room...</option>
                {rooms.map(r => <option key={r.id} value={r.id}>{r.name} (Cap: {r.capacity})</option>)}
              </Select>
            </Field>
            <Field label="Start Serial #"><Input type="number" value={start} onChange={e => setStart(e.target.value)} placeholder="1000" /></Field>
            <Field label="End Serial #"><Input type="number" value={end} onChange={e => setEnd(e.target.value)} placeholder="1050" /></Field>
          </div>
          <Button onClick={create} className="mt-4">Allot</Button>
        </Card>
      )}

      {examId && allocations.length > 0 && (
        <Card title="Current Allotments">
          <Table>
            <thead>
              <tr>
                <th>Class Section</th>
                <th>Room</th>
                <th>Sheet Range</th>
                <th>Total Sheets</th>
              </tr>
            </thead>
            <tbody>
              {allocations.map(a => (
                <tr key={a.id}>
                  <td>{(a.classSection || a.class_section)?.program.name} Sem {(a.classSection || a.class_section)?.termNo || (a.classSection || a.class_section)?.term_no} ({(a.classSection || a.class_section)?.shift})</td>
                  <td>{a.room.name}</td>
                  <td>{a.start_serial} - {a.end_serial}</td>
                  <td>{a.end_serial - a.start_serial + 1}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card>
      )}
    </div>
  );
}
