-- ============================================================================
-- 019: RBAC RLS v2 — 4-tier scoped policies
-- ============================================================================
-- Updates helper functions and RLS policies to match the new role model:
--   staff (0) | team_leader (1) | manager (2)
-- Executive department auto-bypasses all filters.
-- permission_overrides can elevate individual user scope.
--
-- Prerequisites:
--   003_supabase_auth.sql — get_my_profile_id(), get_my_role(), get_my_department()
--   018_rbac_teams_and_roles.sql — teams, permission_overrides, users.team_id
-- ============================================================================


-- ============================================================================
-- STEP 1: New helper functions
-- ============================================================================

-- Returns current user's team_id (NULL if not in a team)
CREATE OR REPLACE FUNCTION public.get_my_team_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT team_id FROM public.users WHERE auth_id = auth.uid();
$$;

-- Returns TRUE if the current user is in the Executive department
CREATE OR REPLACE FUNCTION public.is_executive()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT department = 'Executive' FROM public.users WHERE auth_id = auth.uid();
$$;

-- Returns IDs of all users in the same team as the current user
-- (used for team_leader scope)
CREATE OR REPLACE FUNCTION public.get_my_team_member_ids()
RETURNS TEXT[]
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT ARRAY(
    SELECT id FROM public.users
    WHERE team_id = (SELECT team_id FROM public.users WHERE auth_id = auth.uid())
      AND team_id IS NOT NULL
  );
$$;

-- Returns the override scope for the current user ('department_wide', 'cross_department', 'full')
-- Returns NULL if no override exists
CREATE OR REPLACE FUNCTION public.get_my_override_scope()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT scope FROM public.permission_overrides
  WHERE user_id = get_my_profile_id()
  LIMIT 1;
$$;

-- Core scope predicate: does the current user have access to a record owned by owner_id?
-- owner_id: the TEXT user id in the owner/created_by column of the record
CREATE OR REPLACE FUNCTION public.can_access_record(owner_id TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    -- Executive sees everything
    is_executive()
    -- Full override sees everything
    OR get_my_override_scope() = 'full'
    -- Manager sees all records in their department (no row-level restriction)
    OR get_my_role() = 'manager'
    -- Team leader sees team members' records
    OR (get_my_role() = 'team_leader' AND owner_id = ANY(get_my_team_member_ids()))
    -- Staff sees own records
    OR owner_id = get_my_profile_id()
    -- Null owner_id is visible to everyone (e.g. unassigned records)
    OR owner_id IS NULL;
$$;


-- ============================================================================
-- STEP 2: Drop stale policies that reference old roles
-- ============================================================================

DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN
    SELECT schemaname, tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND (
        policyname LIKE 'customers_%'
        OR policyname LIKE 'contacts_%'
        OR policyname LIKE 'tasks_%'
        OR policyname LIKE 'quotations_%'
        OR policyname LIKE 'bookings_%'
        OR policyname LIKE 'evouchers_%'
      )
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I',
      pol.policyname, pol.schemaname, pol.tablename);
  END LOOP;
END $$;


-- ============================================================================
-- STEP 3: customers
-- ============================================================================

ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "customers_select" ON customers FOR SELECT TO authenticated
  USING (
    get_my_department() != 'HR'
    AND can_access_record(owner_id)
  );

CREATE POLICY "customers_insert" ON customers FOR INSERT TO authenticated
  WITH CHECK (
    get_my_department() IN ('Business Development', 'Executive')
    OR is_executive()
  );

CREATE POLICY "customers_update" ON customers FOR UPDATE TO authenticated
  USING (
    can_access_record(owner_id)
    AND get_my_department() IN ('Business Development', 'Executive')
    OR get_my_role() IN ('manager', 'team_leader')
  )
  WITH CHECK (
    get_my_department() IN ('Business Development', 'Executive')
    OR get_my_role() = 'manager'
  );

CREATE POLICY "customers_delete" ON customers FOR DELETE TO authenticated
  USING (
    (get_my_department() = 'Business Development' AND get_my_role() = 'manager')
    OR is_executive()
  );


-- ============================================================================
-- STEP 4: contacts
-- ============================================================================

ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "contacts_select" ON contacts FOR SELECT TO authenticated
  USING (
    get_my_department() != 'HR'
    AND can_access_record(owner_id)
  );

CREATE POLICY "contacts_insert" ON contacts FOR INSERT TO authenticated
  WITH CHECK (
    get_my_department() IN ('Business Development', 'Executive')
    OR is_executive()
  );

CREATE POLICY "contacts_update" ON contacts FOR UPDATE TO authenticated
  USING (
    can_access_record(owner_id)
    AND (
      get_my_department() IN ('Business Development', 'Executive')
      OR get_my_role() IN ('manager', 'team_leader')
    )
  )
  WITH CHECK (
    get_my_department() IN ('Business Development', 'Executive')
    OR get_my_role() = 'manager'
  );

CREATE POLICY "contacts_delete" ON contacts FOR DELETE TO authenticated
  USING (
    (get_my_department() = 'Business Development' AND get_my_role() = 'manager')
    OR is_executive()
  );


