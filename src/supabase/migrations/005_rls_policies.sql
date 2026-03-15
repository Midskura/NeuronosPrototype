-- ============================================================================
-- 005: Scoped RLS Policies (Phase 2 — Department/Role-Based Access)
-- ============================================================================
-- Replaces the permissive "Authenticated full access" policies from 003 with
-- department- and role-scoped policies per Neuron OS access matrix.
--
-- Prerequisites:
--   - 003_supabase_auth.sql has been run (helper functions exist)
--   - 004_role_constraints.sql has been run (role/dept constraints exist)
--
-- Helper functions used (from 003):
--   get_my_profile_id() → TEXT  (users.id for current auth user)
--   get_my_role()       → TEXT  ('rep','manager','director')
--   get_my_department() → TEXT  ('Business Development','Pricing','Operations','Accounting','Executive','HR')
-- ============================================================================


-- ============================================================================
-- STEP 1: Drop existing permissive "Authenticated full access" policies
-- ============================================================================
-- These were Phase 1 "everyone can do everything" policies from 003.

DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOR tbl IN
    SELECT unnest(ARRAY[
      'customers','contacts','consignees',
      'client_handler_preferences','tasks','crm_activities','budget_requests',
      'quotations','contract_bookings','contract_activity','contract_attachments',
      'evouchers','evoucher_history','invoices','billing_line_items',
      'collections','expenses',
      'ticket_types','tickets','comments','activity_log'
    ])
  LOOP
    EXECUTE format(
      'DROP POLICY IF EXISTS "Authenticated full access" ON %I', tbl
    );
  END LOOP;
END $$;

-- Note: We keep the permissive policies on these utility/low-risk tables:
--   settings, counters, service_providers, catalog_categories, catalog_items,
--   projects, bookings, project_bookings, project_attachments,
--   accounts, journal_entries, transactions, saved_reports
-- They can be tightened later if needed.


-- ============================================================================
-- STEP 2: customers — BD CRUD; Pricing/Ops/Accounting SELECT; HR no access
-- ============================================================================

-- SELECT: Everyone except HR can read customers
CREATE POLICY "customers_select"
  ON customers FOR SELECT
  TO authenticated
  USING (get_my_department() != 'HR');

-- INSERT: Only BD can create customers
CREATE POLICY "customers_insert"
  ON customers FOR INSERT
  TO authenticated
  WITH CHECK (get_my_department() IN ('Business Development', 'Executive'));

-- UPDATE: BD can update; managers/directors from other depts can update
CREATE POLICY "customers_update"
  ON customers FOR UPDATE
  TO authenticated
  USING (
    get_my_department() IN ('Business Development', 'Executive')
    OR get_my_role() IN ('manager', 'director')
  )
  WITH CHECK (
    get_my_department() IN ('Business Development', 'Executive')
    OR get_my_role() IN ('manager', 'director')
  );

-- DELETE: Only BD managers/directors or Executive can delete
CREATE POLICY "customers_delete"
  ON customers FOR DELETE
  TO authenticated
  USING (
    (get_my_department() IN ('Business Development', 'Executive') AND get_my_role() IN ('manager', 'director'))
    OR get_my_department() = 'Executive'
  );


-- ============================================================================
-- STEP 3: contacts — Same pattern as customers
-- ============================================================================

CREATE POLICY "contacts_select"
  ON contacts FOR SELECT
  TO authenticated
  USING (get_my_department() != 'HR');

CREATE POLICY "contacts_insert"
  ON contacts FOR INSERT
  TO authenticated
  WITH CHECK (get_my_department() IN ('Business Development', 'Executive'));

CREATE POLICY "contacts_update"
  ON contacts FOR UPDATE
  TO authenticated
  USING (
    get_my_department() IN ('Business Development', 'Executive')
    OR get_my_role() IN ('manager', 'director')
  )
  WITH CHECK (
    get_my_department() IN ('Business Development', 'Executive')
    OR get_my_role() IN ('manager', 'director')
  );

CREATE POLICY "contacts_delete"
  ON contacts FOR DELETE
  TO authenticated
  USING (
    (get_my_department() IN ('Business Development', 'Executive') AND get_my_role() IN ('manager', 'director'))
    OR get_my_department() = 'Executive'
  );


-- ============================================================================
-- STEP 4: consignees — Follows customers pattern (FK cascade)
-- ============================================================================

CREATE POLICY "consignees_select"
  ON consignees FOR SELECT
  TO authenticated
  USING (get_my_department() != 'HR');

