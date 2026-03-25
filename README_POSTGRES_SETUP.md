# App Setup for LGU Oslob Purchase Request

This project supports two database modes:
- SQLite (default, no PostgreSQL install needed)
- PostgreSQL (optional, recommended for cloud 24/7)

Shared data includes:
- Office users
- Purchase requests
- Budget office profile (signature)
- Mayor profile (signature)

The frontend still keeps local fallback storage, but when the API is available it syncs automatically.

## Option A: Run now without PostgreSQL (SQLite default)

## 1. Create `.env`
Copy `.env.example` to `.env`.

Minimum `.env`:

```env
PORT=4000
FRONTEND_ORIGIN=http://localhost:4000
SQLITE_PATH=./data/app.db
```

## 2. Install Node dependencies
```bash
npm install
```

## 3. Start app and API server
```bash
npm start
```

Open:
- http://localhost:4000

The app serves `LGU_Oslob_Purchase_Request_Template.html` and syncs through `/api`.
The same shared PostgreSQL state is now used by:
- `LGU_Oslob_Purchase_Request_Template.html`
- `Budget_Office_Dashboard.html`
- `Mayor_Dashboard.html`
- `GSO_Dashboard.html`
- `Budget_Request_Print.html`

When running in default mode, shared state is stored in `data/app.db`.

## Option B: Use PostgreSQL (optional)

1. Create a PostgreSQL database (local or cloud).
2. Set `DATABASE_URL` in `.env`.
3. Run SQL from `database/init.sql` once.
4. Start with `npm start`.

When `DATABASE_URL` is set, server uses PostgreSQL automatically.

## API endpoints
- `GET /api/health`
- `GET /api/state`
- `PUT /api/users`
- `PUT /api/requests`
- `PUT /api/budget-profile`
- `PUT /api/mayor-profile`
- `POST /api/state/sync`

## Notes
- Sessions are still browser-session based (`sessionStorage`) by design.
- If API/database is unavailable, the frontend falls back to local storage so the UI remains usable.
