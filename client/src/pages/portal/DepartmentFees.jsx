import { useEffect, useState } from 'react';
import api from '../../api/client';
import { Card, Table, Button, Select, Input, Field, useFlash, useConfirm, errText } from '../../components/ui';
import ChallanPrint from '../../components/ChallanPrint';

// Clerk desk: configure a fee schedule per department (Library Fund, Transport
// Fund, ...) and issue a summed voucher to a student — same 3-copy print
// (Bank / College / Student) as admission challans.
export default function DepartmentFees() {
  const [departments, setDepartments] = useState([]);
  const [departmentId, setDepartmentId] = useState('');
  const [items, setItems] = useState(null);
  const [newLabel, setNewLabel] = useState('');
  const [newAmount, setNewAmount] = useState('');
  const [q, setQ] = useState('');
  const [students, setStudents] = useState([]);
  const [printData, setPrintData] = useState(null);
  const [printCopies, setPrintCopies] = useState(1);
  const [flash, flashEl] = useFlash();
  const [confirm, confirmEl] = useConfirm();

  // Manual / special one-off challan (Library Fine, Mobile Fine, Absent Fine, …)
  const [mcTitle, setMcTitle] = useState('');
  const [mcAmount, setMcAmount] = useState('');
  const [mcCopies, setMcCopies] = useState('1');
  const [mcQ, setMcQ] = useState('');
  const [mcResults, setMcResults] = useState([]);
  const [mcStudent, setMcStudent] = useState(null);

  useEffect(() => {
    api.get('/academic/departments').then((r) => setDepartments(r.data.departments));
  }, []);

  const loadItems = (deptId) => {
    if (!deptId) { setItems(null); return; }
    api.get(`/department-fees/${deptId}`).then((r) => setItems(r.data.items));
  };
  useEffect(() => { loadItems(departmentId); setStudents([]); setQ(''); }, [departmentId]);

  const total = (items ?? []).filter((i) => i.isActive).reduce((s, i) => s + Number(i.amount), 0);

  async function addItem() {
    if (!newLabel.trim() || !(Number(newAmount) > 0)) return;
    try {
      await api.post('/department-fees', { departmentId: Number(departmentId), label: newLabel, amount: newAmount });
      setNewLabel(''); setNewAmount('');
      loadItems(departmentId);
    } catch (e) { flash({ type: 'error', text: errText(e) }); }
  }

  async function toggleActive(item) {
    await api.put(`/department-fees/${item.id}`, { isActive: !item.isActive }).catch((e) => flash({ type: 'error', text: errText(e) }));
    loadItems(departmentId);
  }

  async function removeItem(item) {
    confirm(`Remove "${item.label}" from this department's fee schedule?`, async () => {
      try {
        await api.delete(`/department-fees/${item.id}`);
        loadItems(departmentId);
      } catch (e) { flash({ type: 'error', text: errText(e) }); }
    });
  }

  async function searchStudents() {
    const r = await api.get('/students', { params: { department: departmentId, q, all: 1 } });
    setStudents(r.data.students);
  }

  async function issueVoucher(student) {
    confirm(
      `Issue a ${departments.find((d) => d.id === Number(departmentId))?.name} voucher (Rs. ${total.toLocaleString()}) to ${student.name} (${student.rollNumber})?`,
      async () => {
        try {
          const r = await api.post(`/department-fees/${departmentId}/issue`, { studentId: student.id });
          flash({ type: 'ok', text: `Voucher ${r.data.challan.challanNo} issued.` });
          const p = await api.get(`/challans/${r.data.challan.id}/print-data`);
          setPrintCopies(1);
          setPrintData(p.data);
        } catch (e) { flash({ type: 'error', text: errText(e) }); }
      }
    );
  }

  async function mcSearch() {
    if (!mcQ.trim()) { setMcResults([]); return; }
    const r = await api.get('/students', { params: { q: mcQ.trim(), all: 1 } });
    setMcResults(r.data.students.slice(0, 15));
  }

  async function generateCustom() {
    if (!mcTitle.trim() || !(Number(mcAmount) > 0)) return;
    try {
      const r = await api.post('/department-fees/custom-challan', {
        title: mcTitle.trim(), amount: mcAmount, studentId: mcStudent?.id,
      });
      const p = await api.get(`/challans/${r.data.challan.id}/print-data`);
      setPrintCopies(Math.max(1, Number(mcCopies) || 1));
      setPrintData(p.data);
      flash({ type: 'ok', text: `Challan ${r.data.challan.challanNo} created — ${Math.max(1, Number(mcCopies) || 1)} copy/copies ready to print.` });
      setMcTitle(''); setMcAmount(''); setMcCopies('1'); setMcQ(''); setMcResults([]); setMcStudent(null);
    } catch (e) { flash({ type: 'error', text: errText(e) }); }
  }

  return (
    <div className="space-y-6">
      {flashEl}{confirmEl}
      <h1 className="text-2xl font-bold text-slate-900">Department Fee Vouchers</h1>

      <Card title="Manual / special challan (fines & one-off charges)">
        <p className="mb-4 text-sm text-slate-500">
          Print a one-off challan — e.g. <b>Library Fine</b>, <b>Mobile Fine</b>, <b>Absent Fine</b>. Enter a title and amount, choose how many copies to print, and optionally attach a student (it then appears in their fee history and portal).
        </p>
        <div className="mb-4 flex flex-wrap items-end gap-3">
          <Field label="Challan title"><Input value={mcTitle} onChange={(e) => setMcTitle(e.target.value)} placeholder="Library Fine Challan" /></Field>
          <Field label="Amount (Rs.)"><Input type="number" value={mcAmount} onChange={(e) => setMcAmount(e.target.value)} placeholder="200" /></Field>
          <Field label="Copies to print"><Input type="number" min="1" value={mcCopies} onChange={(e) => setMcCopies(e.target.value)} style={{ width: 130 }} /></Field>
          <Button onClick={generateCustom} disabled={!mcTitle.trim() || !(Number(mcAmount) > 0)}>Generate &amp; print</Button>
        </div>
        <div className="rounded-lg border border-slate-200 p-3">
          <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Attach a student (optional)</div>
          {mcStudent ? (
            <div className="flex items-center gap-3 text-sm">
              <span className="text-slate-700">{mcStudent.name} <span className="text-slate-400">({mcStudent.rollNumber})</span></span>
              <Button variant="outline" onClick={() => setMcStudent(null)}>Remove</Button>
            </div>
          ) : (
            <>
              <div className="mb-2 flex flex-wrap items-end gap-2">
                <Input value={mcQ} onChange={(e) => setMcQ(e.target.value)} placeholder="Search name or roll number…" onKeyDown={(e) => e.key === 'Enter' && mcSearch()} style={{ width: 260 }} />
                <Button variant="outline" onClick={mcSearch}>Search</Button>
              </div>
              {mcResults.length > 0 && (
                <ul className="max-h-40 divide-y divide-slate-100 overflow-y-auto text-sm">
                  {mcResults.map((s) => (
                    <li key={s.id} className="flex items-center justify-between py-1.5">
                      <span className="text-slate-700">{s.name} <span className="text-slate-400">({s.rollNumber})</span></span>
                      <Button variant="ghost" onClick={() => { setMcStudent(s); setMcResults([]); setMcQ(''); }}>Attach</Button>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
        </div>
      </Card>

      <Card>
        <Field label="Department">
          <Select value={departmentId} onChange={(e) => setDepartmentId(e.target.value)}>
            <option value="">Select a department…</option>
            
            <optgroup label="BS Programs (Departments)">
              {departments
                .filter(d => !d.name.includes('FSc') && !d.name.includes('ICS') && !d.name.includes('FA') && !d.name.includes('Diploma'))
                .map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </optgroup>
            
            <optgroup label="Intermediate">
              {departments
                .filter(d => d.name.includes('FSc') || d.name === 'ICS' || d.name === 'FA')
                .map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </optgroup>
            
            <optgroup label="Diplomas">
              {departments
                .filter(d => d.name.includes('Diploma'))
                .map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </optgroup>
          </Select>
        </Field>
      </Card>

      {departmentId && (
        <>
          <Card title="Fee types for this department">
            <div className="mb-4 flex flex-wrap items-end gap-3">
              <Field label="Fee type (e.g. Library Fund)"><Input value={newLabel} onChange={(e) => setNewLabel(e.target.value)} placeholder="Library Fund" /></Field>
              <Field label="Amount (Rs.)"><Input type="number" value={newAmount} onChange={(e) => setNewAmount(e.target.value)} placeholder="500" /></Field>
              <Button onClick={addItem} disabled={!newLabel.trim() || !(Number(newAmount) > 0)}>Add fee type</Button>
            </div>
            <Table
              columns={[
                { header: 'Fee type', cell: (i) => i.label },
                { header: 'Amount', cell: (i) => `Rs. ${Number(i.amount).toLocaleString()}` },
                { header: 'Status', cell: (i) => i.isActive ? <span className="text-primary">Active</span> : <span className="text-slate-400">Inactive</span> },
                {
                  header: 'Actions',
                  cell: (i) => (
                    <div className="flex gap-2">
                      <Button variant="outline" onClick={() => toggleActive(i)}>{i.isActive ? 'Deactivate' : 'Activate'}</Button>
                      <Button variant="danger" onClick={() => removeItem(i)}>Remove</Button>
                    </div>
                  ),
                },
              ]}
              rows={items ?? []}
              empty={items === null ? 'Loading…' : 'No fee types added yet — add one above.'}
            />
            {items?.length > 0 && (
              <p className="mt-3 text-sm text-slate-600">
                Voucher total (active fee types): <b className="text-primary">Rs. {total.toLocaleString()}</b>
              </p>
            )}
          </Card>

          <Card title="Issue a voucher to a student">
            <div className="mb-4 flex flex-wrap items-end gap-3">
              <Field label="Search student (name or roll number)">
                <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search…" onKeyDown={(e) => e.key === 'Enter' && searchStudents()} />
              </Field>
              <Button onClick={searchStudents}>Search</Button>
            </div>
            <Table
              columns={[
                { header: 'Roll No', cell: (s) => s.rollNumber },
                { header: 'Name', cell: (s) => s.name },
                { header: 'Program', cell: (s) => s.program?.name ?? '—' },
                {
                  header: 'Actions',
                  cell: (s) => <Button disabled={!total} onClick={() => issueVoucher(s)}>Issue voucher</Button>,
                },
              ]}
              rows={students}
              empty="Search for a student in this department to issue a voucher."
            />
          </Card>
        </>
      )}

      {printData && <ChallanPrint data={printData} copies={printCopies} onClose={() => setPrintData(null)} />}
    </div>
  );
}
