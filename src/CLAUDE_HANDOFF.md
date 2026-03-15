# Neuron OS -- Claude Code Handoff

> **Date**: 2026-03-15
> **From**: Figma Make AI assistant (3+ sessions)
> **To**: Claude Code
> **Status**: Frontend 100% complete. Manual SQL steps remain.

---

## What Is This Project?

Neuron OS is an ERP-style web app for Philippine freight forwarding SMEs. It covers Business Development (CRM), Pricing (quotations/contracts), Operations (bookings across 5 service types), Accounting (eVouchers/invoices/collections/expenses/ledger), HR (employees/payroll), and an Executive dashboard. ~250 React component files, 35 Supabase tables, real auth.

## Tech Stack

- **Frontend**: React 18 + TypeScript + Tailwind CSS v4 (no `tailwind.config.js` -- config is `@theme inline` in `/styles/globals.css`)
- **Routing**: `react-router` (NOT `react-router-dom`) with `createBrowserRouter` / `RouterProvider`
- **Backend**: Supabase (Postgres + Auth + RLS). All data access via `supabase.from('table').select()`
- **UI Kit**: shadcn/ui components in `/components/ui/` (~40 files)
- **Icons**: lucide-react
- **Toasts**: `import { toast } from "sonner@2.0.3"` (version required)
- **No static assets**: No `/public/` folder. No image files. SVGs are TypeScript path-data objects in `/imports/svg-*.ts`. App is icon-driven.

## Reading Order (Start Here)

