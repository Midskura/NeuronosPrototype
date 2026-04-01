-- Migration 025: E-Voucher Architecture — Role Constraints, Operations Role Cleanup,
--               EV Approval Authority, Liquidation Submissions
-- Resolves:
--   • Migration 018 role constraint missing 'executive' value
--   • operations_role column redundant (Supervisor = team_leader in main role column)
--   • ev_approval_authority toggle needed for delegation model
--   • liquidation_submissions table for cash_advance / budget_request liquidation

-- ─────────────────────────────────────────────
-- 1. Add 'executive' to role CHECK constraint
-- ─────────────────────────────────────────────
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check
  CHECK (role IN ('staff', 'team_leader', 'manager', 'executive'));

-- Assign 'executive' role to all users in the Executive department
UPDATE users
SET role = 'executive'
WHERE department = 'Executive'
  AND role != 'executive';

-- ─────────────────────────────────────────────
-- 2. Retire operations_role column
--    (Supervisor already migrated → team_leader in migration 018)
--    Drop safely — column is no longer used by the app.
-- ─────────────────────────────────────────────
ALTER TABLE users DROP COLUMN IF EXISTS operations_role;

-- ─────────────────────────────────────────────
-- 3. Add ev_approval_authority to users
--    When true for a team_leader, their team's EVs skip the CEO gate.
--    Configurable by Executives via User Management.
-- ─────────────────────────────────────────────
ALTER TABLE users ADD COLUMN IF NOT EXISTS ev_approval_authority boolean NOT NULL DEFAULT false;

-- ─────────────────────────────────────────────
-- 4. liquidation_submissions table
--    One submission per handler session. Multiple submissions per EV are allowed
--    (incremental receipt filing). The advance stays open until is_final = true
--    and Accounting closes it.
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS liquidation_submissions (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  evoucher_id       text NOT NULL REFERENCES evouchers(id) ON DELETE CASCADE,
  submitted_by      text NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  submitted_by_name text NOT NULL,
  -- JSONB array of { id, description, amount, receipt_url? }
  line_items        jsonb NOT NULL DEFAULT '[]'::jsonb,
  total_spend       numeric(15,2) NOT NULL DEFAULT 0,
  unused_return     numeric(15,2),              -- cash being returned (final submission only)
  is_final          boolean NOT NULL DEFAULT false,  -- marks the advance as ready for Accounting review
  status            text NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending', 'approved', 'revision_requested')),
  submitted_at      timestamptz NOT NULL DEFAULT now(),
  reviewed_by       text REFERENCES users(id) ON DELETE SET NULL,
  reviewed_at       timestamptz,
  reviewer_remarks  text,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

-- Index: fast lookup of all submissions for a given EV
CREATE INDEX IF NOT EXISTS idx_liquidation_submissions_evoucher_id
  ON liquidation_submissions(evoucher_id);

-- updated_at trigger
CREATE OR REPLACE TRIGGER set_liquidation_submissions_updated_at
  BEFORE UPDATE ON liquidation_submissions
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ─────────────────────────────────────────────
-- 5. RLS for liquidation_submissions
--    • Any authenticated user can read submissions on their own EVs
--    • Accounting can read all; Executives can read all
--    • Only the EV requestor can insert (submit)
--    • Accounting can update (approve / request revision)
-- ─────────────────────────────────────────────
ALTER TABLE liquidation_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "liquidation_submissions_select" ON liquidation_submissions
  FOR SELECT USING (
    auth.uid()::text IN (
      SELECT created_by FROM evouchers WHERE id = evoucher_id
    )
    OR EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()::text
        AND (department = 'Accounting' OR department = 'Executive')
    )
  );

CREATE POLICY "liquidation_submissions_insert" ON liquidation_submissions
  FOR INSERT WITH CHECK (
    submitted_by = auth.uid()::text
  );

CREATE POLICY "liquidation_submissions_update" ON liquidation_submissions
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()::text
        AND department = 'Accounting'
    )
  );
