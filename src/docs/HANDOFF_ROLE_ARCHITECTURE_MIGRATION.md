# Handoff: User Role-Based Architecture Migration

> **Date**: 2026-03-15
> **Author**: AI Assistant (across 3+ Figma Make sessions)
> **Status**: Supabase migration COMPLETE; role/RLS hardening PARTIALLY complete; manual SQL steps remain

---

## 1. The Greater Goal

Neuron OS is an ERP-style web app for Philippine freight forwarding SMEs. It has 6 departments (Business Development, Pricing, Operations, Accounting, HR, Executive) and 3 role tiers (rep, manager, director). The **end goal** is a system where:

1. **Every user sees only what their department and role permits** -- both in the UI (sidebar, buttons, route access) and in the database (Supabase RLS policies reject unauthorized queries at the Postgres level).
2. **There is a single source of truth** for department/role values -- no more fragmented taxonomy where `permissions.ts` says `"BD"` but the database says `"Business Development"`.
3. **The dead Edge Function is fully eliminated** -- all data flows through `supabase.from('table').select()` with the user's JWT automatically forwarded, and RLS is the security layer.
4. **The database enforces constraints** -- CHECK constraints on `users.department` and `users.role` prevent invalid values, the unused `password` column is dropped, and scoped RLS policies replace the permissive "authenticated = full access" policies from the initial deployment.

In short: **go from a broken, zero-security prototype to a production-ready RBAC system with defense in depth (frontend guards + database enforcement).**

---

## 2. Where We Started (The Problems)

### 2.1 The Dead Edge Function

The Hono-based Edge Function (`make-server-c142e950`) was deployed via Figma Make's Supabase connector to an OLD project. When the Supabase project was recreated, the function was never redeployed. Result: **every `fetch(API_URL/...)` call in ~111 frontend files returned 404**. The entire app was authenticated but showed empty states everywhere.

### 2.2 Taxonomy Fragmentation (6 Classes of Defects)

The system had **4 different sets of role/department values** that didn't align:

| Layer | Department Values | Role Values |
|---|---|---|
| **useUser.tsx (canonical)** | `'Business Development'`, `'Pricing'`, `'Operations'`, `'Accounting'`, `'Executive'`, `'HR'` | `'rep'`, `'manager'`, `'director'` |
| **permissions.ts (broken)** | `'BD'`, `'PD'`, `'Finance'`, `'Admin'` | Not used |
| **Admin.tsx (broken)** | Not selectable | `'Employee'`, `'President'` |
| **RLS policies (fragile)** | N/A | `'Admin'`, `'admin'`, `'manager'`, `'Manager'`, `'director'` |
| **EmployeesList.tsx (broken)** | N/A | `'Admin'` (never matches) |
| **CRM components** | `'BD'` / `'PD'` (shortcodes) | N/A |

**Impact**: Permission checks in `permissions.ts` silently failed (compared `"BD"` against `"Business Development"`). Admin panel displayed wrong role badges. EmployeesList admin actions were permanently hidden. EVoucher workflow buttons compared against `"Treasury"`, `"Accountant"`, `"Finance Manager"` -- none of which are real values.

### 2.3 Zero Security

- **No auth middleware** on the Edge Function: all 100+ API endpoints were publicly accessible
- **3 destructive DELETE endpoints** could wipe entire tables with an unauthenticated curl
- **RLS was permissive**: `USING (true)` on all 34 non-user tables (any authenticated user could read/write everything)
- **No route guards**: sidebar hid links, but URLs like `/accounting/transactions` were accessible to any authenticated user
- **`publicAnonKey` used as Bearer token**: the anon key was sent as `Authorization: Bearer ${publicAnonKey}` -- this doesn't authenticate anyone

### 2.4 Database Gaps

- `users.department` and `users.role` are free-text TEXT columns with no CHECK constraints
- `users.permissions` TEXT[] column: always `'{}'`, never used
- `users.password` TEXT column: leftover from pre-Supabase-Auth custom login, now dead

---

## 3. The Migration Plan (Two Parallel Tracks)

Two interrelated plans govern this work:

| Plan | File | Scope |
|---|---|---|
| **User Roles Fix Blueprint** | `/docs/blueprints/USER_ROLES_FIX_BLUEPRINT.md` | 7-phase plan to fix taxonomy, permission checks, route guards, and RLS |
| **Supabase Migration Plan** | `/docs/plans/SUPABASE_MIGRATION_PLAN.md` | 4-priority plan to migrate all `fetch(API_URL/...)` calls to `supabase.from()`, apply RLS, and delete the Edge Function |

They overlap at Phases 2-3 of the roles blueprint (replacing Edge Function user fetches) and at the RLS policy layer.

---

## 4. Current Status (What's Done)

### 4.1 Supabase Migration -- COMPLETE

