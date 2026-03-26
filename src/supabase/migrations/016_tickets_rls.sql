-- ============================================================================
-- Migration 016 — tickets: enable Row Level Security
-- ============================================================================
-- Migration 010 (inbox_messaging) rebuilt the tickets table but did not enable
-- RLS. Migrations 004/005 applied RLS to all other user-facing tables.
-- This migration closes that gap.
--
-- Policy model:
--   - service_role: full bypass (for migrations and server-side operations)
--   - authenticated SELECT: all authenticated users can read tickets
--   - authenticated INSERT: all authenticated users can create tickets
--   - authenticated UPDATE: creator, or any manager/director, or any Executive
--   - authenticated DELETE: director or Executive only
-- ============================================================================

ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;

-- Service role bypass (required for migrations and admin operations)
CREATE POLICY "tickets_service_role"
  ON tickets FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- All authenticated users can read tickets
CREATE POLICY "tickets_select"
  ON tickets FOR SELECT
  TO authenticated
  USING (true);

-- All authenticated users can create tickets
CREATE POLICY "tickets_insert"
  ON tickets FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Creator, managers, directors, and Executive dept can update
CREATE POLICY "tickets_update"
  ON tickets FOR UPDATE
  TO authenticated
  USING (
    created_by = get_my_profile_id()
    OR get_my_role() IN ('manager', 'director')
    OR get_my_department() = 'Executive'
  )
  WITH CHECK (
    created_by = get_my_profile_id()
    OR get_my_role() IN ('manager', 'director')
    OR get_my_department() = 'Executive'
  );

-- Only directors and Executive dept can delete tickets
CREATE POLICY "tickets_delete"
  ON tickets FOR DELETE
  TO authenticated
  USING (
    get_my_role() = 'director'
    OR get_my_department() = 'Executive'
  );
