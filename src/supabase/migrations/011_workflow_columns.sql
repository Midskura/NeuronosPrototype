-- 011_workflow_columns.sql
-- Reconciles tickets + ticket_participants schema with the inbox messaging UI.
-- All statements are defensive (IF NOT EXISTS / IF EXISTS).

-- ─── 1. tickets — add missing workflow columns ────────────────────────────────

ALTER TABLE tickets ADD COLUMN IF NOT EXISTS linked_record_type text;
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS linked_record_id text;
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS resolution_action text;
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS auto_created boolean DEFAULT false;
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS priority text DEFAULT 'normal'
  CHECK (priority IN ('normal', 'urgent'));

-- Return workflow columns
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS return_reason text;
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS returned_at timestamptz;
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS returned_by text REFERENCES users(id);

-- Approval workflow columns
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS approval_result text
  CHECK (approval_result IN ('approved', 'rejected'));
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS approval_decided_at timestamptz;
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS approval_decided_by text REFERENCES users(id);

-- Status enum expansion: add statuses used by inbox UI
-- Drop old constraint, re-add with full set
ALTER TABLE tickets DROP CONSTRAINT IF EXISTS tickets_status_check;
ALTER TABLE tickets ADD CONSTRAINT tickets_status_check
  CHECK (status IN ('draft', 'open', 'acknowledged', 'in_progress', 'pending', 'done', 'resolved', 'returned', 'archived'));

-- Type enum expansion
ALTER TABLE tickets DROP CONSTRAINT IF EXISTS tickets_type_check;
ALTER TABLE tickets ADD CONSTRAINT tickets_type_check
  CHECK (type IN ('fyi', 'request', 'approval', 'action_required', 'urgent'));

-- ─── 2. ticket_participants — rename columns to match app code ────────────────
-- App code uses participant_user_id / participant_dept everywhere.
-- Migration 010 created user_id / department.

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'ticket_participants' AND column_name = 'user_id'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'ticket_participants' AND column_name = 'participant_user_id'
  ) THEN
    ALTER TABLE ticket_participants RENAME COLUMN user_id TO participant_user_id;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'ticket_participants' AND column_name = 'department'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'ticket_participants' AND column_name = 'participant_dept'
  ) THEN
    ALTER TABLE ticket_participants RENAME COLUMN department TO participant_dept;
  END IF;
END $$;

-- Update the participant constraint to use new column names
ALTER TABLE ticket_participants DROP CONSTRAINT IF EXISTS chk_participant_target;
ALTER TABLE ticket_participants ADD CONSTRAINT chk_participant_target CHECK (
  (participant_type = 'user'       AND participant_user_id IS NOT NULL AND participant_dept IS NULL) OR
  (participant_type = 'department' AND participant_dept IS NOT NULL AND participant_user_id IS NULL)
);

-- ─── 3. ticket_assignments — rename department if needed ──────────────────────
-- ticket_assignments.department stays as-is (no mismatch in app code)

-- ─── 4. Update RPCs to use renamed columns ────────────────────────────────────

CREATE OR REPLACE FUNCTION get_inbox_threads(
  p_user_id text,
  p_dept    text,
  p_role    text
)
RETURNS TABLE (
  id              uuid,
  subject         text,
  type            text,
  status          text,
  priority        text,
  created_by      text,
  created_at      timestamptz,
  updated_at      timestamptz,
  last_message_at timestamptz,
  resolved_at     timestamptz,
  resolved_by     text,
  linked_record_type text,
  linked_record_id   text,
  auto_created    boolean
)
LANGUAGE sql STABLE AS $$
  SELECT DISTINCT
    t.id, t.subject, t.type, t.status, t.priority, t.created_by,
    t.created_at, t.updated_at, t.last_message_at,
    t.resolved_at, t.resolved_by,
    t.linked_record_type, t.linked_record_id, t.auto_created
  FROM tickets t
  WHERE t.status NOT IN ('draft', 'archived')
    AND (
      EXISTS (
        SELECT 1 FROM ticket_participants tp
        WHERE tp.ticket_id = t.id
          AND tp.participant_type = 'user'
          AND tp.participant_user_id = p_user_id
          AND tp.role IN ('to', 'cc')
      )
      OR EXISTS (
        SELECT 1 FROM ticket_assignments ta
        WHERE ta.ticket_id = t.id AND ta.assigned_to = p_user_id
      )
      OR (
        p_role IN ('manager', 'director')
        AND EXISTS (
          SELECT 1 FROM ticket_participants tp
          WHERE tp.ticket_id = t.id
            AND tp.participant_type = 'department'
            AND tp.participant_dept = p_dept
        )
      )
    )
  ORDER BY t.last_message_at DESC;
$$;

CREATE OR REPLACE FUNCTION get_unread_count(p_user_id text, p_dept text, p_role text)
RETURNS integer
LANGUAGE sql STABLE AS $$
  SELECT COUNT(*)::integer
  FROM (
    SELECT DISTINCT t.id
    FROM tickets t
    WHERE t.status NOT IN ('draft', 'archived')
      AND (
        EXISTS (
          SELECT 1 FROM ticket_participants tp
          WHERE tp.ticket_id = t.id AND tp.participant_type = 'user'
            AND tp.participant_user_id = p_user_id AND tp.role IN ('to', 'cc')
        )
        OR EXISTS (
          SELECT 1 FROM ticket_assignments ta
          WHERE ta.ticket_id = t.id AND ta.assigned_to = p_user_id
        )
        OR (
          p_role IN ('manager', 'director')
          AND EXISTS (
            SELECT 1 FROM ticket_participants tp
            WHERE tp.ticket_id = t.id AND tp.participant_type = 'department'
              AND tp.participant_dept = p_dept
          )
        )
      )
      AND (
        NOT EXISTS (
          SELECT 1 FROM ticket_read_receipts rr
          WHERE rr.ticket_id = t.id AND rr.user_id = p_user_id
        )
        OR EXISTS (
          SELECT 1 FROM ticket_read_receipts rr
          WHERE rr.ticket_id = t.id AND rr.user_id = p_user_id
            AND t.last_message_at > rr.last_read_at
        )
      )
  ) unread;
$$;

-- ─── 5. Indexes for new columns ──────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_tickets_linked_record
  ON tickets(linked_record_type, linked_record_id)
  WHERE linked_record_type IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_tickets_priority ON tickets(priority);

-- Rebuild participant indexes for renamed columns
DROP INDEX IF EXISTS idx_tp_user_id;
DROP INDEX IF EXISTS idx_tp_department;
CREATE INDEX IF NOT EXISTS idx_tp_participant_user_id ON ticket_participants(participant_user_id);
CREATE INDEX IF NOT EXISTS idx_tp_participant_dept ON ticket_participants(participant_dept);