All 111 frontend files across 13 phases (A through M) have been migrated from `apiFetch()` / `fetch(API_URL/...)` to direct `supabase.from()` queries. Zero `apiFetch` consumers remain. The wrapper files have been deleted:

- `/utils/api.ts` -- DELETED (was the `apiFetch()` wrapper)
- `/utils/fetchWithRetry.ts` -- DELETED (only consumer was `api.ts`)

The Edge Function server files at `/supabase/functions/server/` are system-protected in Figma Make and cannot be deleted here. They are dead code (the function returns 404) and should be deleted after exporting the codebase.

**Key migration decisions made:**
- The Edge Function queried `db.from("activities")` but the actual schema table is `crm_activities` -- all frontend queries use the correct table name
- `Admin.tsx` seed/migrate endpoints were replaced with toast messages directing users to the Supabase SQL Editor
- BD report files got client-side CSV export logic replacing server-side endpoints

### 4.2 Roles Blueprint Phases -- PARTIALLY COMPLETE

| Phase | Description | Status | Notes |
|---|---|---|---|
| **Phase 1** | Fix taxonomy mismatches | COMPLETE | `permissions.ts` rewritten with canonical names, `Admin.tsx` fixed, `EmployeesList.tsx` fixed, CRM shortcodes mapped properly, EVoucher/BudgetRequest role checks fixed |
| **Phase 2** | `useUsers()` hook (kill Edge Function user fetches) | COMPLETE | Shared hook at `/hooks/useUsers.ts`, used by AddCustomerPanel, AddContactPanel, TeamAssignmentForm, ActivityLogPage, CRM list filters |
| **Phase 3** | Frontend migration (apiFetch then supabase.from) | COMPLETE | All 111 files migrated across 3 sessions. Server-side JWT middleware written to files for reference but never deployed (Edge Function is dead) |
| **Phase 4** | Frontend route guards | COMPLETE | `/components/RouteGuard.tsx` created, applied in `App.tsx` wrapping route groups by department/role |
| **Phase 5** | DB constraints (drop password, CHECK constraints) | NOT STARTED | SQL file exists at `/supabase/migrations/004_role_constraints.sql` -- must be run in Supabase SQL Editor |
| **Phase 6** | Scoped RLS policies | NOT STARTED | SQL file exists at `/supabase/migrations/005_rls_policies.sql` -- must be run in Supabase SQL Editor |
| **Phase 7** | Dead code cleanup | PARTIAL | `api.ts` and `fetchWithRetry.ts` deleted. Edge Function server files are system-protected (delete after export). `Login.tsx` still exports the dead `UserRole` type |

### 4.3 What the Frontend Enforces Today

**Sidebar (NeuronSidebar.tsx)** -- department-gated:
```
Executive       -> sees ALL modules
BD              -> sees BD module only
Pricing         -> sees Pricing module only
Operations      -> sees Operations module only
Accounting      -> sees Accounting module only
HR              -> sees HR module only
manager/director -> Ticket Queue + Activity Log visible
```

**Route Guards (RouteGuard.tsx)** -- prevents URL-bar navigation:
- `/bd/*` requires `department: 'Business Development'`
- `/pricing/*` requires `department: 'Pricing'`
- `/operations/*` requires `department: 'Operations'`
- `/accounting/*` requires `department: 'Accounting'`
- `/hr/*` requires `department: 'HR'`
- `/activity-log` requires `role: 'manager'` minimum
- `/ticket-queue` requires `role: 'manager'` minimum
- Executive department bypasses all department checks

**Permissions (permissions.ts)** -- now uses canonical values:
- `canCreateCustomer()` requires `department === 'Business Development'`
- `canPriceQuotation()` requires `department === 'Pricing' || 'Executive'`
- `hasMinRole()` uses numeric hierarchy: rep(0) < manager(1) < director(2)
- EVoucher workflow: Accounting manager approves/disburses, rep records, director audits
- Budget requests: Accounting manager/director or Executive can approve

**Dev Override (EmployeeProfile.tsx)** -- `localStorage: neuron_dev_role_override`:
- Overrides `effectiveDepartment` and `effectiveRole` globally for testing
- Does NOT bypass RLS (database still enforces real identity)

### 4.4 What the Database Enforces Today

**Current RLS (Phase 1 -- permissive):**
- All 34 non-user tables: `USING (true)` for all operations (any authenticated user can do anything)
- `users` table: scoped UPDATE/DELETE (only managers/directors can modify other users)

**This is the critical gap.** The frontend guards are cosmetic -- a user who opens browser DevTools can call `supabase.from('customers').delete()` and it will succeed regardless of their department. The scoped RLS policies in `005_rls_policies.sql` fix this.

---

## 5. What Remains (Manual Steps)