-- ============================================================================
-- STEP 5: tasks
-- ============================================================================

ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tasks_select" ON tasks FOR SELECT TO authenticated
  USING (can_access_record(owner_id));

CREATE POLICY "tasks_insert" ON tasks FOR INSERT TO authenticated
  WITH CHECK (
    get_my_department() IN ('Business Development', 'Executive')
    OR is_executive()
  );

CREATE POLICY "tasks_update" ON tasks FOR UPDATE TO authenticated
  USING (can_access_record(owner_id))
  WITH CHECK (can_access_record(owner_id));

CREATE POLICY "tasks_delete" ON tasks FOR DELETE TO authenticated
  USING (
    can_access_record(owner_id) AND get_my_role() IN ('manager', 'team_leader')
    OR owner_id = get_my_profile_id()
    OR is_executive()
  );


-- ============================================================================
-- STEP 6: quotations (spot quotations + contracts)
-- ============================================================================

ALTER TABLE quotations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "quotations_select" ON quotations FOR SELECT TO authenticated
  USING (
    get_my_department() IN ('Pricing', 'Business Development', 'Executive', 'Operations', 'Accounting')
    AND can_access_record(created_by)
  );

CREATE POLICY "quotations_insert" ON quotations FOR INSERT TO authenticated
  WITH CHECK (
    get_my_department() IN ('Pricing', 'Business Development', 'Executive')
    OR is_executive()
  );

CREATE POLICY "quotations_update" ON quotations FOR UPDATE TO authenticated
  USING (
    can_access_record(created_by)
    AND get_my_department() IN ('Pricing', 'Business Development', 'Executive')
  )
  WITH CHECK (
    get_my_department() IN ('Pricing', 'Business Development', 'Executive')
    OR is_executive()
  );

CREATE POLICY "quotations_delete" ON quotations FOR DELETE TO authenticated
  USING (
    (get_my_role() = 'manager' AND get_my_department() IN ('Pricing', 'Business Development'))
    OR is_executive()
  );


-- ============================================================================
-- STEP 7: bookings (operations)
-- ============================================================================

ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "bookings_select" ON bookings FOR SELECT TO authenticated
  USING (
    get_my_department() IN ('Operations', 'Accounting', 'Executive')
    AND can_access_record(created_by)
  );

CREATE POLICY "bookings_insert" ON bookings FOR INSERT TO authenticated
  WITH CHECK (
    get_my_department() IN ('Operations', 'Executive')
    OR is_executive()
  );

CREATE POLICY "bookings_update" ON bookings FOR UPDATE TO authenticated
  USING (
    can_access_record(created_by)
    AND get_my_department() IN ('Operations', 'Executive')
  )
  WITH CHECK (
    get_my_department() IN ('Operations', 'Executive')
    OR is_executive()
  );

CREATE POLICY "bookings_delete" ON bookings FOR DELETE TO authenticated
  USING (
    (get_my_role() = 'manager' AND get_my_department() = 'Operations')
    OR is_executive()
  );


-- ============================================================================
-- STEP 8: evouchers (accounting expense requests)
-- ============================================================================

ALTER TABLE evouchers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "evouchers_select" ON evouchers FOR SELECT TO authenticated
  USING (can_access_record(created_by));

CREATE POLICY "evouchers_insert" ON evouchers FOR INSERT TO authenticated
  WITH CHECK (true);  -- any authenticated user can submit an expense

CREATE POLICY "evouchers_update" ON evouchers FOR UPDATE TO authenticated
  USING (
    can_access_record(created_by)
    OR get_my_department() IN ('Accounting', 'Executive')
  )
  WITH CHECK (
    can_access_record(created_by)
    OR get_my_department() IN ('Accounting', 'Executive')
  );

CREATE POLICY "evouchers_delete" ON evouchers FOR DELETE TO authenticated
  USING (
    (created_by = get_my_profile_id() AND get_my_role() IN ('manager', 'team_leader'))
    OR (get_my_role() = 'manager' AND get_my_department() = 'Accounting')
    OR is_executive()
  );


-- ============================================================================
-- STEP 9: teams + permission_overrides — Executive-only management
-- ============================================================================

ALTER TABLE teams ENABLE ROW LEVEL SECURITY;

CREATE POLICY "teams_select" ON teams FOR SELECT TO authenticated
  USING (true);  -- everyone can see team structure

CREATE POLICY "teams_manage" ON teams FOR ALL TO authenticated
  USING (is_executive())
  WITH CHECK (is_executive());

ALTER TABLE permission_overrides ENABLE ROW LEVEL SECURITY;

CREATE POLICY "overrides_select" ON permission_overrides FOR SELECT TO authenticated
  USING (
    user_id = get_my_profile_id()  -- see your own override
    OR is_executive()               -- executive manages all overrides
  );

CREATE POLICY "overrides_manage" ON permission_overrides FOR ALL TO authenticated
  USING (is_executive())
  WITH CHECK (is_executive());
