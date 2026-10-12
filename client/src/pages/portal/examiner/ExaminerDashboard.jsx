import { useEffect, useState } from 'react';
import api from '../../../api/client';
import { Card, Table, Button, Input, Field, Select, useFlash, errText } from '../../../components/ui';
import ExaminationsTable from './ExaminationsTable';

export default function ExaminerDashboard() {
  const [exams, setExams] = useState([]);
  const [name, setName] = useState('');
  const [term, setTerm] = useState('mid');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [editId, setEditId] = useState(null);
  const [flash, flashEl] = useFlash();

  const load = () => api.get('/examiner/exams').then(r => setExams(r.data.exams));
  useEffect(() => { load(); }, []);

  async function createOrUpdate() {
    if (!name.trim()) return;
    try {
      const payload = { name, term, startDate: startDate || null, endDate: endDate || null };
      if (editId) {
        await api.put(`/examiner/exams/${editId}`, payload);
        flash({ type: 'ok', text: 'Examination updated successfully.' });
      } else {
        await api.post('/examiner/exams', payload);
        flash({ type: 'ok', text: 'Examination created successfully.' });
      }
      setEditId(null); setName(''); setStartDate(''); setEndDate('');
      load();
    } catch (e) { flash({ type: 'error', text: errText(e) }); }
  }

  function handleEdit(exam) {
    setEditId(exam.id);
    setName(exam.name);
    setTerm(exam.term);
    setStartDate(exam.startDate || '');
    setEndDate(exam.endDate || '');
    document.getElementById('create-exam-card').scrollIntoView({ behavior: 'smooth' });
  }

  async function handleDelete(id) {
    try {
      await api.delete(`/examiner/exams/${id}`);
      flash({ type: 'ok', text: 'Examination deleted.' });
      load();
    } catch (e) { flash({ type: 'error', text: errText(e) }); }
  }

  async function toggle(id) {
    await api.put(`/examiner/exams/${id}/toggle`).catch(e => flash({ type: 'error', text: errText(e) }));
    load();
  }

  const activeExams = exams.filter(e => e.isActive).length;

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {flashEl}
      
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Controller Examiner Dashboard</h1>
        <p className="mt-2 text-slate-500 text-lg">Manage examination cycles, timelines, and active sessions across the institution.</p>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-6 text-white shadow-lg shadow-indigo-200">
          <div className="text-indigo-100 text-sm font-medium uppercase tracking-wider mb-1">Total Examinations</div>
          <div className="text-4xl font-bold">{exams.length}</div>
        </div>
        <div className="bg-gradient-to-br from-emerald-400 to-teal-500 rounded-2xl p-6 text-white shadow-lg shadow-teal-200">
          <div className="text-teal-50 text-sm font-medium uppercase tracking-wider mb-1">Active Sessions</div>
          <div className="text-4xl font-bold">{activeExams}</div>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 flex flex-col justify-center">
          <div className="text-slate-500 text-sm font-medium mb-1">Quick Action</div>
          <Button onClick={() => document.getElementById('create-exam-card').scrollIntoView({ behavior: 'smooth' })} className="w-full">
            + New Examination
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Main Table Area */}
        <div className="xl:col-span-2 space-y-6">
          <Card title="Examination Cycles" className="shadow-md border-0 ring-1 ring-slate-100">
            <ExaminationsTable exams={exams} onToggle={toggle} onEdit={handleEdit} onDelete={handleDelete} />
          </Card>
        </div>

        {/* Sidebar / Create Form */}
        <div className="space-y-6">
          <Card id="create-exam-card" title={editId ? "Edit Examination" : "Launch New Exam"} className="shadow-md border-0 ring-1 ring-indigo-50 bg-indigo-50/30">
            <div className="space-y-5">
              <Field label="Examination Name">
                <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Fall 2026 Midterms" className="bg-white" />
              </Field>
              <Field label="Term Category">
                <Select value={term} onChange={e => setTerm(e.target.value)} className="bg-white">
                  <option value="mid">Midterm</option>
                  <option value="final">Final</option>
                  <option value="term">Term</option>
                </Select>
              </Field>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Start Date">
                  <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="bg-white" />
                </Field>
                <Field label="End Date">
                  <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="bg-white" />
                </Field>
              </div>
              <div className="flex gap-2">
                <Button onClick={createOrUpdate} className="flex-1 bg-indigo-600 hover:bg-indigo-700 py-3 shadow-md shadow-indigo-200">
                  {editId ? "Save Changes" : "Create & Activate Exam"}
                </Button>
                {editId && (
                  <Button variant="outline" className="py-3" onClick={() => { setEditId(null); setName(''); setStartDate(''); setEndDate(''); }}>
                    Cancel
                  </Button>
                )}
              </div>
            </div>
          </Card>
          
          <div className="rounded-xl bg-amber-50 p-5 border border-amber-100">
            <h3 className="font-semibold text-amber-800 mb-2 flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Examiner Guide
            </h3>
            <ul className="text-sm text-amber-700 space-y-2 list-disc pl-5">
              <li>Active exams are visible to teachers for question paper submission.</li>
              <li>Only one or two exams should typically be active at a time.</li>
              <li>Closing an exam prevents further room allotments or slip generation.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
