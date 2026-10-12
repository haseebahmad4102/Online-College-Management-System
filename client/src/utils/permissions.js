// Read-only permissions — viewing/reporting only, no data mutation. Mirrors the
// server's READ_PERMISSIONS set (server/src/config/permissions.js).
//
// Role model:
//  - Principal: full super admin — every module, read and write.
//  - Admin: read + access control. Sees everything (bypasses these read perms) and
//    manages roles/permissions/HODs/accounts, but does NOT create operational
//    content (timetables, notices, academic records, library, etc.) — that belongs
//    to the relevant staff role.
export const READ_PERMISSIONS = new Set([
  'admissions.view', 'merit.view', 'challans.view', 'students.view', 'teachers.view',
  'academic.view', 'timetable.view', 'library.view', 'notices.view', 'website.view',
  'settings.view', 'attendance.reports',
]);

// Does this user pass a can(...permissions) check? Shared by AuthContext.can and the
// sidebar menu builder so both agree on what the read-only Admin may reach.
export function passesCan(user, permissions) {
  if (!user) return false;
  if (user.roles.includes('principal') || user.roles.includes('admin')) return true;
  return permissions.some((p) => (user.permissions ?? []).includes(p));
}
