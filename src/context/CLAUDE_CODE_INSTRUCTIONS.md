# Instructions for Claude Code

> **Updated**: 2026-03-15 (post-Supabase-migration, post-Figma-Make)
> **Primary handoff doc**: `/CLAUDE_HANDOFF.md` -- read that first for the full picture.

## First Steps When Starting a Session

1. **Read `/CLAUDE_HANDOFF.md`** -- project identity, tech stack, current state, key files
2. **If working on roles/permissions/RLS**, read:
   - `/docs/HANDOFF_ROLE_ARCHITECTURE_MIGRATION.md` -- full RBAC migration context
   - `/docs/USER_ROLE_ARCHITECTURE.md` -- component-to-role dependency map
3. **If working on a specific module**, read:
   - `/context/MODULE_MAP.md` -- all modules and their key files
   - The relevant blueprint in `/docs/blueprints/` (50+ files)
4. **If working on schema/database**, read:
   - `/supabase/migrations/001_full_schema.sql` through `005_rls_policies.sql`
   - `/docs/plans/SUPABASE_MIGRATION_PLAN.md`

## Current State (March 15, 2026)

### Completed
- **Supabase migration**: All 111 frontend files migrated from `fetch(API_URL/...)` to `supabase.from()`. Zero `apiFetch` consumers remain. `/utils/api.ts` and `/utils/fetchWithRetry.ts` deleted.
- **Role taxonomy fix**: `permissions.ts` uses canonical department names. `Admin.tsx` uses `rep/manager/director`. `EmployeesList.tsx` checks `director` not `Admin`. EVoucher/BudgetRequest role checks fixed.
- **useUsers hook**: Shared hook at `/hooks/useUsers.ts` for all user-picker dropdowns.
- **Route guards**: `/components/RouteGuard.tsx` wraps routes in `App.tsx` by department/role.
- **Auth**: Real Supabase Auth with auto-profile trigger, JWT auto-refresh, session persistence.

### Remaining (Manual SQL -- not code changes)
- Apply `/supabase/migrations/004_role_constraints.sql` in Supabase SQL Editor
- Apply `/supabase/migrations/005_rls_policies.sql` in Supabase SQL Editor
- Run `ALTER TABLE users DROP COLUMN IF EXISTS password;`
- Delete `/supabase/functions/server/` directory (dead Edge Function code)

### Known Fragilities
- CRM shortcode props (`"BD"`/`"PD"`) work via parent mapping but are legacy
- EVoucher `user_role` field stores department name, not role
- RLS is still permissive until `005_rls_policies.sql` is applied

## Development Workflow

This project uses a **blueprint-driven** process:

1. **Discuss** the feature with the user
2. **Create or update** a blueprint in `/docs/blueprints/` with phased implementation plan
3. **Wait for "Go Ahead"** before writing any code
4. **Implement** one phase at a time
5. **Update the blueprint** after each phase with completion status and notes
6. **Summarize** what was done and suggest next steps

## Technical Environment

### Stack
- React 18 + TypeScript + Tailwind CSS v4 (config in `/styles/globals.css`, no `tailwind.config.js`)
- Supabase (Postgres + Auth + RLS) via `/utils/supabase/client.ts`
- React Router (`react-router`, NOT `react-router-dom`)
- shadcn/ui components in `/components/ui/`
- lucide-react for icons
- `sonner@2.0.3` for toasts (version required in import)

### Key Import Patterns
```tsx
// Direct Supabase client (USE THIS for all data operations)
import { supabase } from "../utils/supabase/client";

// User context
import { useUser } from "../hooks/useUser";

// User picker dropdowns
import { useUsers } from "../hooks/useUsers";

// Toasts (version REQUIRED)
import { toast } from "sonner@2.0.3";

// Routing
import { useNavigate, useParams } from "react-router";
```

### Data Fetching Pattern
```tsx
// Fetch
const { data, error } = await supabase.from('customers').select('*');

// Fetch with joins
const { data, error } = await supabase.from('bookings')
  .select('*, projects(project_number), customers(name)')
  .eq('project_id', projectId);

// Create
const { data, error } = await supabase.from('customers').insert(payload).select().single();

// Update
const { data, error } = await supabase.from('customers').update(payload).eq('id', id);

// Delete
const { error } = await supabase.from('customers').delete().eq('id', id);
```

### JSONB Details Merge
Tables with overflow columns (quotations, projects, bookings, evouchers) store extra fields in a `details` JSONB column:
```tsx
const { data } = await supabase.from('quotations').select('*').eq('id', id).maybeSingle();
const merged = { ...data?.details, ...data };
```

## Critical Patterns to Preserve

1. **CustomDropdown portal pattern** -- uses `createPortal` to `document.body`, `position: fixed`, `zIndex: 9999`. Don't change this.
2. **Unified tab components** -- `UnifiedBillingsTab`, `UnifiedExpensesTab`, `UnifiedInvoicesTab`, `UnifiedCollectionsTab` are shared across many views.
3. **Quotation/Contract duality** -- quotations and contracts share the same table (`quotations`). Distinguished by `quotation_type: "contract"`.
4. **Service type from booking prefix** -- `ContractDetailView.tsx` infers service type from booking ID prefix (FWD-, BRK-, TRK-, MI-, OTH-).
5. **Neuron design system** -- stroke-based borders (not shadows), green palette (#237F66), Inter font, 13px body text.

## Canonical Taxonomy

```
department: 'Business Development' | 'Pricing' | 'Operations' | 'Accounting' | 'Executive' | 'HR'
role:       'rep' | 'manager' | 'director'
service_type:    'Forwarding' | 'Brokerage' | 'Trucking' | 'Marine Insurance' | 'Others'  (Operations only)
operations_role: 'Manager' | 'Supervisor' | 'Handler'  (Operations only)
```

Role hierarchy: rep (0) < manager (1) < director (2). Executive department auto-promotes to director privileges.

## Protected Files (NEVER modify)

- `/components/figma/ImageWithFallback.tsx`
- `/utils/supabase/info.tsx`

## Stale Context Files (Read With Caution)

These files were written before the Supabase migration was complete and contain outdated information:

| File | What's Stale |
|---|---|
| `/context/HANDOFF_CURRENT_SITUATION.md` | Says "all data fetches 404" -- that's fixed now |
| `/context/HANDOFF_KNOWN_BUGS.md` | Lists permissions.ts, Admin.tsx, EmployeesList bugs -- all fixed |
| `/context/HANDOFF_MIGRATION_GUIDE.md` | Describes how to do the migration -- it's already done |
| `/context/ARCHITECTURE_AND_PATTERNS.md` | References KV store -- that's been dead since migration 001 |
| `/context/CURRENT_STATE.md` | Pre-auth snapshot from March 3 -- completely obsolete |

The authoritative post-migration docs are:
- `/CLAUDE_HANDOFF.md`
- `/docs/HANDOFF_ROLE_ARCHITECTURE_MIGRATION.md`
- `/docs/plans/SUPABASE_MIGRATION_PLAN.md`

## Things to Avoid

- Don't call or deploy Edge Functions -- the path is direct `supabase.from()` queries
- Don't use `react-router-dom` -- use `react-router`
- Don't use `react-resizable` -- use `re-resizable`
- Don't import sonner without version -- must be `"sonner@2.0.3"`
- Don't add shadows where borders are expected (Neuron design system preference)
- Don't duplicate Unified tab component UI -- always reuse them with props
- Don't leak `SUPABASE_SERVICE_ROLE_KEY` to the frontend
- Don't create a `tailwind.config.js` -- Tailwind v4 uses `@theme inline` in globals.css
