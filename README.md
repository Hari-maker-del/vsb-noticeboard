# VSB Noticeboard

Full-stack noticeboard for the V.S.B Engineering College Information Technology Department.

## Features
- Dynamic notices backed by SQLite
- Admin authentication with bcrypt + JWT
- Role-based create/update/delete permissions
- Search, category and class filtering
- Notice priority and expiry
- Timetable and faculty APIs
- Admin statistics
- Security headers and rate limiting
- Environment-based secrets

## Run
1. Copy `.env.example` to `.env`.
2. Set a strong `JWT_SECRET`.
3. Set `ADMIN_EMAIL` and `ADMIN_PASSWORD`.
4. Run `npm install`.
5. Run `npm start`.
6. Open `http://localhost:5000`.

Database is created automatically under `data/`.

## API
GET /api/health
POST /api/auth/login
GET /api/notices
POST /api/notices (ADMIN/FACULTY)
PUT /api/notices/:id (ADMIN/FACULTY)
DELETE /api/notices/:id (ADMIN)
GET /api/classes
GET /api/timetable
GET /api/faculty
GET /api/admin/stats (ADMIN)

Never commit .env, node_modules, database files, or backup files.