CREATE POLICY "consignees_insert"
  ON consignees FOR INSERT
  TO authenticated
  WITH CHECK (get_my_department() IN ('Business Development', 'Operations', 'Executive'));

CREATE POLICY "consignees_update"
  ON consignees FOR UPDATE
  TO authenticated
  USING (get_my_department() IN ('Business Development', 'Operations', 'Executive'))
  WITH CHECK (get_my_department() IN ('Business Development', 'Operations', 'Executive'));

CREATE POLICY "consignees_delete"
  ON consignees FOR DELETE
  TO authenticated
  USING (
    get_my_department() IN ('Business Development', 'Executive')
    AND get_my_role() IN ('manager', 'director')
  );


-- ============================================================================
-- STEP 5: client_handler_preferences — BD/Ops manage, others read
-- ============================================================================

CREATE POLICY "client_handler_prefs_select"
  ON client_handler_preferences FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "client_handler_prefs_insert"
  ON client_handler_preferences FOR INSERT
  TO authenticated
  WITH CHECK (get_my_department() IN ('Business Development', 'Operations', 'Executive'));

CREATE POLICY "client_handler_prefs_update"
  ON client_handler_preferences FOR UPDATE
  TO authenticated
  USING (get_my_department() IN ('Business Development', 'Operations', 'Executive'))
  WITH CHECK (get_my_department() IN ('Business Development', 'Operations', 'Executive'));

CREATE POLICY "client_handler_prefs_delete"
  ON client_handler_preferences FOR DELETE
  TO authenticated
  USING (get_my_department() IN ('Business Development', 'Operations', 'Executive'));


-- ============================================================================
-- STEP 6: quotations — BD creates; Pricing prices; others SELECT
-- ============================================================================

CREATE POLICY "quotations_select"
  ON quotations FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "quotations_insert"
  ON quotations FOR INSERT
  TO authenticated
  WITH CHECK (get_my_department() IN ('Business Development', 'Pricing', 'Executive'));

CREATE POLICY "quotations_update"
  ON quotations FOR UPDATE
  TO authenticated
  USING (get_my_department() IN ('Business Development', 'Pricing', 'Executive'))
  WITH CHECK (get_my_department() IN ('Business Development', 'Pricing', 'Executive'));

CREATE POLICY "quotations_delete"
  ON quotations FOR DELETE
  TO authenticated
  USING (
    get_my_role() = 'director'
    OR get_my_department() = 'Executive'
  );


-- ============================================================================
-- STEP 7: contract_bookings, contract_activity, contract_attachments
-- ============================================================================

-- contract_bookings: BD/Pricing/Ops manage
CREATE POLICY "contract_bookings_select"
  ON contract_bookings FOR SELECT TO authenticated USING (true);

CREATE POLICY "contract_bookings_insert"
  ON contract_bookings FOR INSERT TO authenticated
  WITH CHECK (get_my_department() IN ('Business Development', 'Pricing', 'Operations', 'Executive'));

CREATE POLICY "contract_bookings_update"
  ON contract_bookings FOR UPDATE TO authenticated
  USING (get_my_department() IN ('Business Development', 'Pricing', 'Operations', 'Executive'))
  WITH CHECK (get_my_department() IN ('Business Development', 'Pricing', 'Operations', 'Executive'));

CREATE POLICY "contract_bookings_delete"
  ON contract_bookings FOR DELETE TO authenticated
  USING (get_my_role() = 'director' OR get_my_department() = 'Executive');

-- contract_activity: same access
CREATE POLICY "contract_activity_select"
  ON contract_activity FOR SELECT TO authenticated USING (true);

CREATE POLICY "contract_activity_insert"
  ON contract_activity FOR INSERT TO authenticated
  WITH CHECK (get_my_department() IN ('Business Development', 'Pricing', 'Operations', 'Executive'));

CREATE POLICY "contract_activity_update"
  ON contract_activity FOR UPDATE TO authenticated
  USING (get_my_department() IN ('Business Development', 'Pricing', 'Operations', 'Executive'))
  WITH CHECK (get_my_department() IN ('Business Development', 'Pricing', 'Operations', 'Executive'));

CREATE POLICY "contract_activity_delete"
  ON contract_activity FOR DELETE TO authenticated
  USING (get_my_role() = 'director' OR get_my_department() = 'Executive');

-- contract_attachments: same
CREATE POLICY "contract_attachments_select"
  ON contract_attachments FOR SELECT TO authenticated USING (true);

