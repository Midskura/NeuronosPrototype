# RBAC Refactor Plan — Neuron OS

## Goal

Replace the current 3-tier role model (`rep | manager | director`) with a 4-tier scoped model:

| Tier | Who | Sees |
|---|---|---|
| Executive dept | No role hierarchy | Everything across all departments |
| `manager` | Department manager | All records in their department |
| `team_leader` | Team lead | All records created by their team members |
| `staff` | Regular user | Only records they created / are assigned to |

Additionally, Executive users get a full **PermissionsHub** inside the expanded Admin page to manage users, teams, and access overrides.

---

## Key Decisions

- `director` role is removed. Existing directors → `manager`.
- `rep` role is renamed to `staff`.
- `operations_role` (Manager/Supervisor/Handler) is retired for RBAC. Mapping: Handler→staff, Supervisor→team_leader, Manager→manager. The `service_type` column stays (controls which Ops module tabs are visible).
- Teams are first-class DB objects (`teams` table). Every Operations service type becomes a team.
- Not everyone needs a team. `team_leader` MUST have `team_id`. `staff` without a team falls back to own-records-only scope.
- Data scoping is derived: Manager queries filter by `created_by IN (users where dept = X)`. No `department` column added to record tables.
- Cross-dept records (projects) are visible to a manager if any of their dept's users are attached to it.
- Both frontend filtering (UX) and RLS (enforcement) will be implemented.
- PermissionsHub lives in the expanded `/admin` page, Executive-only.

---

## New Schema

### `teams` table (new)
```sql
CREATE TABLE teams (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name       text NOT NULL,
  department text NOT NULL,
  leader_id  uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

### `permission_overrides` table (new)
```sql
CREATE TABLE permission_overrides (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  scope       text NOT NULL CHECK (scope IN ('department_wide', 'cross_department', 'full')),
  departments text[],  -- populated if scope = 'cross_department'
  granted_by  uuid REFERENCES users(id),
  notes       text,
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
);
```

### `users` table additions
```sql
ALTER TABLE users ADD COLUMN team_id uuid REFERENCES teams(id) ON DELETE SET NULL;
```

### Role migration
```sql
UPDATE users SET role = 'staff'       WHERE role = 'rep';
UPDATE users SET role = 'manager'     WHERE role = 'director';
-- Operations-specific: migrate operations_role → role
UPDATE users SET role = 'staff'       WHERE department = 'Operations' AND operations_role = 'Handler';
UPDATE users SET role = 'team_leader' WHERE department = 'Operations' AND operations_role = 'Supervisor';
UPDATE users SET role = 'manager'     WHERE department = 'Operations' AND operations_role = 'Manager';
```

---

## Frontend Architecture

### `useDataScope()` hook
Central hook that resolves the current user's visibility scope into a list of visible user IDs (or 'all').

```ts
type DataScope =
  | { type: 'all' }
  | { type: 'userIds'; ids: string[] }   // manager, team_leader, override
  | { type: 'own'; userId: string }       // staff

