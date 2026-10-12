# GGCM OCMS — Permission & Access-Control Reference

> Audited 2026-07-12. This project runs on **Node.js/Express**, so the PHP package
> *Spatie laravel-permission* cannot be used directly. The system instead implements the
> same model Spatie provides — **roles in the database** (`roles`, `user_roles` tables),
> a **role guard middleware**, and a **super-admin bypass** — with these equivalents:
>
> | Spatie concept | OCMS equivalent |
> |---|---|
> | `Role` model + `model_has_roles` | `roles` + `user_roles` tables (Prisma) |
> | `$user->hasRole('clerk')` | `req.user.roles.includes('clerk')` |
> | `middleware('role:clerk')` | `authorize('clerk')` ([auth.js](../server/src/middleware/auth.js)) |
> | `Gate::before()` super admin | `authorize()` passes the **principal** for every check |
> | Policies (ownership) | per-handler owner checks (`userId === req.user.id`, `teacherId === req.teacher.id`) |

## Roles

`principal` (super admin — passes every `authorize()`), `clerk`, `teacher`, `student`,
`librarian`, `timetable`, `applicant` (assigned automatically at public registration).

## Global rules

1. **Authentication** — every `/api/*` route except the public set requires a Bearer JWT
   (`authenticate`). Deactivated accounts (`is_active = 0`) are rejected at every request.
2. **Principal bypass** — `authorize(...)` always admits the principal (Spatie
   `Gate::before` equivalent). `authorize()` with no roles = principal-only.
3. **Temporary passwords** — accounts flagged `must_change_password` can only reach
   `/api/auth/*` until they set their own password (enforced server-side in `authenticate`).
4. **Private files** — everything under `storage/private` is only served through guarded
   download routes with owner/role checks; `storage/public` (logos, gallery) is world-readable.

## Route matrix

### Public (no login)
| Route | Notes |
|---|---|
| `GET /api/public/*` | website payloads (home, gallery, departments, faculty, programs, admissions, notices, pages) |
| `GET /api/settings/public` | site branding keys only (group `site`) |
| `GET /api/merit/public` | published merit lists |
| `POST /api/auth/login`, `POST /api/auth/register` | register always assigns the `applicant` role |

