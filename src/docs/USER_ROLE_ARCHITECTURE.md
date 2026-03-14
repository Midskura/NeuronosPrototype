# Neuron OS - User Role Architecture

> **Status**: Analysis complete, implementation pending  
> **Date**: 2026-03-14  
> **Scope**: Maps every role/department dependency in the prototype, identifies schema integration gaps, and defines the target architecture.

---

## 1. Current Schema (Source of Truth)

### 1.1 `users` Table Columns (001 + 002 + 003)

| Column | Type | Notes |
|---|---|---|
| `id` | TEXT PK | e.g. `user-a1b2c3d4` |
| `auth_id` | UUID UNIQUE | FK to `auth.users.id` (migration 003) |
| `name` | TEXT | Display name |
| `email` | TEXT | Login email |
| `department` | TEXT | Free-text, no ENUM |
| `role` | TEXT | Free-text, no ENUM |
| `service_type` | TEXT | Operations team: `'Forwarding'`,`'Brokerage'`,`'Trucking'`,`'Marine Insurance'`,`'Others'` |
| `operations_role` | TEXT | Operations team: `'Manager'`,`'Supervisor'`,`'Handler'` |
| `permissions` | TEXT[] | Unused array, always `'{}'` |
| `status` | TEXT | `'Active'` |
| `is_active` | BOOLEAN | `true` |
| `avatar` | TEXT | URL or initials |
| `phone` | TEXT | |

### 1.2 RLS Helper Functions (migration 003)

```sql
get_my_profile_id()  -- auth.uid() -> users.id (TEXT)
get_my_role()        -- auth.uid() -> users.role
get_my_department()  -- auth.uid() -> users.department
```

### 1.3 Current RLS Policies (Phase 1 - Permissive)

| Table | Policy | Rule |
|---|---|---|
| All 34 non-user tables | `Authenticated full access` | `USING (true)` for all ops |
| `users` SELECT | `Anyone authenticated can read users` | `USING (true)` |
| `users` UPDATE (own) | `Users can update own profile` | `auth_id = auth.uid()` |
| `users` UPDATE (admin) | `Admins can update any user` | `get_my_role() IN ('Admin','admin','manager','Manager','director')` |
| `users` INSERT | `Admins can insert users` | Same admin check |
| `users` DELETE | `Admins can delete users` | Same admin check |

### 1.4 Foreign Keys Referencing `users(id)` - 37 Total

| Table | FK Columns | Purpose |
|---|---|---|
| `customers` | `owner_id`, `created_by` | Account ownership |
| `contacts` | `owner_id`, `created_by` | Contact ownership |
| `tasks` | `owner_id`, `assigned_to` | Task delegation |
| `crm_activities` | `user_id` | Activity logging |
| `budget_requests` | `requested_by`, `approved_by` | Approval workflow |
| `quotations` | `created_by`, `assigned_to` | Pricing workflow |
| `contract_activity` | `user_id` | Audit trail |
| `contract_attachments` | `uploaded_by` | File ownership |
| `projects` | `manager_id`, `supervisor_id`, `handler_id`, `created_by` | Ops team assignment |
| `bookings` | `manager_id`, `supervisor_id`, `handler_id`, `created_by` | Ops team assignment |
| `project_attachments` | `uploaded_by` | File ownership |
| `evouchers` | `created_by` | Financial workflow |
| `evoucher_history` | `user_id` | Audit trail |
| `invoices` | `created_by` | Financial record |
| `collections` | `created_by` | Financial record |
| `expenses` | `created_by` | Financial record |
| `journal_entries` | `created_by` | Financial record |
| `transactions` | `created_by` | Financial record |
| `tickets` | `created_by`, `assigned_to` | Ticketing |
| `comments` | `user_id` | Comments |
| `activity_log` | `user_id` | System audit |
| `saved_reports` | `user_id` | Personal reports |
| `client_handler_preferences` | `preferred_manager_id`, `preferred_supervisor_id`, `preferred_handler_id` | Ops team defaults |

