import { useEffect, useMemo, useState } from 'react';
import api from '../../api/client';
import { Card, Button, Input, Select, Modal, Field, useFlash, useConfirm, errText } from '../../components/ui';
import { useAuth } from '../../context/AuthContext';

const GROUP_LABEL = {
  admissions: 'Admissions desk',
  merit: 'Merit lists',
  challans: 'Fee challans',
  students: 'Students',
  teachers: 'Teachers',
  departments: 'Departments',
  academic: 'Academic structure',
  timetable: 'Timetable',
  library: 'Library',
  committee: 'Committees',
  notices: 'Notices',
  website: 'Website content',
  settings: 'System settings',
  staff: 'Staff accounts',
  examinations: 'Examinations',
};

const ROLE_NOTES = {
  admin: 'Full system control — passes every permission check, manages this page.',
  principal: 'Oversees academic activities. Granted full module permissions by default, but these can be revoked.',
  controller_examiner: 'Exam allotments, slips, question papers.',
  hod: 'Granted automatically with a HOD nomination: own department page, gallery, students.',
  teacher: 'Own classes: attendance, assessments & marks, classwork, timetable, profile.',
  student: 'Own records: attendance, marks, classwork, challans, library, student card.',
  applicant: 'Register, apply online, track applications, upload documents.',
};