| Priority | File | What You Learn |
|---|---|---|
| 1 | `/docs/HANDOFF_ROLE_ARCHITECTURE_MIGRATION.md` | **The big picture**: the RBAC migration, what's done, what's left, verification checklist |
| 2 | `/docs/USER_ROLE_ARCHITECTURE.md` | Every component's role/department dependency, the taxonomy, the data flow |
| 3 | `/docs/plans/SUPABASE_MIGRATION_PLAN.md` | Full tracker of the Edge Function -> Supabase migration (all phases complete) |
| 4 | `/docs/blueprints/USER_ROLES_FIX_BLUEPRINT.md` | 7-phase plan for fixing roles (Phases 1-4 done, 5-7 need SQL) |
| 5 | `/context/MODULE_MAP.md` | All modules and their key files |
| 6 | `/context/PROJECT_OVERVIEW.md` | Product context, design system, domain terminology |
| 7 | `/context/ARCHITECTURE_AND_PATTERNS.md` | Code patterns (NOTE: ignore any KV store references -- that's dead) |

## Current State (Post-Migration)

### What Works
- **Auth**: Real Supabase Auth (`signUp`, `signInWithPassword`, JWT auto-refresh, session persistence)
- **All data operations**: Every component uses `supabase.from()` directly -- zero Edge Function calls remain
- **Role-based UI**: Sidebar is department-gated, route guards enforce URL access, permissions.ts uses canonical values
- **Dev override**: `EmployeeProfile.tsx` has a localStorage toggle to test different department/role combos

### What's Left (Manual SQL Only)
These cannot be done in code. Run them in **Supabase SQL Editor**:

1. **DB constraints** -- `/supabase/migrations/004_role_constraints.sql` (CHECK constraints on department/role columns)
2. **Scoped RLS policies** -- `/supabase/migrations/005_rls_policies.sql` (replaces permissive "authenticated = full access" with department/role-scoped policies)
3. **Drop dead columns** -- `ALTER TABLE users DROP COLUMN IF EXISTS password;`
4. **Delete dead server code** -- `/supabase/functions/server/` directory (11 files, all dead -- the Edge Function doesn't exist on the current Supabase project)

### What's Fragile (Known Debt)
- **CRM shortcode props**: `BusinessDevelopment.tsx` passes `"BD"` and `Pricing.tsx` passes `"PD"` as props to CRM list components. Works via parent mapping, but is a legacy pattern.
- **EVoucher `user_role` field**: Stores `user.department` (e.g., `"Accounting"`) not the actual role. Cosmetic issue.
- **RLS is still permissive**: Until `005_rls_policies.sql` is applied, any authenticated user can read/write any table. Frontend guards are cosmetic only.

## Canonical Taxonomy (Single Source of Truth)

```typescript
// From /hooks/useUser.tsx
department: 'Business Development' | 'Pricing' | 'Operations' | 'Accounting' | 'Executive' | 'HR'
role:       'rep' | 'manager' | 'director'

// Operations-only sub-fields
service_type:    'Forwarding' | 'Brokerage' | 'Trucking' | 'Marine Insurance' | 'Others'
operations_role: 'Manager' | 'Supervisor' | 'Handler'
```

**Role hierarchy**: rep (0) < manager (1) < director (2). Executive department auto-promotes to director privileges everywhere.

## Key Files

| File | Purpose |
|---|---|
| `/App.tsx` | Root component, all routes, RouteGuard wrapping |
| `/hooks/useUser.tsx` | Auth provider, canonical `User` type, `effectiveDepartment`/`effectiveRole` |
| `/hooks/useUsers.ts` | Shared hook for user-picker dropdowns (filters by dept/role/service_type) |
| `/utils/supabase/client.ts` | Supabase JS client (auto-attaches JWT to all queries) |
| `/utils/supabase/info.tsx` | `projectId` and `publicAnonKey` constants |
| `/utils/permissions.ts` | RBAC permission functions (canonical department/role values) |
| `/components/RouteGuard.tsx` | Frontend route protection by department/role |
| `/components/NeuronSidebar.tsx` | Department-gated sidebar navigation |
| `/components/Layout.tsx` | App shell (sidebar + content area) |
| `/styles/globals.css` | All design tokens, Tailwind v4 theme, typography system |
| `/supabase/migrations/*.sql` | Schema (001-003 applied), constraints (004 pending), RLS (005 pending) |

## Import Patterns

```tsx
// Supabase client (all data operations)
import { supabase } from "../utils/supabase/client";

// User context
import { useUser } from "../hooks/useUser";

// User picker dropdowns
import { useUsers } from "../hooks/useUsers";

// Toasts (version REQUIRED)
import { toast } from "sonner@2.0.3";

// Routing (NOT react-router-dom)
import { useNavigate, useParams } from "react-router";

// JSONB merge pattern (quotations, projects, bookings, evouchers have `details` column)
const { data } = await supabase.from('quotations').select('*').eq('id', id).maybeSingle();
const merged = { ...data?.details, ...data };
```

## Critical Patterns (Don't Break These)

1. **CustomDropdown portal** -- uses `createPortal` to `document.body`, `position: fixed`, `zIndex: 9999`
2. **Unified tab components** -- `UnifiedBillingsTab`, `UnifiedExpensesTab`, `UnifiedInvoicesTab`, `UnifiedCollectionsTab` are shared across many views
3. **Quotation/Contract duality** -- same `quotations` table, distinguished by `quotation_type: "contract"`
4. **Service type from booking prefix** -- `ContractDetailView.tsx` infers type from ID prefix (FWD-, BRK-, TRK-, MI-, OTH-)
5. **Neuron design system** -- stroke-based borders (not shadows), green palette (#237F66), Inter font, 13px body text
6. **Blueprint-driven workflow** -- 50+ blueprints in `/docs/blueprints/`. Read the relevant one before modifying any feature.

## Dead Code to Delete (Post-Export)

| Path | Why It's Dead |
|---|---|
| `/supabase/functions/server/` (11 files) | Edge Function doesn't exist on current Supabase project. Returns 404. All frontend calls already migrated. |
| `/components/Login.tsx` `export type UserRole` | Legacy type, zero consumers after Phase 1 fixes |
| `/context/HANDOFF_MIGRATION_GUIDE.md` | Describes how to do the migration that's already complete |
| `/context/HANDOFF_CURRENT_SITUATION.md` | Pre-migration snapshot, now superseded by `/docs/HANDOFF_ROLE_ARCHITECTURE_MIGRATION.md` |
| `/context/HANDOFF_KNOWN_BUGS.md` | Lists bugs that have been fixed (permissions.ts, Admin.tsx, EmployeesList.tsx, all fetch 404s) |

## Things to NOT Do

- Don't call or deploy Edge Functions -- the path is direct `supabase.from()` queries
- Don't use `react-router-dom` -- use `react-router`
- Don't use `react-resizable` -- use `re-resizable`
- Don't import sonner without version -- must be `"sonner@2.0.3"`
- Don't add shadows where borders are expected (Neuron design = stroke-first)
- Don't leak `SUPABASE_SERVICE_ROLE_KEY` to the frontend
- Don't modify `/components/figma/ImageWithFallback.tsx` or `/utils/supabase/info.tsx`
- Don't create a `tailwind.config.js` -- Tailwind v4 uses `@theme inline` in globals.css
