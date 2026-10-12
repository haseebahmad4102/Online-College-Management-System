import { useEffect, useState } from 'react';
import api from '../../api/client';
import { Card, Table, Badge, Button, Input, Select, Modal, Field, useFlash, useConfirm, errText, fmtDate } from '../../components/ui';
import { useAuth } from '../../context/AuthContext';
import { printPaper } from '../../utils/paper';

export default function Assessments() {
  const { user } = useAuth();
  const [assessments, setAssessments] = useState(null);
  const [allocations, setAllocations] = useState([]);
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({ type: 'midterm' });
  const [grid, setGrid] = useState(null); // {assessment, students}
  const [deletingId, setDeletingId] = useState(null);
  const [flash, flashEl] = useFlash();
  const [confirm, confirmEl] = useConfirm();

  const load = () => api.get('/assessments').then((r) => setAssessments(r.data.assessments));
  useEffect(() => {
    load();
    api.get('/attendance/my-classes').then((r) => setAllocations(r.data.allocations));
  }, []);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  async function create() {
    try {
      await api.post('/assessments', form);
      flash({ type: 'ok', text: 'Assessment created (draft).' });
      setCreateOpen(false); setForm({ type: 'midterm' }); load();
    } catch (e) { flash({ type: 'error', text: errText(e) }); }
  }

  async function remove(a) {
    try {
      setDeletingId(a.id);
      await api.delete(`/assessments/${a.id}`);
      flash({ type: 'ok', text: `"${a.title}" deleted.` });
      load();
    } catch (e) { flash({ type: 'error', text: errText(e) }); }
    finally { setDeletingId(null); }
  }

  const [sortOrder, setSortOrder] = useState('roll');

  async function openGrid(a) {
    const r = await api.get(`/assessments/${a.id}/marks`);
    setGrid(r.data);
    setSortOrder('roll');
  }

  async function saveMarks() {
    try {
      await api.post(`/assessments/${grid.assessment.id}/marks`, {
        marks: grid.students.map((s) => ({ studentId: s.id, obtained: s.obtained })),
      });
      flash({ type: 'ok', text: 'Marks saved as draft.' });
    } catch (e) { flash({ type: 'error', text: errText(e) }); }
  }

  function publish(a) {
    confirm('Publish these marks? Students will see them immediately and get a notification.', async () => {
      try {
        await api.put(`/assessments/${a.id}/publish`);
        flash({ type: 'ok', text: 'Marks published.' });
        setGrid(null); load();
      } catch (e) { flash({ type: 'error', text: errText(e) }); }
    });
  }

  return (
    <div className="space-y-6">
      {flashEl}{confirmEl}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Assessments & Marks</h1>
        <Button onClick={() => setCreateOpen(true)}>+ New assessment</Button>
      </div>

      <Card>
        <Table
          columns={[
            { header: 'Title', cell: (a) => a.title },
            { header: 'Class', cell: (a) => `${a.allocation.classSection.program.code} Semester ${a.allocation.classSection.termNo} (${a.allocation.classSection.shift}) — ${a.allocation.subject.title}` },
            { header: 'Type', cell: (a) => <Badge value={a.type} /> },
            { header: 'Total', cell: (a) => a.totalMarks },
            { header: 'Held on', cell: (a) => fmtDate(a.heldOn) },
            { header: 'Status', cell: (a) => <Badge value={a.isPublished ? 'published' : 'draft'} /> },
            {
              header: 'Actions',
              cell: (a) => (
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => openGrid(a)}>Marks</Button>
                  <Button variant="outline" onClick={() => printPaper({
                    title: a.title,
                    typeLabel: a.type === 'midterm' ? 'Mid Term Examination' 
                             : a.type === 'sessional' ? 'Sessional Test' 
                             : a.type === 'final' ? 'Final Examination' 
                             : a.type === 'practical' ? 'Practical (Lab)' 
                             : a.title,
                    allocation: a.allocation,
                    date: a.heldOn,
                    totalMarks: a.totalMarks,
                    teacherName: user.name,
                  })}>Print paper</Button>
                  {!a.isPublished && <Button onClick={() => publish(a)}>Publish</Button>}
                  {!a.isPublished && (
                    <Button variant="danger" disabled={deletingId === a.id} onClick={() => remove(a)}>
                      {deletingId === a.id ? 'Deleting…' : 'Delete'}
                    </Button>
                  )}
                </div>
              ),
            },
          ]}
          rows={assessments ?? []}
          empty={assessments === null ? 'Loading…' : 'No assessments yet.'}
        />
      </Card>

      <Modal open={createOpen} title="New assessment" onClose={() => setCreateOpen(false)}>
        <div className="space-y-3">
          <Field label="Class">
            <Select value={form.allocationId ?? ''} onChange={set('allocationId')}>
              <option value="">Select…</option>
              {allocations.map((a) => (
                <option key={a.id} value={a.id}>{a.subject.title} — {a.classSection.program.code} Semester {a.classSection.termNo} ({a.classSection.shift})</option>
              ))}
            </Select>
          </Field>
          <Field label="Type">
            <Select value={form.type} onChange={set('type')}>
              <option value="midterm">Midterm</option>
              <option value="sessional">Sessional</option>
              <option value="final">Final Exam</option>
              <option value="practical">Practical (Lab)</option>
              <option value="other">Other</option>
            </Select>
          </Field>
          <Field label="Title"><Input value={form.title ?? ''} onChange={set('title')} /></Field>
          <Field label="Total marks"><Input type="number" value={form.totalMarks ?? ''} onChange={set('totalMarks')} /></Field>
          <Field label="Held on"><Input type="date" value={form.heldOn ?? ''} onChange={set('heldOn')} /></Field>
          <div className="flex justify-end"><Button onClick={create} disabled={!form.allocationId || !form.title || !form.totalMarks}>Create</Button></div>
        </div>
      </Modal>

      <Modal open={!!grid} wide title={grid ? `Marks entry — ${grid.assessment.title} (total ${grid.assessment.totalMarks})` : ''} onClose={() => setGrid(null)}>
        {grid && (
          <div>
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3 print:hidden">
              <span className="text-sm text-slate-500">Blank = absent. Obtained ≤ total.</span>
              <div className="flex items-center gap-2">
                <Select value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} style={{ width: 140 }}>
                  <option value="roll">Roll No</option>
                  <option value="highest">Highest Marks</option>
                  <option value="lowest">Lowest Marks</option>
                </Select>
                <Button variant="outline" onClick={() => window.print()}>Award list</Button>
                <Button onClick={saveMarks} disabled={grid.assessment.isPublished}>Save draft</Button>
              </div>
            </div>
            <div className="print-area">
              <div className="mb-2 hidden text-sm font-bold print:block">
                Award List — {grid.assessment.title} (total {grid.assessment.totalMarks})
              </div>
              <div className="max-h-[55vh] space-y-1.5 overflow-y-auto">
              {[...grid.students].sort((a, b) => {
                if (sortOrder === 'highest') return (b.obtained ?? -1) - (a.obtained ?? -1);
                if (sortOrder === 'lowest') return (a.obtained ?? -1) - (b.obtained ?? -1);
                return a.rollNumber.localeCompare(b.rollNumber);
              }).map((s, i) => (
                <div key={s.id} className="flex items-center justify-between gap-3 rounded-lg border border-slate-100 px-3 py-1.5">
                  <span className="text-sm"><span className="font-mono text-xs text-slate-400">{s.rollNumber}</span> {s.name}</span>
                  <Input
                    type="number" min={0} max={grid.assessment.totalMarks}
                    disabled={grid.assessment.isPublished}
                    value={s.obtained ?? ''}
                    onChange={(e) => {
                      const students = [...grid.students];
                      const idx = students.findIndex((st) => st.id === s.id);
                      if (idx > -1) {
                        students[idx] = { ...students[idx], obtained: e.target.value === '' ? null : e.target.value };
                        setGrid({ ...grid, students });
                      }
                    }}
                    style={{ width: 90 }}
                  />
                </div>
              ))}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
