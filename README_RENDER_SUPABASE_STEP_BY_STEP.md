# Render + Supabase Step-by-Step (Desktop App + Online DB)

This guide gets you to:
1. Online backend running 24/7 on Render
2. Online PostgreSQL on Supabase
3. Installable Windows app (.exe) pointing to your live URL

---

## A. Create Supabase database

1. Go to https://supabase.com and sign in.
2. Create a new project.
3. Wait until project status is healthy.
4. Open `Project Settings -> Database`.
5. Copy the `Connection string` in URI format.
6. Replace `[YOUR-PASSWORD]` in that URI with your actual DB password.

Example format:

`postgresql://postgres.xxxxx:[YOUR-PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres`

---

## B. Run your SQL schema on Supabase

1. In Supabase, open `SQL Editor`.
2. Open local file `database/init.sql`.
3. Paste SQL into SQL Editor and run.
4. Confirm table `app_state` exists in `Table Editor`.

---

## C. Push project to GitHub

1. Create a new GitHub repository.
2. In project folder, run:

```powershell
git init
git add .
git commit -m "Initial LGU PR system"
git branch -M main
git remote add origin https://github.com/<your-user>/<your-repo>.git
git push -u origin main
```

---

## D. Deploy backend on Render

1. Go to https://render.com and sign in.
2. Click `New +` -> `Blueprint`.
3. Connect your GitHub repo.
4. Select this repository.
5. Render detects `render.yaml` and prepares service.
6. In environment variable inputs, set:
   - `DATABASE_URL` = Supabase URI from step A
   - `FRONTEND_ORIGIN` = your Render URL (you can set after first deploy)
7. Click `Apply` / `Create`.
8. Wait for deploy success.
9. Open your Render URL and test:
   - `/api/health`
   - `/api/state`

Expected health response:

```json
{ "ok": true, "db": "postgres" }
```

---

## E. Build Windows app that points to live URL

In local PowerShell (project folder):

```powershell
$env:APP_START_URL='https://<your-render-service>.onrender.com'
npm run desktop:build
```

Build output in `release/`:
1. NSIS installer `.exe`
2. Portable `.exe`

Install this on PCs. All will connect to the same online database.

---

## F. Quick validation checklist

1. Create a request from Office page on PC A.
2. Approve in Budget page on PC B.
3. Sign in Mayor page on PC C.
4. Check status in GSO page on PC D.
5. Confirm same records appear on all devices.

---

## G. Common issues

1. `Database connection failed`:
   - DATABASE_URL is wrong or password missing.
2. `/api/health` shows sqlite:
   - DATABASE_URL not set in Render env vars.
3. Desktop app opens but blank:
   - APP_START_URL wrong or service sleeping/down.
4. CORS issues:
   - Set FRONTEND_ORIGIN to your render URL.

---

## H. Security minimum

1. Change admin default password in app logic.
2. Keep `.env` out of git.
3. Enable Supabase backups.
4. Restrict who can access Render dashboard and DB credentials.