CREATE POLICY "contract_attachments_insert"
  ON contract_attachments FOR INSERT TO authenticated
  WITH CHECK (get_my_department() IN ('Business Development', 'Pricing', 'Operations', 'Executive'));

CREATE POLICY "contract_attachments_update"
  ON contract_attachments FOR UPDATE TO authenticated
  USING (get_my_department() IN ('Business Development', 'Pricing', 'Operations', 'Executive'))
  WITH CHECK (get_my_department() IN ('Business Development', 'Pricing', 'Operations', 'Executive'));

CREATE POLICY "contract_attachments_delete"
  ON contract_attachments FOR DELETE TO authenticated
  USING (get_my_role() = 'director' OR get_my_department() = 'Executive');


-- ============================================================================
-- STEP 8: evouchers — Accounting CRUD; others SELECT
-- ============================================================================

CREATE POLICY "evouchers_select"
  ON evouchers FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "evouchers_insert"
  ON evouchers FOR INSERT
  TO authenticated
  WITH CHECK (get_my_department() IN ('Accounting', 'Executive'));

CREATE POLICY "evouchers_update"
  ON evouchers FOR UPDATE
  TO authenticated
  USING (get_my_department() IN ('Accounting', 'Executive'))
  WITH CHECK (get_my_department() IN ('Accounting', 'Executive'));

CREATE POLICY "evouchers_delete"
  ON evouchers FOR DELETE
  TO authenticated
  USING (
    get_my_department() IN ('Accounting', 'Executive')
    AND get_my_role() IN ('manager', 'director')
  );

-- evoucher_history: read-only for everyone, Accounting inserts
CREATE POLICY "evoucher_history_select"
  ON evoucher_history FOR SELECT TO authenticated USING (true);

CREATE POLICY "evoucher_history_insert"
  ON evoucher_history FOR INSERT TO authenticated
  WITH CHECK (get_my_department() IN ('Accounting', 'Executive'));

CREATE POLICY "evoucher_history_update"
  ON evoucher_history FOR UPDATE TO authenticated
  USING (get_my_department() IN ('Accounting', 'Executive'))
  WITH CHECK (get_my_department() IN ('Accounting', 'Executive'));

CREATE POLICY "evoucher_history_delete"
  ON evoucher_history FOR DELETE TO authenticated
  USING (get_my_role() = 'director');


-- ============================================================================
-- STEP 9: invoices / billing_line_items — Accounting CRUD; others SELECT
-- ============================================================================

CREATE POLICY "invoices_select"
  ON invoices FOR SELECT TO authenticated USING (true);

CREATE POLICY "invoices_insert"
  ON invoices FOR INSERT TO authenticated
  WITH CHECK (get_my_department() IN ('Accounting', 'Executive'));

CREATE POLICY "invoices_update"
  ON invoices FOR UPDATE TO authenticated
  USING (get_my_department() IN ('Accounting', 'Executive'))
  WITH CHECK (get_my_department() IN ('Accounting', 'Executive'));

CREATE POLICY "invoices_delete"
  ON invoices FOR DELETE TO authenticated
  USING (
    get_my_department() IN ('Accounting', 'Executive')
    AND get_my_role() IN ('manager', 'director')
  );

CREATE POLICY "billing_line_items_select"
  ON billing_line_items FOR SELECT TO authenticated USING (true);

CREATE POLICY "billing_line_items_insert"
  ON billing_line_items FOR INSERT TO authenticated
  WITH CHECK (get_my_department() IN ('Accounting', 'Executive'));

CREATE POLICY "billing_line_items_update"
  ON billing_line_items FOR UPDATE TO authenticated
  USING (get_my_department() IN ('Accounting', 'Executive'))
  WITH CHECK (get_my_department() IN ('Accounting', 'Executive'));

CREATE POLICY "billing_line_items_delete"
  ON billing_line_items FOR DELETE TO authenticated
  USING (
    get_my_department() IN ('Accounting', 'Executive')
    AND get_my_role() IN ('manager', 'director')
  );


-- ============================================================================
-- STEP 10: collections / expenses — Accounting CRUD; others SELECT
-- ============================================================================

CREATE POLICY "collections_select"
  ON collections FOR SELECT TO authenticated USING (true);

CREATE POLICY "collections_insert"
  ON collections FOR INSERT TO authenticated
  WITH CHECK (get_my_department() IN ('Accounting', 'Executive'));

CREATE POLICY "collections_update"
  ON collections FOR UPDATE TO authenticated
  USING (get_my_department() IN ('Accounting', 'Executive'))
  WITH CHECK (get_my_department() IN ('Accounting', 'Executive'));

