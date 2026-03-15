 Migration Plan: Off Edge Function → Direct Supabase

 Context

 The make-server-c142e950 Edge Function is currently unreachable (404) and was deployed through Figma Make's Supabase 
  connector — a mechanism the user can no longer use. The user is migrating to direct Supabase client calls + RLS as  
 the backend, eliminating the Edge Function entirely. Figma Make is being abandoned in ~3 days but is still the       
 editing environment for now.

 JWT middleware plan is CANCELLED — no point hardening a server that will be deleted.

 ---
 End State

 All frontend data access goes through:
 import { createClient } from '@supabase/supabase-js';
 // or the existing supabase client from utils/supabase/info
 supabase.from('table').select(...).eq(...)

 Security enforced by Supabase RLS policies on each table, using the user's JWT automatically.

 ---
 Priority Order

 Priority 1 — DB Constraints (unblocked, do now)

 These SQL steps don't depend on the Edge Function at all. Run in Supabase SQL Editor.

 Step 5 — Drop password column (was blocked by Edge Function; unblocked now):
 ALTER TABLE users DROP COLUMN IF EXISTS password;
 Safe to run immediately — the Edge Function is already dead (404), and the frontend uses
 supabase.auth.signInWithPassword() directly.

 Add role/dept constraints (from 004_role_constraints.sql):
 ALTER TABLE users ADD CONSTRAINT users_department_check
   CHECK (department IN ('Business Development','Pricing','Operations','Accounting','Executive','HR'));
 ALTER TABLE users ADD CONSTRAINT users_role_check
   CHECK (role IN ('rep','manager','director'));
 ALTER TABLE users ADD CONSTRAINT users_service_type_check
   CHECK (service_type IS NULL OR service_type IN ('Forwarding','Brokerage','Trucking','Marine Insurance','Others')); 
 ALTER TABLE users ADD CONSTRAINT users_operations_role_check
   CHECK (operations_role IS NULL OR operations_role IN ('Manager','Supervisor','Handler'));
 ALTER TABLE users DROP COLUMN IF EXISTS permissions;

 ---
 Priority 2 — RLS Policies (security foundation before migrating frontend calls)

 Without the Edge Function as a security layer, RLS is the only thing preventing any authenticated user from
 reading/writing any table. Must be in place before removing the Edge Function from the frontend.

 Key policies needed (Phase 6 from original plan):
 - users — authenticated users can SELECT their own row; managers/directors can SELECT all
 - customers / contacts — BD CRUD; Pricing, Operations, Accounting SELECT only; HR no access
 - quotations — BD creates; Pricing prices; others SELECT
 - evouchers / invoices — Accounting CRUD; others SELECT
 - activity_log — directors see all; managers see their dept; reps see own
 - tickets — directors see all; managers see their dept inbox; reps see own

 Helper functions needed (if not already created by 003_supabase_auth.sql):
 CREATE OR REPLACE FUNCTION get_my_profile_id() RETURNS TEXT AS $$
   SELECT id FROM users WHERE auth_id = auth.uid()
 $$ LANGUAGE sql SECURITY DEFINER STABLE;

 CREATE OR REPLACE FUNCTION get_my_role() RETURNS TEXT AS $$
   SELECT role FROM users WHERE auth_id = auth.uid()
 $$ LANGUAGE sql SECURITY DEFINER STABLE;

 CREATE OR REPLACE FUNCTION get_my_department() RETURNS TEXT AS $$
   SELECT department FROM users WHERE auth_id = auth.uid()
 $$ LANGUAGE sql SECURITY DEFINER STABLE;

 ---
 Priority 3 — Frontend Migration (replace Edge Function calls)

 Every fetch(\${API_URL}/...`)call in the frontend gets replaced with a directsupabase.from()` call.

 New pattern (src/utils/supabase/client.ts — check if already exists):
 import { createClient } from '@supabase/supabase-js';
 import { projectId, publicAnonKey } from './info';
 export const supabase = createClient(
   `https://${projectId}.supabase.co`,
   publicAnonKey
 );
 The JWT is forwarded automatically — Supabase JS client attaches the user's session token to every request.

 Migration by module (rough scope):

 ┌────────────┬──────────────────────────────┬───────────────────────────────────────────────────────────┐
 │   Module   │     Edge Function calls      │                  Direct Supabase pattern                  │
 ├────────────┼──────────────────────────────┼───────────────────────────────────────────────────────────┤
 │ Users/Auth │ /auth/me, /users             │ supabase.from('users').select('*').eq('auth_id', user.id) │
 ├────────────┼──────────────────────────────┼───────────────────────────────────────────────────────────┤
 │ Customers  │ /customers/*                 │ supabase.from('customers').select/insert/update/delete()  │
 ├────────────┼──────────────────────────────┼───────────────────────────────────────────────────────────┤
 │ Contacts   │ /contacts/*                  │ supabase.from('contacts')...                              │
 ├────────────┼──────────────────────────────┼───────────────────────────────────────────────────────────┤
 │ Quotations │ /quotations/*                │ supabase.from('quotations')...                            │
 ├────────────┼──────────────────────────────┼───────────────────────────────────────────────────────────┤
 │ Tickets    │ /tickets/*                   │ supabase.from('tickets')...                               │
 ├────────────┼──────────────────────────────┼───────────────────────────────────────────────────────────┤
 │ Accounting │ /billing/*, /invoices/* etc. │ supabase.from('billings')...                              │
 └────────────┴──────────────────────────────┴───────────────────────────────────────────────────────────┘

 The useUsers hook from Phase 2 is already the correct pattern — it calls supabase.from('users') directly. Replicate  
 this for all other modules.

 ---
 Priority 4 — Remove Edge Function References

 Once all frontend calls are migrated:
 - Delete src/supabase/functions/server/ directory (keep migrations/)
 - Remove API_URL constant from all components
 - Remove publicAnonKey usage as an auth token (it was used as Authorization: Bearer ${publicAnonKey} — wrong)        
 - Remove import { projectId, publicAnonKey } from './utils/supabase/info' from components that only used it for      
 API_URL

 ---
 What to Tell Figma Make to Do (immediate)

 For the 3-day window while still in Figma Make, focus on:

 1. Auth/me endpoint — replace the fetch(${API_URL}/auth/me) call in useUser.tsx with
 supabase.from('users').select('*').eq('auth_id', authUser.id).single(). This is the most critical — it's what        
 populates the sidebar and role checks.
 2. useUsers hook — already done (Phase 2). Confirm it's using direct Supabase, not the Edge Function.
 3. One module at a time — Start with Customers, then Contacts, then Quotations. Each is a self-contained set of CRUD 
  endpoints.

 ---
 Verification

 After RLS policies are in place:
 - Log in as a BD rep → can SELECT customers, cannot DELETE
 - Log in as Accounting → can SELECT customers but not INSERT
 - Log in as HR → cannot SELECT customers at all
 - Attempt supabase.from('users').select('*') as a rep → should only return own row