All remaining work requires running SQL in the **Supabase SQL Editor** (or via `psql` / migration tooling after export). None of these can be done from Figma Make.

### 5.1 Priority 1: DB Constraints (004_role_constraints.sql)

**File**: `/supabase/migrations/004_role_constraints.sql`

Run a validation query FIRST to find any rows with bad data:
```sql
SELECT id, email, department, role FROM users
WHERE department NOT IN ('Business Development','Pricing','Operations','Accounting','Executive','HR')
   OR role NOT IN ('rep','manager','director');
```

Fix any bad rows, then apply:
```sql
ALTER TABLE users ADD CONSTRAINT users_department_check
  CHECK (department IN ('Business Development','Pricing','Operations','Accounting','Executive','HR'));
ALTER TABLE users ADD CONSTRAINT users_role_check
  CHECK (role IN ('rep','manager','director'));
ALTER TABLE users ADD CONSTRAINT users_service_type_check
  CHECK (service_type IS NULL OR service_type IN ('Forwarding','Brokerage','Trucking','Marine Insurance','Others'));
ALTER TABLE users ADD CONSTRAINT users_operations_role_check
  CHECK (operations_role IS NULL OR operations_role IN ('Manager','Supervisor','Handler'));
ALTER TABLE users DROP COLUMN IF EXISTS permissions;
```

And separately:
```sql
ALTER TABLE users DROP COLUMN IF EXISTS password;
```

### 5.2 Priority 2: Scoped RLS Policies (005_rls_policies.sql)

**File**: `/supabase/migrations/005_rls_policies.sql`

This 620-line migration:
1. **Drops** the permissive `"Authenticated full access"` policies from 21 tables
2. **Creates** department- and role-scoped policies for each table
3. **Adds** service_role bypass policies for admin scripts

Key access matrix:

| Table | SELECT | INSERT | UPDATE | DELETE |
|---|---|---|---|---|
| **customers/contacts** | All except HR | BD, Executive | BD, Executive, managers+ | BD managers/directors, Executive |
| **quotations** | All | BD, Pricing, Executive | BD, Pricing, Executive | Directors only |
| **evouchers** | All | Accounting, Executive | Accounting, Executive | Accounting managers+ |
| **invoices/collections/expenses** | All | Accounting, Executive | Accounting, Executive | Accounting managers+ |
| **tickets** | Directors: all; Managers: own dept; Reps: own | All | Own + managers+ | Directors only |
| **activity_log** | Directors: all; Managers: own dept; Reps: own | All | Directors only | Directors only |
| **comments** | All | All | Own + managers+ | Own + managers+ |

**Prerequisite**: Run `004_role_constraints.sql` first (the RLS helper functions rely on role values being canonical).

### 5.3 Priority 3: Post-Export Cleanup

After exporting the codebase from Figma Make:
- Delete `/supabase/functions/server/` directory (11 dead Edge Function files)
- Remove `password: "password123"` from seed data in server files (if keeping them for reference)
- Consider removing the `Login.tsx` `UserRole` type export (dead code, zero consumers)

---

## 6. Verification Checklist

After applying RLS policies, verify with these scenarios:

| Test | Expected Result |
|---|---|
| Log in as BD rep -> `supabase.from('customers').select()` | Returns all customers (SELECT allowed) |
| BD rep -> `supabase.from('customers').delete().eq('id', X)` | **Denied** (only BD managers/directors can delete) |
| Accounting rep -> `supabase.from('customers').insert(...)` | **Denied** (only BD/Executive can insert customers) |
| HR user -> `supabase.from('customers').select()` | **Denied** (HR has no customer access) |
| BD rep -> `supabase.from('tickets').select()` | Returns only own tickets |
| Manager -> `supabase.from('tickets').select()` | Returns own department tickets |
| Director -> `supabase.from('activity_log').select()` | Returns all activity log entries |
| Rep -> navigate to `/accounting/transactions` via URL bar | Redirected to dashboard (RouteGuard) |

Use the Supabase SQL Editor to test RLS in isolation:
```sql
SET LOCAL role = 'authenticated';
SET LOCAL request.jwt.claims = '{"sub": "<auth_uid_of_test_user>"}';
SELECT * FROM customers; -- should respect RLS
```

---

## 7. Architecture Reference

### 7.1 Key Files

