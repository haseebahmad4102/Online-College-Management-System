import { useEffect, useState } from 'react';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { Card, Table, Badge, Button, Input, Select, Modal, Field, Pager, downloadCsv, useFlash, errText, fmtDate } from '../../components/ui';

const EMPTY = { name: '', fatherName: '', cnic: '', gender: 'male', phone: '', email: '', departmentId: '', designationId: '', teacherType: 'permanent', qualification: '', specialization: '' };

export default function Teachers() {
  // Buttons follow the same permissions the server enforces: someone granted only
  // teachers.view gets a read-only list, no dead Edit/Delete buttons.
  const { can } = useAuth();
  const [teachers, setTeachers] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [designations, setDesignations] = useState([]);
  const [filter, setFilter] = useState({ department: '', type: '' });
  const [modal, setModal] = useState(null); // 'new' | teacher being edited
  const [viewTeacher, setViewTeacher] = useState(null); // teacher for read-only view
  const [form, setForm] = useState(EMPTY);
  const [tempPw, setTempPw] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({ pages: 1, total: 0 });
  const [flash, flashEl] = useFlash();

  const params = (extra = {}) => ({ department: filter.department || undefined, type: filter.type || undefined, ...extra });
  const load = (p = page) => api.get('/teachers', { params: params({ page: p }) })
    .then((r) => { setTeachers(r.data.teachers); setMeta({ pages: r.data.pages, total: r.data.total }); });
  useEffect(() => { setPage(1); load(1); }, [filter]);

  async function exportCsv() {
    const r = await api.get('/teachers', { params: params({ all: 1 }) });
    downloadCsv('teachers.csv', [
      { header: 'Name', value: (t) => t.name },
      { header: 'Father Name', value: (t) => t.fatherName ?? '' },
      { header: 'CNIC', value: (t) => t.cnic },
      { header: 'Gender', value: (t) => t.gender },
      { header: 'Phone', value: (t) => t.phone },
      { header: 'Email', value: (t) => t.email ?? '' },
      { header: 'Department', value: (t) => t.department.name },
      { header: 'Designation', value: (t) => t.designation.title },
      { header: 'Type', value: (t) => t.teacherType },
      { header: 'Status', value: (t) => t.status },
      { header: 'Qualification', value: (t) => t.qualification ?? '' },
    ], r.data.teachers);
  }
  useEffect(() => {
    api.get('/academic/departments').then((r) => setDepartments(r.data.departments));
    api.get('/academic/designations').then((r) => setDesignations(r.data.designations));
  }, []);

  async function save() {
    try {
      if (modal === 'new') {
        const r = await api.post('/teachers', form);
        setTempPw(r.data.tempPassword);
        flash({ type: 'ok', text: 'Teacher added — login account created.' });
      } else {
        await api.put(`/teachers/${modal.id}`, form);
        flash({ type: 'ok', text: 'Teacher updated.' });
        setModal(null);
      }
      load();
    } catch (e) { flash({ type: 'error', text: errText(e) }); }
  }

  async function remove(t) {
    try {
      setDeletingId(t.id);
      const r = await api.delete(`/teachers/${t.id}`);
      flash({ type: 'ok', text: r.data.message });
      load();
    } catch (e) { flash({ type: 'error', text: errText(e) }); }
    finally { setDeletingId(null); }
  }

  function openEdit(t) {
    setForm({ ...t, departmentId: t.departmentId, designationId: t.designationId });
    setModal(t);
  }

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  return (
    <div className="space-y-6">
      {flashEl}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-slate-900">Teachers</h1>
        <div className="flex gap-2">
          <Select value={filter.department} onChange={(e) => setFilter({ ...filter, department: e.target.value })}>
            <option value="">All departments</option>
            {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
          </Select>
          <Select value={filter.type} onChange={(e) => setFilter({ ...filter, type: e.target.value })}>
            <option value="">All types</option>
            {['permanent', 'cti', 'adhoc', 'visiting'].map((t) => <option key={t} value={t}>{t}</option>)}
          </Select>
          <Button variant="outline" onClick={exportCsv}>Export CSV</Button>
          {can('teachers.create') && (
            <Button onClick={() => { setForm(EMPTY); setModal('new'); setTempPw(null); }}>+ Add teacher</Button>
          )}
        </div>
      </div>

      <Card>
        <Table
          columns={[
            { header: 'Name', cell: (t) => t.name },
            { header: 'CNIC', cell: (t) => t.cnic },
            { header: 'Department', cell: (t) => t.department.name },
            { header: 'Designation', cell: (t) => t.designation.title },
            { header: 'Type', cell: (t) => <Badge value={t.teacherType} /> },
            { header: 'Status', cell: (t) => <Badge value={t.status} /> },
            {
              header: 'Actions',
              cell: (t) => (
                <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                  <Button variant="ghost" onClick={() => setViewTeacher(t)}>View</Button>
                  {can('teachers.update') && <Button variant="outline" onClick={() => openEdit(t)}>Edit</Button>}
                  {can('teachers.delete') && (
                    <Button variant="danger" disabled={deletingId === t.id} onClick={() => remove(t)}>
                      {deletingId === t.id ? 'Deleting…' : 'Delete'}
                    </Button>
                  )}
                </div>
              )
            },
          ]}
          rows={teachers ?? []}
          empty={teachers === null ? 'Loading…' : 'No teachers found.'}
        />
        <Pager page={page} pages={meta.pages} total={meta.total} onPage={(p) => { setPage(p); load(p); }} />
      </Card>

      {/* View Teacher Modal */}
      <Modal open={!!viewTeacher} wide title={`Teacher Profile — ${viewTeacher?.name}`} onClose={() => setViewTeacher(null)}>
        {viewTeacher && (
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-xl font-bold text-white uppercase">
                {viewTeacher.name[0]}
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-800">{viewTeacher.name}</h2>
                <p className="text-sm text-slate-500 capitalize">{viewTeacher.teacherType} — {viewTeacher.department.name}</p>
              </div>
              <Badge value={viewTeacher.status} />
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <Card title="Personal Details">
                <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                  <div><dt className="text-xs uppercase text-slate-400">Father's Name</dt><dd className="text-slate-700">{viewTeacher.fatherName || '—'}</dd></div>
                  <div><dt className="text-xs uppercase text-slate-400">CNIC</dt><dd className="text-slate-700">{viewTeacher.cnic}</dd></div>
                  <div><dt className="text-xs uppercase text-slate-400">Gender</dt><dd className="text-slate-700 capitalize">{viewTeacher.gender}</dd></div>
                  <div><dt className="text-xs uppercase text-slate-400">Date of Birth</dt><dd className="text-slate-700">{fmtDate(viewTeacher.dob)}</dd></div>
                  <div><dt className="text-xs uppercase text-slate-400">Phone</dt><dd className="text-slate-700">{viewTeacher.phone}</dd></div>
                  <div><dt className="text-xs uppercase text-slate-400">Email</dt><dd className="text-slate-700">{viewTeacher.email || '—'}</dd></div>
                </dl>
              </Card>

              <Card title="Professional Details">
                <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                  <div><dt className="text-xs uppercase text-slate-400">Department</dt><dd className="text-slate-700">{viewTeacher.department.name}</dd></div>
                  <div><dt className="text-xs uppercase text-slate-400">Designation</dt><dd className="text-slate-700">{viewTeacher.designation.title}</dd></div>
                  <div><dt className="text-xs uppercase text-slate-400">Teacher Type</dt><dd className="text-slate-700"><Badge value={viewTeacher.teacherType} /></dd></div>
                  <div><dt className="text-xs uppercase text-slate-400">Joining Date</dt><dd className="text-slate-700">{fmtDate(viewTeacher.joiningDate)}</dd></div>
                  <div className="col-span-2"><dt className="text-xs uppercase text-slate-400">Qualification</dt><dd className="text-slate-700">{viewTeacher.qualification || '—'}</dd></div>
                  <div className="col-span-2"><dt className="text-xs uppercase text-slate-400">Specialization</dt><dd className="text-slate-700">{viewTeacher.specialization || '—'}</dd></div>
                </dl>
              </Card>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
              {can('teachers.update') && (
                <Button variant="outline" onClick={() => { setViewTeacher(null); openEdit(viewTeacher); }}>Edit Profile</Button>
              )}
              <Button variant="outline" onClick={() => setViewTeacher(null)}>Close</Button>
            </div>
          </div>
        )}
      </Modal>

      <Modal open={!!modal} wide title={modal === 'new' ? 'Add teacher' : `Edit — ${modal?.name}`} onClose={() => setModal(null)}>
        {tempPw ? (
          <div className="space-y-4 text-center">
            <p className="text-sm text-slate-600">Login account created. Share these credentials — the teacher must change the password on first login:</p>
            <div className="rounded-lg bg-slate-50 p-4 font-mono text-sm">
              <div>{form.email}</div>
              <div className="font-bold text-primary">{tempPw}</div>
            </div>
            <Button onClick={() => { setModal(null); setTempPw(null); }}>Done</Button>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Full name"><Input value={form.name} onChange={set('name')} /></Field>
            <Field label="Father name"><Input value={form.fatherName ?? ''} onChange={set('fatherName')} /></Field>
            <Field label="CNIC (#####-#######-#)"><Input value={form.cnic} onChange={set('cnic')} disabled={modal !== 'new'} /></Field>
            <Field label="Gender">
              <Select value={form.gender} onChange={set('gender')}>
                <option value="male">Male</option><option value="female">Female</option>
              </Select>
            </Field>
            <Field label="Phone"><Input value={form.phone} onChange={set('phone')} /></Field>
            <Field label="Email (login)"><Input value={form.email ?? ''} onChange={set('email')} disabled={modal !== 'new'} /></Field>
            <Field label="Department">
              <Select value={form.departmentId} onChange={set('departmentId')}>
                <option value="">Select…</option>
                {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
              </Select>
            </Field>
            <Field label="Designation">
              <Select value={form.designationId} onChange={set('designationId')}>
                <option value="">Select…</option>
                {designations.map((d) => <option key={d.id} value={d.id}>{d.title}</option>)}
              </Select>
            </Field>
            <Field label="Type">
              <Select value={form.teacherType} onChange={set('teacherType')}>
                <option value="permanent">Permanent</option>
                <option value="cti">Contract (CTI)</option>
                <option value="adhoc">Ad-hoc</option>
                <option value="visiting">Visiting</option>
              </Select>
            </Field>
            <Field label="Qualification"><Input value={form.qualification ?? ''} onChange={set('qualification')} /></Field>
            <Field label="Specialization"><Input value={form.specialization ?? ''} onChange={set('specialization')} /></Field>
            {modal !== 'new' && (
              <Field label="Status">
                <Select value={form.status} onChange={set('status')}>
                  <option value="active">Active</option><option value="left">Left</option>
                </Select>
              </Field>
            )}
            <div className="col-span-full flex justify-end gap-2">
              <Button variant="outline" onClick={() => setModal(null)}>Cancel</Button>
              <Button onClick={save}>{modal === 'new' ? 'Create teacher + login' : 'Save changes'}</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
