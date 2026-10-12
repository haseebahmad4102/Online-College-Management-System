import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { passesCan } from '../utils/permissions';
import api from '../api/client';
import FancyBackground from '../components/FancyBackground';

// Sidebar = identity menus (what a role IS: own classes, own marks…) + permission
// menus (what a role has been ALLOWED to manage on the Permissions page). Admin and
// Principal bypass every permission check, so they get every management item.
const MENUS = {
  // Admin/Principal-only surfaces (audit trail & permission management are
  // authorize('admin') on the server, never permission-granted).
  admin: [
    ['Audit Logs', '/portal/audit-logs'],
    ['Permissions', '/portal/permissions'],
    ['Departments & Teachers', '/portal/departments'],
  ],
  // Principal is now a customizable role. They only get menus based on the permissions granted
  // to them in the Admin portal, plus their personal tasks workspace.
  principal: [
    ['My Tasks', '/portal/my-tasks'],
  ],
  clerk: [
    ['My Tasks', '/portal/my-tasks'],
  ],
  // HOD is always also a teacher; the department workspace sits on top.
  hod: [
    ['My Department', '/portal/my-department'],
    ['My Tasks', '/portal/my-tasks'],
  ],
  teacher: [
    ['My Classes & Attendance', '/portal/my-classes'],
    ['Assessments & Marks', '/portal/assessments'],
    ['Quizzes & Assignments', '/portal/classwork'],
    ['Question Papers', '/portal/question-papers'],
    ['Recorded Lectures', '/portal/lectures'],
    ['My Timetable', '/portal/my-timetable'],
    ['My Tasks', '/portal/my-tasks'],
    ['My Profile', '/portal/my-profile'],
  ],
  student: [
    ['My Attendance', '/portal/attendance'],
    ['My Marks', '/portal/marks'],
    ['Classwork', '/portal/student-classwork'],
    ['Recorded Lectures', '/portal/lectures'],
    ['Timetable', '/portal/student-timetable'],
    ['Fee Challans', '/portal/my-challans'],
    ['Library', '/portal/library'],
    ['Student Card', '/portal/card'],
  ],
  librarian: [
    ['My Tasks', '/portal/my-tasks'],
  ],
  timetable: [
    ['My Tasks', '/portal/my-tasks'],
  ],
  applicant: [
    ['My Applications', '/portal/applications'],
    ['Apply Now', '/portal/apply'],
  ],
  controller_examiner: [
    ['Exams Hub', '/portal/examinations'],
    ['Exam Rooms & Sheets', '/portal/examinations/allocations'],
    ['Roll Number Slips', '/portal/examinations/slips'],
    ['Question Papers', '/portal/examinations/papers'],
  ],
};

// Management pages unlocked by module permissions — the same names the server's
// can() guards use, so a tick on the Permissions page = a sidebar entry here.
// Order matches the Admin/Principal sidebar so every role sees the same layout.
const PERMISSION_MENU = [
  [['admissions.view'], 'Verification Desk', '/portal/verification'],
  [['merit.view'], 'Merit Lists', '/portal/merit'],
  [['challans.view'], 'Challans', '/portal/challans'],
  [['challans.manage'], 'Department Fee Vouchers', '/portal/department-fees'],
  [['students.view'], 'Students', '/portal/students'],
  [['students.promote'], 'Batch Promotion', '/portal/promotion'],
  [['teachers.view'], 'Teachers', '/portal/teachers'],
  [['staff.manage'], 'Staff Accounts', '/portal/staff'],
  [['staff.manage'], 'Non-Teaching Staff', '/portal/non-teaching-staff'],
  [['assets.manage'], 'College Assets', '/portal/assets'],
  [['tasks.manage'], 'Task Assignments', '/portal/tasks'],
  [['academic.view', 'academic.manage', 'departments.manage'], 'Academic Structure', '/portal/academic'],
  [['examinations.manage'], 'Examinations Management', '/portal/examinations'],
  [['timetable.view', 'timetable.manage'], 'Timetable Builder', '/portal/timetable-builder'],
  [['timetable.view', 'timetable.manage'], 'Blocks & Rooms', '/portal/blocks'],
  [['timetable.view', 'timetable.manage'], 'Time Slots', '/portal/slots'],
  [['committee.view', 'committee.manage'], 'Committees', '/portal/committees'],
  [['library.view', 'library.manage'], 'Library', '/portal/library-hub'],
  [['marks.manage'], 'Student Marks Override', '/portal/assessments'],
  [['notices.view'], 'Notices', '/portal/notices'],
  [['website.view', 'website.manage'], 'Website Content', '/portal/website'],
  [['settings.view'], 'Settings', '/portal/settings'],
];