---

## 2. Taxonomy Conflicts (Critical Bugs)

The system has **4 different sets of role/department values** that don't align:

### 2.1 Department Values

| Source | Values | Status |
|---|---|---|
| **useUser.tsx TypeScript type** | `'Business Development'`, `'Pricing'`, `'Operations'`, `'Accounting'`, `'Executive'`, `'HR'` | **Canonical** (matches signup form + sidebar) |
| **permissions.ts** | `'BD'`, `'PD'`, `'Operations'`, `'Finance'`, `'Admin'` | **BROKEN** - never matches real values |
| **CRM components** prop type | `'BD'` \| `'PD'` | Works via manual prop mapping in BD/Pricing parents |
| **Schema SQL comments** | `'Executive'`, `'Operations'`, `'Accounting'`, `'Business Development'`, `'HR'`, `'IT'` | Advisory only (TEXT column, no ENUM) |

### 2.2 Role Values

| Source | Values | Status |
|---|---|---|
| **useUser.tsx TypeScript type** | `'rep'`, `'manager'`, `'director'` | **Canonical** (matches signup form) |
| **Admin.tsx user management** | `'Employee'`, `'President'` | **BROKEN** - out of sync with schema |
| **RLS policies (003)** | `'Admin'`, `'admin'`, `'manager'`, `'Manager'`, `'director'` | Overly broad string matching |
| **Schema SQL comments** | `'Admin'`, `'Manager'`, `'Operations'`, `'Accounting'`, `'BD'`, `'HR'`, `'Executive'` | Mix of roles and departments |
| **EmployeesList.tsx** | `'Admin'` | Checks `userRole === "Admin"` (never true) |

### 2.3 Impact of Mismatches

| Component | Check | Expected Value | Actual Value | Result |
|---|---|---|---|---|
| `ContactsListWithFilters` | `userDepartment === "BD"` | `"BD"` | Prop hardcoded to `"BD"/"PD"` by parent | **Works** (via prop mapping) |
| `permissions.ts` `canPerformQuotationAction` | `dept === "BD"` | `"BD"` | `"Business Development"` | **BROKEN** - always denied |
| `Admin.tsx` role badge | `user.role === "President"` | `"President"` | `"manager"` or `"director"` | **BROKEN** - wrong colors |
| `EmployeesList.tsx` | `userRole === "Admin"` | `"Admin"` | `"manager"` | **BROKEN** - admin actions hidden |
| `RLS policy` | `get_my_role() IN ('Admin','admin','manager','Manager','director')` | Any of those | `"manager"` or `"director"` | **Works** (but fragile) |

---

## 3. How Roles Are Actually Used (Dependency Map)

### 3.1 Sidebar Navigation (NeuronSidebar.tsx) - DEPARTMENT-BASED

```
effectiveDepartment
  |
  |- "Executive"            -> sees ALL modules (BD + Pricing + Ops + Accounting + HR)
  |- "Business Development" -> sees BD module only
  |- "Pricing"              -> sees Pricing module only
  |- "Operations"           -> sees Operations module only  
  |- "Accounting"           -> sees Accounting module only
  |- "HR"                   -> sees HR module only

effectiveRole
  |
  |- "manager" or "director" -> Ticket Queue + Activity Log visible
  |- "rep"                   -> Personal items only (Calendar, Inbox)
```

### 3.2 CRM Permissions (Contacts/Customers List) - DEPARTMENT-BASED

```
userDepartment (prop: "BD" | "PD")
  |
  |- "BD"  -> canCreate, canEdit, showOwnerFilter = true
  |- "PD"  -> canCreate, canEdit, showOwnerFilter = false (read-only view)
```

Note: The parent components (`BusinessDevelopment.tsx`, `Pricing.tsx`) manually map the full department name to the `"BD"`/`"PD"` shortcode. This works but is fragile.

### 3.3 Ticket System - ROLE + DEPARTMENT

