CREATE TABLE IF NOT EXISTS app_state (
  id SMALLINT PRIMARY KEY DEFAULT 1,
  users JSONB NOT NULL DEFAULT '{}'::jsonb,
  requests JSONB NOT NULL DEFAULT '[]'::jsonb,
  office_access JSONB NOT NULL DEFAULT '{}'::jsonb,
  budget_profile JSONB NOT NULL DEFAULT '{}'::jsonb,
  mayor_profile JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT app_state_singleton CHECK (id = 1)
);

INSERT INTO app_state (id, users, requests, office_access, budget_profile, mayor_profile)
VALUES (1, '{}'::jsonb, '[]'::jsonb, '{}'::jsonb, '{}'::jsonb, '{}'::jsonb)
ON CONFLICT (id) DO NOTHING;
