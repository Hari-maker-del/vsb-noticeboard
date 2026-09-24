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
Node.js, Express, SQLite, JWT, bcrypt, Multer and the existing lightweight Tailwind CDN frontend.

## Local setup
1. Copy `.env.example` to `.env`.
2. Set a strong `JWT_SECRET` (32+ characters), `ADMIN_EMAIL` and `ADMIN_PASSWORD`.
3. Run `npm install`.
4. Run `npm test`.
5. Run `npm start`.
6. Open `http://localhost:5000`.

The database is created at `data/vsb-noticeboard.sqlite`. Uploaded files are stored in `public/uploads`.

## Production
Set `NODE_ENV=production`, use a strong secret and non-default admin credentials, and set `CORS_ORIGIN` to trusted origins. SQLite/local uploads are suitable for a small single-instance deployment; for larger deployments migrate to PostgreSQL and object storage. Do not commit `.env`, database files, uploads containing private data or credentials.

## API
- `/api/auth/login`, `/api/me`, `/api/profile`
- `/api/notices` and notice read tracking
- `/api/classes`, `/api/timetable`, `/api/faculty`
- `/api/events`, `/api/assignments`, `/api/materials`, `/api/exams`
- `/api/attendance`, `/api/marks`
- `/api/users`, `/api/students`, `/api/notifications`
- `/api/uploads`

## Validation
`npm test` checks backend/database syntax and runs a database smoke test. GitHub Actions runs the same test suite on pushes and pull requests.