```
effectiveRole (+ Executive auto-promotion to director)
  |
  |- "director"  -> sees ALL tickets, cross-department filter, can assign, bulk edit
  |- "manager"   -> sees own department tickets, can assign, bulk edit
  |- "rep"       -> sees own tickets only

effectiveDepartment
  |
  |- Sent to server as filter parameter
  |- "Executive" auto-promotes role to "director"
```

### 3.4 Activity Log - ROLE + DEPARTMENT

```
effectiveRole (+ Executive auto-promotion)
  |
  |- "director"  -> full system-wide log, all departments
  |- "manager"   -> department-scoped, can see team members
  |- "rep"       -> own activities only
```

### 3.5 EVoucher Workflow - DEPARTMENT (as "user_role")

The EVoucherWorkflowPanel uses `user.department` as the `user_role` field in history entries. This is a naming confusion, not a functional bug, but it means evoucher history says "user_role: Accounting" instead of a real role.

### 3.6 Operations Team Assignment - SERVICE_TYPE + OPERATIONS_ROLE

```
TeamAssignmentForm queries:
  GET /users?department=Operations&service_type=Forwarding&operations_role=Manager
  GET /users?department=Operations&service_type=Forwarding&operations_role=Supervisor  
  GET /users?department=Operations&service_type=Forwarding&operations_role=Handler

client_handler_preferences stores:
  preferred_manager_id, preferred_supervisor_id, preferred_handler_id
  per (customer_id, service_type) pair
```

This is the only place `service_type` and `operations_role` are used on the `users` table. It's critical for the forwarding/brokerage/trucking booking flow.

### 3.7 Account Owner Assignment (Screenshot Context) - DEPARTMENT FILTER

```
AddCustomerPanel / AddContactPanel:
  |
  |- Fetches all users where department=Business Development
  |- Renders dropdown: "Account Owner *" -> "Assign to..."
  |- Stores selected user's id as customers.owner_id / contacts.owner_id
  |- Currently BROKEN: fetches from Edge Function
```

### 3.8 Admin User Management (Admin.tsx) - COMPLETELY OUT OF SYNC

```
Current Admin.tsx:
  |- Creates users with role: "Employee" | "President" (WRONG)
  |- No department selection at all
  |- Badges styled for "President" vs "Employee" (WRONG)
  |- Should use: department dropdown + role dropdown matching the canonical values
```

### 3.9 Dev Role Override (EmployeeProfile.tsx)

```
localStorage key: neuron_dev_role_override
  |
  |- { department, role, enabled, timestamp }
  |- Overrides effectiveDepartment and effectiveRole globally
  |- Used for testing different views without re-logging
```

---

## 4. Target Architecture

### 4.1 Canonical Taxonomy (Single Source of Truth)

Create `/constants/roles.ts`:

```typescript
// DEPARTMENTS - display names match DB values exactly
export const DEPARTMENTS = [
  'Business Development',
  'Pricing', 
  'Operations',
  'Accounting',
  'HR',
  'Executive',
] as const;
export type Department = typeof DEPARTMENTS[number];

// Shortcode map for legacy components (CRM, permissions.ts)
export const DEPARTMENT_SHORT: Record<Department, string> = {
  'Business Development': 'BD',
  'Pricing': 'PD',
  'Operations': 'Operations',
  'Accounting': 'Finance',
  'HR': 'HR',
  'Executive': 'Admin',
};

// ROLES - hierarchical
export const ROLES = ['rep', 'manager', 'director'] as const;
export type Role = typeof ROLES[number];

// ROLE HIERARCHY (for permission checks)
export const ROLE_LEVEL: Record<Role, number> = {
  rep: 1,
  manager: 2,
  director: 3,
};

// OPERATIONS SUB-ROLES
export const SERVICE_TYPES = [
  'Forwarding',
  'Brokerage', 
  'Trucking',
  'Marine Insurance',
  'Others',
] as const;
export type ServiceType = typeof SERVICE_TYPES[number];

export const OPS_ROLES = ['Manager', 'Supervisor', 'Handler'] as const;
export type OpsRole = typeof OPS_ROLES[number];
```

