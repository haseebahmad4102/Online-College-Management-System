import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ROLE_LABELS = {
  principal: 'Principal',
  clerk: 'Clerk',
  teacher: 'Teacher',
  student: 'Student',
  librarian: 'Librarian',
  timetable: 'Timetable Controller',
  applicant: 'Applicant',
};

// Placeholder dashboard — per-role dashboards with real stats arrive in Phase 1/9.
export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="bg-primary px-6 py-3 text-white shadow">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <span className="font-semibold">GGCM OCMS Portal</span>
          <div className="flex items-center gap-4 text-sm">
            <span>{user.name}</span>
            <button
              onClick={handleLogout}
              className="rounded bg-primary-dark px-3 py-1.5 hover:bg-black/30"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-10">
        <div className="rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
          <h1 className="mb-2 text-2xl font-bold text-slate-900">Welcome, {user.name}</h1>
          <p className="mb-6 text-slate-600">You are signed in to the GGCM Online College Management System.</p>
          <div className="flex flex-wrap gap-2">
            {user.roles.map((role) => (
              <span
                key={role}
                className="rounded-full bg-green-100 px-4 py-1.5 text-sm font-medium text-primary"
              >
                {ROLE_LABELS[role] ?? role}
              </span>
            ))}
          </div>
          <p className="mt-8 rounded-lg bg-slate-50 p-4 text-sm text-slate-500">
            Phase 0 complete — role-specific dashboards, settings, and the component library are
            built in Phase 1.
          </p>
        </div>
      </main>
    </div>
  );
}