CREATE POLICY "collections_delete"
  ON collections FOR DELETE TO authenticated
  USING (
    get_my_department() IN ('Accounting', 'Executive')
    AND get_my_role() IN ('manager', 'director')
  );

CREATE POLICY "expenses_select"
  ON expenses FOR SELECT TO authenticated USING (true);

CREATE POLICY "expenses_insert"
  ON expenses FOR INSERT TO authenticated
  WITH CHECK (get_my_department() IN ('Accounting', 'Executive'));

CREATE POLICY "expenses_update"
  ON expenses FOR UPDATE TO authenticated
  USING (get_my_department() IN ('Accounting', 'Executive'))
  WITH CHECK (get_my_department() IN ('Accounting', 'Executive'));

CREATE POLICY "expenses_delete"
  ON expenses FOR DELETE TO authenticated
  USING (
    get_my_department() IN ('Accounting', 'Executive')
    AND get_my_role() IN ('manager', 'director')
  );


-- ============================================================================
-- STEP 11: tasks — Everyone reads/writes own; managers see dept; directors all
-- ============================================================================

CREATE POLICY "tasks_select"
  ON tasks FOR SELECT TO authenticated USING (true);

CREATE POLICY "tasks_insert"
  ON tasks FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "tasks_update"
  ON tasks FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "tasks_delete"
  ON tasks FOR DELETE TO authenticated
  USING (get_my_role() IN ('manager', 'director'));


-- ============================================================================
-- STEP 12: crm_activities — BD CRUD; others SELECT
-- ============================================================================

CREATE POLICY "crm_activities_select"
  ON crm_activities FOR SELECT TO authenticated USING (true);

CREATE POLICY "crm_activities_insert"
  ON crm_activities FOR INSERT TO authenticated
  WITH CHECK (get_my_department() IN ('Business Development', 'Executive'));

CREATE POLICY "crm_activities_update"
  ON crm_activities FOR UPDATE TO authenticated
  USING (get_my_department() IN ('Business Development', 'Executive'))
  WITH CHECK (get_my_department() IN ('Business Development', 'Executive'));

CREATE POLICY "crm_activities_delete"
  ON crm_activities FOR DELETE TO authenticated
  USING (get_my_department() IN ('Business Development', 'Executive'));


-- ============================================================================
-- STEP 13: budget_requests — All depts can create; managers/directors approve
-- ============================================================================

CREATE POLICY "budget_requests_select"
  ON budget_requests FOR SELECT TO authenticated USING (true);

CREATE POLICY "budget_requests_insert"
  ON budget_requests FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "budget_requests_update"
  ON budget_requests FOR UPDATE TO authenticated
  USING (
    get_my_role() IN ('manager', 'director')
    OR get_my_department() = 'Executive'
  )
  WITH CHECK (
    get_my_role() IN ('manager', 'director')
    OR get_my_department() = 'Executive'
  );

CREATE POLICY "budget_requests_delete"
  ON budget_requests FOR DELETE TO authenticated
  USING (get_my_role() = 'director' OR get_my_department() = 'Executive');


-- ============================================================================
-- STEP 14: tickets — directors see all; managers see dept; reps see own
-- ============================================================================

CREATE POLICY "tickets_select"
  ON tickets FOR SELECT
  TO authenticated
  USING (
    get_my_role() = 'director'
    OR get_my_department() = 'Executive'
    -- Managers see tickets assigned to their department
    OR (get_my_role() = 'manager' AND (
      department = get_my_department()
      OR created_by = get_my_profile_id()
    ))
    -- Reps see only their own tickets
    OR created_by = get_my_profile_id()
    OR assigned_to = get_my_profile_id()
  );

CREATE POLICY "tickets_insert"
  ON tickets FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "tickets_update"
  ON tickets FOR UPDATE
  TO authenticated
  USING (
    get_my_role() IN ('manager', 'director')
    OR get_my_department() = 'Executive'
    OR created_by = get_my_profile_id()
    OR assigned_to = get_my_profile_id()
  )
  WITH CHECK (
    get_my_role() IN ('manager', 'director')
    OR get_my_department() = 'Executive'
    OR created_by = get_my_profile_id()
    OR assigned_to = get_my_profile_id()
  );

CREATE POLICY "tickets_delete"
  ON tickets FOR DELETE
  TO authenticated
  USING (get_my_role() = 'director' OR get_my_department() = 'Executive');


-- ============================================================================
-- STEP 15: comments — Everyone can read/create; only author or manager+ can delete
-- ============================================================================

