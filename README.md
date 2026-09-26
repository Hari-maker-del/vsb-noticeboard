# VSB IT Department Portal

A professional full-stack academic portal for the V.S.B Engineering College Information Technology Department. Version 4 adds durable-persistence tooling, production migration verification, and object-storage readiness.

## Features

### Student
- Secure login and profile
- Class-specific notices with unread tracking
- Pinned, scheduled and expiring announcements
- Weekly timetable
- Assignments and due dates
- Study materials
- Exam timetable
- Events and registration links
- Attendance and internal marks
- Dark/light UI and installable PWA shell

### Faculty
- Secure login
- Publish/edit department notices
- Create assignments, materials and events
- Enter attendance and marks
- Upload approved academic files

### Admin
- Dashboard statistics
- User and class management
- Notice lifecycle management
- Timetable and faculty management
- Academic content management
- Attendance/marks administration
- Audit logging

## Stack
Node.js, Express, SQLite/PostgreSQL, JWT, bcrypt, Multer, AWS S3-compatible object storage and the existing lightweight Tailwind frontend.

## Production architecture
- **Database:** SQLite remains the zero-setup local default; setting `DATABASE_URL` switches the application to PostgreSQL. V12 adds a transactional SQLite→PostgreSQL migration with row-count verification and intentionally skips active authentication sessions so users re-authenticate after cutover. The PostgreSQL schema is in `database/postgres.sql`.
- **Uploads:** local disk is the development default. Set `STORAGE_PROVIDER=s3` plus `S3_BUCKET`, `S3_REGION` and credentials for S3-compatible object storage. The upload API uses memory buffering and writes the object only after validation. V12 adds `npm run persistence:audit` to verify the database schema and durable-storage configuration before a production cutover.
- **Deployment:** Render runs the Node web service; production relational data is hosted in the configured Supabase PostgreSQL project and uploads use Supabase S3-compatible Storage. `DATABASE_URL` and S3 secrets are intentionally dashboard-managed (`sync: false`) rather than embedded in the blueprint.
- **Monitoring:** every request receives an `X-Request-ID`, structured JSON request/error logs, database-aware health status and admin operational counters. Render also exposes service CPU, memory, disk and HTTP metrics.
- **Backups:** `npm run backup:postgres` creates a PostgreSQL dump when `DATABASE_URL` and `pg_dump` are available; configured S3 storage is used for durable backup retention.

## Local setup
1. Copy `.env.example` to `.env`.
2. Set a strong `JWT_SECRET` (32+ characters), `ADMIN_EMAIL` and `ADMIN_PASSWORD`.
3. Run `npm install`.
4. Run `npm test`.
5. Run `npm run test:integration`.
6. Run `npm start`.
6. Open `http://localhost:5000`.

The database is created at `data/vsb-noticeboard.sqlite` unless `DATABASE_URL` is set. Uploaded files are stored in `public/uploads` unless S3 storage is enabled.

## Production checklist
1. Provision PostgreSQL and set `DATABASE_URL`.
2. Run `npm run migrate:postgres -- --dry-run` against a copy/maintenance environment to review source/destination counts.
3. Run `npm run migrate:postgres` during the cutover window; existing authentication sessions are intentionally skipped.
4. Run `npm run persistence:audit` and require a clean result before switching the production health monitor to durable mode.
5. Set `NODE_ENV=production`, a generated 32+ character `JWT_SECRET`, unique admin credentials and explicit `CORS_ORIGIN`.
6. Configure `STORAGE_PROVIDER=s3` and the S3-compatible bucket credentials.
7. Run `npm test` and `npm run test:integration` before release.
5. Configure Render's HTTP health check to `/api/health` (already represented in `render.yaml`).
6. Monitor request logs/metrics and schedule PostgreSQL backups according to your retention requirements.
7. Never commit `.env`, database files, private uploads, backup files or credentials.

Render's default filesystem is ephemeral, so local uploads should not be treated as durable production storage; managed Postgres is preferred for relational data and object storage for arbitrary files.

## API
- `/api/auth/login`, `/api/me`, `/api/profile`
- `/api/notices` and notice read tracking
- `/api/classes`, `/api/timetable`, `/api/faculty`
- `/api/events`, `/api/assignments`, `/api/materials`, `/api/exams`
- `/api/attendance`, `/api/marks`
- `/api/users`, `/api/students`, `/api/notifications`
- `/api/uploads`

