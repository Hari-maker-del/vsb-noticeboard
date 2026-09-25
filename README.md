# VSB IT Department Portal

A professional full-stack academic portal for the V.S.B Engineering College Information Technology Department. Version 3 adds personalized student access, academic management, file uploads, PWA support and production-oriented security.

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
- **Database:** SQLite remains the zero-setup local default; set `DATABASE_URL` to switch to PostgreSQL. The PostgreSQL schema is in `database/postgres.sql` and CI validates it against PostgreSQL 17.
- **Uploads:** local disk is the development default. Set `STORAGE_PROVIDER=s3` plus `S3_BUCKET`, `S3_REGION` and credentials for S3-compatible object storage. The upload API uses memory buffering and writes the object only after validation.
- **Deployment:** `render.yaml` provisions a Node web service and managed Render Postgres with an HTTP health check at `/api/health`. Render web services require binding to `0.0.0.0`; the app does this automatically.
- **Monitoring:** every request receives an `X-Request-ID`, structured JSON request/error logs, database-aware health status and admin operational counters. Render also exposes service CPU, memory, disk and HTTP metrics.
- **Backups:** `npm run backup:postgres` creates a PostgreSQL dump when `DATABASE_URL` and `pg_dump` are available. Render Postgres also provides managed recovery/backups.

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
2. Set `NODE_ENV=production`, a generated 32+ character `JWT_SECRET`, unique admin credentials and explicit `CORS_ORIGIN`.
3. Configure `STORAGE_PROVIDER=s3` and the S3-compatible bucket credentials.
4. Run `npm test`, `npm run test:integration`, and the CI PostgreSQL smoke test before release.
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
- **Automated monitor:** `scripts/health-check.js` performs an HTTP check against the deployed service and exits non-zero on failure. `render.yaml` schedules it every 15 minutes.
- **Backups:** `npm run backup:postgres` creates a PostgreSQL dump. When S3 credentials are configured it copies the dump to object storage and removes objects older than `BACKUP_RETENTION_DAYS` from the configured backup prefix.
- **Durability gate:** set `REQUIRE_DURABLE_PERSISTENCE=true` for the monitor only after PostgreSQL and S3 are configured; otherwise the monitor checks application/database availability without treating the current SQLite/local-upload fallback as an outage.
- **Operational logs:** request IDs, structured HTTP logs and Render metrics remain enabled for troubleshooting and capacity checks.

## V6 college-ready operations
- **Student dashboard:** signed-in students get a class-aware dashboard with attendance, marks, upcoming exams, upcoming assignments and latest notices.
- **Admin center:** admins can manage students, faculty, classes, notices, timetable, assignments, materials, exams, attendance, marks and events from the portal.
- **Demo data:** run `npm run seed:demo` in a non-production environment to populate realistic IT-A/IT-B/IT-C sample records. Demo accounts are intentionally local-only and should be changed or removed before a real college rollout.

## Validation
`npm test` checks backend/database syntax and runs a database smoke test. `npm run test:integration` exercises authentication, CRUD and password-change flows. GitHub Actions runs SQLite and PostgreSQL validation on pushes and pull requests.