function menuFor(user) {
  const roles = user.roles;
  // Admin sees every module (read-only); the read-aware can() keeps the sidebar and
  // page write-buttons consistent — every permission menu below lists a .view perm.
  const has = (needs) => passesCan(user, needs);

  // priority: staff roles define the shell; extra roles append unique items
  const order = ['admin', 'principal', 'controller_examiner', 'clerk', 'hod', 'teacher', 'librarian', 'timetable', 'student', 'applicant'];
  const isExclusivelyCE = user.roles.length === 1 && user.roles[0] === 'controller_examiner';
  const items = isExclusivelyCE ? [] : [['Dashboard', '/portal']];
  const seen = new Set(items.map(i => i[1]));
  const push = (label, to) => {
    if (seen.has(to)) return;
    seen.add(to);
    items.push([label, to]);
  };

  for (const role of order) {
    if (!roles.includes(role)) continue;
    for (const [label, to] of MENUS[role]) push(label, to);
  }
  
  const isTemporary = (needs) => {
    if (user.roles.includes('admin') || user.roles.includes('principal')) return false; // Full permanent access
    const permanent = needs.some(p => user.permissions.includes(p) && !(user.temporaryPermissions || []).includes(p));
    if (permanent) return false;
    return needs.some(p => (user.temporaryPermissions || []).includes(p));
  };

  // Whatever the Admin/Principal granted this user's roles shows up as a menu item.
  for (const [needs, label, to] of PERMISSION_MENU) {
    if (has(needs)) {
      push(isTemporary(needs) ? `${label} *` : label, to);
    }
  }
  // Every role manages its own credentials (§5.13).
  push('My Account', '/portal/account');
  return items;
}

// Temporary-password accounts must set their own password before using the portal (§8.1).
function ForcePasswordChange() {
  const { user, logout, setUser } = useAuth();
  const navigate = useNavigate();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    if (newPassword !== confirm) return setError('New password and confirmation do not match.');
    setError('');
    setBusy(true);
    try {
      await api.put('/auth/password', { currentPassword, newPassword });
      setUser({ ...user, mustChangePassword: false });
    } catch (err) {
      setError(err.response?.data?.message || 'Could not change the password.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <FancyBackground />
      <form onSubmit={submit} className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-8 shadow-lg">
        <h1 className="mb-1 text-lg font-semibold text-slate-800">Set a new password</h1>
        <p className="mb-5 text-sm text-slate-500">
          Your account is using a temporary password. Choose your own password to continue, {user.name}.
        </p>
        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">{error}</div>
        )}
        <label className="mb-1 block text-sm font-medium text-slate-700">Temporary password</label>
        <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required autoFocus
          className="mb-4 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" />
        <label className="mb-1 block text-sm font-medium text-slate-700">New password</label>
        <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required minLength={8}
          className="mb-4 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" />
        <label className="mb-1 block text-sm font-medium text-slate-700">Confirm new password</label>
        <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required minLength={8}
          className="mb-6 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" />
        <button type="submit" disabled={busy}
          className="w-full rounded-lg bg-primary py-2.5 font-semibold text-white hover:bg-primary-dark disabled:opacity-60">
          {busy ? 'Saving…' : 'Save and continue'}
        </button>
        <button type="button" onClick={() => { logout(); navigate('/login'); }}
          className="mt-3 w-full rounded-lg py-2 text-sm text-slate-500 hover:bg-slate-50">
          Log out
        </button>
      </form>
    </div>
  );
}