### 4.2 Permission System (Replace permissions.ts)

```typescript
// /utils/permissions.ts - REVISED

import type { Department, Role } from '../constants/roles';
import { ROLE_LEVEL } from '../constants/roles';

interface UserContext {
  department: Department;
  role: Role;
}

// Module access
export function canAccessModule(user: UserContext, module: string): boolean {
  if (user.department === 'Executive') return true; // Executive sees everything
  
  const moduleMap: Record<string, Department[]> = {
    bd: ['Business Development'],
    pricing: ['Pricing'],
    operations: ['Operations'],
    accounting: ['Accounting'],
    hr: ['HR'],
    // Cross-department modules
    projects: ['Business Development', 'Pricing', 'Operations', 'Accounting'],
    contracts: ['Business Development', 'Pricing', 'Operations', 'Accounting'],
    tickets: ['Business Development', 'Pricing', 'Operations', 'Accounting', 'HR'],
  };
  
  return moduleMap[module]?.includes(user.department) ?? false;
}

// Role hierarchy check
export function hasMinRole(user: UserContext, minRole: Role): boolean {
  return ROLE_LEVEL[user.role] >= ROLE_LEVEL[minRole];
}

// Specific action checks
export function canCreateCustomer(user: UserContext): boolean {
  return user.department === 'Business Development';
}

export function canCreateContact(user: UserContext): boolean {
  return user.department === 'Business Development';
}

export function canPriceQuotation(user: UserContext): boolean {
  return user.department === 'Pricing' || user.department === 'Executive';
}

export function canManageTickets(user: UserContext): boolean {
  return hasMinRole(user, 'manager');
}

export function canViewActivityLog(user: UserContext): boolean {
  return hasMinRole(user, 'manager');
}

export function canManageUsers(user: UserContext): boolean {
  return hasMinRole(user, 'manager');
}

export function canDeleteUsers(user: UserContext): boolean {
  return user.role === 'director';
}
```

### 4.3 User Picker Queries (Direct Supabase)

Replace all Edge Function user fetches with direct queries:

```typescript
// Fetch BD reps for Account Owner dropdown
const { data: bdUsers } = await supabase
  .from('users')
  .select('id, name, email, avatar')
  .eq('department', 'Business Development')
  .eq('is_active', true);

// Fetch Operations team by service type and ops role
const { data: managers } = await supabase
  .from('users')
  .select('id, name')
  .eq('department', 'Operations')
  .eq('service_type', 'Forwarding')
  .eq('operations_role', 'Manager')
  .eq('is_active', true);
```

### 4.4 Data Flow Diagram

```
                          Supabase Auth
                               |
                          auth.users (UUID)
                               |
                     [auto-profile trigger]
                               |
                     public.users (TEXT id, auth_id UUID)
                        |           |           |
                   department     role    service_type + operations_role
                        |           |           |
              +---------+---------+ |  +--------+--------+
              |                     |  |                  |
        NeuronSidebar        Permission     TeamAssignment
        (module visibility)   Checks         Form
              |                |    |         (Ops only)
              |                |    |              |
        BD  Pricing  Ops  Accounting   client_handler_preferences
        |     |       |       |              |
     CRM   Quotation  Booking  EVoucher  projects/bookings
     owner_ created_by manager_ created_by  manager_id
     id      assigned  id       by          supervisor_id
                _to    handler_              handler_id
                       id
```

---

## 5. Migration Checklist

### Phase 1: Fix Taxonomy (No Schema Changes)

- [ ] Create `/constants/roles.ts` with canonical types
- [ ] Update `permissions.ts` to use full department names
- [ ] Update `Admin.tsx` to use `rep/manager/director` roles + department selector
- [ ] Update `EmployeesList.tsx` to check `role === 'director'` instead of `'Admin'`
- [ ] Verify CRM prop mapping (`"BD"`/`"PD"`) still works via parent components

