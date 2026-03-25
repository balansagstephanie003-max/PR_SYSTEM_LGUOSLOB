const express = require("express");
const path = require("path");
const fs = require("fs");
const cors = require("cors");
const dotenv = require("dotenv");
const { Pool } = require("pg");
const Database = require("better-sqlite3");

dotenv.config();

const PORT = Number(process.env.PORT || 4000);
const DATABASE_URL = process.env.DATABASE_URL;
const SQLITE_PATH = process.env.SQLITE_PATH || path.resolve(__dirname, "data", "app.db");
const USE_POSTGRES = Boolean(DATABASE_URL);

let pool = null;
let sqliteDb = null;

if (USE_POSTGRES) {
  pool = new Pool({ connectionString: DATABASE_URL });
} else {
  const sqliteDir = path.dirname(SQLITE_PATH);
  fs.mkdirSync(sqliteDir, { recursive: true });
  sqliteDb = new Database(SQLITE_PATH);
}

const app = express();

app.use(cors({ origin: true }));
app.use(express.json({ limit: "15mb" }));

async function ensureTable() {
  if (USE_POSTGRES) {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS app_state (
        id SMALLINT PRIMARY KEY DEFAULT 1,
        users JSONB NOT NULL DEFAULT '{}'::jsonb,
        requests JSONB NOT NULL DEFAULT '[]'::jsonb,
        budget_profile JSONB NOT NULL DEFAULT '{}'::jsonb,
        mayor_profile JSONB NOT NULL DEFAULT '{}'::jsonb,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT app_state_singleton CHECK (id = 1)
      );
    `);

    await pool.query("ALTER TABLE app_state ADD COLUMN IF NOT EXISTS budget_profile JSONB NOT NULL DEFAULT '{}'::jsonb");
    await pool.query("ALTER TABLE app_state ADD COLUMN IF NOT EXISTS mayor_profile JSONB NOT NULL DEFAULT '{}'::jsonb");

    await pool.query(`
      INSERT INTO app_state (id, users, requests, budget_profile, mayor_profile)
      VALUES (1, '{}'::jsonb, '[]'::jsonb, '{}'::jsonb, '{}'::jsonb)
      ON CONFLICT (id) DO NOTHING;
    `);
    return;
  }

  sqliteDb.exec(`
    CREATE TABLE IF NOT EXISTS app_state (
      id INTEGER PRIMARY KEY,
      users TEXT NOT NULL DEFAULT '{}',
      requests TEXT NOT NULL DEFAULT '[]',
      budget_profile TEXT NOT NULL DEFAULT '{}',
      mayor_profile TEXT NOT NULL DEFAULT '{}',
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      CHECK (id = 1)
    );
  `);

  sqliteDb.prepare(`
    INSERT OR IGNORE INTO app_state (id, users, requests, budget_profile, mayor_profile, updated_at)
    VALUES (1, '{}', '[]', '{}', '{}', datetime('now'))
  `).run();
}

function normalizeUsers(users) {
  return users && typeof users === "object" && !Array.isArray(users) ? users : {};
}

function normalizeRequests(requests) {
  return Array.isArray(requests) ? requests : [];
}

function normalizeProfile(profile) {
  return profile && typeof profile === "object" && !Array.isArray(profile) ? profile : {};
}

function safeParseJson(value, fallback) {
  if (typeof value !== "string") {
    return fallback;
  }
  try {
    return JSON.parse(value);
  } catch (error) {
    return fallback;
  }
}

async function getState() {
  if (USE_POSTGRES) {
    const result = await pool.query("SELECT users, requests, budget_profile, mayor_profile, updated_at FROM app_state WHERE id = 1");
    const row = result.rows[0] || { users: {}, requests: [], budget_profile: {}, mayor_profile: {}, updated_at: null };
    return {
      users: normalizeUsers(row.users),
      requests: normalizeRequests(row.requests),
      budgetProfile: normalizeProfile(row.budget_profile),
      mayorProfile: normalizeProfile(row.mayor_profile),
      updatedAt: row.updated_at
    };
  }

  const row = sqliteDb.prepare("SELECT users, requests, budget_profile, mayor_profile, updated_at FROM app_state WHERE id = 1").get();
  if (!row) {
    return { users: {}, requests: [], budgetProfile: {}, mayorProfile: {}, updatedAt: null };
  }
  return {
    users: normalizeUsers(safeParseJson(row.users, {})),
    requests: normalizeRequests(safeParseJson(row.requests, [])),
    budgetProfile: normalizeProfile(safeParseJson(row.budget_profile, {})),
    mayorProfile: normalizeProfile(safeParseJson(row.mayor_profile, {})),
    updatedAt: row.updated_at
  };
}

async function saveUsers(users) {
  if (USE_POSTGRES) {
    await pool.query("UPDATE app_state SET users = $1::jsonb, updated_at = NOW() WHERE id = 1", [JSON.stringify(users)]);
    return;
  }
  sqliteDb.prepare("UPDATE app_state SET users = ?, updated_at = datetime('now') WHERE id = 1").run(JSON.stringify(users));
}

async function saveRequests(requests) {
  if (USE_POSTGRES) {
    await pool.query("UPDATE app_state SET requests = $1::jsonb, updated_at = NOW() WHERE id = 1", [JSON.stringify(requests)]);
    return;
  }
  sqliteDb.prepare("UPDATE app_state SET requests = ?, updated_at = datetime('now') WHERE id = 1").run(JSON.stringify(requests));
}

async function saveBudgetProfile(profile) {
  if (USE_POSTGRES) {
    await pool.query("UPDATE app_state SET budget_profile = $1::jsonb, updated_at = NOW() WHERE id = 1", [JSON.stringify(profile)]);
    return;
  }
  sqliteDb.prepare("UPDATE app_state SET budget_profile = ?, updated_at = datetime('now') WHERE id = 1").run(JSON.stringify(profile));
}

async function saveMayorProfile(profile) {
  if (USE_POSTGRES) {
    await pool.query("UPDATE app_state SET mayor_profile = $1::jsonb, updated_at = NOW() WHERE id = 1", [JSON.stringify(profile)]);
    return;
  }
  sqliteDb.prepare("UPDATE app_state SET mayor_profile = ?, updated_at = datetime('now') WHERE id = 1").run(JSON.stringify(profile));
}

async function saveState(users, requests) {
  if (USE_POSTGRES) {
    await pool.query("UPDATE app_state SET users = $1::jsonb, requests = $2::jsonb, updated_at = NOW() WHERE id = 1", [JSON.stringify(users), JSON.stringify(requests)]);
    return;
  }
  sqliteDb.prepare("UPDATE app_state SET users = ?, requests = ?, updated_at = datetime('now') WHERE id = 1").run(JSON.stringify(users), JSON.stringify(requests));
}

app.get("/api/health", async (_req, res) => {
  try {
    if (USE_POSTGRES) {
      await pool.query("SELECT 1");
      res.json({ ok: true, db: "postgres" });
      return;
    }
    sqliteDb.prepare("SELECT 1").get();
    res.json({ ok: true, db: "sqlite" });
  } catch (error) {
    res.status(500).json({ ok: false, error: "Database connection failed." });
  }
});

app.get("/api/state", async (_req, res) => {
  try {
    res.json(await getState());
  } catch (error) {
    res.status(500).json({ error: "Failed to read app state." });
  }
});

app.put("/api/users", async (req, res) => {
  const users = normalizeUsers(req.body && req.body.users);
  try {
    await saveUsers(users);
    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ error: "Failed to save users." });
  }
});

app.put("/api/requests", async (req, res) => {
  const requests = normalizeRequests(req.body && req.body.requests);
  try {
    await saveRequests(requests);
    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ error: "Failed to save requests." });
  }
});

app.put("/api/budget-profile", async (req, res) => {
  const budgetProfile = normalizeProfile(req.body && req.body.profile);
  try {
    await saveBudgetProfile(budgetProfile);
    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ error: "Failed to save budget profile." });
  }
});

app.put("/api/mayor-profile", async (req, res) => {
  const mayorProfile = normalizeProfile(req.body && req.body.profile);
  try {
    await saveMayorProfile(mayorProfile);
    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ error: "Failed to save mayor profile." });
  }
});

app.post("/api/state/sync", async (req, res) => {
  const users = normalizeUsers(req.body && req.body.users);
  const requests = normalizeRequests(req.body && req.body.requests);

  try {
    await saveState(users, requests);
    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ error: "Failed to sync state." });
  }
});

app.use(express.static(path.resolve(__dirname)));

app.get("/", (_req, res) => {
  res.sendFile(path.resolve(__dirname, "LGU_Oslob_Purchase_Request_Template.html"));
});

async function start() {
  try {
    await ensureTable();
    app.listen(PORT, () => {
      console.log(`LGU PR app running at http://localhost:${PORT}`);
      console.log(`Database mode: ${USE_POSTGRES ? "postgres" : "sqlite"}`);
    });
  } catch (error) {
    console.error("Startup failed:", error.message);
    process.exit(1);
  }
}

start();