## V7 operations and monitoring
- **Health endpoints:** `/api/health/live` checks process availability, `/api/health` checks the database, and `/api/health/ready` verifies durable PostgreSQL + object-storage readiness.
- **Automated monitor:** `.github/workflows/health-monitor.yml` checks `/api/health/live`, `/api/health`, and `/api/health/ready` every 15 minutes. Durable readiness must remain true in production.
- **Backups:** `npm run backup:postgres` creates a PostgreSQL dump. When S3 credentials are configured it copies the dump to object storage and removes objects older than `BACKUP_RETENTION_DAYS` from the configured backup prefix.
- **Durability gate:** production sets `REQUIRE_DURABLE_PERSISTENCE=true`; the readiness monitor therefore fails when PostgreSQL or S3-backed storage is unavailable.
- **Operational logs:** request IDs, structured HTTP logs and Render metrics remain enabled for troubleshooting and capacity checks.

## V6 college-ready operations
- **Student dashboard:** signed-in students get a class-aware dashboard with attendance, marks, upcoming exams, upcoming assignments and latest notices.
- **Admin center:** admins can manage students, faculty, classes, notices, timetable, assignments, materials, exams, attendance, marks and events from the portal.
- **Demo data:** run `npm run seed:demo` in a non-production environment to populate realistic IT-A/IT-B/IT-C sample records. Demo accounts are intentionally local-only and should be changed or removed before a real college rollout.


## V8 security hardening
- **Browser authentication:** the web portal uses an HttpOnly, Secure (production) and SameSite=Lax session cookie instead of storing JWT access tokens in localStorage.
- **CSRF protection:** state-changing cookie-authenticated requests require a separate CSRF token; the frontend sends it automatically.
- **Content Security Policy:** inline JavaScript was removed from the main page and the server now serves a restrictive script policy.
- **Authentication controls:** login attempts and file uploads have dedicated rate limits, auth responses are marked non-cacheable, and the app trusts the first Render proxy hop.
- **Admin password reset:** administrators can reset a user's password through a dedicated audited endpoint with a 12-character minimum.
- **Security CI:** GitHub Actions runs npm audit --omit=dev --audit-level=high on pushes, pull requests and weekly.
- **Legacy API clients:** Bearer-token authentication remains supported; setting RETURN_LEGACY_TOKEN=true exposes the login token for clients that still require it. The browser frontend does not use this compatibility mode.


## V9 session management
- Persistent database-backed sessions with expiry and revocation.
- Password changes, admin password resets, role changes and account deactivation revoke affected sessions.
- Users can view active sessions and sign out other devices from the account panel.
- Logout now revokes the server-side session.
- Authenticated requests re-check current account state.
- SQLite and PostgreSQL smoke tests cover the session store.
- Portal version: 3.5.0.


## V12 durable persistence
- **Migration safety:** `scripts/migrate-sqlite-to-postgres.js` now creates the PostgreSQL schema, migrates relational data inside a transaction, verifies destination row counts, repairs identity sequences and reports skipped conflicts.
- **Session cutover:** `auth_sessions` is intentionally excluded from migration so no pre-cutover browser session is carried into the new database.
- **Persistence audit:** `scripts/persistence-audit.js` verifies `DATABASE_URL`, required PostgreSQL tables and S3 configuration; `REQUIRE_DURABLE_PERSISTENCE=true` turns missing object storage into a hard failure.
- **Production storage:** the application now runs with PostgreSQL + S3 configuration attached in Render; local SQLite/local uploads remain development-only fallbacks.
- **Portal version:** 4.0.0.

## V10 operations and audit center
- **Audit API:** administrators can search and filter audit records with pagination limits.
- **Security dashboard:** the admin control center includes a Security & Audit workspace for recent authentication and administration activity.
- **Session control:** users can revoke individual other-device sessions; administrators can revoke all active sessions for a user.
- **Operational indexing:** audit-log indexes support user/entity/time filtering on SQLite and PostgreSQL.
- **Portal version:** 3.6.0.

## Validation
`npm test` checks backend/database syntax and runs a database smoke test. `npm run test:integration` exercises authentication, CRUD and password-change flows. GitHub Actions runs SQLite and PostgreSQL validation on pushes and pull requests.