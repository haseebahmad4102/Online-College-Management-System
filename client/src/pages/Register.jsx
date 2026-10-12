import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { Input, Field, Button, errText, formatCnic } from '../components/ui';
import FancyBackground from '../components/FancyBackground';

const CNIC_RE = /^[0-9]{5}-[0-9]{7}-[0-9]$/;

// Applicant registration (§5.3.1) — real account that becomes the student login on enrollment.
// Phone is collected later in the application (personal details), so it's not asked here.
export default function Register() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const cycleId = searchParams.get('cycle');
  const applyPath = cycleId ? `/portal/apply?cycle=${cycleId}` : '/portal/apply';
  const { login } = useAuth();
  const [form, setForm] = useState({});
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  // Field-level checks so the applicant sees exactly what to fix before submitting.
  const fieldErrors = {
    name: !form.name || form.name.trim().length < 3 ? 'Enter your full name (at least 3 characters).' : '',
    cnic: !CNIC_RE.test(form.cnic ?? '') ? 'CNIC/B-Form must be #####-#######-# (13 digits).' : '',
    email: !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email ?? '') ? 'Enter a valid email address.' : '',
    password: (form.password ?? '').length < 8 ? 'Password must be at least 8 characters.' : '',
  };
  const isValid = Object.values(fieldErrors).every((e) => !e);

  async function submit(e) {
    e.preventDefault();
    if (!isValid) { setError(Object.values(fieldErrors).find(Boolean)); return; }
    setError(''); setBusy(true);
    try {
      await api.post('/auth/register', form);
      await login(form.email, form.password);
      navigate(applyPath);
    } catch (err) {
      const errors = err.response?.data?.errors;
      setError(errors ? Object.values(errors).flat()[0] : errText(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <FancyBackground />
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-primary text-2xl font-bold text-white">G</div>
          <h1 className="text-xl font-bold text-primary">Apply Online — Create Account</h1>
          <p className="text-sm text-slate-500">Govt. Graduate College Muzaffargarh</p>
        </div>
        <form onSubmit={submit} noValidate className="space-y-4 rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
          {error && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">{error}</div>}
          <Field label="Full name" hint={form.name && fieldErrors.name ? fieldErrors.name : undefined}>
            <Input value={form.name ?? ''} onChange={set('name')} required />
          </Field>
          <Field label="CNIC / B-Form (#####-#######-#)" hint={form.cnic && fieldErrors.cnic ? fieldErrors.cnic : undefined}>
            <Input
              value={form.cnic ?? ''}
              onChange={(e) => setForm({ ...form, cnic: formatCnic(e.target.value) })}
              placeholder="32302-1234567-1"
              inputMode="numeric"
              required
            />
          </Field>
          <Field label="Email" hint={form.email && fieldErrors.email ? fieldErrors.email : undefined}>
            <Input type="email" value={form.email ?? ''} onChange={set('email')} required />
          </Field>
          <Field label="Password (min 8 characters)" hint={form.password && fieldErrors.password ? fieldErrors.password : undefined}>
            <Input type="password" value={form.password ?? ''} onChange={set('password')} required />
          </Field>
          <Button type="submit" disabled={busy || !isValid} className="w-full">{busy ? 'Creating account…' : 'Register & start application'}</Button>
          <p className="text-center text-sm text-slate-500">
            Already registered? <Link to={cycleId ? `/login?cycle=${cycleId}` : '/login'} className="text-primary hover:underline">Sign in</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
