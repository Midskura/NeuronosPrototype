# TanStack Query Migration — Design Spec
**Date:** 2026-03-28
**Status:** Approved
**Scope:** Performance — caching + query consolidation

---

## Problem

Every page in Neuron OS fetches data from scratch on every render. There is no caching layer — navigating away and back triggers a full network round-trip. Many pages compound this with structural query problems: redundant parallel fetches, full-table-dumps aggregated in JavaScript, and duplicate queries for the same data within a single mount.

**Measured scope:** 252 `supabase.from()` calls across 94 files. Zero caching infrastructure.

**Root causes:**
1. All data fetching uses raw `useEffect + useState` with no deduplication or cache
2. Pages fire 4–8 queries on mount; some overlap with sibling components on the same page
3. Aggregate stats (e.g., usage counts) fetch entire tables and count in JS rather than using SQL

---

## Chosen Approach

**TanStack Query, hooks-first (Option A)**

Install `@tanstack/react-query`. Migrate the 23 shared hooks in `src/hooks/` first — they are already the right abstraction and are consumed by the majority of pages. Fix query structure in the worst-offending direct-fetch components in the same pass. Remaining direct-fetch components are migrated incrementally in Phase 4.

---

## Architecture

### 1. App Setup

`src/main.tsx` gains a `QueryClientProvider` wrapping the entire app. A single `QueryClient` instance is created with global defaults:

```ts
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,        // 30 seconds — global default
      gcTime: 5 * 60 * 1000,   // 5 minutes — unused cache retention
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});
```

React Query Devtools are mounted in development only (`import.meta.env.DEV`).

### 2. Query Key Registry

`src/lib/queryKeys.ts` — a single typed factory object. All query keys across the app are defined here. No magic strings scattered in components.

```ts
export const queryKeys = {
  catalog: {
    all:        () => ['catalog'] as const,
    items:      () => ['catalog', 'items'] as const,
    categories: () => ['catalog', 'categories'] as const,
    matrix:     () => ['catalog', 'matrix'] as const,
  },
  customers: {
    all:    () => ['customers'] as const,
    list:   () => ['customers', 'list'] as const,
    detail: (id: string) => ['customers', id] as const,
  },
  projects: {
    all:        () => ['projects'] as const,
    list:       () => ['projects', 'list'] as const,
    detail:     (id: string) => ['projects', id] as const,
    financials: (id: string) => ['projects', id, 'financials'] as const,
  },
  contracts: {
    all:        () => ['contracts'] as const,
    detail:     (id: string) => ['contracts', id] as const,
    financials: (id: string) => ['contracts', id, 'financials'] as const,
  },
  bookings: {
    all:        () => ['bookings'] as const,
    detail:     (id: string) => ['bookings', id] as const,
    financials: (id: string) => ['bookings', id, 'financials'] as const,
  },
  evouchers: {
    all:    () => ['evouchers'] as const,
    detail: (id: string) => ['evouchers', id] as const,
  },
  quotations: {
    all:    () => ['quotations'] as const,
    detail: (id: string) => ['quotations', id] as const,
  },
  contacts: {
    all:    () => ['contacts'] as const,
    detail: (id: string) => ['contacts', id] as const,
  },
  users:    { all: () => ['users'] as const },
  vendors:  { all: () => ['vendors'] as const },
  inbox:    { all: () => ['inbox'] as const, thread: (id: string) => ['inbox', id] as const },
  reports:  { all: () => ['reports'] as const },
};
```

Key hierarchy is intentional: `invalidateQueries({ queryKey: queryKeys.projects.all() })` invalidates all project queries including detail and financials sub-keys.

### 3. Hook Migration Pattern

**Before:**
```ts
const [data, setData] = useState([]);
const [isLoading, setIsLoading] = useState(true);

const fetch = useCallback(async () => {
  setIsLoading(true);
  const { data } = await supabase.from('catalog_items').select('*');
  setData(data ?? []);
  setIsLoading(false);
}, []);

useEffect(() => { fetch(); }, [fetch]);
```

**After:**
```ts
const { data = [], isLoading } = useQuery({
  queryKey: queryKeys.catalog.items(),
  queryFn: async () => {
    const { data, error } = await supabase.from('catalog_items').select('*');
    if (error) throw error;
    return data ?? [];
  },
  staleTime: 5 * 60 * 1000, // override for reference data
});
```

**Mutations:**
```ts
const queryClient = useQueryClient();
const { mutate } = useMutation({
  mutationFn: (payload) => supabase.from('catalog_items').insert(payload),
  onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.catalog.all() }),
});
```

Errors from Supabase are thrown (not swallowed) so TanStack Query's `isError` / `error` states surface correctly.

---

## Cache Configuration