export default function Permissions() {
  const [tab, setTab] = useState('matrix');
  const [matrix, setMatrix] = useState(null);
  const [flash, flashEl] = useFlash();
  const [confirm, confirmEl] = useConfirm();

  const loadMatrix = () => api.get('/admin/permissions').then((r) => setMatrix(r.data));
  useEffect(() => { loadMatrix(); }, []);

  return (
    <div className="space-y-6">
      {flashEl}{confirmEl}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Access Control</h1>
        <p className="text-sm text-slate-500">Manage what each role can do, and handle user accounts.</p>
      </div>

      <div className="flex gap-2 border-b border-slate-200">
        <button onClick={() => setTab('matrix')}
          className={`-mb-px border-b-2 px-4 py-2 text-sm font-medium ${tab === 'matrix' ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
          Permissions Matrix
        </button>
        <button onClick={() => setTab('accounts')}
          className={`-mb-px border-b-2 px-4 py-2 text-sm font-medium ${tab === 'accounts' ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
          User Accounts
        </button>
      </div>

      {tab === 'matrix' && <PermissionsMatrix matrix={matrix} loadMatrix={loadMatrix} flash={flash} confirm={confirm} />}
      {tab === 'accounts' && <UserAccounts matrix={matrix} loadMatrix={loadMatrix} flash={flash} confirm={confirm} />}
    </div>
  );
}

function PermissionsMatrix({ matrix, loadMatrix, flash, confirm }) {
  const editableRoles = (matrix?.roles ?? []).filter((r) => r.grantable && !r.superAdmin);
  const [roleName, setRoleName] = useState(editableRoles[0]?.name ?? '');
  const role = editableRoles.find((r) => r.name === roleName) ?? editableRoles[0] ?? null;

  const [applyToAll, setApplyToAll] = useState(true);
  const [users, setUsers] = useState(null);
  const [selectedUsers, setSelectedUsers] = useState(new Set());
  const [directPermsMap, setDirectPermsMap] = useState({}); // userId -> [permIds]
  
  const [permQ, setPermQ] = useState('');
  const [userQ, setUserQ] = useState('');
  const [isTimeLimited, setIsTimeLimited] = useState(false);
  const [expiresAt, setExpiresAt] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!roleName) return;
    setUsers(null);
    setSelectedUsers(new Set());
    api.get('/users', { params: { role: roleName } }).then(r => setUsers(r.data.users));
  }, [roleName]);

  // Load direct permissions for selected users
  useEffect(() => {
    if (applyToAll || selectedUsers.size === 0) return;
    const loadSelected = async () => {
      const newMap = { ...directPermsMap };
      for (const uid of selectedUsers) {
        if (!newMap[uid]) {
          try {
            const r = await api.get(`/admin/users/${uid}/permissions`);
            newMap[uid] = r.data.permissions;
          } catch (e) { /* ignore */ }
        }
      }
      setDirectPermsMap(newMap);
    };
    loadSelected();
  }, [applyToAll, selectedUsers]);

  const filteredUsers = useMemo(() => {
    if (!users) return null;
    const needle = userQ.trim().toLowerCase();
    if (!needle) return users;
    return users.filter(u => 
      u.name.toLowerCase().includes(needle) || 
      u.email.toLowerCase().includes(needle) ||
      (u.extra && u.extra.toLowerCase().includes(needle))
    );
  }, [users, userQ]);

  const groups = useMemo(() => {
    const needle = permQ.trim().toLowerCase();
    const map = new Map();
    for (const p of matrix?.permissions ?? []) {
      if (needle && !`${p.label} ${p.name} ${GROUP_LABEL[p.group] ?? p.group}`.toLowerCase().includes(needle)) continue;
      if (!map.has(p.group)) map.set(p.group, []);
      map.get(p.group).push(p);
    }
    return [...map.entries()];
  }, [matrix, permQ]);

  function toggleUserSelection(uid) {
    const s = new Set(selectedUsers);
    if (s.has(uid)) s.delete(uid);
    else s.add(uid);
    setSelectedUsers(s);
  }

  async function togglePermission(perm, has) {
    if (!applyToAll && selectedUsers.size === 0) {
      return flash({ type: 'error', text: 'Select at least one user first.' });
    }

    setBusy(true);
    try {
      if (applyToAll) {
        const r = has
          ? await api.delete(`/admin/roles/${role.name}/permissions/${perm.name}`)
          : await api.post(`/admin/roles/${role.name}/permissions`, { permission: perm.name });
        flash({ type: 'ok', text: r.data.message });
        await loadMatrix();
      } else {
        const userIds = Array.from(selectedUsers);
        const action = has ? 'revoke' : 'grant';
        
        let finalExpiresAt = null;
        if (isTimeLimited) {
          if (!expiresAt) {
            setBusy(false);
            return flash({ type: 'error', text: 'Please select a date and time for the limited permission.' });
          }
          // datetime-local doesn't include timezone. Parse it as local time, then convert to ISO string (UTC) for the backend.
          finalExpiresAt = new Date(expiresAt).toISOString();
        }

        const payload = {
          userIds,
          permission: perm.name,
          action,
          expiresAt: finalExpiresAt
        };
        const r = await api.post('/admin/users/bulk-permissions', payload);
        flash({ type: 'ok', text: r.data.message });
        
        // Update local map
        setDirectPermsMap(prev => {
          const m = { ...prev };
          userIds.forEach(uid => {
            if (!m[uid]) m[uid] = [];
            if (action === 'grant') m[uid] = [...m[uid], perm.id];
            else m[uid] = m[uid].filter(id => id !== perm.id);
          });
          return m;
        });
      }
    } catch (e) { flash({ type: 'error', text: errText(e) }); }
    finally { setBusy(false); }
  }

  function getCheckboxState(permId) {
    if (applyToAll) {
      return role?.permissions.includes(permId) ? 'checked' : 'unchecked';
    }
    if (selectedUsers.size === 0) return 'unchecked';
    
    let hasCount = 0;
    for (const uid of selectedUsers) {
      if (directPermsMap[uid]?.includes(permId)) hasCount++;
    }
    if (hasCount === 0) return 'unchecked';
    if (hasCount === selectedUsers.size) return 'checked';
    return 'mixed';
  }

  if (matrix === null) return <p className="py-8 text-center text-sm text-slate-400">Loading…</p>;

  return (
    <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
      {/* Target Selector */}
      <Card title="1. Select Target">
        <div className="space-y-4">
          <Field label="Role">
            <Select value={roleName} onChange={(e) => setRoleName(e.target.value)} className="capitalize">
              {editableRoles.map((r) => (
                <option key={r.id} value={r.name} className="capitalize">{r.name}</option>
              ))}
            </Select>
          </Field>
          
          <div className="rounded-lg border border-slate-200">
            <label className="flex cursor-pointer items-center gap-3 border-b border-slate-100 bg-slate-50 px-4 py-3">
              <input type="radio" checked={applyToAll} onChange={() => setApplyToAll(true)} className="h-4 w-4 accent-primary" />
              <div className="text-sm font-medium text-slate-800">Entire Role <span className="font-normal text-slate-500">(All Users)</span></div>
            </label>
            <label className="flex cursor-pointer items-center gap-3 px-4 py-3">
              <input type="radio" checked={!applyToAll} onChange={() => setApplyToAll(false)} className="h-4 w-4 accent-primary" />
              <div className="text-sm font-medium text-slate-800">Specific Users</div>
            </label>
          </div>

          {!applyToAll && (
            <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-2">
              <div className="mb-2 flex flex-col gap-2 px-2">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
                  <span>Users ({filteredUsers?.length ?? 0} of {users?.length ?? 0})</span>
                  {selectedUsers.size > 0 && <button className="text-primary hover:underline" onClick={() => setSelectedUsers(new Set())}>Clear selection</button>}
                </div>
                <Input placeholder="Search users by name or email..." value={userQ} onChange={(e) => setUserQ(e.target.value)} style={{ padding: '0.3rem 0.5rem', fontSize: '0.75rem' }} />
              </div>
              <div className="max-h-60 space-y-1 overflow-y-auto">
                {users === null && <p className="py-4 text-center text-xs text-slate-400">Loading…</p>}
                {filteredUsers?.map(u => (
                  <label key={u.id} className="flex cursor-pointer items-start gap-2 rounded px-2 py-1.5 hover:bg-white">
                    <input type="checkbox" checked={selectedUsers.has(u.id)} onChange={() => toggleUserSelection(u.id)} className="mt-0.5 h-3.5 w-3.5 rounded border-slate-300 accent-primary" />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium text-slate-700">{u.name}</div>
                      <div className="truncate text-[10px] text-slate-400">
                        {u.extra ? <span className="font-medium">{u.extra} &bull; </span> : null}{u.email}
                      </div>
                    </div>
                  </label>
                ))}
                {filteredUsers !== null && filteredUsers.length === 0 && <p className="py-4 text-center text-xs text-slate-400">No users match.</p>}
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Permissions Grid */}
      <Card title="2. Assign Permissions">
        <div className="mb-4 flex flex-wrap items-center gap-4">
          <Field label="Find a permission">
            <Input placeholder="e.g. merit, teachers…" value={permQ} onChange={(e) => setPermQ(e.target.value)} style={{ width: 240 }} />
          </Field>
          <div className="text-sm text-slate-500">
            {applyToAll ? (
              <span>Changes apply to <b>ALL current and future</b> users with the {role?.name} role.</span>
            ) : (
              <div className="flex flex-col gap-2">
                <span>Changes apply <b>directly</b> to the {selectedUsers.size} selected users.</span>
                <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                  <input type="checkbox" checked={isTimeLimited} onChange={(e) => setIsTimeLimited(e.target.checked)} className="h-4 w-4 accent-primary" />
                  Time Limited (Auto-Expire)
                </label>
                {isTimeLimited && (
                  <Field label="Expiration Date & Time">
                    <Input type="datetime-local" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} />
                  </Field>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {groups.map(([group, perms]) => (
            <div key={group} className="rounded-lg border border-slate-200">
              <div className="border-b border-slate-100 bg-slate-50 px-4 py-2 text-xs font-bold uppercase tracking-wide text-slate-500">
                {GROUP_LABEL[group] ?? group}
              </div>
              <div className="divide-y divide-slate-100">
                {perms.map((p) => {
                  const state = getCheckboxState(p.id);
                  const isChecked = state === 'checked';
                  const isMixed = state === 'mixed';
                  
                  return (
                    <label key={p.id} className={`flex cursor-pointer items-center gap-3 px-4 py-2.5 hover:bg-slate-50 ${(busy || (!applyToAll && selectedUsers.size === 0)) ? 'opacity-50 cursor-not-allowed' : ''}`}>
                      <input
                        type="checkbox"
                        className="h-4 w-4 shrink-0 cursor-pointer accent-green-700"
                        checked={isChecked}
                        ref={el => { if (el) el.indeterminate = isMixed; }}
                        disabled={busy || (!applyToAll && selectedUsers.size === 0)}
                        onChange={() => togglePermission(p, isChecked)}
                      />
                      <span className="min-w-0">
                        <span className="block text-sm text-slate-700">{p.label}</span>
                        {!applyToAll && role?.permissions.includes(p.id) && (
                          <span className="block text-[10px] text-primary">Inherited from {role?.name} role</span>
                        )}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>
          ))}
          {groups.length === 0 && <p className="col-span-full py-6 text-center text-sm text-slate-400">No matches.</p>}
        </div>
      </Card>
    </div>
  );
}

function UserAccounts({ matrix, loadMatrix, flash, confirm }) {
  const { user: me } = useAuth();
  const [users, setUsers] = useState(null);
  const [q, setQ] = useState('');
  
  const [grant, setGrant] = useState(null);
  const [grantRole, setGrantRole] = useState('');
  const [reset, setReset] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [busy, setBusy] = useState(false);

  const loadUsers = () => api.get('/users', { params: q ? { q } : {} }).then((r) => setUsers(r.data.users));
  useEffect(() => { loadUsers(); }, [q]);

  async function grantSubmit() {
    try {
      setBusy(true);
      const r = await api.post(`/admin/users/${grant.id}/roles`, { role: grantRole });
      flash({ type: 'ok', text: r.data.message });
      setGrant(null); setGrantRole('');
      loadUsers(); loadMatrix();
    } catch (e) { flash({ type: 'error', text: errText(e) }); }
    finally { setBusy(false); }
  }

  function revoke(u, role) {
    confirm(`Remove the "${role}" role from ${u.name}?`, async () => {
      try {
        const r = await api.delete(`/admin/users/${u.id}/roles/${role}`);
        flash({ type: 'ok', text: r.data.message });
        loadUsers(); loadMatrix();
      } catch (e) { flash({ type: 'error', text: errText(e) }); }
    });
  }

  async function resetSubmit() {
    try {
      setBusy(true);
      const r = await api.put(`/users/${reset.id}/reset-password`, newPassword ? { newPassword } : {});
      flash({
        type: 'ok',
        text: r.data.tempPassword
          ? `${r.data.message} Temporary password: "${r.data.tempPassword}"`
          : `${r.data.message} They must set a new password at next login.`,
      });
      setReset(null); setNewPassword('');
    } catch (e) { flash({ type: 'error', text: errText(e) }); }
    finally { setBusy(false); }
  }

  function toggleActive(u) {
    const target = !u.isActive;
    confirm(`${target ? 'Activate' : 'Disable'} ${u.name}'s account?`, async () => {
      try {
        const r = await api.put(`/admin/users/${u.id}/active`, { isActive: target });
        flash({ type: 'ok', text: r.data.message });
        loadUsers();
      } catch (e) { flash({ type: 'error', text: errText(e) }); }
    });
  }

  return (
    <div>
      <Card title="User Accounts" actions={<Input placeholder="Search name or email…" value={q} onChange={(e) => setQ(e.target.value)} style={{ width: 240 }} />}>
        <div className="space-y-2">
          {(users ?? []).map((u) => (
            <div key={u.id} className={`flex flex-wrap items-center gap-3 rounded-lg border px-4 py-3 ${u.isActive ? 'border-slate-200' : 'border-red-200 bg-red-50/50'}`}>
              <div className="min-w-48 flex-1">
                <div className="text-sm font-medium text-slate-800">
                  {u.name} {String(u.id) === String(me.id) && <span className="text-xs text-slate-400">(you)</span>}
                  {!u.isActive && <span className="ml-2 rounded bg-red-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-red-700">disabled</span>}
                </div>
                <div className="text-xs text-slate-400">
                  {u.extra ? <span className="font-medium text-slate-500">{u.extra} &bull; </span> : null}{u.email}
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                {u.roles.map((role) => (
                  <span key={role} className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2.5 py-1 text-xs font-medium capitalize text-primary ring-1 ring-green-200">
                    {role}
                    {String(u.id) !== String(me.id) && (
                      <button className="text-slate-400 hover:text-red-600" title={`Remove ${role} role`} onClick={() => revoke(u, role)}>✕</button>
                    )}
                  </span>
                ))}
              </div>
              {String(u.id) !== String(me.id) && (
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => { setGrant(u); setGrantRole(''); }}>+ Role</Button>
                  <Button variant="outline" onClick={() => { setReset(u); setNewPassword(''); }}>Reset password</Button>
                  <Button variant={u.isActive ? 'danger' : 'primary'} onClick={() => toggleActive(u)}>
                    {u.isActive ? 'Disable' : 'Activate'}
                  </Button>
                </div>
              )}
            </div>
          ))}
          {users !== null && users.length === 0 && <p className="py-8 text-center text-sm text-slate-400">No users match.</p>}
          {users === null && <p className="py-8 text-center text-sm text-slate-400">Loading…</p>}
        </div>
      </Card>

      <Modal open={!!grant} title={grant ? `Grant a role — ${grant.name}` : ''} onClose={() => setGrant(null)}>
        {grant && (
          <div className="space-y-3">
            <Field label="Role to grant">
              <Select value={grantRole} onChange={(e) => setGrantRole(e.target.value)}>
                <option value="">Select…</option>
                {(matrix?.roles ?? []).filter((r) => !grant.roles.includes(r.name)).map((r) => (
                  <option key={r.name} value={r.name} className="capitalize">{r.name}</option>
                ))}
              </Select>
            </Field>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setGrant(null)}>Cancel</Button>
              <Button disabled={!grantRole || busy} onClick={grantSubmit}>{busy ? 'Granting…' : 'Grant role'}</Button>
            </div>
          </div>
        )}
      </Modal>

      <Modal open={!!reset} title={reset ? `Reset password — ${reset.name}` : ''} onClose={() => setReset(null)}>
        {reset && (
          <div className="space-y-3">
            <Field label="New password" hint="Leave blank to generate a random temporary password.">
              <Input type="text" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Leave blank for random" />
            </Field>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setReset(null)}>Cancel</Button>
              <Button disabled={busy || (newPassword !== '' && newPassword.length < 8)} onClick={resetSubmit}>
                {busy ? 'Resetting…' : 'Reset password'}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
