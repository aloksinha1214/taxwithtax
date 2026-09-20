# Tally With Tax backend

## Setup

1. Install Node.js 22+ (Node 24 is supported by the current `better-sqlite3` version).
2. Run `npm install`.
3. Copy `.env.example` to `.env`, set a random `JWT_SECRET`, and add Razorpay test credentials.
4. Run `npm start`, then open `http://localhost:3000`.

Do not open `index.html` directly with a `file://` URL. API login, payments, protected PDFs, and admin access require the Express server at `http://localhost:3000`.

The SQLite database is created at `data/platform.db` and is seeded with sample courses on first start. Set `ADMIN_EMAIL` and `ADMIN_PASSWORD` in `.env` to create the administrator automatically on first start. Never commit `.env` or the database.

Key endpoints include `/api/auth/register`, `/api/auth/login`, `/api/courses`, `/api/payments/orders`, `/api/payments/verify`, `/api/payments/history`, `/api/student/dashboard`, protected `/api/my/content/:id/stream`, and authenticated `/api/admin/{courses,modules,topics,contents}` CRUD plus `/api/admin/payments`. Topics support nullable descriptions, objectives, and thumbnails, and `/api/admin/topics/:id/generate-script` returns a provider-neutral lesson prompt/template. Local media files should be placed under `private-media/` and referenced by a relative `url` (for example `local:videos/lesson.mp4`); they are only served through the authenticated stream route.
