import { useEffect, useState } from 'react';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { Card, Button, Input, Select, Field, Table, Badge, Modal, useFlash, errText } from '../../components/ui';

const STAFF_ROLES = [
  { value: 'clerk', label: 'Admission Clerk' },
  { value: 'librarian', label: 'Librarian' },
  { value: 'timetable', label: 'Timetable Controller' },
];
const roleLabel = (v) => STAFF_ROLES.find((r) => r.value === v)?.label || v;

// Principal-only staff directory (§5.13): view clerk / librarian / timetable
// accounts, create new ones on the default password, and reset any password.
export default function StaffAccounts() {
  const { user } = useAuth();
  const [users, setUsers] = useState(null);
  const [roleFilter, setRoleFilter] = useState('');
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', role: 'clerk' });
  const [saving, setSaving] = useState(false);
  const [resettingId, setResettingId] = useState(null);
  const [busyId, setBusyId] = useState(null); // delete / enable-disable in flight
  const [flash, flashEl] = useFlash();

  const load = () =>
    api
      .get('/users', { params: { ...(roleFilter && { role: roleFilter }) } })
      .then((r) => setUsers(r.data.users))
      .catch((e) => flash({ type: 'error', text: errText(e) }));

  useEffect(() => {
    load();
  }, [roleFilter]);

  // Only the three staff roles are creatable/manageable here.
  const staffUsers = (users || []).filter((u) => u.roles.some((r) => ['clerk', 'librarian', 'timetable'].includes(r)));

  async function createAccount(e) {
    e.preventDefault();
    try {
      setSaving(true);
      const r = await api.post('/users', form);
      flash({ type: 'ok', text: `${roleLabel(form.role)} account created. Temporary password: "${r.data.tempPassword}".` });
      setModal(false);
      setForm({ name: '', email: '', role: 'clerk' });
      await load();
    } catch (e2) {
      flash({ type: 'error', text: errText(e2) });
    } finally {
      setSaving(false);
    }
  }

  async function resetPassword(u) {
    try {
      setResettingId(u.id);
      const res = await api.put(`/users/${u.id}/reset-password`);
      flash({ type: 'ok', text: `${res.data.message} New password: "password".` });
    } catch (e2) {
      flash({ type: 'error', text: errText(e2) });
    } finally {
      setResettingId(null);
    }
  }

  async function toggleActive(u) {
    try {
      setBusyId(u.id);
      const r = await api.put(`/users/${u.id}/active`, { isActive: !u.isActive });
      flash({ type: 'ok', text: r.data.message });
      await load();
    } catch (e2) {
      flash({ type: 'error', text: errText(e2) });
    } finally {
      setBusyId(null);
    }
  }

  async function remove(u) {
    try {
      setBusyId(u.id);
      const r = await api.delete(`/users/${u.id}`);
      flash({ type: 'ok', text: r.data.message });
      await load();
    } catch (e2) {
      flash({ type: 'error', text: errText(e2) });
    } finally {
      setBusyId(null);
    }
  }

  const columns = [
    { header: 'NAME', cell: (u) => u.name },
    { header: 'EMAIL', cell: (u) => u.email },
    {
      header: 'ROLE',
      cell: (u) => (
        <span className="flex flex-wrap gap-1">
          {u.roles.filter((r) => ['clerk', 'librarian', 'timetable'].includes(r)).map((r) => (
            <Badge key={r} value={roleLabel(r)} />
          ))}
        </span>
      ),
    },
    {
      header: 'STATUS',
      cell: (u) => (u.isActive ? <span className="text-primary">Active</span> : <span className="text-slate-400">Inactive</span>),
    },
    {
      header: 'ACTIONS',
      cell: (u) => (
        <div className="flex gap-2">
          <Button
            variant="outline"
            disabled={resettingId === u.id || u.id === user.id}
            onClick={() => resetPassword(u)}
          >
            {resettingId === u.id ? 'Resetting…' : 'Reset password'}
          </Button>
          <Button
            variant="outline"
            disabled={busyId === u.id || u.id === user.id}
            onClick={() => toggleActive(u)}
          >
            {u.isActive ? 'Disable' : 'Enable'}
          </Button>
          <Button
            variant="danger"
            disabled={busyId === u.id || u.id === user.id}
            onClick={() => remove(u)}
          >
            {busyId === u.id ? 'Working…' : 'Delete'}
          </Button>
        </div>
      ),
    },
  ];

  const rows = staffUsers.map((u) => ({ ...u, id: u.id }));

  return (
    <div className="space-y-6">
      {flashEl}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-slate-900">Staff Accounts</h1>
        <Button onClick={() => setModal(true)}>+ New account</Button>
      </div>

      <Card>
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <Select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className="w-auto">
            <option value="">All staff roles</option>
            {STAFF_ROLES.map((r) => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </Select>
          <span className="text-sm text-slate-400">{staffUsers.length} account(s)</span>
        </div>
        {users === null ? (
          <div className="py-10 text-center text-slate-400">Loading…</div>
        ) : (
          <Table columns={columns} rows={rows} empty="No staff accounts in this view yet." />
        )}
      </Card>

      <Modal open={modal} title="Create staff account" onClose={() => setModal(false)}>
        <form onSubmit={createAccount} className="space-y-4">
          <Field label="Full name">
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required minLength={3} autoFocus />
          </Field>
          <Field label="Login email">
            <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
          </Field>
          <Field label="Role">
            <Select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
              {STAFF_ROLES.map((r) => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </Select>
          </Field>
          <p className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-500">
            The account starts with the default password <span className="font-mono">"password"</span> and the user must set their own at first login.
          </p>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setModal(false)}>Cancel</Button>
            <Button type="submit" disabled={saving}>{saving ? 'Creating…' : 'Create account'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
