import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) {
    return <div className="flex min-h-screen items-center justify-center text-slate-500">Loading…</div>;
  }
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

// Friendly in-portal "no access" screen (the API refuses anyway — this is UX).
export function NoAccess() {
  return (
    <div className="py-24 text-center">
      <div className="text-5xl">🔒</div>
      <h1 className="mt-4 text-xl font-bold text-slate-800">You don't have access to this page</h1>
      <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
        Your roles haven't been granted the permission this page needs. Ask the Admin or Principal
        to allow it from the Permissions page.
      </p>
      <Link to="/portal" className="mt-6 inline-block rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-dark">
        Back to dashboard
      </Link>
    </div>
  );
}

// Route-level permission gate: renders the page only when the user holds one of the
// named permissions (anyOf) OR one of the named roles. Pass roles for admin/principal
// surfaces that aren't permission-granted (e.g. Permissions is admin-only). An empty
// anyOf no longer implies "super admin" — say which roles explicitly.
export function PermissionRoute({ anyOf = [], roles = [], children }) {
  const { user, can } = useAuth();
  const roleOk = roles.some((r) => user?.roles?.includes(r));
  const permOk = anyOf.length > 0 && can(...anyOf);
  if (!roleOk && !permOk) return <NoAccess />;
  return children;
}

export function NotFound() {
  return (
    <div className="py-24 text-center">
      <div className="text-5xl">🧭</div>
      <h1 className="mt-4 text-xl font-bold text-slate-800">Page not found</h1>
      <p className="mt-2 text-sm text-slate-500">The page you're looking for doesn't exist or has moved.</p>
      <Link to="/portal" className="mt-6 inline-block rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-dark">
        Back to dashboard
      </Link>
    </div>
  );
}