| Category | Examples | `staleTime` |
|---|---|---|
| Reference / taxonomy | Catalog items, categories, customers, users, vendors | 5 min |
| Transactional lists | Bookings, projects, quotations, invoices | 30 sec (global default) |
| Financial aggregates | Container financials, P&L, aging reports | 30 sec (global default) |
| Real-time sensitive | Inbox threads | 0 (always refetch) |

Individual `useQuery` calls override `staleTime` where they deviate from the global default.

---

## Query Consolidation

These structural problems are fixed alongside the caching migration, not deferred:

### 1. Eliminate redundant parallel fetches (CatalogManagementPage)

The parent component fetches 4 stats queries; the child `ItemsTab` fetches 4 more, 2 of which overlap. After migration:
- One `useCatalogItems()` hook serves both — TanStack Query deduplicates the concurrent requests automatically
- Stats (total count, category breakdown) are derived in JS from the already-fetched item list
- Net reduction: 8 queries → 2–3 on first load, 0 network on revisit

### 2. Replace full-table-dump usage counts with SQL aggregate RPC

**Before:**
```ts
// Fetches every billing_line_items row to count in JS
supabase.from('billing_line_items').select('catalog_item_id').not('catalog_item_id', 'is', null)
```

**After — Postgres RPC `get_catalog_usage_counts()`:**
```sql
create or replace function get_catalog_usage_counts()
returns table(catalog_item_id uuid, usage_count bigint)
language sql stable as $$
  select catalog_item_id, count(*) as usage_count
  from billing_line_items
  where catalog_item_id is not null
  group by catalog_item_id;
$$;
```

Called as:
```ts
supabase.rpc('get_catalog_usage_counts')
```

Returns a handful of aggregate rows instead of the full table.

### 3. Remove duplicate within-fetch queries

`fetchAll` in `CatalogManagementPage` queries `catalog_items` twice — once with joins, once bare for per-category counts. The second query is deleted; category counts are derived from the first result's `category_id` field (already present on every row).

---

## Migration Phases

### Phase 1 — Foundation
- Install `@tanstack/react-query`
- `src/main.tsx` — `QueryClientProvider` + devtools
- `src/lib/queryKeys.ts` — full key registry

**Files touched:** 2 + 1 new

### Phase 2 — Shared hook migration (`src/hooks/`)
Migrate all 23 hooks from `useEffect+useState` to `useQuery`/`useMutation`. Pages consuming these hooks get caching automatically.

**Priority order:**
1. `useContainerFinancials` (used by Projects, Contracts, Bookings)
2. Report hooks: `useFinancialHealthReport`, `useReportsData`, `useBookingCashFlowReport`, `useCollectionsReport`, `useReceivablesAgingReport`, `useUnbilledRevenueReport`
3. Reference data hooks: `useUsers`, `useNetworkPartners`, `useTeamMembers`, `useConsignees`, `useEVouchers`
4. Utility hooks: `useInbox`, `useThread`, `useBillingMerge`, `useBookingFinancials`, `useBookingGrouping`, `useBookingRateCard`, `useContractFinancials`, `useEVoucherSubmit`, `useProjectsFinancialsMap`, `useDataScope`

**Files touched:** 23

### Phase 3 — Query consolidation in worst offenders
Fix structural problems + migrate to `useQuery` in high-call-count direct-fetch components:

| File | Current calls | Action |
|---|---|---|
| `CatalogManagementPage.tsx` | 20 | Consolidate to 2–3, add RPC for usage counts |
| `Admin.tsx` | 14 | Consolidate overlapping user/role fetches |
| `EVoucherDetailView.tsx` | 10 | Consolidate into 2–3 joined queries |
| `CustomerDetail.tsx` | 10 | Merge redundant fetches |
| `ContactDetail.tsx` | 7 | Merge redundant fetches |
| `FinancialsModule.tsx` | 4 | Migrate to useQuery |
| `PostToLedgerPanel.tsx` | 3 | Migrate to useQuery |

**Files touched:** ~8, plus 1 Supabase migration (RPC)

### Phase 4 — Remaining direct-fetch components (follow-up)
The remaining ~70 files. Panels and modals that open on user action — their cold-load cost is lower since they're not on the critical path. Migrated incrementally, no sprint deadline.

---

## Definition of Done (This Sprint)

- [ ] Phases 1–3 complete
- [ ] All 23 shared hooks use `useQuery`/`useMutation`
- [ ] `queryKeys` registry covers every entity
- [ ] Worst-offending pages consolidated (see Phase 3 table)
- [ ] `get_catalog_usage_counts` RPC deployed to Supabase
- [ ] No regression in existing functionality
- [ ] React Query Devtools visible in dev mode

---

## Files Not Touched

- `/src/components/figma/ImageWithFallback.tsx` (protected)
- `/src/utils/supabase/info.tsx` (protected)
- `/src/utils/supabase/client.ts` (no changes needed — the lock fix stays)
