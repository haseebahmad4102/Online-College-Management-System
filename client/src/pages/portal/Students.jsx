import { useEffect, useState } from 'react';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { Card, Table, Badge, Button, Input, Select, Modal, Field, Pager, downloadCsv, useFlash, errText, fmtDate, termLabel } from '../../components/ui';

export default function Students() {
  // students.view = read-only directory; the Assign Shift button needs students.update.
  const { can } = useAuth();
  const [students, setStudents] = useState(null);
  const [sections, setSections] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [programLevels, setProgramLevels] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [interGroups, setInterGroups] = useState([]);
  const [matricGroups, setMatricGroups] = useState([]);

  const [form, setForm] = useState({
    programLevelId: '',
    programId: '',
    groupId: '',
    shift: '',
    termNo: '',
    sessionId: ''
  });
  const [q, setQ] = useState('');

  const [assign, setAssign] = useState(null);
  const [sectionId, setSectionId] = useState('');
  const [viewStudent, setViewStudent] = useState(null);
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({ pages: 1, total: 0 });
  const [flash, flashEl] = useFlash();

  const load = (f = form, p = 1) => {
    setStudents(null);
    setPage(p);
    api.get('/students', {
      params: {
        q: q.trim() || undefined,
        programLevelId: f.programLevelId || undefined,
        program: f.programId || undefined,
        groupId: f.groupId || undefined,
        shift: f.shift || undefined,
        termNo: f.termNo || undefined,
        session: f.sessionId || undefined,
        page: p,
      }
    }).then((r) => { setStudents(r.data.students); setMeta({ pages: r.data.pages, total: r.data.total }); });
  };

  async function exportCsv() {
    const r = await api.get('/students', {
      params: { 
        q: q.trim() || undefined, 
        programLevelId: form.programLevelId || undefined,
        program: form.programId || undefined,
        groupId: form.groupId || undefined,
        shift: form.shift || undefined,
        termNo: form.termNo || undefined,
        session: form.sessionId || undefined,
        all: 1 
      },
    });
    downloadCsv('students.csv', [
      { header: 'Roll No', value: (s) => s.rollNumber },
      { header: 'Name', value: (s) => s.name },
      { header: 'Email', value: (s) => s.user?.email ?? '' },
      { header: 'Father Name', value: (s) => s.fatherName ?? '' },
      { header: 'Program', value: (s) => s.program.code },
      { header: 'Department', value: (s) => s.program.department?.name ?? '' },
      { header: 'Class', value: (s) => s.classSection ? `${termLabel(s.program.level, s.classSection.termNo)} — ${s.classSection.shift}` : 'unassigned' },
      { header: 'Status', value: (s) => s.status },
    ], r.data.students);
  }

  useEffect(() => {
    load();
    api.get('/academic/sections').then((r) => setSections(r.data.sections));
    api.get('/academic/sessions').then((r) => setSessions(r.data.sessions));
    api.get('/academic/program-levels').then((r) => setProgramLevels(r.data.levels));
    api.get('/academic/programs').then((r) => setPrograms(r.data.programs));
    api.get('/academic/inter-groups').then((r) => setInterGroups(r.data.interGroups));
    api.get('/academic/matric-groups').then((r) => setMatricGroups(r.data.matricGroups));
  }, []);

  async function doAssign() {
    try {
      await api.put(`/students/${assign.id}/section`, { classSectionId: sectionId });
      flash({ type: 'ok', text: 'Class shift assigned.' });
      setAssign(null); load(form, page);
    } catch (e) { flash({ type: 'error', text: errText(e) }); }
  }

  const setF = (k) => (e) => {
    const v = e.target.value;
    const next = { ...form, [k]: v };
    if (k === 'programLevelId') { next.programId = ''; next.groupId = ''; next.shift = ''; next.termNo = ''; next.sessionId = ''; }
    setForm(next);
    load(next, 1);
  };

  return (
    <div className="space-y-6">
      {flashEl}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-slate-900">Students Directory</h1>
        <div className="flex gap-2">
          <Input placeholder="Search name or roll no…" value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && load()} style={{ width: 220 }} />
          <Button variant="outline" onClick={() => load()}>Search</Button>
          <Button variant="outline" onClick={exportCsv}>Export CSV</Button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="grid gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-2 lg:grid-cols-5">
        <Field label="Program Level">
          <Select value={form.programLevelId} onChange={setF('programLevelId')}>
            <option value="">All Levels</option>
            {programLevels.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
          </Select>
        </Field>
        
        <Field label="Program">
          <Select value={form.programId} onChange={setF('programId')}>
            <option value="">All Programs</option>
            {programs.filter(p => !form.programLevelId || p.programLevelId === Number(form.programLevelId)).map((p) => (
              <option key={p.id} value={p.id}>{p.name} ({p.code})</option>
            ))}
          </Select>
        </Field>
        
        {(() => {
          const lvl = programLevels.find(l => l.id === Number(form.programLevelId));
          if (!lvl) return null;
          
          return (
            <Field label="Shift">
              <Select value={form.shift} onChange={setF('shift')}>
                <option value="">All Shifts</option>
                <option value="morning">Morning</option>
                <option value="evening">Evening</option>
                <option value="unassigned">Unassigned</option>
              </Select>
            </Field>
          );
        })()}

        {(() => {
          const lvl = programLevels.find(l => l.id === Number(form.programLevelId));
          if (!lvl) return null;
          
          let filterLabel = 'Term/Semester';
          if (lvl.defaultExamSystem === 'annual' && lvl.name.toLowerCase().includes('intermediate')) {
            filterLabel = 'Term/Year';
          }
          const itemLabel = lvl.defaultExamSystem === 'annual' ? 'Year' : 'Semester';
          const maxTerm = (lvl.cycleYears || 1) * (lvl.defaultExamSystem === 'annual' ? 1 : 2);
          
          return (
            <Field label={filterLabel}>
              <Select value={form.termNo} onChange={setF('termNo')}>
                <option value="">All Terms</option>
                {Array.from({ length: maxTerm }, (_, i) => i + 1).map(n => (
                  <option key={n} value={n}>{itemLabel} {n}</option>
                ))}
              </Select>
            </Field>
          );
        })()}

        {!programLevels.find(l => l.id === Number(form.programLevelId)) && (
          <Field label="Admission Session">
            <Select value={form.sessionId} onChange={setF('sessionId')}>
              <option value="">All Sessions</option>
              {sessions.map((s) => <option key={s.id} value={s.id}>{s.name} ({s.startYear}-{s.endYear})</option>)}
            </Select>
          </Field>
        )}
      </div>

      <Card>
        <Table
          onRowClick={(s) => setViewStudent(s)}
          columns={[
            { header: 'Roll No', cell: (s) => <span className="font-semibold text-primary">{s.rollNumber}</span> },
            { header: 'Name', cell: (s) => s.name },
            { header: 'Father', cell: (s) => s.fatherName },
            { header: 'Program', cell: (s) => s.program.code },
            { header: 'Shift', cell: (s) => s.classSection ? `${termLabel(s.program.level, s.classSection.termNo)} — ${s.classSection.shift}` : <Badge value="pending" /> },
            { header: 'Status', cell: (s) => <Badge value={s.status} /> },
            {
              header: 'Actions',
              cell: (s) => (
                <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                  <Button variant="outline" onClick={() => setViewStudent(s)}>View</Button>
                  {can('students.update') && (
                    <Button onClick={() => { setAssign(s); setSectionId(s.classSectionId ?? ''); }}>
                      {s.classSection ? 'Change Shift' : 'Assign Shift'}
                    </Button>
                  )}
                </div>
              )
            },
          ]}
          rows={students ?? []}
          empty={students === null ? 'Loading…' : 'No students found.'}
        />
        <Pager page={page} pages={meta.pages} total={meta.total} onPage={(p) => load(form, p)} />
      </Card>

      {/* Assign Class Shift Modal */}
      <Modal open={!!assign} title={`Assign class shift — ${assign?.name}`} onClose={() => setAssign(null)}>
        <Field label="Class shift (capacity-aware)">
          <Select value={sectionId} onChange={(e) => setSectionId(e.target.value)}>
            <option value="">Select…</option>
            {sections.filter((s) => {
              if (s.programId !== assign?.programId) return false;
              if (s.academicSessionId !== assign?.academicSessionId) return false;
              if (assign?.classSection) return s.termNo === assign.classSection.termNo;
              return s.termNo === 1;
            }).map((s) => (
              <option key={s.id} value={s.id}>
                {s.program.code} {termLabel(s.program.level, s.termNo)} — {s.shift} ({s._count.students}/{s.capacity ?? '∞'})
              </option>
            ))}
          </Select>
        </Field>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="outline" onClick={() => setAssign(null)}>Cancel</Button>
          <Button disabled={!sectionId} onClick={doAssign}>Assign Shift</Button>
        </div>
      </Modal>

      {/* View Student Details Modal */}
      <Modal open={!!viewStudent} title={`Student Profile — ${viewStudent?.name}`} onClose={() => setViewStudent(null)} wide>
        {viewStudent && (
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-xl font-bold text-white uppercase">
                {viewStudent.name[0]}
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-800">{viewStudent.name}</h2>
                <p className="text-sm font-semibold text-primary">{viewStudent.rollNumber}</p>
                {viewStudent.user?.email && (
                  <p className="mt-1 flex items-center gap-2 text-sm text-slate-600">
                    <span className="text-xs uppercase text-slate-400">Login&nbsp;email</span>
                    <span className="font-mono text-slate-700">{viewStudent.user.email}</span>
                    <button
                      type="button"
                      onClick={() => { navigator.clipboard?.writeText(viewStudent.user.email); flash({ type: 'ok', text: 'Login email copied.' }); }}
                      className="rounded border border-slate-300 px-1.5 py-0.5 text-xs text-slate-500 hover:border-primary hover:text-primary"
                    >
                      Copy
                    </button>
                  </p>
                )}
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <Card title="Personal Details">
                <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                  <div><dt className="text-xs uppercase text-slate-400">Father's Name</dt><dd className="text-slate-700">{viewStudent.fatherName || '—'}</dd></div>
                  <div><dt className="text-xs uppercase text-slate-400">CNIC / B-Form</dt><dd className="text-slate-700">{viewStudent.cnicBform}</dd></div>
                  <div><dt className="text-xs uppercase text-slate-400">Gender</dt><dd className="text-slate-700 capitalize">{viewStudent.gender}</dd></div>
                  <div><dt className="text-xs uppercase text-slate-400">Date of Birth</dt><dd className="text-slate-700">{fmtDate(viewStudent.dob)}</dd></div>
                  <div><dt className="text-xs uppercase text-slate-400">Phone</dt><dd className="text-slate-700">{viewStudent.phone}</dd></div>
                  <div><dt className="text-xs uppercase text-slate-400">Guardian Phone</dt><dd className="text-slate-700">{viewStudent.guardianPhone || '—'}</dd></div>
                  <div className="col-span-2"><dt className="text-xs uppercase text-slate-400">Postal Address</dt><dd className="text-slate-700">{viewStudent.address || '—'}</dd></div>
                </dl>
              </Card>

              <Card title="Academic Details">
                <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                  <div><dt className="text-xs uppercase text-slate-400">Program</dt><dd className="text-slate-700">{viewStudent.program.name}</dd></div>
                  <div><dt className="text-xs uppercase text-slate-400">Status</dt><dd className="text-slate-700 capitalize"><Badge value={viewStudent.status} /></dd></div>
                  <div className="col-span-2 border-t border-slate-100 my-1"></div>
                  <div className="col-span-2 font-semibold text-xs uppercase text-slate-400 tracking-wider">Matriculation</div>
                  <div><dt className="text-xs uppercase text-slate-400">Board & Year</dt><dd className="text-slate-700">{viewStudent.matricBoard || '—'} ({viewStudent.matricYear || '—'})</dd></div>
                  <div><dt className="text-xs uppercase text-slate-400">Marks</dt><dd className="text-slate-700">{viewStudent.matricObtained ? `${Number(viewStudent.matricObtained)}/${Number(viewStudent.matricTotal)}` : '—'}</dd></div>
                  
                  {viewStudent.interObtained && (
                    <>
                      <div className="col-span-2 border-t border-slate-100 my-1"></div>
                      <div className="col-span-2 font-semibold text-xs uppercase text-slate-400 tracking-wider">Intermediate</div>
                      <div><dt className="text-xs uppercase text-slate-400">Board & Year</dt><dd className="text-slate-700">{viewStudent.interBoard || '—'} ({viewStudent.interYear || '—'})</dd></div>
                      <div><dt className="text-xs uppercase text-slate-400">Marks</dt><dd className="text-slate-700">{viewStudent.interObtained ? `${Number(viewStudent.interObtained)}/${Number(viewStudent.interTotal)}` : '—'}</dd></div>
                    </>
                  )}
                </dl>
              </Card>
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-100">
              <Button variant="outline" onClick={() => setViewStudent(null)}>Close Profile</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
