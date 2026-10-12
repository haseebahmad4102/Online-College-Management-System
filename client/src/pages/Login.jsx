import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';
import FancyBackground from '../components/FancyBackground';

const ROLES = [
  {
    key: 'principal',
    label: 'Principal',
    icon: '🎓',
    tagline: 'College administration & oversight',
    accent: 'border-emerald-300 bg-emerald-50 text-emerald-800',
  },
  {
    key: 'student',
    label: 'Student',
    icon: '📚',
    tagline: 'Classwork, attendance & results',
    accent: 'border-sky-300 bg-sky-50 text-sky-800',
  },
  {
    key: 'teacher',
    label: 'Teacher',
    icon: '🧑‍🏫',
    tagline: 'Classes, assessments & marking',
    accent: 'border-violet-300 bg-violet-50 text-violet-800',
  },
  {
    key: 'clerk',
    label: 'Clerk',
    icon: '🗂️',
    tagline: 'Admissions, records & challans',
    accent: 'border-amber-300 bg-amber-50 text-amber-800',
  },
  {
    key: 'librarian',
    label: 'Librarian',
    icon: '📖',
    tagline: 'Library catalogue & circulation',
    accent: 'border-rose-300 bg-rose-50 text-rose-800',
  },
  {
    key: 'timetable',
    label: 'Timetable Controller',
    icon: '🗓️',
    tagline: 'Slots, rooms & scheduling',
    accent: 'border-teal-300 bg-teal-50 text-teal-800',
  },
  {
    key: 'applicant',
    label: 'Applicant',
    icon: '📝',
    tagline: 'Track your admission application',
    accent: 'border-indigo-300 bg-indigo-50 text-indigo-800',
  },
  {
    key: 'admin',
    label: 'Admin',
    icon: '🛡️',
    tagline: 'Full system control, audit & permissions',
    accent: 'border-slate-400 bg-slate-100 text-slate-800',
  },
  {
    key: 'controller_examiner',
    label: 'Controller Examiner',
    icon: '📑',
    tagline: 'Exam allotments, slips & question papers',
    accent: 'border-pink-300 bg-pink-50 text-pink-800',
  },
];

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const cycleId = searchParams.get('cycle');
  const [activeRole, setActiveRole] = useState(ROLES[0].key);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [logo, setLogo] = useState(null);
  // Forgot-password: identity is proven with the account's registered CNIC.
  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgot, setForgot] = useState({ email: '', cnic: '', newPassword: '' });
  const [forgotMsg, setForgotMsg] = useState(null); // { type: 'ok'|'error', text }
  const [forgotBusy, setForgotBusy] = useState(false);

  useEffect(() => {
    api.get('/settings/public').then((r) => setLogo(r.data.settings['site.logo'] || null)).catch(() => {});
  }, []);

  const role = ROLES.find((r) => r.key === activeRole);

  function selectRole(key) {
    if (key === activeRole) return;
    setActiveRole(key);
    setEmail('');
    setPassword('');
    setError('');
  }

  async function submitForgot(e) {
    e.preventDefault();
    setForgotMsg(null);
    setForgotBusy(true);
    try {
      // Applicants always reset to the standard temporary password "password" —
      // no new-password field is shown or sent for that role.
      const payload = activeRole === 'applicant'
        ? { email: forgot.email, cnic: forgot.cnic }
        : forgot;
      const r = await api.post('/auth/forgot-password', payload);
      setForgotMsg({ type: 'ok', text: r.data.message });
      setForgot({ email: '', cnic: '', newPassword: '' });
    } catch (err) {
      const data = err.response?.data;
      const fieldError = data?.errors && Object.values(data.errors).flat()[0];
      setForgotMsg({ type: 'error', text: fieldError || data?.message || 'Could not reset the password.' });
    } finally {
      setForgotBusy(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await login(email, password, activeRole);
      // Arrived here from "Apply Online" for a specific cycle → go straight to the wizard.
      navigate(cycleId ? `/portal/apply?cycle=${cycleId}` : '/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <FancyBackground />
      <div className="w-full max-w-2xl">
        <div className="mb-6 text-center">
          {logo ? (
            <img src={logo} alt="College logo" className="mx-auto mb-3 h-16 w-16 rounded-full border border-slate-200 bg-white object-contain p-1" />
          ) : (
            <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-primary text-2xl font-bold text-white">
              G
            </div>
          )}
          <h1 className="text-xl font-bold text-primary">Govt. Graduate College Muzaffargarh</h1>
          <p className="font-urdu text-accent" dir="rtl">گورنمنٹ گریجویٹ کالج مظفر گڑھ</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-slate-800">Portal Login</h2>

          <form
            onSubmit={handleSubmit}
            className={`rounded-lg border p-5 ${role.accent.split(' ')[0]}`}
          >
            <div className="mb-4 flex items-center gap-3">
              <span className="text-2xl">{role.icon}</span>
              <div>
                <p className="text-sm font-semibold text-slate-800">{role.label} Login</p>
                <p className="text-xs text-slate-500">{role.tagline}</p>
              </div>
            </div>

            {error && (
              <div className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </div>
            )}

            <label className="mb-1 block text-sm font-medium text-slate-700">
              {role.label} Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
              className="mb-3 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              placeholder="Enter your email"
            />

            <label className="mb-1 block text-sm font-medium text-slate-700">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="mb-4 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              placeholder="••••••••"
            />

            <div className="mb-5">
              <label className="mb-1 block text-sm font-medium text-slate-700">Select Role</label>
              <div className="relative">
                <select
                  value={activeRole}
                  onChange={(e) => selectRole(e.target.value)}
                  className="w-full appearance-none rounded-lg border border-slate-300 bg-white py-2 pl-3 pr-10 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  {ROLES.map((r) => (
                    <option key={r.key} value={r.key}>
                      {r.label}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                  <svg className="h-4 w-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={busy}
              className="w-full rounded-lg bg-primary py-2.5 font-semibold text-white hover:bg-primary-dark disabled:opacity-60"
            >
              {busy ? 'Signing in…' : `Sign in as ${role.label}`}
            </button>

            <button
              type="button"
              onClick={() => { setForgotOpen((v) => !v); setForgotMsg(null); }}
              className="mt-3 w-full text-center text-xs text-slate-500 hover:text-primary hover:underline"
            >
              {forgotOpen ? 'Hide password reset' : 'Forgot your password?'}
            </button>
          </form>

          {forgotOpen && (
            <form onSubmit={submitForgot} className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-5">
              <p className="mb-3 text-xs text-slate-500">
                {activeRole === 'applicant'
                  ? 'Reset your password using the CNIC/B-Form registered on your account. It will be reset to the temporary password "password" — you\'ll be asked to set your own right after signing in.'
                  : 'Reset your password using the CNIC/B-Form registered on your account. Staff accounts without a CNIC should ask the admin office for a reset instead.'}
              </p>
              {forgotMsg && (
                <div className={`mb-3 rounded-lg border px-3 py-2 text-sm ${forgotMsg.type === 'ok'
                  ? 'border-green-200 bg-green-50 text-green-800'
                  : 'border-red-200 bg-red-50 text-red-700'}`}>
                  {forgotMsg.text}
                </div>
              )}
              <label className="mb-1 block text-sm font-medium text-slate-700">Account email</label>
              <input type="email" required value={forgot.email}
                onChange={(e) => setForgot({ ...forgot, email: e.target.value })}
                className="mb-3 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" />
              <label className="mb-1 block text-sm font-medium text-slate-700">CNIC / B-Form (#####-#######-#)</label>
              <input type="text" required value={forgot.cnic} placeholder="12345-1234567-1"
                onChange={(e) => setForgot({ ...forgot, cnic: e.target.value })}
                className={activeRole === 'applicant' ? 'mb-4 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary' : 'mb-3 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary'} />
              {activeRole !== 'applicant' && (
                <>
                  <label className="mb-1 block text-sm font-medium text-slate-700">New password</label>
                  <input type="password" required minLength={8} value={forgot.newPassword}
                    onChange={(e) => setForgot({ ...forgot, newPassword: e.target.value })}
                    className="mb-4 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" />
                </>
              )}
              <button type="submit" disabled={forgotBusy}
                className="w-full rounded-lg bg-slate-700 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60">
                {forgotBusy ? 'Resetting…' : activeRole === 'applicant' ? 'Reset to temporary password' : 'Reset password'}
              </button>
            </form>
          )}
        </div>

        <p className="mt-4 text-center text-sm text-slate-500">
          <Link to="/" className="text-primary hover:underline">← Back to website</Link>
        </p>
      </div>
    </div>
  );
}