| File | Purpose |
|---|---|
| `/hooks/useUser.tsx` | Auth provider, canonical `User` type, `effectiveDepartment`/`effectiveRole`, dev override |
| `/hooks/useUsers.ts` | Shared hook for user-picker dropdowns (filters by dept, role, service_type, ops_role) |
| `/utils/permissions.ts` | RBAC permission functions using canonical department/role values |
| `/utils/supabase/client.ts` | Supabase JS client (auto-attaches JWT) |
| `/components/RouteGuard.tsx` | Frontend route protection by department/role |
| `/components/NeuronSidebar.tsx` | Department-gated sidebar navigation |
| `/components/EmployeeProfile.tsx` | Dev role override (localStorage) |
| `/docs/USER_ROLE_ARCHITECTURE.md` | Full dependency map of every component's role/department usage |
| `/docs/blueprints/USER_ROLES_FIX_BLUEPRINT.md` | 7-phase implementation plan with detailed file changes |
| `/docs/plans/SUPABASE_MIGRATION_PLAN.md` | 4-priority Supabase migration tracker (all phases complete) |
| `/supabase/migrations/004_role_constraints.sql` | DB CHECK constraints (not yet applied) |
| `/supabase/migrations/005_rls_policies.sql` | Scoped RLS policies (not yet applied) |

### 7.2 The `users` Table (37 Foreign Keys Depend on It)

The `users` table is the most connected table in the schema. 37 FK columns across 22 tables reference `users(id)`. Key patterns:

- **Ownership**: `customers.owner_id`, `contacts.owner_id` (BD account assignment)
- **Team assignment**: `projects.manager_id/supervisor_id/handler_id`, `bookings.manager_id/supervisor_id/handler_id` (Operations)
- **Audit trail**: `crm_activities.user_id`, `activity_log.user_id`, `evoucher_history.user_id`
- **Workflow**: `quotations.created_by/assigned_to`, `tickets.created_by/assigned_to`, `budget_requests.requested_by/approved_by`
- **Financial records**: `evouchers.created_by`, `invoices.created_by`, `collections.created_by`, `expenses.created_by`
- **Client preferences**: `client_handler_preferences.preferred_manager_id/preferred_supervisor_id/preferred_handler_id`

### 7.3 Data Flow

```
Supabase Auth (auth.users UUID)
        |
   [auto-profile trigger: handle_new_auth_user()]
        |
public.users (TEXT id "user-xxxx", auth_id UUID)
   |           |              |
department    role    service_type + operations_role
   |           |              |
   +-----+-----+    +---------+---------+
   |     |     |    |                   |
Sidebar  Route  Permission    TeamAssignment
(modules) Guard  Checks       Form (Ops only)
   |       |      |                |
 BD  Pricing  Ops  Acctg    client_handler_preferences
  |    |       |     |              |
 CRM  Quotation Booking EVoucher  projects/bookings
 owner_ created_ manager_ created_  manager_id
 id     by/      id/      by       supervisor_id
        assigned handler_           handler_id
        _to      id
```

---

## 8. Known Gotchas for Future Developers

1. **Executive department = superuser**: The `Executive` department auto-promotes to `director` privileges everywhere in the frontend. RLS policies also grant Executive full access via `get_my_department() = 'Executive'` checks.

2. **CRM shortcode mapping**: `BusinessDevelopment.tsx` passes `"BD"` and `Pricing.tsx` passes `"PD"` as props to CRM list components. This is a legacy pattern that works via prop mapping in the parent. The canonical department names are used everywhere else.

3. **EVoucher `user_role` confusion**: `EVoucherWorkflowPanel` writes `user.department` into the `user_role` field in history entries. This means evoucher history says `"user_role: Accounting"` instead of `"rep"`. It's cosmetic, not functional.

4. **Operations sub-roles**: Only the Operations department uses `service_type` and `operations_role` on the `users` table. These fields are nullable for all other departments. The `TeamAssignmentForm` component is the primary consumer -- it filters users by `department=Operations AND service_type=X AND operations_role=Y`.

5. **Dev override doesn't bypass RLS**: The `neuron_dev_role_override` in localStorage changes what the frontend *displays* but does NOT change the JWT or database identity. If you override to "Executive" but your real user is a BD rep, RLS will still enforce BD rep permissions on database queries.

6. **The `fast_apply_tool` import issue**: During migration, `fast_apply_tool` frequently failed to remove `import { apiFetch }` lines when applying changes. The workaround was using `edit_tool` as a fallback. Every file was verified post-edit with a codebase-wide search for stale imports. This is a Figma Make environment issue, not a codebase issue.

---

## 9. Summary: What You Need to Do

If you're picking this up after export from Figma Make:

1. **Run `004_role_constraints.sql`** in Supabase SQL Editor (fix bad data first)
2. **Run `005_rls_policies.sql`** in Supabase SQL Editor
3. **Run `ALTER TABLE users DROP COLUMN IF EXISTS password`**
4. **Delete `/supabase/functions/server/`** directory
5. **Test with the verification checklist** in Section 6
6. **Optionally**: create `/constants/roles.ts` as a formal constants file (the target architecture in `USER_ROLE_ARCHITECTURE.md` Section 4.1 has the full spec -- currently the canonical types live only in `useUser.tsx` and `permissions.ts`)