function useDataScope(): DataScope & { isLoaded: boolean }
```

Resolution order:
1. Executive dept → `{ type: 'all' }`
2. `permission_overrides` record exists → resolve to override scope
3. `manager` → fetch all users in same dept, return their IDs
4. `team_leader` → fetch all users in same team_id, return their IDs
5. `staff` → `{ type: 'own', userId }`

### `useTeamMembers(teamId)` hook
Fetches all users belonging to a given team. Used by `useDataScope` internally.

### Updated `useUser` types
```ts
role: 'staff' | 'team_leader' | 'manager'
team_id?: string | null
```

### Updated `RouteGuard`
```ts
const ROLE_LEVEL = { staff: 0, team_leader: 1, manager: 2 }
```

### PermissionsHub (in Admin.tsx / `/admin` route)
Three new tabs added to the existing Admin page, visible only to Executive dept users:

| Tab | Purpose |
|---|---|
| **Users** | Full user directory. Create, edit, deactivate. Set dept/role/team/service_type. Replaces current minimal user management in Admin.tsx. |
| **Teams** | Create/rename/delete teams per department. Assign team leader. View/manage members. |
| **Access Overrides** | Grant a user elevated scope without changing their role. Add/revoke overrides. |

---

## Phases

### Phase 1 — Database
**Goal:** Apply all schema changes. No frontend changes yet.

Tasks:
- [ ] Write migration SQL for `teams` table
- [ ] Write migration SQL for `permission_overrides` table
- [ ] Write migration SQL for `users.team_id` column
- [ ] Write migration SQL for role value updates (rep→staff, director→manager, operations_role migration)
- [ ] Write migration SQL for CHECK constraint update on `users.role`
- [ ] Apply all migrations via Supabase MCP
- [ ] Seed the 5 Operations teams (Forwarding, Brokerage, Trucking, Marine Insurance, Others)
- [ ] Verify schema in Supabase dashboard

---

### Phase 2 — Core Hooks & Types
**Goal:** Update the auth/role layer so everything downstream can use new types.

Tasks:
- [ ] Update `User` interface in `useUser.tsx`: role type, add `team_id`
- [ ] Update `ROLE_LEVEL` map in `RouteGuard.tsx`
- [ ] Update `effectiveRole` fallback default from `'rep'` to `'staff'`
- [ ] Create `src/hooks/useDataScope.ts`
- [ ] Create `src/hooks/useTeamMembers.ts`
- [ ] Update dev override UI (if any) to use new role values
- [ ] TypeScript clean build — zero errors

---

### Phase 3 — PermissionsHub: Users Tab
**Goal:** Replace the minimal user management in Admin.tsx with a full users panel.

Tasks:
- [ ] Audit current `Admin.tsx` — identify what to keep vs replace
- [ ] Build `PermissionsHubUsersTab` component
  - Full user table with search/filter by dept and role
  - Create user form: name, email, dept, role, team, service_type (if Ops)
  - Edit user inline or via side panel
  - Deactivate/reactivate toggle
  - Password reset trigger (Supabase auth)
- [ ] Gate the entire PermissionsHub section behind `effectiveDepartment === 'Executive'`
- [ ] Wire into Admin.tsx as new tab

---

### Phase 4 — PermissionsHub: Teams Tab
**Goal:** Executive can manage all teams across departments.

Tasks:
- [ ] Build `PermissionsHubTeamsTab` component
  - List teams grouped by department
  - Create team form: name, department, leader (user picker)
  - Edit team name / reassign leader
  - View team members (users with this team_id)
  - Delete team (with warning: clears team_id from members)
- [ ] Wire into Admin.tsx

---

### Phase 5 — PermissionsHub: Access Overrides Tab
**Goal:** Executive can grant elevated scope to specific users.

Tasks:
- [ ] Build `PermissionsHubOverridesTab` component
  - List all current overrides (user, scope, granted by, date)
  - Add override: user picker, scope selector, optional dept array (for cross_department), notes
  - Revoke override (delete row)
- [ ] Wire into Admin.tsx

---

### Phase 6 — Apply Scoping: BD Module
**Goal:** BD quotations, customers, contacts, projects respect the new scope.

Affected components to audit and update:
- `ContactsListWithFilters.tsx`
- `ContactDetail.tsx`
- `CustomerDetail.tsx`
- BD quotations list
- BD projects list

Tasks:
- [ ] Identify all `supabase.from(...)` list queries in BD components
- [ ] Apply `useDataScope()` to each: wrap `created_by` filter for staff/team/dept/all
- [ ] Test all 4 scope levels via dev override tool
- [ ] Handle edge case: staff with no team_id

---

### Phase 7 — Apply Scoping: Pricing Module
Affected: quotations list, contract list, rate cards

Tasks:
- [ ] Identify all list queries in Pricing components
- [ ] Apply `useDataScope()` to each
- [ ] Test all 4 scope levels

---

### Phase 8 — Apply Scoping: Operations Module
Affected: all 5 service booking lists (Forwarding, Brokerage, Trucking, Marine Insurance, Others)

Note: Operations users also have `service_type` which already filters which tab they see. Scoping applies WITHIN each service tab.

Tasks:
- [ ] Identify all list queries in Operations components
- [ ] Apply `useDataScope()` to each booking list
- [ ] Ensure `service_type` tab filtering still works independently of RBAC scope
- [ ] Test all 4 scope levels per service type

---

### Phase 9 — Apply Scoping: Accounting + HR
Affected: invoices, expenses, evouchers, collections, HR user views

Tasks:
- [ ] Identify all list queries in Accounting components
- [ ] Apply `useDataScope()` to each
- [ ] Identify all list queries in HR components
- [ ] Apply `useDataScope()` to each
- [ ] Test all 4 scope levels

---

### Phase 10 — RLS Policies
**Goal:** Enforce scope at the database level as a security backstop.

Tasks:
- [ ] Write RLS policy for `quotations` — staff sees own, team_leader sees team, manager sees dept, executive sees all
- [ ] Write RLS policy for `bookings`
- [ ] Write RLS policy for `customers` / `contacts`
- [ ] Write RLS policy for `invoices` / `expenses` / `evouchers`
- [ ] Write RLS policy for `projects`
- [ ] Write RLS policy for `teams` — readable by all, writable by Executive only
- [ ] Write RLS policy for `permission_overrides` — readable by self + Executive, writable by Executive only
- [ ] Apply all policies via Supabase MCP
- [ ] Smoke test: verify a staff-level session cannot read other users' records directly via Supabase client

---

## Migration Notes

- The `operations_role` column is NOT dropped in this refactor — it may still be used in some UI display logic. It can be cleaned up in a follow-up pass once all scoping is confirmed working.
- Existing data has no `team_id` set. After Phase 1, all existing users will have `team_id = NULL`. Executive must assign teams via the PermissionsHub (Phase 3/4) before team_leader scoping is meaningful.
- Dev override tool in the app should be updated to offer `staff | team_leader | manager` options after Phase 2.

---

## Files That Will Change

| File | Change |
|---|---|
| `src/hooks/useUser.tsx` | Role type update, add team_id to User interface |
| `src/components/RouteGuard.tsx` | ROLE_LEVEL map update |
| `src/hooks/useDataScope.ts` | New file |
| `src/hooks/useTeamMembers.ts` | New file |
| `src/components/Admin.tsx` | Expand with PermissionsHub tabs |
| `src/components/bd/*.tsx` | Apply useDataScope to list queries |
| `src/components/pricing/*.tsx` | Apply useDataScope to list queries |
| `src/components/operations/*.tsx` | Apply useDataScope to list queries |
| `src/components/accounting/*.tsx` | Apply useDataScope to list queries |
| `src/components/crm/*.tsx` | Apply useDataScope to list queries |
| Supabase migrations | phases 1 + 10 |

---

## Status

- [x] Brainstorming complete
- [x] Plan written
- [ ] Phase 1 — Database
- [ ] Phase 2 — Core Hooks & Types
- [ ] Phase 3 — PermissionsHub: Users Tab
- [ ] Phase 4 — PermissionsHub: Teams Tab
- [ ] Phase 5 — PermissionsHub: Access Overrides Tab
- [ ] Phase 6 — BD Scoping
- [ ] Phase 7 — Pricing Scoping
- [ ] Phase 8 — Operations Scoping
- [ ] Phase 9 — Accounting + HR Scoping
- [ ] Phase 10 — RLS Policies
