-- ==========================================================================
-- 024 — Calendar Module
-- Tables for user-created events (personal, team, department).
-- Business entity dates (booking ETD/ETA, quotation validity, etc.) are
-- auto-pulled at render time and never stored here.
-- ==========================================================================

-- --------------------------------------------------------------------------
-- 1. calendar_events
-- --------------------------------------------------------------------------
CREATE TABLE calendar_events (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title           text NOT NULL,
  description     text,

  -- Timing
  start_at        timestamptz NOT NULL,
  end_at          timestamptz NOT NULL,
  is_all_day      boolean DEFAULT false,
  timezone        text DEFAULT 'Asia/Manila',

  -- Classification
  event_type      text NOT NULL CHECK (event_type IN ('personal', 'team', 'department')),
  department      text,  -- NULL for personal; department name for dept events

  -- Recurrence (RFC 5545 RRULE string, NULL = non-recurring)
  rrule           text,
  recurrence_id   uuid REFERENCES calendar_events(id) ON DELETE CASCADE,
  original_start  timestamptz,  -- marks which occurrence this exception replaces

  -- Ownership
  created_by      text NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Optional
  location        text,
  color_override  text,

  -- Timestamps
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);
SELECT add_updated_at_trigger('calendar_events');

CREATE INDEX idx_cal_events_created_by  ON calendar_events(created_by);
CREATE INDEX idx_cal_events_date_range  ON calendar_events(start_at, end_at);
CREATE INDEX idx_cal_events_type        ON calendar_events(event_type);

-- --------------------------------------------------------------------------
-- 2. calendar_event_participants  (for team / department events)
-- --------------------------------------------------------------------------
CREATE TABLE calendar_event_participants (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id   uuid NOT NULL REFERENCES calendar_events(id) ON DELETE CASCADE,
  user_id    text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status     text DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  created_at timestamptz DEFAULT now(),
  UNIQUE(event_id, user_id)
);

CREATE INDEX idx_cal_part_user  ON calendar_event_participants(user_id);
CREATE INDEX idx_cal_part_event ON calendar_event_participants(event_id);

-- --------------------------------------------------------------------------
-- 3. calendar_event_reminders
-- --------------------------------------------------------------------------
CREATE TABLE calendar_event_reminders (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id        uuid NOT NULL REFERENCES calendar_events(id) ON DELETE CASCADE,
  remind_before   interval NOT NULL DEFAULT '15 minutes',
  created_at      timestamptz DEFAULT now()
);

-- --------------------------------------------------------------------------
-- 4. Add last_seen_at to users for team availability indicator
-- --------------------------------------------------------------------------
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_seen_at timestamptz;

-- ==========================================================================
-- RLS Policies
-- ==========================================================================
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_event_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_event_reminders ENABLE ROW LEVEL SECURITY;

-- calendar_events: SELECT ---------------------------------------------------

-- Own events
CREATE POLICY "cal_select_own" ON calendar_events FOR SELECT TO authenticated
  USING (created_by = get_my_profile_id());

-- Events user participates in
CREATE POLICY "cal_select_participant" ON calendar_events FOR SELECT TO authenticated
  USING (
    id IN (
      SELECT event_id FROM calendar_event_participants
      WHERE user_id = get_my_profile_id()
    )
  );

-- Manager / team leader can see team member events
CREATE POLICY "cal_select_team" ON calendar_events FOR SELECT TO authenticated
  USING (
    get_my_role() IN ('manager', 'team_leader')
    AND created_by = ANY(get_my_team_member_ids())
  );

-- Department-wide events visible to same department
CREATE POLICY "cal_select_dept" ON calendar_events FOR SELECT TO authenticated
  USING (
    event_type = 'department'
    AND department = get_my_department()
  );

-- Executive sees all
CREATE POLICY "cal_select_executive" ON calendar_events FOR SELECT TO authenticated
  USING (is_executive());

-- calendar_events: INSERT / UPDATE / DELETE ---------------------------------

CREATE POLICY "cal_insert" ON calendar_events FOR INSERT TO authenticated
  WITH CHECK (created_by = get_my_profile_id());

CREATE POLICY "cal_update" ON calendar_events FOR UPDATE TO authenticated
  USING (created_by = get_my_profile_id());

CREATE POLICY "cal_delete" ON calendar_events FOR DELETE TO authenticated
  USING (created_by = get_my_profile_id());

-- calendar_event_participants -----------------------------------------------

CREATE POLICY "cal_part_select" ON calendar_event_participants FOR SELECT TO authenticated
  USING (true);  -- visible to anyone who can see the event (RLS on parent handles it)

CREATE POLICY "cal_part_insert" ON calendar_event_participants FOR INSERT TO authenticated
  WITH CHECK (
    event_id IN (
      SELECT id FROM calendar_events WHERE created_by = get_my_profile_id()
    )
  );

CREATE POLICY "cal_part_delete" ON calendar_event_participants FOR DELETE TO authenticated
  USING (
    event_id IN (
      SELECT id FROM calendar_events WHERE created_by = get_my_profile_id()
    )
  );

-- calendar_event_reminders --------------------------------------------------

CREATE POLICY "cal_remind_select" ON calendar_event_reminders FOR SELECT TO authenticated
  USING (
    event_id IN (
      SELECT id FROM calendar_events WHERE created_by = get_my_profile_id()
    )
  );

CREATE POLICY "cal_remind_insert" ON calendar_event_reminders FOR INSERT TO authenticated
  WITH CHECK (
    event_id IN (
      SELECT id FROM calendar_events WHERE created_by = get_my_profile_id()
    )
  );

CREATE POLICY "cal_remind_delete" ON calendar_event_reminders FOR DELETE TO authenticated
  USING (
    event_id IN (
      SELECT id FROM calendar_events WHERE created_by = get_my_profile_id()
    )
  );