### Phase 2: Fix User Fetching (Kill Edge Function Dependencies)

- [ ] Rewrite `fetchUserProfile()` in useUser.tsx -> direct Supabase query (DONE)
- [ ] Rewrite `AddCustomerPanel` user fetch -> `supabase.from('users').select().eq('department', 'Business Development')`
- [ ] Rewrite `AddContactPanel` user fetch -> same pattern
- [ ] Rewrite `TeamAssignmentForm` user fetch -> `supabase.from('users').select().eq('department', 'Operations').eq('service_type', X).eq('operations_role', Y)`
- [ ] Rewrite `ContactsListWithFilters` user fetch
- [ ] Rewrite `CustomersListWithFilters` user fetch
- [ ] Create shared hook: `useUsers(filters)` that all pickers can use

### Phase 3: Strengthen RLS (Future)

- [ ] Add department-scoped SELECT policies (BD can only see BD customers they own)
- [ ] Add role-scoped WRITE policies (only managers can delete)
- [ ] Move from `get_my_role() IN (...)` string matching to `ROLE_LEVEL` numeric check
- [ ] Add Postgres ENUM types for department/role to prevent invalid values

### Phase 4: Auto-Profile Enhancement

- [ ] Update `handle_new_auth_user()` trigger to read department/role from `raw_user_meta_data`
- [ ] Pass department/role through `supabase.auth.signUp({ options: { data: { department, role } } })`
- [ ] Remove the post-signup `UPDATE` workaround in useUser.tsx

---

## 6. Component-to-Role Dependency Matrix

| Component | Uses Department | Uses Role | Uses service_type | Uses operations_role | Fetches Users |
|---|---|---|---|---|---|
| NeuronSidebar | effectiveDepartment | effectiveRole | - | - | - |
| LoginPage (signup) | writes | writes | writes (if Ops) | writes (if Ops) | - |
| ContactsListWithFilters | prop "BD"/"PD" | - | - | - | fetches BD users |
| CustomersListWithFilters | prop "BD"/"PD" | - | - | - | fetches BD users |
| AddContactPanel | - | - | - | - | fetches BD users (owner dropdown) |
| AddCustomerPanel | - | - | - | - | fetches BD users (owner dropdown) |
| AddTaskPanel | - | - | - | - | fetches BD users (assign dropdown) |
| TeamAssignmentForm | hardcoded "Operations" | - | query filter | query filter | fetches Ops users |
| InboxPage | effectiveDepartment | effectiveRole | - | - | - |
| TicketQueuePage | effectiveDepartment | effectiveRole | - | - | - |
| TicketDetailModal | effectiveDepartment | effectiveRole | - | - | - |
| ActivityLogPage | effectiveDepartment | effectiveRole | - | - | fetches dept users |
| EVoucherWorkflowPanel | user.department (as "role") | - | - | - | - |
| Admin.tsx | - | WRONG values | - | - | fetches all users |
| EmployeeProfile | effectiveDepartment | effectiveRole | - | - | - |
| EmployeesList | - | userRole (prop) | - | - | - |
| BusinessDevelopment | maps to "BD" | - | - | - | - |
| Pricing | maps to "PD" | - | - | - | - |
| permissions.ts | WRONG shortcodes | - | - | - | - |

---

## 7. Immediate Action Items (Unblock Testing)

1. **Create `/constants/roles.ts`** - single source of truth for all role/department values
2. **Fix `useUser.tsx` `fetchUserProfile()`** - use direct Supabase query (DONE)
3. **Fix `useUser.tsx` `signup()`** - pass department/role to user row (DONE)
4. **Create `useUsers()` hook** - shared hook for all user-picker dropdowns, queries Supabase directly
5. **Fix `permissions.ts`** - use canonical department names
6. **Fix `Admin.tsx`** - use canonical role values + add department selector
7. **Fix Account Owner dropdown** (AddCustomerPanel/AddContactPanel) - use `useUsers()` hook
