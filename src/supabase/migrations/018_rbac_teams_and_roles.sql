-- Migration 018: RBAC Refactor — Teams, Permission Overrides, Role Updates
-- Implements 4-tier scoped RBAC: executive | manager | team_leader | staff

-- ─────────────────────────────────────────────
-- 1. teams table
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS teams (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name       text NOT NULL,
  department text NOT NULL,
  leader_id  text REFERENCES users(id) ON DELETE SET NULL,  -- users.id is text
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ─────────────────────────────────────────────
-- 2. permission_overrides table
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS permission_overrides (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     text REFERENCES users(id) ON DELETE CASCADE,   -- users.id is text
  scope       text NOT NULL CHECK (scope IN ('department_wide', 'cross_department', 'full')),
  departments text[],   -- populated when scope = 'cross_department'
  granted_by  text REFERENCES users(id) ON DELETE SET NULL,  -- users.id is text
  notes       text,
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now(),
  UNIQUE (user_id)
);

-- ─────────────────────────────────────────────
-- 3. Add team_id to users
-- ─────────────────────────────────────────────
ALTER TABLE users ADD COLUMN IF NOT EXISTS team_id uuid REFERENCES teams(id) ON DELETE SET NULL;

-- ─────────────────────────────────────────────
-- 4. Role value migration
--    rep      → staff
--    director → manager
--    Operations: operations_role takes precedence
-- ─────────────────────────────────────────────

-- Step 4a: migrate operations users from operations_role first (most specific)
UPDATE users
SET role = CASE operations_role
  WHEN 'Handler'    THEN 'staff'
  WHEN 'Supervisor' THEN 'team_leader'
  WHEN 'Manager'    THEN 'manager'
  ELSE role
END
WHERE department = 'Operations'
  AND operations_role IS NOT NULL;

-- Step 4b: migrate remaining rep → staff, director → manager
UPDATE users SET role = 'staff'   WHERE role = 'rep';
UPDATE users SET role = 'manager' WHERE role = 'director';

-- ─────────────────────────────────────────────
-- 5. Drop old role CHECK constraint and add new one
-- ─────────────────────────────────────────────
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check
  CHECK (role IN ('staff', 'team_leader', 'manager'));

-- ─────────────────────────────────────────────
-- 6. Seed the 5 Operations service teams
-- ─────────────────────────────────────────────
INSERT INTO teams (name, department) VALUES
  ('Forwarding',       'Operations'),
  ('Brokerage',        'Operations'),
  ('Trucking',         'Operations'),
  ('Marine Insurance', 'Operations'),
  ('Others',           'Operations')
ON CONFLICT DO NOTHING;

-- ─────────────────────────────────────────────
-- 7. Assign Operations users to their service team
--    based on existing service_type column
-- ─────────────────────────────────────────────
UPDATE users u
SET team_id = t.id
FROM teams t
WHERE u.department = 'Operations'
  AND u.service_type IS NOT NULL
  AND t.name = u.service_type
  AND t.department = 'Operations';

-- ─────────────────────────────────────────────
-- 8. updated_at triggers for new tables
-- ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS teams_updated_at ON teams;
CREATE TRIGGER teams_updated_at
  BEFORE UPDATE ON teams
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS permission_overrides_updated_at ON permission_overrides;
CREATE TRIGGER permission_overrides_updated_at
  BEFORE UPDATE ON permission_overrides
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
