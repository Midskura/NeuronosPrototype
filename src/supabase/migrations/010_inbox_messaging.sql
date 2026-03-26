-- 010_inbox_messaging.sql
-- Replaces old tickets/ticket_types with the full Inbox Messaging schema.
-- Old tables had only seed data (4 rows) — safe to drop.

-- ─── Drop old tables ────────────────────────────────────────────────────────
DROP TABLE IF EXISTS ticket_types CASCADE;
DROP TABLE IF EXISTS tickets CASCADE;

-- ─── 1. tickets — thread container (metadata only) ──────────────────────────
CREATE TABLE tickets (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subject         text NOT NULL,
  type            text NOT NULL CHECK (type IN ('fyi', 'action_required', 'urgent')),
  status          text NOT NULL DEFAULT 'draft'
                  CHECK (status IN ('draft', 'open', 'pending', 'resolved', 'archived')),
  created_by      text REFERENCES users(id) NOT NULL,
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now(),
  last_message_at timestamptz DEFAULT now(),
  resolved_at     timestamptz,
  resolved_by     text REFERENCES users(id)
);

-- ─── 2. ticket_participants — who is in the thread ──────────────────────────
CREATE TABLE ticket_participants (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id        uuid REFERENCES tickets(id) ON DELETE CASCADE NOT NULL,
  participant_type text NOT NULL CHECK (participant_type IN ('user', 'department')),
  user_id          text REFERENCES users(id),
  department       text,
  role             text NOT NULL CHECK (role IN ('sender', 'to', 'cc')),
  added_by         text REFERENCES users(id) NOT NULL,
  added_at         timestamptz DEFAULT now(),
  CONSTRAINT chk_participant_target CHECK (
    (participant_type = 'user'       AND user_id IS NOT NULL AND department IS NULL) OR
    (participant_type = 'department' AND department IS NOT NULL AND user_id IS NULL)
  )
);

-- ─── 3. ticket_assignments — dept ticket assigned to specific rep ────────────
CREATE TABLE ticket_assignments (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id     uuid REFERENCES tickets(id) ON DELETE CASCADE NOT NULL,
  department    text NOT NULL,
  assigned_to   text REFERENCES users(id) NOT NULL,
  assigned_by   text REFERENCES users(id) NOT NULL,
  assigned_at   timestamptz DEFAULT now(),
  note          text
);

-- ─── 4. ticket_messages — all messages + system events in one table ──────────
CREATE TABLE ticket_messages (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id        uuid REFERENCES tickets(id) ON DELETE CASCADE NOT NULL,
  sender_id        text REFERENCES users(id) NOT NULL,
  body             text,
  is_system        boolean NOT NULL DEFAULT false,
  system_event     text,
  system_metadata  jsonb,
  is_retracted     boolean NOT NULL DEFAULT false,
  retracted_at     timestamptz,
  retracted_by     text REFERENCES users(id),
  created_at       timestamptz DEFAULT now()
);

-- ─── 5. ticket_attachments — file uploads AND entity links per message ───────
CREATE TABLE ticket_attachments (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id       uuid REFERENCES tickets(id) ON DELETE CASCADE NOT NULL,
  message_id      uuid REFERENCES ticket_messages(id) ON DELETE CASCADE NOT NULL,
  attachment_type text NOT NULL CHECK (attachment_type IN ('file', 'entity')),
  -- file fields
  file_path       text,
  file_name       text,
  file_size       integer,
  file_mime_type  text,
  -- entity link fields
  entity_type     text,
  entity_id       text,
  entity_label    text,
  uploaded_by     text REFERENCES users(id) NOT NULL,
  created_at      timestamptz DEFAULT now()
);

-- ─── 6. ticket_read_receipts — unread state per user per thread ─────────────
CREATE TABLE ticket_read_receipts (
  ticket_id            uuid REFERENCES tickets(id) ON DELETE CASCADE NOT NULL,
  user_id              text REFERENCES users(id) NOT NULL,
  last_read_at         timestamptz DEFAULT now(),
  last_read_message_id uuid REFERENCES ticket_messages(id),
  PRIMARY KEY (ticket_id, user_id)
);

-- ─── Indexes ────────────────────────────────────────────────────────────────
CREATE INDEX idx_tickets_created_by        ON tickets(created_by);
CREATE INDEX idx_tickets_last_message_at   ON tickets(last_message_at DESC);
CREATE INDEX idx_tickets_status            ON tickets(status);
CREATE INDEX idx_tp_ticket_id              ON ticket_participants(ticket_id);
CREATE INDEX idx_tp_user_id               ON ticket_participants(user_id);
CREATE INDEX idx_tp_department            ON ticket_participants(department);
CREATE INDEX idx_tm_ticket_id             ON ticket_messages(ticket_id);
CREATE INDEX idx_tm_created_at            ON ticket_messages(created_at);
CREATE INDEX idx_ta_message_id            ON ticket_attachments(message_id);
CREATE INDEX idx_trr_user_id              ON ticket_read_receipts(user_id);

-- ─── RPC: get_inbox_threads ─────────────────────────────────────────────────
-- Returns all threads the calling user should see in their Inbox tab.
-- Covers: direct participant, dept-addressed (managers only), assigned.
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
  created_by      text,
  created_at      timestamptz,
  updated_at      timestamptz,
  last_message_at timestamptz,
  resolved_at     timestamptz,
  resolved_by     text
)
LANGUAGE sql STABLE AS $$
  SELECT DISTINCT
    t.id, t.subject, t.type, t.status, t.created_by,
    t.created_at, t.updated_at, t.last_message_at,
    t.resolved_at, t.resolved_by
  FROM tickets t
  WHERE t.status != 'draft'
    AND (
      EXISTS (
        SELECT 1 FROM ticket_participants tp
        WHERE tp.ticket_id = t.id
          AND tp.participant_type = 'user'
          AND tp.user_id = p_user_id
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
            AND tp.department = p_dept
        )
      )
    )
  ORDER BY t.last_message_at DESC;
$$;

-- ─── RPC: get_unread_count ───────────────────────────────────────────────────
-- Returns total unread thread count for a user (for sidebar badge).
CREATE OR REPLACE FUNCTION get_unread_count(p_user_id text, p_dept text, p_role text)
RETURNS integer
LANGUAGE sql STABLE AS $$
  SELECT COUNT(*)::integer
  FROM (
    SELECT DISTINCT t.id
    FROM tickets t
    WHERE t.status != 'draft'
      AND (
        EXISTS (
          SELECT 1 FROM ticket_participants tp
          WHERE tp.ticket_id = t.id AND tp.participant_type = 'user'
            AND tp.user_id = p_user_id AND tp.role IN ('to', 'cc')
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
              AND tp.department = p_dept
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