### Auth (`/api/auth`)
| Route | Allowed |
|---|---|
| `GET /me`, `PUT /password` | any authenticated user |
| `PUT /profile` | **principal only** (by design — other roles' identity is managed by staff) |

### Admissions (`/api/admissions`)
| Route | Allowed |
|---|---|
| `GET /mine`, `GET /wizard-data`, `POST /` | any authenticated user (applicant flow) |
| `POST /:id/documents/:typeId` | **owner** of the application only |
| `GET /:id`, `GET /:id/pdf`, `GET /documents/:id/download` | owner **or** clerk/principal |
| `GET /queue`, `PUT /documents/:id`, `PUT /:id/override`, `PUT /:id/reject` | clerk (+principal) |

### Academic structure (`/api/academic`)
| Route | Allowed |
|---|---|
| all `GET` | any authenticated user (reference data, mirrored publicly anyway) |
| all `POST/PUT/DELETE` | clerk (+principal) |

### Students (`/api/students`)
| Route | Allowed |
|---|---|
| `GET /me`, `POST /me/photo`, `GET /me/card` | student (own profile via `loadStudent`) |
| `GET /`, `PUT /:id/section`, `PUT /:id/status` | clerk (+principal) |

`PUT /:id/status` sets `active` / `inactive` / `struck_off` (expelled). Striking a
student off also disables their login; setting them back to `active` restores it.
`passed_out` is not settable here — it is the outcome of the final-term promotion.

### Teachers (`/api/teachers`)
| Route | Allowed |
|---|---|
| `GET /` | clerk, timetable (+principal) |
| `GET /:id`, `POST /`, `PUT /:id`, `DELETE /:id` | clerk (+principal) |

### Attendance (`/api/attendance`)
| Route | Allowed |
|---|---|
| `GET /my-classes`, `GET/POST /sheet` | teacher (own allocations only) |
| `PUT /sheet/:id/unlock` | **principal only** |
| `GET /mine` | student (own record) |
| `GET /report/register` | clerk, teacher (+principal) |
| `GET /report/short` | clerk (+principal) |

### Assessments (`/api/assessments`)
| Route | Allowed |
|---|---|
| CRUD + marks + publish | teacher (own allocations only, checked per handler) |
| `GET /mine` | student (own marks, published only) |
| `GET /:id/award-list` | owning teacher, clerk (+principal) — *ownership check added in audit* |

### Classwork / Quizzes (`/api/classwork`)
| Route | Allowed |
|---|---|
| `GET /`, `POST /`, `DELETE /:id`, `GET /:id/submissions`, `PUT /submissions/:id/grade` | teacher (own allocations only) |
| `GET /mine`, `POST /:id/submit`, `GET/POST /:id/attempt` (online quiz) | student (own section; quiz answers never sent to the client before submission) |
| `GET /:id/attachment` | section students / owning teacher (+principal) — *check added in audit* |
| `GET /submissions/:id/download` | submitting student / owning teacher (+principal) |

### Challans (`/api/challans`)
| Route | Allowed |
|---|---|
| `GET /` , `PUT /:id/verify`, `PUT /:id/reject` | clerk (+principal) |
| `GET /:id/print-data`, `GET /:id/paid-copy` | owner or clerk/principal |
| `POST /:id/paid-copy` | owner only |

### Merit (`/api/merit`)
| Route | Allowed |
|---|---|
| `GET /`, `POST /generate`, `PUT /:id/publish`, `POST /:id/expire-unpaid` | clerk (+principal) |

### Library (`/api/library`)
| Route | Allowed |
|---|---|
| `GET /books` | any authenticated user (catalog browse) |
| `POST /requests`, `GET /mine` | student |
| everything else (stats, books CRUD, categories, requests desk, issues, fines) | librarian (+principal) |

### Timetable (`/api/timetable`)
| Route | Allowed |
|---|---|
| all `GET` (blocks, rooms, slots, entries, shift-ranges) | any authenticated user |
| all `POST/PUT/DELETE` | timetable controller (+principal) |
| `GET /my/teacher` / `GET /my/student` | teacher / student (own timetable) |

### Notices (`/api/notices`)
| Route | Allowed |
|---|---|
| `GET /feed` | any authenticated user (role-audience filtered) |
| manage CRUD | clerk (+principal) |

### Settings (`/api/settings`)
| Route | Allowed |
|---|---|
| `GET /`, `PUT /` | librarian sees/edits **only `library.*` keys**; principal sees/edits all |
| logo, principal-message, principal-photo, site-image, gallery CRUD | principal only |

### Users / staff accounts (`/api/users`) & notifications & dashboard
| Route | Allowed |
|---|---|
| `/api/users/*` (list, create, reset password, activate, delete) | **principal only** |
| `/api/notifications/*` | any authenticated user (own rows) |
| `/api/dashboard` | any authenticated user (payload shaped by role) |

## Findings fixed in this audit (2026-07-12)

1. **Classwork attachment IDOR** — `GET /api/classwork/:id/attachment` had no ownership
   check; any logged-in user could download any class's attachment. Now restricted to the
   section's students, the owning teacher, or the principal.
2. **Award-list cross-teacher read** — `GET /api/assessments/:id/award-list` let any
   teacher open any other teacher's award list (with student marks). Now owner-only for
   teachers; clerk/principal unchanged.
3. **Temporary-password bypass** — `must_change_password` was only enforced by the portal
   UI; the API accepted all calls. Now enforced in `authenticate` (only `/api/auth/*`
   reachable until the password is changed).

## Accepted-by-design (reviewed, not changed)

- Academic reference data (`GET /api/academic/*`) readable by every authenticated role —
  the same data is largely public on the website.
- `PUT /auth/profile` principal-only — staff/student identity fields are maintained by
  the clerk/principal, not self-service.
- Students/applicants can both submit applications (students may apply for BS programs).
