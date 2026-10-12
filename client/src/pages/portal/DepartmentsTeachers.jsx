import { useEffect, useMemo, useState } from 'react';
import api from '../../api/client';
import { Card, Button, Input, Select, Textarea, Modal, Field, useFlash, useConfirm, errText } from '../../components/ui';

const TYPE_LABEL = { permanent: 'Permanent', cti: 'CTI', adhoc: 'Ad-hoc', visiting: 'Visiting' };
const POSITION_RANK = { convener: 0, secretary: 1, member: 2 };
const POSITION_BADGE = {
  convener: 'bg-amber-50 text-amber-700 ring-amber-200',
  secretary: 'bg-blue-50 text-blue-700 ring-blue-200',
  member: 'bg-slate-50 text-slate-600 ring-slate-200',
};

// Admin/Principal desk: every department with its faculty (nominate the HOD from
// the list), plus the institute's committees and their teacher members.
export default function DepartmentsTeachers() {
  const [tab, setTab] = useState('departments');
  const [departments, setDepartments] = useState(null);
  const [committees, setCommittees] = useState(null);
  const [flash, flashEl] = useFlash();
  const [confirm, confirmEl] = useConfirm();

  const loadDepartments = () => api.get('/admin/departments').then((r) => setDepartments(r.data.departments));
  const loadCommittees = () => api.get('/admin/committees').then((r) => setCommittees(r.data.committees));
  useEffect(() => { loadDepartments(); loadCommittees(); }, []);

  const allTeachers = useMemo(
    () => (departments ?? []).flatMap((d) => d.teachers.filter((t) => t.status === 'active').map((t) => ({ ...t, departmentName: d.name }))),
    [departments],
  );

  return (
    <div className="space-y-6">
      {flashEl}{confirmEl}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Departments &amp; Teachers</h1>
        <p className="text-sm text-slate-500">
          Faculty listed department-wise. Nominate a HOD for each department, and manage the institute&apos;s committees.
        </p>
      </div>

      <div className="flex gap-2 border-b border-slate-200">
        {[['departments', 'Departments & HODs'], ['committees', 'Committees']].map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)}
            className={`-mb-px border-b-2 px-4 py-2 text-sm font-medium ${tab === key ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
            {label}
          </button>
        ))}
      </div>

      {tab === 'departments' && (
        <DepartmentsTab departments={departments} flash={flash} confirm={confirm} reload={loadDepartments} />
      )}
      {tab === 'committees' && (
        <CommitteesTab committees={committees} teachers={allTeachers} flash={flash} confirm={confirm}
          reload={() => { loadCommittees(); loadDepartments(); }} />
      )}
    </div>
  );
}

function DepartmentsTab({ departments, flash, confirm, reload }) {
  function makeHod(dep, teacher) {
    confirm(`Nominate ${teacher.name} as HOD of ${dep.name}? ${dep.hod ? `${dep.hod.name} will be replaced and lose the HOD role.` : 'They gain the HOD role and its department workspace.'}`, async () => {
      try {
        const r = await api.put(`/admin/departments/${dep.id}/hod`, { teacherId: teacher.id });
        flash({ type: 'ok', text: r.data.message });
        reload();
      } catch (e) { flash({ type: 'error', text: errText(e) }); }
    });
  }
  function removeHod(dep) {
    confirm(`Remove ${dep.hod.name} as HOD of ${dep.name}? The department will have no HOD until you nominate another teacher.`, async () => {
      try {
        const r = await api.put(`/admin/departments/${dep.id}/hod`, { teacherId: null });
        flash({ type: 'ok', text: r.data.message });
        reload();
      } catch (e) { flash({ type: 'error', text: errText(e) }); }
    });
  }

  if (departments === null) return <p className="py-8 text-center text-sm text-slate-400">Loading…</p>;
  if (departments.length === 0) return <p className="py-8 text-center text-sm text-slate-400">No departments yet — create them under Academic Structure.</p>;

  return (
    <div className="space-y-5">
      {departments.map((dep) => (
        <Card key={dep.id}
          title={<span>{dep.name} <span className="ml-1 text-xs font-normal text-slate-400">({dep.code})</span></span>}
          actions={dep.hod ? (
            <span className="flex items-center gap-2 text-xs">
              <span className="rounded-full bg-amber-50 px-2.5 py-1 font-semibold text-amber-700 ring-1 ring-amber-200">
                HOD: {dep.hod.name}
              </span>
              <button className="text-slate-400 hover:text-red-600" title="Remove HOD" onClick={() => removeHod(dep)}>✕</button>
            </span>
          ) : (
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-500">No HOD nominated</span>
          )}>
          {dep.teachers.length === 0 ? (
            <p className="py-4 text-center text-sm text-slate-400">No teachers in this department yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-400">
                    <th className="py-2 pr-4">Teacher</th>
                    <th className="py-2 pr-4">Designation</th>
                    <th className="py-2 pr-4">Type</th>
                    <th className="py-2 pr-4">Committees</th>
                    <th className="py-2 pr-4">Status</th>
                    <th className="py-2 text-right">HOD</th>
                  </tr>
                </thead>
                <tbody>
                  {dep.teachers.map((t) => {
                    const isHod = dep.hodTeacherId != null && String(dep.hodTeacherId) === String(t.id);
                    return (
                      <tr key={t.id} className="border-b border-slate-100 last:border-0">
                        <td className="py-2.5 pr-4">
                          <div className="flex items-center gap-2.5">
                            {t.photoPath ? (
                              <img src={t.photoPath} alt="" className="h-8 w-8 rounded-full object-cover" />
                            ) : (
                              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-green-50 text-xs font-bold text-primary">
                                {t.name.charAt(0)}
                              </span>
                            )}
                            <div>
                              <div className="font-medium text-slate-800">
                                {t.name}
                                {isHod && <span className="ml-2 rounded bg-amber-50 px-1.5 py-0.5 text-[10px] font-bold uppercase text-amber-700 ring-1 ring-amber-200">HOD</span>}
                              </div>
                              <div className="text-xs text-slate-400">{t.email || t.phone}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-2.5 pr-4 text-slate-600">{t.designation?.title}</td>
                        <td className="py-2.5 pr-4 text-slate-600">{TYPE_LABEL[t.teacherType] ?? t.teacherType}</td>
                        <td className="py-2.5 pr-4">
                          <div className="flex max-w-52 flex-wrap gap-1">
                            {(t.committees ?? []).length === 0 && <span className="text-xs text-slate-300">—</span>}
                            {(t.committees ?? []).map((m) => (
                              <span key={m.committeeId} title={m.position}
                                className={`rounded-full px-2 py-0.5 text-[10px] font-medium ring-1 ${POSITION_BADGE[m.position] ?? POSITION_BADGE.member}`}>
                                {m.committee.name}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="py-2.5 pr-4">
                          <span className={`rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase ${t.status === 'active' ? 'bg-green-50 text-primary' : 'bg-red-50 text-red-600'}`}>
                            {t.status}
                          </span>
                        </td>
                        <td className="py-2.5 text-right">
                          {!isHod && t.status === 'active' && (
                            <Button variant="outline" className="!px-2.5 !py-1 text-xs" onClick={() => makeHod(dep, t)}>
                              Make HOD
                            </Button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      ))}
    </div>
  );
}

function CommitteesTab({ committees, teachers, flash, confirm, reload }) {
  const [edit, setEdit] = useState(null); // null | {} (new) | committee (edit)
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [addTo, setAddTo] = useState(null); // committee receiving a member
  const [teacherId, setTeacherId] = useState('');
  const [position, setPosition] = useState('member');
  const [searchTeacher, setSearchTeacher] = useState('');
  const [busy, setBusy] = useState(false);

  function openEdit(c) {
    setEdit(c ?? {});
    setName(c?.name ?? '');
    setDescription(c?.description ?? '');
  }

  async function saveCommittee() {
    try {
      setBusy(true);
      const r = edit.id
        ? await api.put(`/admin/committees/${edit.id}`, { name, description })
        : await api.post('/admin/committees', { name, description });
      flash({ type: 'ok', text: edit.id ? 'Committee updated.' : `"${r.data.committee.name}" committee created.` });
      setEdit(null);
      reload();
    } catch (e) { flash({ type: 'error', text: errText(e) }); }
    finally { setBusy(false); }
  }

  function deleteCommittee(c) {
    confirm(`Delete the "${c.name}" committee? Its member list is removed too.`, async () => {
      try {
        const r = await api.delete(`/admin/committees/${c.id}`);
        flash({ type: 'ok', text: r.data.message });
        reload();
      } catch (e) { flash({ type: 'error', text: errText(e) }); }
    });
  }

  async function addMember() {
    try {
      setBusy(true);
      const r = await api.post(`/admin/committees/${addTo.id}/members`, { teacherId, position });
      flash({ type: 'ok', text: r.data.message });
      setAddTo(null); setTeacherId(''); setPosition('member'); setSearchTeacher('');
      reload();
    } catch (e) { flash({ type: 'error', text: errText(e) }); }
    finally { setBusy(false); }
  }

  function removeMember(c, m) {
    confirm(`Remove ${m.teacher.name} from "${c.name}"?`, async () => {
      try {
        const r = await api.delete(`/admin/committees/${c.id}/members/${m.teacherId}`);
        flash({ type: 'ok', text: r.data.message });
        if (edit?.id === c.id) {
          setEdit({ ...edit, members: edit.members.filter((x) => x.teacherId !== m.teacherId) });
        }
        reload();
      } catch (e) { flash({ type: 'error', text: errText(e) }); }
    });
  }

  async function changeRole(c, teacherId, newPosition) {
    try {
      await api.post(`/admin/committees/${c.id}/members`, { teacherId, position: newPosition });
      flash({ type: 'ok', text: 'Role updated.' });
      reload();
      // the reload will fetch fresh data but the modal edit state won't instantly update unless we patch it
      if (edit?.id === c.id) {
        setEdit({
          ...edit, 
          members: edit.members.map(m => m.teacherId === teacherId ? { ...m, position: newPosition } : (newPosition === 'convener' && m.position === 'convener' ? { ...m, position: 'member' } : m))
        });
      }
    } catch (e) { flash({ type: 'error', text: errText(e) }); }
  }

  return (
    <div className="space-y-5">
      <div className="flex justify-end">
        <Button onClick={() => openEdit(null)}>+ New committee</Button>
      </div>

      {committees === null && <p className="py-8 text-center text-sm text-slate-400">Loading…</p>}
      {committees?.length === 0 && (
        <p className="py-8 text-center text-sm text-slate-400">
          No committees yet. Create one (e.g. Discipline Committee, Sports Committee, Admission Committee) and add teachers to it.
        </p>
      )}

      <div className="grid gap-5 lg:grid-cols-2">
        {(committees ?? []).map((c) => (
          <Card key={c.id} title={c.name}
            actions={
              <span className="flex gap-2">
                <Button variant="outline" className="!px-2.5 !py-1 text-xs" onClick={() => setAddTo(c)}>+ Member</Button>
                <Button variant="outline" className="!px-2.5 !py-1 text-xs" onClick={() => openEdit(c)}>Edit</Button>
                <Button variant="danger" className="!px-2.5 !py-1 text-xs" onClick={() => deleteCommittee(c)}>Delete</Button>
              </span>
            }>
            {c.description && <p className="mb-3 text-sm text-slate-500">{c.description}</p>}
            {c.members.length === 0 ? (
              <p className="py-3 text-center text-sm text-slate-400">No members yet.</p>
            ) : (
              <ul className="space-y-2">
                {[...c.members].sort((a, b) => (POSITION_RANK[a.position] ?? 9) - (POSITION_RANK[b.position] ?? 9)).map((m) => (
                  <li key={m.teacherId} className="flex items-center justify-between gap-2 rounded-lg border border-slate-100 px-3 py-2">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium text-slate-800">{m.teacher.name}</div>
                      <div className="truncate text-xs text-slate-400">
                        {m.teacher.designation?.title} · {m.teacher.department?.name}
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ring-1 ${POSITION_BADGE[m.position]}`}>
                        {m.position}
                      </span>
                      <button className="text-slate-400 hover:text-red-600" title="Remove member" onClick={() => removeMember(c, m)}>✕</button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        ))}
      </div>

      {/* Create / edit committee */}
      <Modal open={!!edit} title={edit?.id ? `Edit committee — ${edit.name}` : 'New committee'} onClose={() => setEdit(null)}>
        {edit && (
          <div className="space-y-3">
            <Field label="Committee name">
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Discipline Committee" autoFocus />
            </Field>
            <Field label="Purpose (optional)">
              <Textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)}
                placeholder="What this committee is responsible for…" />
            </Field>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEdit(null)}>Cancel</Button>
              <Button disabled={busy || name.trim().length < 3} onClick={saveCommittee}>
                {busy ? 'Saving…' : edit.id ? 'Save changes' : 'Create committee'}
              </Button>
            </div>
            
            {edit.id && (
              <div className="mt-6 border-t pt-4">
                <h4 className="mb-3 text-sm font-semibold text-slate-800">Current Members</h4>
                {edit.members?.length === 0 ? (
                  <p className="text-sm text-slate-500">No members.</p>
                ) : (
                  <ul className="space-y-2">
                    {[...(edit.members || [])].sort((a, b) => (POSITION_RANK[a.position] ?? 9) - (POSITION_RANK[b.position] ?? 9)).map((m) => (
                      <li key={m.teacherId} className="flex items-center justify-between gap-2 rounded-md bg-slate-50 px-3 py-2">
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-sm font-medium">{m.teacher?.name}</div>
                        </div>
                        <Select 
                          className="!py-1 !text-xs w-28" 
                          value={m.position} 
                          onChange={(e) => changeRole(edit, m.teacherId, e.target.value)}
                        >
                          <option value="convener">Convener</option>
                          <option value="secretary">Secretary</option>
                          <option value="member">Member</option>
                        </Select>
                        <button className="ml-2 text-slate-400 hover:text-red-600" onClick={() => removeMember(edit, m)}>✕</button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Add member */}
      <Modal open={!!addTo} title={addTo ? `Add member — ${addTo.name}` : ''} onClose={() => setAddTo(null)}>
        {addTo && (
          <div className="space-y-3">
            <Field label="Teacher" hint="Teachers from every department can join a committee.">
              <div className="mb-2">
                <Input 
                  placeholder="Search teacher by name..." 
                  value={searchTeacher} 
                  onChange={(e) => setSearchTeacher(e.target.value)} 
                />
              </div>
              <Select 
                value={teacherId} 
                onChange={(e) => setTeacherId(e.target.value)}
                size={searchTeacher ? Math.min(6, teachers.filter(t => t.name.toLowerCase().includes(searchTeacher.toLowerCase())).length + 1) : undefined}
              >
                <option value="">Select a teacher…</option>
                {teachers.filter(t => t.name.toLowerCase().includes(searchTeacher.toLowerCase())).map((t) => (
                  <option key={t.id} value={t.id}>{t.name} — {t.designation?.title} ({t.departmentName})</option>
                ))}
              </Select>
            </Field>
            <Field label="Position" hint="A committee has one convener — appointing a new one demotes the old to member.">
              <Select value={position} onChange={(e) => setPosition(e.target.value)}>
                <option value="convener">Convener</option>
                <option value="secretary">Secretary</option>
                <option value="member">Member</option>
              </Select>
            </Field>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setAddTo(null)}>Cancel</Button>
              <Button disabled={busy || !teacherId} onClick={addMember}>{busy ? 'Adding…' : 'Add member'}</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