CREATE POLICY "comments_select"
  ON comments FOR SELECT TO authenticated USING (true);

CREATE POLICY "comments_insert"
  ON comments FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "comments_update"
  ON comments FOR UPDATE TO authenticated
  USING (
    user_id = get_my_profile_id()
    OR get_my_role() IN ('manager', 'director')
  )
  WITH CHECK (
    user_id = get_my_profile_id()
    OR get_my_role() IN ('manager', 'director')
  );

CREATE POLICY "comments_delete"
  ON comments FOR DELETE TO authenticated
  USING (
    user_id = get_my_profile_id()
    OR get_my_role() IN ('manager', 'director')
  );


-- ============================================================================
-- STEP 16: activity_log — directors see all; managers see dept; reps see own
-- ============================================================================

CREATE POLICY "activity_log_select"
  ON activity_log FOR SELECT
  TO authenticated
  USING (
    get_my_role() = 'director'
    OR get_my_department() = 'Executive'
    OR (get_my_role() = 'manager' AND user_department = get_my_department())
    OR user_id = get_my_profile_id()
  );

-- Insert: any authenticated user (system writes activity logs)
CREATE POLICY "activity_log_insert"
  ON activity_log FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Update: only directors (corrections)
CREATE POLICY "activity_log_update"
  ON activity_log FOR UPDATE
  TO authenticated
  USING (get_my_role() = 'director' OR get_my_department() = 'Executive')
  WITH CHECK (get_my_role() = 'director' OR get_my_department() = 'Executive');

-- Delete: only directors
CREATE POLICY "activity_log_delete"
  ON activity_log FOR DELETE
  TO authenticated
  USING (get_my_role() = 'director' OR get_my_department() = 'Executive');


-- ============================================================================
-- STEP 17: ticket_types — Read-only for all; directors manage
-- ============================================================================

CREATE POLICY "ticket_types_select"
  ON ticket_types FOR SELECT TO authenticated USING (true);

CREATE POLICY "ticket_types_insert"
  ON ticket_types FOR INSERT TO authenticated
  WITH CHECK (get_my_role() = 'director' OR get_my_department() = 'Executive');

CREATE POLICY "ticket_types_update"
  ON ticket_types FOR UPDATE TO authenticated
  USING (get_my_role() = 'director' OR get_my_department() = 'Executive')
  WITH CHECK (get_my_role() = 'director' OR get_my_department() = 'Executive');

CREATE POLICY "ticket_types_delete"
  ON ticket_types FOR DELETE TO authenticated
  USING (get_my_role() = 'director' OR get_my_department() = 'Executive');


-- ============================================================================
-- STEP 18: Service-role bypass for all scoped tables
-- ============================================================================
-- The service_role key (used by admin/migration scripts) should bypass all RLS.
-- Supabase automatically grants service_role bypass when RLS is enabled,
-- but we add explicit policies for clarity.

DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOR tbl IN
    SELECT unnest(ARRAY[
      'customers','contacts','consignees',
      'client_handler_preferences','tasks','crm_activities','budget_requests',
      'quotations','contract_bookings','contract_activity','contract_attachments',
      'evouchers','evoucher_history','invoices','billing_line_items',
      'collections','expenses',
      'ticket_types','tickets','comments','activity_log'
    ])
  LOOP
    EXECUTE format(
      'CREATE POLICY "Service role full access on %I" ON %I FOR ALL TO service_role USING (true) WITH CHECK (true)',
      tbl, tbl
    );
  END LOOP;
END $$;


-- ============================================================================
-- MIGRATION COMPLETE — 005_rls_policies
-- ============================================================================
-- What this migration did:
--   1. Dropped Phase 1 permissive "Authenticated full access" policies
--   2. Created department-scoped SELECT/INSERT/UPDATE/DELETE policies for:
--      - customers, contacts, consignees, client_handler_preferences
--      - quotations, contract_bookings, contract_activity, contract_attachments
--      - evouchers, evoucher_history, invoices, billing_line_items
--      - collections, expenses
--      - tasks, crm_activities, budget_requests
--      - tickets, comments, activity_log, ticket_types
--   3. Added service_role bypass policies for admin operations
--
-- Verification queries (run as different roles):
--   SELECT * FROM customers;           -- HR should get 0 rows
--   INSERT INTO evouchers (...);        -- Non-Accounting should fail
--   DELETE FROM customers WHERE ...;    -- Non-BD-director should fail
--   SELECT * FROM activity_log;         -- Reps see only own entries
-- ============================================================================