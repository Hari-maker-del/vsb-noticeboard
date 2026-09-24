# VSB Noticeboard

A professional full-stack department portal for the V.S.B Engineering College Information Technology Department.

## Core modules
- Student portal: overview, notices, timetable, faculty and events
- Notice search, category filtering, class targeting, priority and expiry
- Staff authentication with bcrypt + JWT
- Admin dashboard and statistics
- Admin CRUD for notices, timetable and faculty
- SQLite relational database with audit logs
- Helmet security headers, CORS and API rate limiting
- Responsive professional UI

## Stack
Node.js, Express, SQLite, JWT, bcrypt and Tailwind CSS.

## Local setup
1. Copy `.env.example` to `.env`.
2. Set a strong `JWT_SECRET`, `ADMIN_EMAIL` and `ADMIN_PASSWORD`.
3. Run `npm install`.
4. Run `npm test`.
5. Run `npm start`.
6. Open `http://localhost:5000`.

The SQLite database is created automatically in `data/vsb-noticeboard.sqlite`.

## API
### Public
- GET /api/health
- POST /api/auth/login
- GET /api/notices
- GET /api/classes
- GET /api/timetable
- GET /api/faculty

### Admin / staff
- POST /api/notices (ADMIN/FACULTY)
- PUT /api/notices/:id (ADMIN/FACULTY)
- DELETE /api/notices/:id (ADMIN)
- POST /api/classes (ADMIN)
- DELETE /api/classes/:id (ADMIN)
- POST /api/timetable (ADMIN)
- PUT /api/timetable/:id (ADMIN)
- DELETE /api/timetable/:id (ADMIN)
- POST /api/faculty (ADMIN)
- PUT /api/faculty/:id (ADMIN)
- DELETE /api/faculty/:id (ADMIN)
- GET /api/admin/stats (ADMIN)

## Security
Never commit `.env`, database files, `node_modules`, passwords or backup files. Use a strong random JWT secret in production.

## Validation
Run `npm test` before committing. This checks Node.js syntax for the backend/database modules.

## Production roadmap
For public deployment, move SQLite to PostgreSQL, add object storage for attachments, email/push notifications, automated integration tests, CI/CD, backups and monitoring.
