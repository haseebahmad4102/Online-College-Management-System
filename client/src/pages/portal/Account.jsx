import { useState } from 'react';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { Card, Button, Input, Field, Badge, useFlash, errText } from '../../components/ui';

// My Account (§5.13) — every role changes its own password here; the principal
// additionally edits his profile and resets any user's password.
export default function Account() {
  const { user, setUser } = useAuth();
  const [flash, flashEl] = useFlash();
  // Admin and Principal share the super-admin extras (profile edit, user resets).
  const isPrincipal = user.roles.includes('principal') || user.roles.includes('admin');

  // Change own password
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);

  // Principal profile
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [savingProfile, setSavingProfile] = useState(false);

  // Principal: reset any user's password
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(null);
  const [searching, setSearching] = useState(false);
  const [resettingId, setResettingId] = useState(null);

  async function changePassword(e) {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      flash({ type: 'error', text: 'New password and confirmation do not match.' });
      return;
    }
    try {
      setSavingPassword(true);
      await api.put('/auth/password', { currentPassword, newPassword });
      flash({ type: 'ok', text: 'Your password has been changed.' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (e2) {
      flash({ type: 'error', text: errText(e2) });
    } finally {
      setSavingPassword(false);
    }
  }

  async function saveProfile(e) {
    e.preventDefault();
    try {
      setSavingProfile(true);
      const res = await api.put('/auth/profile', { name, email });
      setUser((u) => ({ ...u, name: res.data.user.name, email: res.data.user.email }));
      flash({ type: 'ok', text: 'Profile updated.' });
    } catch (e2) {
      flash({ type: 'error', text: errText(e2) });
    } finally {
      setSavingProfile(false);
    }
  }

  async function search(e) {
    e.preventDefault();
    try {
      setSearching(true);
      const res = await api.get('/users', { params: { q: query } });
      setResults(res.data.users);
    } catch (e2) {
      flash({ type: 'error', text: errText(e2) });
    } finally {
      setSearching(false);
    }
  }

  async function resetPassword(u) {
    try {
      setResettingId(u.id);
      const res = await api.put(`/users/${u.id}/reset-password`);
      flash({ type: 'ok', text: `${res.data.message} Temporary password: "${res.data.tempPassword}" — they must change it at first login.` });
    } catch (e2) {
      flash({ type: 'error', text: errText(e2) });
    } finally {
      setResettingId(null);
    }
  }

  return (
    <div className="space-y-6">
      {flashEl}
      <h1 className="text-2xl font-bold text-slate-900">My Account</h1>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Change Password">
          <form onSubmit={changePassword} className="space-y-4">
            <Field label="Current password">
              <Input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </Field>
            <Field label="New password" hint="At least 8 characters.">
              <Input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={8}
                autoComplete="new-password"
              />
            </Field>
            <Field label="Confirm new password">
              <Input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={8}
                autoComplete="new-password"
              />
            </Field>
            <Button type="submit" disabled={savingPassword}>
              {savingPassword ? 'Saving…' : 'Change password'}
            </Button>
          </form>
        </Card>

        {isPrincipal && (
          <Card title="My Profile">
            <form onSubmit={saveProfile} className="space-y-4">
              <Field label="Display name">
                <Input value={name} onChange={(e) => setName(e.target.value)} required minLength={3} />
              </Field>
              <Field label="Login email">
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </Field>
              <Button type="submit" disabled={savingProfile}>
                {savingProfile ? 'Saving…' : 'Save profile'}
              </Button>
            </form>
          </Card>
        )}
      </div>

      {isPrincipal && (
        <Card title="Reset a User's Password">
          <form onSubmit={search} className="mb-4 flex gap-2">
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name or email…"
            />
            <Button type="submit" disabled={searching} className="shrink-0">
              {searching ? 'Searching…' : 'Search'}
            </Button>
          </form>

          {results && results.length === 0 && (
            <p className="text-sm text-slate-400">No users match that search.</p>
          )}
          {results && results.length > 0 && (
            <div className="divide-y divide-slate-100">
              {results.map((u) => (
                <div key={u.id} className="flex flex-wrap items-center gap-3 py-3">
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium text-slate-800">{u.name}</div>
                    <div className="truncate text-xs text-slate-500">{u.email}</div>
                  </div>
                  <div className="flex gap-1">
                    {u.roles.map((r) => <Badge key={r} value={r} />)}
                  </div>
                  <Button
                    variant="outline"
                    disabled={resettingId === u.id || u.id === user.id}
                    onClick={() => resetPassword(u)}
                  >
                    {resettingId === u.id ? 'Resetting…' : 'Reset password'}
                  </Button>
                </div>
              ))}
            </div>
          )}
          <p className="mt-3 text-xs text-slate-400">
            Resets generate a random temporary password (shown once here) and force the user to choose their own at next login.
          </p>
        </Card>
      )}
    </div>
  );
}