export default function PortalLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  // Sidebar: open by default on desktop, closed on phones (it overlays there).
  const [open, setOpen] = useState(() => window.innerWidth >= 1024);
  const [bell, setBell] = useState({ notifications: [], unread: 0 });
  const [bellOpen, setBellOpen] = useState(false);
  const [settings, setSettings] = useState({});
  const [apiError, setApiError] = useState(null);
  const bellRef = useRef(null);

  // Close the notification panel on any click outside it (not just the bell button).
  useEffect(() => {
    if (!bellOpen) return;
    const onClickAway = (e) => {
      if (bellRef.current && !bellRef.current.contains(e.target)) setBellOpen(false);
    };
    document.addEventListener('mousedown', onClickAway);
    return () => document.removeEventListener('mousedown', onClickAway);
  }, [bellOpen]);

  useEffect(() => {
    let timer;
    const onError = (e) => {
      setApiError(e.detail);
      clearTimeout(timer);
      timer = setTimeout(() => setApiError(null), 6000);
    };
    window.addEventListener('api-error', onError);
    return () => { window.removeEventListener('api-error', onError); clearTimeout(timer); };
  }, []);

  // Monitor temporary permissions and force reload if any expire
  useEffect(() => {
    if (!user || !user.expirations) return;
    const expDates = Object.values(user.expirations).map(v => new Date(v).getTime());
    if (expDates.length === 0) return;
    
    const checkExpirations = () => {
      const now = Date.now();
      if (expDates.some(time => time <= now)) {
        window.location.href = '/portal';
      }
    };
    
    // Check every 5 seconds
    const interval = setInterval(checkExpirations, 5000);
    return () => clearInterval(interval);
  }, [user]);

  useEffect(() => {
    if (!user) return;
    api.get('/notifications').then((res) => setBell(res.data)).catch(() => {});
    api.get('/settings/public').then((res) => setSettings(res.data.settings)).catch(() => {});
  }, [user]);

  if (!user) return null;
  if (user.mustChangePassword) return <ForcePasswordChange />;
  const items = menuFor(user);
  const logo = settings['site.logo'];

  async function openBell() {
    setBellOpen((v) => !v);
    if (bell.unread > 0) {
      await api.put('/notifications/read-all').catch(() => {});
      setBell((b) => ({ ...b, unread: 0 }));
    }
  }

  async function clearAllNotifications() {
    await api.delete('/notifications').catch(() => {});
    setBell({ notifications: [], unread: 0 });
  }

  return (
    <div className="flex h-screen">
      <FancyBackground variant="portal" />
      {/* Sidebar — fixed while the content pane scrolls; only the nav list scrolls if long.
          On phones it overlays the content (fixed) instead of squeezing it. */}
      {open && <div className="fixed inset-0 z-30 bg-black/40 lg:hidden" onClick={() => setOpen(false)} />}
      <aside className={`${open ? 'w-64' : 'w-0 overflow-hidden'} fixed inset-y-0 left-0 z-40 flex shrink-0 flex-col bg-primary-dark text-green-100 transition-all lg:static`}>
        <div className="flex items-center gap-3 border-b border-white/10 px-5 py-4">
          {logo ? (
            <img src={logo} alt="Site logo" className="h-9 w-9 rounded-full bg-white object-contain p-0.5" />
          ) : (
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white font-bold text-primary">G</div>
          )}
          <div className="text-sm font-semibold text-white">GGCM OCMS</div>
        </div>
        <nav className="flex-1 space-y-0.5 overflow-y-auto p-3">
          {items.map(([label, to]) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/portal'}
              onClick={() => { if (window.innerWidth < 1024) setOpen(false); }}
              className={({ isActive }) =>
                `block rounded-lg px-3 py-2 text-sm ${isActive ? 'bg-primary text-white' : 'hover:bg-white/10'}`
              }
            >
              {label}
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* Main */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-slate-200 bg-white px-5 py-3">
          <div className="flex items-center gap-3">
            <button onClick={() => setOpen(!open)} className="rounded p-1.5 text-slate-500 hover:bg-slate-100" aria-label="Toggle sidebar">☰</button>
          </div>
          <div className="flex items-center gap-4">
            {/* Public website — admin/principal only, sits beside the notification bell */}
            {(user.roles.includes('principal') || user.roles.includes('admin')) && (
              <Link
                to="/"
                title="Open public website"
                aria-label="Open public website"
                className="rounded p-1.5 text-xl text-slate-500 hover:bg-slate-100 hover:text-primary"
              >
                🌐
              </Link>
            )}
            {/* Notification bell */}
            <div className="relative" ref={bellRef}>
              <button onClick={openBell} className="relative rounded p-1.5 text-xl text-slate-500 hover:bg-slate-100" aria-label="Notifications">
                🔔
                {bell.unread > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-bold text-white">
                    {bell.unread}
                  </span>
                )}
              </button>
              {bellOpen && (
                <div className="absolute right-0 z-40 mt-2 max-h-96 w-80 overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-xl">
                  <div className="flex items-center justify-between border-b border-slate-100 px-4 py-2">
                    <span className="text-xs font-semibold uppercase text-slate-400">Notifications</span>
                    {bell.notifications.length > 0 && (
                      <button onClick={clearAllNotifications} className="text-xs font-medium text-primary hover:underline">
                        Clear All
                      </button>
                    )}
                  </div>
                  {bell.notifications.length === 0 && <div className="p-4 text-sm text-slate-400">No notifications.</div>}
                  {bell.notifications.map((n) => (
                    <div key={n.id} className="border-b border-slate-100 px-4 py-3 last:border-0">
                      <div className="text-sm font-medium text-slate-800">{n.title}</div>
                      {n.body && <div className="mt-0.5 text-xs text-slate-500">{n.body}</div>}
                      <div className="mt-1 text-[11px] text-slate-400">{new Date(n.createdAt).toLocaleString()}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="text-right">
              <div className="text-sm font-medium text-slate-800">{user.name}</div>
              <div className="text-xs capitalize text-slate-400">{user.roles.join(' · ')}</div>
            </div>
            <button
              onClick={() => { logout(); navigate('/login'); }}
              className="rounded-lg bg-slate-100 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-200"
            >
              Logout
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6">
          {apiError && (
            <div className="mb-4 flex items-center justify-between rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
              <span>{apiError}</span>
              <button onClick={() => setApiError(null)} className="ml-4 font-bold" aria-label="Dismiss">✕</button>
            </div>
          )}
          <Outlet />
        </main>
      </div>
    </div>
  );
}
