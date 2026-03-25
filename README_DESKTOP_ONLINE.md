# Installable Desktop App with Online Database

This project now supports building a Windows desktop app installer using Electron.

## Goal
- Install app on PCs
- Keep data online (shared database)

## Architecture
1. Deploy `server.js` to an always-on host (Render, Railway, Fly.io, etc.)
2. Use online PostgreSQL (Supabase, Neon, Railway Postgres)
3. Desktop app points to deployed URL using `APP_START_URL`

---

## Step 1: Deploy backend online

Use your preferred host. The deployed service should run:

```bash
npm install
npm start
```

Set environment variables on your host:

```env
PORT=4000
DATABASE_URL=postgresql://<user>:<pass>@<host>:5432/<db>
FRONTEND_ORIGIN=https://your-app-domain.com
```

Run SQL once in your PostgreSQL database using `database/init.sql`.

After deploy, note your URL, example:

`https://lgu-oslob-pr.onrender.com`

---

## Step 2: Test desktop app against online URL

PowerShell:

```powershell
$env:APP_START_URL='https://lgu-oslob-pr.onrender.com'
npm run desktop:dev
```

If everything works, continue to build installer.

---

## Step 3: Build Windows installer and portable app

PowerShell:

```powershell
$env:APP_START_URL='https://lgu-oslob-pr.onrender.com'
npm run desktop:build
```

Output files are in `release/`:
- NSIS installer (`.exe`)
- Portable app (`.exe`)

Distribute the installer to PCs.

---

## Local development options

Run desktop against local server:

```bash
npm run desktop:local
```

Run backend only:

```bash
npm start
```

---

## Notes
- Desktop app uses your online backend URL, so all PCs share one online database.
- If backend is down, desktop app cannot sync online until backend is back.
- Keep PostgreSQL backups enabled on your cloud provider.
