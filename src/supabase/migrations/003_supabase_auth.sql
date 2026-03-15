-- ============================================================================
-- 003: Supabase Auth Integration
-- ============================================================================
-- Bridges the existing users (TEXT PK) table to Supabase Auth (auth.users UUID).
-- After running this migration:
--   1. Create auth accounts for each seed user via the Supabase dashboard or
--      the POST /auth/migrate-users endpoint (added in the server code).
--   2. Deploy the updated server code that uses supabase.auth.* for login.
--   3. Update the frontend to store and send the JWT.
--
-- This migration is safe to run while the old login flow is still active —
-- it only adds columns, replaces permissive policies, and creates helper
-- functions. Nothing breaks until you flip the server code.
-- ============================================================================

-- ============================================================================
-- STEP 1: Link users table to auth.users
-- ============================================================================

-- Add auth_id column that maps to Supabase Auth's UUID
ALTER TABLE users ADD COLUMN IF NOT EXISTS auth_id UUID UNIQUE;

-- Index for fast lookup during JWT → profile resolution
CREATE INDEX IF NOT EXISTS idx_users_auth_id ON users(auth_id) WHERE auth_id IS NOT NULL;

-- Make password nullable (will be removed once migration is confirmed)
-- Supabase Auth stores hashed passwords in auth.users, so this column becomes dead
ALTER TABLE users ALTER COLUMN password DROP NOT NULL;
-- (password was already nullable from 001 — this is a safety net)


-- ============================================================================
-- STEP 2: Helper function — resolve auth.uid() → users.id
-- ============================================================================
-- All RLS policies use this to bridge the UUID world (auth) to the TEXT world
-- (our existing FKs). Cached per-transaction via a config var for performance.

CREATE OR REPLACE FUNCTION public.get_my_profile_id()
RETURNS TEXT
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _profile_id TEXT;
BEGIN
  -- Try transaction-local cache first
  BEGIN
    _profile_id := current_setting('app.current_profile_id', true);
    IF _profile_id IS NOT NULL AND _profile_id != '' THEN
      RETURN _profile_id;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    -- setting doesn't exist yet, continue
  END;

  -- Look up from users table
  SELECT id INTO _profile_id
  FROM public.users
  WHERE auth_id = auth.uid();

  -- Cache for remainder of transaction
  IF _profile_id IS NOT NULL THEN
    PERFORM set_config('app.current_profile_id', _profile_id, true);
  END IF;

  RETURN _profile_id;
END;
$$;

-- Helper: check if current user has a specific role
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.users WHERE auth_id = auth.uid();
$$;

-- Helper: check if current user's department
CREATE OR REPLACE FUNCTION public.get_my_department()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT department FROM public.users WHERE auth_id = auth.uid();
$$;


-- ============================================================================
-- STEP 3: Auto-create profile on auth.users INSERT (new sign-ups)
-- ============================================================================
-- When a new user is created via Supabase Auth (dashboard invite, signUp(), etc.)
-- this trigger auto-creates a corresponding row in public.users.

CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, auth_id, email, name, status, is_active, created_at)
  VALUES (
    'user-' || substr(NEW.id::text, 1, 8),   -- generate a TEXT id from the UUID prefix
    NEW.id,                                     -- auth_id = auth.users.id
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),  -- use name from metadata or email
    'Active',
    true,
    now()
  )
  ON CONFLICT (auth_id) DO NOTHING;  -- idempotent

  RETURN NEW;
END;
$$;

-- Attach to auth.users (fires on INSERT only)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();


-- ============================================================================
-- STEP 4: Replace permissive RLS policies with auth-scoped policies
-- ============================================================================
-- Phase 1 policy: "authenticated employees can do everything"
-- This matches the current SME model where every logged-in user is a coworker.
-- Phase 2 (future) will add department/role-based restrictions.
--
-- We also add a service_role bypass policy so the server's admin client
-- (used for seeding, migrations, background jobs) continues to work.

-- First, drop all existing "Allow all for service role" policies
DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOR tbl IN
    SELECT unnest(ARRAY[
      'users','settings','counters','customers','contacts','consignees',
      'client_handler_preferences','tasks','crm_activities','budget_requests',
      'service_providers','catalog_categories','catalog_items',
      'quotations','contract_bookings','contract_activity','contract_attachments',
      'projects','bookings','project_bookings','project_attachments',
      'evouchers','evoucher_history','invoices','billing_line_items',
      'collections','expenses','accounts','journal_entries','transactions',
      'ticket_types','tickets','comments','activity_log','saved_reports'
    ])
  LOOP
    EXECUTE format(
      'DROP POLICY IF EXISTS "Allow all for service role" ON %I',
      tbl
    );
  END LOOP;
END $$;

-- --------------------------------------------------------------------------
-- 4a. Generic "authenticated can read/write" policies for most tables
-- --------------------------------------------------------------------------
-- These cover all 35 tables. The pattern:
--   SELECT  → any authenticated user
--   INSERT  → any authenticated user
--   UPDATE  → any authenticated user
--   DELETE  → any authenticated user
--
-- This is intentionally permissive for Phase 1. Role-based restrictions
-- (e.g., only Accounting can delete evouchers) will be layered in Phase 2.

DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOR tbl IN
    SELECT unnest(ARRAY[
      'settings','counters','customers','contacts','consignees',
      'client_handler_preferences','tasks','crm_activities','budget_requests',
      'service_providers','catalog_categories','catalog_items',
      'quotations','contract_bookings','contract_activity','contract_attachments',
      'projects','bookings','project_bookings','project_attachments',
      'evouchers','evoucher_history','invoices','billing_line_items',
      'collections','expenses','accounts','journal_entries','transactions',
      'ticket_types','tickets','comments','activity_log','saved_reports'
    ])
  LOOP
    -- Authenticated users: full access
    EXECUTE format(
      'CREATE POLICY "Authenticated full access" ON %I FOR ALL TO authenticated USING (true) WITH CHECK (true)',
      tbl
    );
  END LOOP;
END $$;

-- --------------------------------------------------------------------------
-- 4b. Users table: slightly more restrictive
-- --------------------------------------------------------------------------
-- Everyone can read all user profiles (needed for assignment dropdowns, etc.)
-- Users can only update their own profile (admins/managers get a separate policy)
-- Only admins can delete user accounts
-- Insert is allowed (for seeding/admin creation flows)

CREATE POLICY "Anyone authenticated can read users"
  ON users FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  TO authenticated
  USING (auth_id = auth.uid())
  WITH CHECK (auth_id = auth.uid());

CREATE POLICY "Admins can update any user"
  ON users FOR UPDATE
  TO authenticated
  USING (public.get_my_role() IN ('Admin', 'admin', 'manager', 'Manager', 'director'))
  WITH CHECK (public.get_my_role() IN ('Admin', 'admin', 'manager', 'Manager', 'director'));

CREATE POLICY "Admins can insert users"
  ON users FOR INSERT
  TO authenticated
  WITH CHECK (public.get_my_role() IN ('Admin', 'admin', 'manager', 'Manager', 'director'));

CREATE POLICY "Admins can delete users"
  ON users FOR DELETE
  TO authenticated
  USING (public.get_my_role() IN ('Admin', 'admin', 'manager', 'Manager', 'director'));

-- Service role (server admin) always has full access via bypass — no policy needed,
-- but we add one explicitly for clarity during development
CREATE POLICY "Service role full access to users"
  ON users FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);


-- ============================================================================
-- STEP 5: Grant anon/authenticated access to helper functions
-- ============================================================================

GRANT EXECUTE ON FUNCTION public.get_my_profile_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_my_role() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_my_department() TO authenticated;


-- ============================================================================
-- STEP 6: Create a migration helper — bulk-link existing users to auth accounts
-- ============================================================================
-- Call this function AFTER creating auth accounts for each seed user.
-- It matches by email and sets users.auth_id = auth.users.id.
--
-- Usage (from SQL editor):
--   SELECT public.link_existing_users_to_auth();

CREATE OR REPLACE FUNCTION public.link_existing_users_to_auth()
RETURNS TABLE(user_id TEXT, email TEXT, auth_id UUID, linked BOOLEAN)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _user RECORD;
  _auth_id UUID;
BEGIN
  FOR _user IN SELECT u.id, u.email FROM public.users u WHERE u.auth_id IS NULL AND u.email IS NOT NULL
  LOOP
    SELECT au.id INTO _auth_id
    FROM auth.users au
    WHERE au.email = _user.email
    LIMIT 1;

    IF _auth_id IS NOT NULL THEN
      UPDATE public.users SET auth_id = _auth_id WHERE id = _user.id;
      user_id := _user.id;
      email := _user.email;
      auth_id := _auth_id;
      linked := true;
      RETURN NEXT;
    ELSE
      user_id := _user.id;
      email := _user.email;
      auth_id := NULL;
      linked := false;
      RETURN NEXT;
    END IF;
  END LOOP;
END;
$$;

GRANT EXECUTE ON FUNCTION public.link_existing_users_to_auth() TO service_role;


-- ============================================================================
-- MIGRATION COMPLETE — 003_supabase_auth
-- ============================================================================
-- What this migration did:
--   1. Added users.auth_id (UUID) linking to auth.users
--   2. Created get_my_profile_id() / get_my_role() / get_my_department() helpers
--   3. Created trigger to auto-create profile on new auth sign-ups
--   4. Replaced permissive "USING (true)" policies with auth-scoped policies
--   5. Created link_existing_users_to_auth() migration helper
--
-- Next steps (in order):
--   a. Run 002 + 003 in SQL Editor
--   b. Create Supabase Auth accounts for each seed user (dashboard or API)
--   c. Run: SELECT public.link_existing_users_to_auth();
--   d. Deploy updated server code with JWT middleware + auth endpoints
--   e. Update frontend to use supabase.auth.signInWithPassword()
--   f. Verify E2E, then DROP COLUMN password from users table
-- ============================================================================
