# TanStack Query Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace raw `useEffect+useState` fetching and the custom `useNeuronCache` system with TanStack Query, adding a proper caching layer and fixing structural query problems in the worst-offending components.

**Architecture:** Install `@tanstack/react-query`, add `QueryClientProvider` at app root, create a typed `queryKeys` registry, then migrate hooks and components phase by phase. The existing `NeuronCacheProvider` remains in place during migration and is removed only after all `useCachedFetch` call sites are replaced.

**Tech Stack:** `@tanstack/react-query` v5, existing Supabase JS client, React 18, TypeScript

---

## Important Context

- `src/hooks/useNeuronCache.tsx` — existing custom cache with `useCachedFetch` / `useInvalidateCache`. Already used by: `useEVouchers`, `useFinancialHealthReport`, `useProjectsFinancialsMap`, `useReportsData`, plus components `BusinessDevelopment`, `ContractsModule`, all booking list components, `ProjectsModule`, `TransactionsModule`.
- `NeuronCacheProvider` is already in `App.tsx` at lines 1321-1327.
- **Protected files — never touch:** `src/components/figma/ImageWithFallback.tsx`, `src/utils/supabase/info.tsx`
- `useBillingMerge` and `useBookingGrouping` are pure computation hooks (no fetching) — skip them.
- `useBookingFinancials`, `useContractFinancials`, `useProjectFinancials` are thin wrappers over `useContainerFinancials` — they stay thin after migration.

---

## File Map

**New files:**
- `src/lib/queryKeys.ts` — typed query key factory

**Modified files (Phase 1):**
- `src/main.tsx` — add `QueryClientProvider`

**Modified files (Phase 2 — hooks):**
- `src/hooks/useUsers.ts`
- `src/hooks/useTeamMembers.ts`
- `src/hooks/useConsignees.ts`
- `src/hooks/useContainerFinancials.ts`
- `src/hooks/useDataScope.ts`
- `src/hooks/useBookingRateCard.ts`
- `src/hooks/useBookingCashFlowReport.ts`
- `src/hooks/useCollectionsReport.ts`
- `src/hooks/useReceivablesAgingReport.ts`
- `src/hooks/useUnbilledRevenueReport.ts`
- `src/hooks/useNetworkPartners.ts`
- `src/hooks/useEVouchers.ts`
- `src/hooks/useFinancialHealthReport.ts`
- `src/hooks/useProjectsFinancialsMap.ts`
- `src/hooks/useReportsData.ts`
- `src/hooks/useInbox.ts`
- `src/hooks/useThread.ts`
- `src/hooks/useEVoucherSubmit.ts`

**Modified files (Phase 3 — components):**
- `src/components/BusinessDevelopment.tsx`
- `src/components/contracts/ContractsModule.tsx`
- `src/components/operations/BrokerageBookings.tsx`
- `src/components/operations/forwarding/ForwardingBookings.tsx`
- `src/components/operations/MarineInsuranceBookings.tsx`
- `src/components/operations/OthersBookings.tsx`
- `src/components/operations/TruckingBookings.tsx`
- `src/components/projects/ProjectsModule.tsx`
- `src/components/transactions/TransactionsModule.tsx`
- `src/App.tsx` — remove `NeuronCacheProvider`
- `src/hooks/useNeuronCache.tsx` — deleted

**Modified files (Phase 3 — query consolidation):**
- `src/components/accounting/CatalogManagementPage.tsx`
- `src/components/Admin.tsx`
- `src/components/accounting/EVoucherDetailView.tsx`
- `src/components/bd/CustomerDetail.tsx`
- `src/components/bd/ContactDetail.tsx`
- `src/components/accounting/FinancialsModule.tsx`
- `src/components/accounting/PostToLedgerPanel.tsx`

**Supabase migration:**
- `src/supabase/migrations/021_catalog_taxonomy_cleanup.sql` or new `022_` — RPC `get_catalog_usage_counts`

---

## Task 1: Install TanStack Query and wrap app

**Files:**
- Modify: `package.json`
- Modify: `src/main.tsx`

- [ ] **Step 1: Install the package**

```bash
npm install @tanstack/react-query @tanstack/react-query-devtools
```

Expected: package installs without peer dependency conflicts.

- [ ] **Step 2: Update `src/main.tsx`**

Replace the full file content with:

```tsx
import * as Sentry from "@sentry/react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import App from "./App.tsx";
import "./styles/globals.css";
import { bootstrapTheme } from "./theme/themeBootstrap";

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN || "",
  environment: import.meta.env.MODE,
  enabled: !!import.meta.env.VITE_SENTRY_DSN,
  tracesSampleRate: 0.2,
});

bootstrapTheme();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 5 * 60 * 1000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

createRoot(document.getElementById("root")!).render(
  <Sentry.ErrorBoundary fallback={<SentryFallback />}>
    <QueryClientProvider client={queryClient}>
      <App />
      {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
    </QueryClientProvider>
  </Sentry.ErrorBoundary>
);

function SentryFallback() {
  return (
    <div style={{ padding: 40, textAlign: "center", fontFamily: "system-ui" }}>
      <h2 style={{ color: "var(--theme-text-primary)" }}>Something went wrong</h2>
      <p style={{ color: "var(--theme-text-muted)" }}>An unexpected error occurred. Please refresh the page.</p>
      <button
        onClick={() => window.location.reload()}
        style={{
          marginTop: 16,
          padding: "8px 24px",
          background: "var(--theme-action-primary-bg)",
          color: "var(--theme-action-primary-text)",
          border: "1px solid var(--theme-action-primary-border)",
          borderRadius: 8,
          cursor: "pointer",
        }}
      >
        Refresh
      </button>
    </div>
  );
}
```

- [ ] **Step 3: Verify app starts**

```bash
npm run dev
```

Expected: Dev server starts, app renders normally, React Query Devtools icon visible in bottom-right corner.

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json src/main.tsx
git commit -m "feat: install @tanstack/react-query and add QueryClientProvider"
```

---

## Task 2: Create query key registry

**Files:**
- Create: `src/lib/queryKeys.ts`

- [ ] **Step 1: Create `src/lib/queryKeys.ts`**

```ts
/**
 * queryKeys — Typed factory for all TanStack Query cache keys.
 *
 * Hierarchy matters: invalidating a parent key invalidates all children.
 * e.g. invalidateQueries({ queryKey: queryKeys.projects.all() })
 *      → invalidates list, detail, and financials for all projects.
 */
export const queryKeys = {
  users: {
    all: () => ["users"] as const,
    list: () => ["users", "list"] as const,
    filtered: (filters: {
      department?: string;
      role?: string;
      service_type?: string;
      operations_role?: string;
    }) => ["users", "filtered", filters] as const,
    teamMembers: (teamId: string) => ["users", "team", teamId] as const,
  },
  customers: {
    all: () => ["customers"] as const,
    list: () => ["customers", "list"] as const,
    detail: (id: string) => ["customers", id] as const,
    consignees: (customerId: string) => ["customers", customerId, "consignees"] as const,
  },
  contacts: {
    all: () => ["contacts"] as const,
    list: () => ["contacts", "list"] as const,
    detail: (id: string) => ["contacts", id] as const,
  },
  projects: {
    all: () => ["projects"] as const,
    list: () => ["projects", "list"] as const,
    detail: (id: string) => ["projects", id] as const,
    financials: (ref: string) => ["projects", ref, "financials"] as const,
  },
  contracts: {
    all: () => ["contracts"] as const,
    list: () => ["contracts", "list"] as const,
    detail: (id: string) => ["contracts", id] as const,
    financials: (ref: string) => ["contracts", ref, "financials"] as const,
    rateCard: (contractId: string) => ["contracts", contractId, "rateCard"] as const,
  },
  bookings: {
    all: () => ["bookings"] as const,
    list: (type: string) => ["bookings", "list", type] as const,
    detail: (id: string) => ["bookings", id] as const,
    financials: (ref: string) => ["bookings", ref, "financials"] as const,
  },
  evouchers: {
    all: () => ["evouchers"] as const,
    list: (view: string, userId?: string) =>
      userId ? ["evouchers", view, userId] : ["evouchers", view],
    detail: (id: string) => ["evouchers", id] as const,
  },
  quotations: {
    all: () => ["quotations"] as const,
    list: () => ["quotations", "list"] as const,
    detail: (id: string) => ["quotations", id] as const,
  },
  catalog: {
    all: () => ["catalog"] as const,
    items: () => ["catalog", "items"] as const,
    categories: () => ["catalog", "categories"] as const,
    usageCounts: () => ["catalog", "usageCounts"] as const,
    matrix: () => ["catalog", "matrix"] as const,
  },
  vendors: {
    all: () => ["vendors"] as const,
    list: () => ["vendors", "list"] as const,
    detail: (id: string) => ["vendors", id] as const,
  },
  networkPartners: {
    all: () => ["networkPartners"] as const,
    list: () => ["networkPartners", "list"] as const,
    detail: (id: string) => ["networkPartners", id] as const,
  },
  inbox: {
    all: () => ["inbox"] as const,
    list: () => ["inbox", "list"] as const,
    thread: (id: string) => ["inbox", "thread", id] as const,
  },
  transactions: {
    all: () => ["transactions"] as const,
    accounts: () => ["transactions", "accounts"] as const,
    list: () => ["transactions", "list"] as const,
    settings: () => ["transactions", "settings"] as const,
  },
  financials: {
    container: (type: string, ref: string, bookingIds: string[]) =>
      ["financials", type, ref, bookingIds.sort().join(",")] as const,
    health: () => ["financials", "health"] as const,
    projectsMap: () => ["financials", "projectsMap"] as const,
    reportsData: () => ["financials", "reportsData"] as const,
    bookingCashFlow: (filters: Record<string, unknown>) =>
      ["financials", "bookingCashFlow", filters] as const,
    collectionsReport: (filters: Record<string, unknown>) =>
      ["financials", "collectionsReport", filters] as const,
    receivablesAging: (filters: Record<string, unknown>) =>
      ["financials", "receivablesAging", filters] as const,
    unbilledRevenue: (filters: Record<string, unknown>) =>
      ["financials", "unbilledRevenue", filters] as const,
  },
  dataScope: {
    user: (userId: string) => ["dataScope", userId] as const,
  },
};
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npm run typecheck
```

Expected: No errors in `src/lib/queryKeys.ts`.

- [ ] **Step 3: Commit**

```bash
git add src/lib/queryKeys.ts
git commit -m "feat: add typed TanStack Query key registry"
```

---

## Task 3: Migrate useUsers and useTeamMembers

**Files:**
- Modify: `src/hooks/useUsers.ts`
- Modify: `src/hooks/useTeamMembers.ts`

- [ ] **Step 1: Replace `src/hooks/useUsers.ts`**

```ts
import { useQuery } from "@tanstack/react-query";
import { supabase } from "../utils/supabase/client";
import { queryKeys } from "../lib/queryKeys";
import type { User } from "./useUser";

export interface UseUsersOptions {
  department?: User["department"];
  role?: User["role"];
  service_type?: User["service_type"];
  operations_role?: User["operations_role"];
  enabled?: boolean;
}

export interface UseUsersResult {
  users: User[];
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useUsers(options: UseUsersOptions = {}): UseUsersResult {
  const { department, role, service_type, operations_role, enabled = true } = options;

  const { data: users = [], isLoading, error, refetch } = useQuery({
    queryKey: queryKeys.users.filtered({ department, role, service_type, operations_role }),
    queryFn: async () => {
      let query = supabase
        .from("users")
        .select("id, name, email, department, role, is_active, service_type, operations_role, created_at")
        .eq("is_active", true)
        .order("name", { ascending: true });

      if (department) query = query.eq("department", department);
      if (role) query = query.eq("role", role);
      if (service_type) query = query.eq("service_type", service_type);
      if (operations_role) query = query.eq("operations_role", operations_role);

      const { data, error: queryError } = await query;
      if (queryError) throw queryError;
      return (data as User[]) || [];
    },
    enabled,
    staleTime: 5 * 60 * 1000,
  });

  return {
    users,
    isLoading,
    error: error ? (error as Error).message : null,
    refetch: () => { refetch(); },
  };
}
```

- [ ] **Step 2: Replace `src/hooks/useTeamMembers.ts`**

```ts
import { useQuery } from "@tanstack/react-query";
import { supabase } from "../utils/supabase/client";
import { queryKeys } from "../lib/queryKeys";

export function useTeamMembers(teamId: string | null | undefined): {
  memberIds: string[];
  isLoading: boolean;
} {
  const { data: memberIds = [], isLoading } = useQuery({
    queryKey: queryKeys.users.teamMembers(teamId ?? ""),
    queryFn: async () => {
      const { data } = await supabase
        .from("users")
        .select("id")
        .eq("team_id", teamId!)
        .eq("is_active", true);
      return data?.map((u) => u.id) ?? [];
    },
    enabled: !!teamId,
    staleTime: 5 * 60 * 1000,
  });

  return { memberIds, isLoading };
}
```

- [ ] **Step 3: Typecheck**

```bash
npm run typecheck
```

Expected: No new errors.

- [ ] **Step 4: Commit**

```bash
git add src/hooks/useUsers.ts src/hooks/useTeamMembers.ts
git commit -m "feat(query): migrate useUsers and useTeamMembers to useQuery"
```

---

## Task 4: Migrate useConsignees

**Files:**
- Modify: `src/hooks/useConsignees.ts`

- [ ] **Step 1: Replace `src/hooks/useConsignees.ts`**

```ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Consignee } from "../types/bd";
import { supabase } from "../utils/supabase/client";
import { queryKeys } from "../lib/queryKeys";

export function useConsignees(customerId?: string) {
  const queryClient = useQueryClient();
  const qKey = queryKeys.customers.consignees(customerId ?? "");

  const { data: consignees = [], isLoading, error } = useQuery({
    queryKey: qKey,
    queryFn: async () => {
      const { data, error: fetchErr } = await supabase
        .from("consignees")
        .select("*")
        .eq("customer_id", customerId!);
      if (fetchErr) throw fetchErr;
      return (data || []) as Consignee[];
    },
    enabled: !!customerId,
    staleTime: 5 * 60 * 1000,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: qKey });

  const createMutation = useMutation({
    mutationFn: async (data: Partial<Consignee>) => {
      const payload = { ...data, customer_id: customerId };
      const { data: created, error } = await supabase
        .from("consignees")
        .insert(payload)
        .select()
        .single();
      if (error) throw new Error(error.message);
      return created as Consignee;
    },
    onSuccess: invalidate,
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Consignee> }) => {
      const { data: updated, error } = await supabase
        .from("consignees")
        .update(data)
        .eq("id", id)
        .select()
        .single();
      if (error) throw new Error(error.message);
      return updated as Consignee;
    },
    onSuccess: invalidate,
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("consignees").delete().eq("id", id);
      if (error) throw new Error(error.message);
    },
    onSuccess: invalidate,
  });

  return {
    consignees,
    isLoading,
    error: error ? (error as Error).message : null,
    fetchConsignees: invalidate,
    createConsignee: (data: Partial<Consignee>) => createMutation.mutateAsync(data),
    updateConsignee: (id: string, data: Partial<Consignee>) =>
      updateMutation.mutateAsync({ id, data }),
    deleteConsignee: (id: string) => deleteMutation.mutateAsync(id),
  };
}
```

- [ ] **Step 2: Typecheck**

```bash
npm run typecheck
```

Expected: No new errors.

- [ ] **Step 3: Commit**

```bash
git add src/hooks/useConsignees.ts
git commit -m "feat(query): migrate useConsignees to useQuery + useMutation"
```

---

## Task 5: Migrate useContainerFinancials

This is the highest-impact hook — it's used by every financial view. The current version fetches entire tables with no WHERE clauses and filters in JavaScript. This task adds scoped WHERE clauses to reduce data transferred.

**Files:**
- Modify: `src/hooks/useContainerFinancials.ts`

- [ ] **Step 1: Replace `src/hooks/useContainerFinancials.ts`**

```ts
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";
import { supabase } from "../utils/supabase/client";
import { queryKeys } from "../lib/queryKeys";
import {
  calculateFinancialTotals,
  convertQuotationToVirtualItems,
  mergeBillableExpenses,
  mergeVirtualItemsWithRealItems,
} from "../utils/financialCalculations";
import {
  collectLinkedBookingIds,
  filterBillingItemsForScope,
  filterCollectionsForScope,
  filterInvoicesForScope,
  mapEvoucherExpensesForScope,
  mapExpenseRowsForScope,
} from "../utils/financialSelectors";
import type { FinancialData } from "./financialData";
import { toast } from "../components/ui/toast-utils";

interface UseContainerFinancialsOptions {
  containerType: "project" | "contract" | "booking";
  containerReference?: string;
  linkedBookings?: Array<string | { bookingId?: string; id?: string }>;
  quotationId?: string;
  includeQuotationVirtualItems?: boolean;
  expenseSource?: "expenses" | "evouchers";
}

export function useContainerFinancials({
  containerType,
  containerReference,
  linkedBookings = [],
  quotationId,
  includeQuotationVirtualItems = false,
  expenseSource = "expenses",
}: UseContainerFinancialsOptions): FinancialData {
  const queryClient = useQueryClient();

  const linkedBookingIds = useMemo(
    () => collectLinkedBookingIds(linkedBookings),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [JSON.stringify(linkedBookings)],
  );

  const hasScope = !!containerReference || linkedBookingIds.length > 0;

  const qKey = queryKeys.financials.container(
    containerType,
    containerReference ?? "",
    linkedBookingIds,
  );

  const { data, isLoading } = useQuery({
    queryKey: qKey,
    queryFn: async () => {
      const expenseTable = expenseSource === "evouchers" ? "evouchers" : "expenses";

      // Build OR filter for scoped fetches — reduces data over the wire.
      // JS filter functions below handle edge cases (array fields, legacy column names).
      const scopeFilter = buildScopeFilter(linkedBookingIds, containerReference);

      const [
        { data: invoiceRows, error: invoiceErr },
        { data: billingItemRows, error: billingErr },
        { data: expenseRows, error: expenseErr },
        { data: collectionRows, error: collectionErr },
        quotationResult,
      ] = await Promise.all([
        supabase.from("invoices").select("*").or(scopeFilter),
        supabase.from("billing_line_items").select("*").or(scopeFilter),
        supabase.from(expenseTable).select("*").or(scopeFilter),
        supabase.from("collections").select("*"),
        includeQuotationVirtualItems && quotationId
          ? supabase.from("quotations").select("*").eq("id", quotationId).maybeSingle()
          : Promise.resolve({ data: null, error: null }),
      ]);

      if (invoiceErr) console.error("invoices fetch error:", invoiceErr);
      if (billingErr) console.error("billing_line_items fetch error:", billingErr);
      if (expenseErr) console.error(`${expenseTable} fetch error:`, expenseErr);

      const filteredInvoices = !invoiceErr && invoiceRows
        ? filterInvoicesForScope(invoiceRows, linkedBookingIds, containerReference)
        : [];

      const mappedExpenses = !expenseErr && expenseRows
        ? expenseSource === "evouchers"
          ? mapEvoucherExpensesForScope(expenseRows, linkedBookingIds, containerReference)
          : mapExpenseRowsForScope(expenseRows, linkedBookingIds, containerReference)
        : [];

      let filteredBillingItems = !billingErr && billingItemRows
        ? filterBillingItemsForScope(billingItemRows, linkedBookingIds, containerReference)
        : [];

      if (includeQuotationVirtualItems && quotationResult.data) {
        const virtualItems = convertQuotationToVirtualItems(
          quotationResult.data,
          containerReference || "",
        );
        filteredBillingItems = mergeVirtualItemsWithRealItems(filteredBillingItems, virtualItems);
      }

      const mergedBillingItems = mergeBillableExpenses(filteredBillingItems, mappedExpenses);
      const filteredCollections = !collectionErr && collectionRows
        ? filterCollectionsForScope(
            collectionRows,
            filteredInvoices.map((invoice: any) => invoice.id).filter(Boolean),
            containerReference,
          )
        : [];

      return { filteredInvoices, mergedBillingItems, mappedExpenses, filteredCollections };
    },
    enabled: hasScope,
    staleTime: 30_000,
  });

  const totals = useMemo(
    () => calculateFinancialTotals(
      data?.filteredInvoices ?? [],
      data?.mergedBillingItems ?? [],
      data?.mappedExpenses ?? [],
      data?.filteredCollections ?? [],
    ),
    [data],
  );

  return {
    invoices: data?.filteredInvoices ?? [],
    billingItems: data?.mergedBillingItems ?? [],
    expenses: data?.mappedExpenses ?? [],
    collections: data?.filteredCollections ?? [],
    isLoading,
    refresh: () => queryClient.invalidateQueries({ queryKey: qKey }),
    totals,
  };
}

/**
 * Builds a Supabase `.or()` filter string to scope queries by booking IDs
 * and container reference — reduces rows fetched vs. full-table scans.
 */
function buildScopeFilter(bookingIds: string[], containerRef?: string): string {
  const parts: string[] = [];

  if (bookingIds.length > 0) {
    // booking_id matches any of the linked booking IDs
    bookingIds.forEach((id) => parts.push(`booking_id.eq.${id}`));
    bookingIds.forEach((id) => parts.push(`source_booking_id.eq.${id}`));
  }

  if (containerRef) {
    parts.push(`project_number.eq.${containerRef}`);
    parts.push(`contract_number.eq.${containerRef}`);
    parts.push(`quotation_number.eq.${containerRef}`);
  }

  // Fallback: if no scope, return a filter that matches nothing rather than everything.
  // The `enabled: hasScope` guard in useQuery prevents this from being called,
  // but this is a safety net.
  return parts.length > 0 ? parts.join(",") : "id.is.null";
}
```

- [ ] **Step 2: Typecheck**

```bash
npm run typecheck
```

Expected: No new errors.

- [ ] **Step 3: Run dev server and navigate to a project financial tab**

```bash
npm run dev
```

Open a project → Financial Overview tab. Verify numbers render correctly. Check React Query Devtools to confirm one `["financials", ...]` query fires (not multiple).

- [ ] **Step 4: Commit**

```bash
git add src/hooks/useContainerFinancials.ts
git commit -m "feat(query): migrate useContainerFinancials to useQuery with scoped WHERE clauses"
```

---

## Task 6: Migrate useDataScope

**Files:**
- Modify: `src/hooks/useDataScope.ts`

- [ ] **Step 1: Read the full current file**

Read `src/hooks/useDataScope.ts` — it fetches `permission_overrides`, `users` (dept peers), `teams` members. The `useQuery` version caches by user ID.

- [ ] **Step 2: Replace `src/hooks/useDataScope.ts`**

```ts
import { useQuery } from "@tanstack/react-query";
import { supabase } from "../utils/supabase/client";
import { useUser } from "./useUser";
import { queryKeys } from "../lib/queryKeys";

export type DataScope =
  | { type: "all" }
  | { type: "userIds"; ids: string[] }
  | { type: "own"; userId: string };

export interface DataScopeResult {
  scope: DataScope;
  isLoaded: boolean;
}

export function useDataScope(): DataScopeResult {
  const { user, effectiveDepartment, effectiveRole } = useUser();

  const { data: scope = { type: "all" as const }, isLoading } = useQuery({
    queryKey: queryKeys.dataScope.user(user?.id ?? ""),
    queryFn: async (): Promise<DataScope> => {
      if (!user) return { type: "own", userId: "" };

      if (effectiveDepartment === "Executive") return { type: "all" };

      // Check permission_override
      const { data: override } = await supabase
        .from("permission_overrides")
        .select("scope, departments")
        .eq("user_id", user.id)
        .maybeSingle();

      if (override) {
        if (override.scope === "full") return { type: "all" };
        if (override.scope === "department" && Array.isArray(override.departments)) {
          const { data: deptUsers } = await supabase
            .from("users")
            .select("id")
            .in("department", override.departments)
            .eq("is_active", true);
          return { type: "userIds", ids: deptUsers?.map((u) => u.id) ?? [] };
        }
      }

      // Manager → all peers in same department
      if (effectiveRole === "manager" || effectiveRole === "director") {
        const { data: peers } = await supabase
          .from("users")
          .select("id")
          .eq("department", user.department)
          .eq("is_active", true);
        return { type: "userIds", ids: peers?.map((u) => u.id) ?? [] };
      }

      // team_leader → team members
      if (user.is_team_leader && user.team_id) {
        const { data: members } = await supabase
          .from("users")
          .select("id")
          .eq("team_id", user.team_id)
          .eq("is_active", true);
        return { type: "userIds", ids: members?.map((u) => u.id) ?? [] };
      }

      return { type: "own", userId: user.id };
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  });

  return { scope, isLoaded: !isLoading };
}
```

- [ ] **Step 3: Typecheck**

```bash
npm run typecheck
```

Expected: No new errors. If `user.is_team_leader` or `user.team_id` don't exist on the User type, check the `useUser` hook's User type and align field names.

- [ ] **Step 4: Commit**

```bash
git add src/hooks/useDataScope.ts
git commit -m "feat(query): migrate useDataScope to useQuery"
```

---

## Task 7: Migrate useBookingRateCard

**Files:**
- Modify: `src/hooks/useBookingRateCard.ts`

- [ ] **Step 1: Read the full current file**

Read `src/hooks/useBookingRateCard.ts` — it fetches a `quotations` row by `contract_id`, extracts `rate_matrices` from `details` JSONB.

- [ ] **Step 2: Replace the fetch logic in `src/hooks/useBookingRateCard.ts`**

Replace the `useState` + `useEffect` + `useCallback` block with:

```ts
import { useQuery } from "@tanstack/react-query";
import { supabase } from "../utils/supabase/client";
import { queryKeys } from "../lib/queryKeys";
import type { ContractRateMatrix } from "../types/pricing";

export interface BookingRateCardData {
  rateMatrices: ContractRateMatrix[];
  isLoading: boolean;
  isContractBooking: boolean;
  contractId: string;
  contractNumber: string;
  customerName: string;
  currency: string;
}

export function useBookingRateCard(contractId?: string): BookingRateCardData {
  const { data, isLoading } = useQuery({
    queryKey: queryKeys.contracts.rateCard(contractId ?? ""),
    queryFn: async () => {
      const { data: row, error } = await supabase
        .from("quotations")
        .select("*")
        .eq("id", contractId!)
        .maybeSingle();

      if (error) throw error;
      if (!row) return null;

      const merged = { ...row.details, ...row };
      return {
        rateMatrices: (merged.rate_matrices ?? []) as ContractRateMatrix[],
        contractNumber: merged.quote_number ?? merged.quotation_number ?? "",
        customerName: merged.customer_name ?? "",
        currency: merged.currency ?? "PHP",
      };
    },
    enabled: !!contractId,
    staleTime: 5 * 60 * 1000,
  });

  return {
    rateMatrices: data?.rateMatrices ?? [],
    isLoading,
    isContractBooking: !!contractId,
    contractId: contractId ?? "",
    contractNumber: data?.contractNumber ?? "",
    customerName: data?.customerName ?? "",
    currency: data?.currency ?? "PHP",
  };
}
```

- [ ] **Step 3: Typecheck**

```bash
npm run typecheck
```

- [ ] **Step 4: Commit**

```bash
git add src/hooks/useBookingRateCard.ts
git commit -m "feat(query): migrate useBookingRateCard to useQuery"
```

---

## Task 8: Migrate report hooks

Four report hooks share the same pattern: fetch raw data in parallel, return arrays + isLoading + refresh. Migrate all four.

**Files:**
- Modify: `src/hooks/useBookingCashFlowReport.ts`
- Modify: `src/hooks/useCollectionsReport.ts`
- Modify: `src/hooks/useReceivablesAgingReport.ts`
- Modify: `src/hooks/useUnbilledRevenueReport.ts`

- [ ] **Step 1: Read each of the four files**

Read each file in full to understand their signatures and fetch logic before replacing.

- [ ] **Step 2: For each report hook, apply this migration pattern**

The pattern (shown here for `useBookingCashFlowReport` — repeat for the other three using their actual queryFn logic):

```ts
// Before: const [data, setData] = useState(...); useEffect(() => { fetch... }, [deps]);
// After:
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "../lib/queryKeys";

// Keep all existing filter params as the hook's arguments.
// Pass them as the query key so different filter combos cache independently.
export function useBookingCashFlowReport(filters: { /* existing params */ }) {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.financials.bookingCashFlow(filters),
    queryFn: async () => {
      // ← paste the existing fetch logic here verbatim, returning the data object
    },
    staleTime: 30_000,
  });

  return {
    // spread existing return shape from data ?? defaults,
    isLoading,
    refresh: () => queryClient.invalidateQueries({ queryKey: queryKeys.financials.reportsData() }),
  };
}
```

Apply the same transformation to `useCollectionsReport` (use `queryKeys.financials.collectionsReport`), `useReceivablesAgingReport` (use `queryKeys.financials.receivablesAging`), and `useUnbilledRevenueReport` (use `queryKeys.financials.unbilledRevenue`).

- [ ] **Step 3: Typecheck**

```bash
npm run typecheck
```

Expected: No new errors.

- [ ] **Step 4: Commit**

```bash
git add src/hooks/useBookingCashFlowReport.ts src/hooks/useCollectionsReport.ts src/hooks/useReceivablesAgingReport.ts src/hooks/useUnbilledRevenueReport.ts
git commit -m "feat(query): migrate four report hooks to useQuery"
```

---

## Task 9: Migrate hooks currently on useCachedFetch

These hooks already have caching via `useNeuronCache`. Migrate them to `useQuery` so `useNeuronCache` can be removed.

**Files:**
- Modify: `src/hooks/useEVouchers.ts`
- Modify: `src/hooks/useFinancialHealthReport.ts`
- Modify: `src/hooks/useProjectsFinancialsMap.ts`
- Modify: `src/hooks/useReportsData.ts`
- Modify: `src/hooks/useNetworkPartners.ts`

- [ ] **Step 1: Read each file before modifying**

Read each of the five files. Note their existing `cacheKey` strings, `fetcher` functions, and return shapes.

- [ ] **Step 2: Replace `src/hooks/useEVouchers.ts`**

```ts
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import { supabase } from "../utils/supabase/client";
import { queryKeys } from "../lib/queryKeys";
import type { EVoucher } from "../types/evoucher";

type EVoucherView = "pending" | "my-evouchers" | "all";

export function useEVouchers(view: EVoucherView, userId?: string) {
  const queryClient = useQueryClient();

  const { data: evouchers = [], isLoading } = useQuery({
    queryKey: queryKeys.evouchers.list(view, userId),
    queryFn: async (): Promise<EVoucher[]> => {
      let query = supabase.from("evouchers").select("*").order("created_at", { ascending: false });

      if (view === "pending") {
        query = query.in("status", ["pending", "Pending"]);
      } else if (view === "my-evouchers" && userId) {
        query = query.eq("requestor_id", userId);
      } else if (view === "my-evouchers" && !userId) {
        return [];
      }

      const { data, error } = await query;
      if (error) throw new Error(`Failed to fetch ${view} e-vouchers: ${error.message}`);

      return (data || []).filter(
        (item) => item.transaction_type !== "collection" && item.transaction_type !== "billing",
      );
    },
    staleTime: 30_000,
  });

  const refresh = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: queryKeys.evouchers.all() });
  }, [queryClient]);

  return { evouchers, isLoading, refresh };
}
```

- [ ] **Step 3: Migrate `useFinancialHealthReport`, `useProjectsFinancialsMap`, `useReportsData`**

For each: remove `useCachedFetch` import, import `useQuery` + `queryKeys`, wrap the existing fetcher function as the `queryFn`, use the corresponding `queryKeys.financials.*` key. Keep all return shapes identical.

- [ ] **Step 4: Read and migrate `useNetworkPartners.ts`**

Read the full file. It has CRUD operations (create, update, delete, seed). Replace the fetch with `useQuery` using `queryKeys.networkPartners.list()` and mutations with `useMutation` + `onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.networkPartners.all() })`.

- [ ] **Step 5: Typecheck**

```bash
npm run typecheck
```

- [ ] **Step 6: Commit**

```bash
git add src/hooks/useEVouchers.ts src/hooks/useFinancialHealthReport.ts src/hooks/useProjectsFinancialsMap.ts src/hooks/useReportsData.ts src/hooks/useNetworkPartners.ts
git commit -m "feat(query): migrate remaining hooks from useCachedFetch to useQuery"
```

---

## Task 10: Migrate useInbox, useThread, useEVoucherSubmit

**Files:**
- Modify: `src/hooks/useInbox.ts`
- Modify: `src/hooks/useThread.ts`
- Modify: `src/hooks/useEVoucherSubmit.ts`

- [ ] **Step 1: Read all three files in full**

Read `useInbox.ts`, `useThread.ts`, `useEVoucherSubmit.ts`.

- [ ] **Step 2: Migrate `useInbox.ts` to `useQuery`**

Inbox is real-time sensitive. Use `staleTime: 0` so it always refetches on mount. Keep all existing filter params and pass them as the query key.

```ts
// Key pattern:
queryKey: queryKeys.inbox.list(),
staleTime: 0, // always fresh
```

- [ ] **Step 3: Migrate `useThread.ts` to `useQuery`**

```ts
queryKey: queryKeys.inbox.thread(threadId),
staleTime: 0,
enabled: !!threadId,
```

- [ ] **Step 4: Migrate `useEVoucherSubmit.ts` to `useMutation`**

`useEVoucherSubmit` is mutation-only (no reads). Replace the internal `useState([isSaving, error])` with `useMutation`. Keep the same returned `submit` / `submitEVoucher` function signature so callers don't change.

```ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "../lib/queryKeys";

export function useEVoucherSubmit(context = "bd") {
  const queryClient = useQueryClient();

  const { mutateAsync, isPending: isSaving, error } = useMutation({
    mutationFn: async (data: EVoucherData) => {
      // ← paste existing submit logic here verbatim
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.evouchers.all() });
    },
  });

  return {
    isSaving,
    error: error ? (error as Error).message : null,
    submitEVoucher: mutateAsync,
  };
}
```

- [ ] **Step 5: Typecheck**

```bash
npm run typecheck
```

- [ ] **Step 6: Commit**

```bash
git add src/hooks/useInbox.ts src/hooks/useThread.ts src/hooks/useEVoucherSubmit.ts
git commit -m "feat(query): migrate useInbox, useThread, useEVoucherSubmit"
```

---

## Task 11: Migrate components off useCachedFetch

Nine components use `useCachedFetch` directly (not through a hook). Migrate each to `useQuery`.

**Files:**
- Modify: `src/components/BusinessDevelopment.tsx`
- Modify: `src/components/contracts/ContractsModule.tsx`
- Modify: `src/components/operations/BrokerageBookings.tsx`
- Modify: `src/components/operations/forwarding/ForwardingBookings.tsx`
- Modify: `src/components/operations/MarineInsuranceBookings.tsx`
- Modify: `src/components/operations/OthersBookings.tsx`
- Modify: `src/components/operations/TruckingBookings.tsx`
- Modify: `src/components/projects/ProjectsModule.tsx`
- Modify: `src/components/transactions/TransactionsModule.tsx`

- [ ] **Step 1: Read each file before modifying**

Read all nine files. Note their `cacheKey` strings, fetcher logic, mutation/invalidation patterns.

- [ ] **Step 2: For each component, apply this transformation**

Pattern (shown for one booking list — repeat for all nine):

```ts
// Remove: useCachedFetch, useInvalidateCache imports from useNeuronCache
// Add: import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
//       import { queryKeys } from "../../lib/queryKeys";  (adjust relative path)

// Replace:
//   const invalidateCache = useInvalidateCache();
//   const { data: rawBookings, isLoading, refresh: fetchBookings } = useCachedFetch<T>("key", fetcher, []);
// With:
const queryClient = useQueryClient();
const { data: rawBookings = [], isLoading } = useQuery({
  queryKey: queryKeys.bookings.list("brokerage"), // use the appropriate key per component
  queryFn: fetcherFunction,                        // existing fetcher logic as queryFn
  staleTime: 30_000,
});
const fetchBookings = () =>
  queryClient.invalidateQueries({ queryKey: queryKeys.bookings.list("brokerage") });
```

Apply the same pattern to each component. Use the correct `queryKeys.*` for each:
- `BusinessDevelopment` → `queryKeys.quotations.list()`, `queryKeys.projects.list()`
- `ContractsModule` → `queryKeys.contracts.list()`
- `BrokerageBookings` → `queryKeys.bookings.list("brokerage")`
- `ForwardingBookings` → `queryKeys.bookings.list("forwarding")`
- `MarineInsuranceBookings` → `queryKeys.bookings.list("marine")`
- `OthersBookings` → `queryKeys.bookings.list("others")`
- `TruckingBookings` → `queryKeys.bookings.list("trucking")`
- `ProjectsModule` → `queryKeys.projects.list()`
- `TransactionsModule` → `queryKeys.transactions.accounts()`, `queryKeys.transactions.list()`, `queryKeys.transactions.settings()`

- [ ] **Step 3: Typecheck**

```bash
npm run typecheck
```

- [ ] **Step 4: Commit**

```bash
git add src/components/BusinessDevelopment.tsx src/components/contracts/ContractsModule.tsx src/components/operations/BrokerageBookings.tsx src/components/operations/forwarding/ForwardingBookings.tsx src/components/operations/MarineInsuranceBookings.tsx src/components/operations/OthersBookings.tsx src/components/operations/TruckingBookings.tsx src/components/projects/ProjectsModule.tsx src/components/transactions/TransactionsModule.tsx
git commit -m "feat(query): migrate booking list and module components to useQuery"
```

---

## Task 12: Remove useNeuronCache

Now that all call sites are migrated, delete the custom cache.

**Files:**
- Modify: `src/App.tsx` — remove `NeuronCacheProvider`
- Delete: `src/hooks/useNeuronCache.tsx`

- [ ] **Step 1: Verify no remaining useCachedFetch/useInvalidateCache imports**

```bash
grep -r "useCachedFetch\|useInvalidateCache\|NeuronCacheProvider\|useNeuronCache" src/ --include="*.ts" --include="*.tsx"
```

Expected: Zero results. If any appear, go back and migrate those call sites before proceeding.

- [ ] **Step 2: Remove NeuronCacheProvider from App.tsx**

In `src/App.tsx`, find and remove:
- The import: `import { NeuronCacheProvider } from "./hooks/useNeuronCache";`
- The JSX wrapper `<NeuronCacheProvider>` and its closing tag (lines ~1321-1327)

Leave all children in place.

- [ ] **Step 3: Delete useNeuronCache.tsx**

```bash
rm src/hooks/useNeuronCache.tsx
```

- [ ] **Step 4: Typecheck**

```bash
npm run typecheck
```

Expected: No errors referencing `useNeuronCache`.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "refactor: remove useNeuronCache — replaced by TanStack Query"
```

---

## Task 13: Add get_catalog_usage_counts RPC

Before fixing CatalogManagementPage, add the Postgres function that replaces the full-table dump.

**Files:**
- Create or append: `src/supabase/migrations/022_catalog_usage_counts_rpc.sql`

- [ ] **Step 1: Create the migration file**

```sql
-- 022_catalog_usage_counts_rpc.sql
-- Aggregate usage counts for catalog items across billing_line_items.
-- Replaces full-table fetch + JS count in CatalogManagementPage.

create or replace function get_catalog_usage_counts()
returns table(catalog_item_id uuid, usage_count bigint)
language sql
stable
security definer
as $$
  select catalog_item_id, count(*) as usage_count
  from billing_line_items
  where catalog_item_id is not null
  group by catalog_item_id;
$$;
```

- [ ] **Step 2: Apply in Supabase SQL Editor**

Open the Supabase dashboard → SQL Editor → paste and run the contents of `022_catalog_usage_counts_rpc.sql`.

Expected: Function created successfully, no errors.

- [ ] **Step 3: Test the RPC**

In the SQL Editor, run:

```sql
select * from get_catalog_usage_counts() limit 10;
```

Expected: Returns rows with `catalog_item_id` and `usage_count`. If catalog has no linked billing lines yet, returns zero rows (not an error).

- [ ] **Step 4: Commit the migration file**

```bash
git add src/supabase/migrations/022_catalog_usage_counts_rpc.sql
git commit -m "feat(db): add get_catalog_usage_counts RPC for billing line item aggregation"
```

---

## Task 14: Fix CatalogManagementPage

Consolidate 8 queries → 3, replace full-table dump with RPC.

**Files:**
- Modify: `src/components/accounting/CatalogManagementPage.tsx`

- [ ] **Step 1: Read the full current file**

Read `src/components/accounting/CatalogManagementPage.tsx` — understand the current `fetchStats` (parent, 4 queries) and `fetchAll` in `ItemsTab` (4 queries).

- [ ] **Step 2: Replace the three data-fetching useQuery blocks**

Add these three `useQuery` calls to `ItemsTab`, removing `fetchStats` from the parent and both `fetchAll`/`fetchStats` callbacks:

```ts
import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "../../lib/queryKeys";

// In ItemsTab:

// Query 1: catalog items with category join
const { data: items = [], isLoading: itemsLoading } = useQuery({
  queryKey: queryKeys.catalog.items(),
  queryFn: async () => {
    const { data, error } = await supabase
      .from("catalog_items")
      .select("id, name, category_id, created_at, updated_at, catalog_categories(name)")
      .order("name");
    if (error) throw error;
    return (data ?? []).map((i: any) => ({
      id: i.id,
      name: i.name,
      category_id: i.category_id,
      category_name: i.catalog_categories?.name ?? null,
      created_at: i.created_at,
      updated_at: i.updated_at,
    })) as CatalogItem[];
  },
  staleTime: 5 * 60 * 1000,
});

// Query 2: categories
const { data: categories = [] } = useQuery({
  queryKey: queryKeys.catalog.categories(),
  queryFn: async () => {
    const { data, error } = await supabase
      .from("catalog_categories")
      .select("*")
      .order("sort_order");
    if (error) throw error;
    return data ?? [];
  },
  staleTime: 5 * 60 * 1000,
});

// Query 3: usage counts via RPC (replaces full billing_line_items fetch)
const { data: usageRows = [] } = useQuery({
  queryKey: queryKeys.catalog.usageCounts(),
  queryFn: async () => {
    const { data, error } = await supabase.rpc("get_catalog_usage_counts");
    if (error) throw error;
    return data ?? [];
  },
  staleTime: 5 * 60 * 1000,
});

// Derive usageCounts map and stats from fetched data (no extra queries)
const usageCounts = useMemo(() => {
  const map: Record<string, number> = {};
  for (const row of usageRows) {
    if (row.catalog_item_id) map[row.catalog_item_id] = Number(row.usage_count);
  }
  return map;
}, [usageRows]);

const stats = useMemo(() => {
  const catCountMap: Record<string, number> = {};
  for (const item of items) {
    if (item.category_id) catCountMap[item.category_id] = (catCountMap[item.category_id] ?? 0) + 1;
  }
  const totalBilling = usageRows.reduce((sum, r) => sum + Number(r.usage_count), 0);
  const linkedBilling = totalBilling; // all rows in usageRows are linked
  return {
    totalItems: items.length,
    categories: categories.length,
    linkedPct: totalBilling > 0 ? Math.round((linkedBilling / totalBilling) * 100) : null,
    catCountMap,
  };
}, [items, categories, usageRows]);

const isLoading = itemsLoading;
```

- [ ] **Step 3: Update categories to include item_count derived from stats**

```ts
const categoriesWithCount = useMemo(
  () => categories.map((c: any) => ({ ...c, item_count: stats.catCountMap[c.id] ?? 0 })),
  [categories, stats.catCountMap],
);
```

- [ ] **Step 4: Remove parent `fetchStats` + `statsLoading` state entirely**

The parent `CatalogManagementPage` no longer needs `fetchStats`, `stats`, or `statsLoading`. The stats bar renders data derived from `items`/`categories`/`usageRows` which now live in `ItemsTab`. Move the stats bar JSX inside `ItemsTab` (above the search row), removing the `onMutate` prop from `ItemsTab` since mutations now invalidate via `queryClient` directly.

- [ ] **Step 5: Update mutations to invalidate catalog keys**

```ts
const queryClient = useQueryClient();
// After any insert/update/delete on catalog_items or catalog_categories:
queryClient.invalidateQueries({ queryKey: queryKeys.catalog.all() });
```

- [ ] **Step 6: Typecheck and verify**

```bash
npm run typecheck
npm run dev
```

Navigate to Accounting → Catalog. Verify: items load, category filter works, stats bar shows. Check React Query Devtools — should see exactly 3 active queries, not 8.

- [ ] **Step 7: Commit**

```bash
git add src/components/accounting/CatalogManagementPage.tsx
git commit -m "feat(query): consolidate CatalogManagementPage from 8 queries to 3, use RPC for usage counts"
```

---

## Task 15: Fix Admin.tsx, FinancialsModule.tsx, PostToLedgerPanel.tsx

**Files:**
- Modify: `src/components/Admin.tsx`
- Modify: `src/components/accounting/FinancialsModule.tsx`
- Modify: `src/components/accounting/PostToLedgerPanel.tsx`

- [ ] **Step 1: Read all three files**

Read each file. Note which tables they fetch, how many queries per mount, and what filters they apply.

- [ ] **Step 2: Migrate Admin.tsx**

`Admin.tsx` has 14 direct `supabase.from()` calls — mostly fetching user lists, roles, department breakdowns. Group overlapping fetches and replace with `useQuery`:

- All user-related fetches → `queryKeys.users.list()` with appropriate filters
- Each distinct entity fetched → its own `useQuery` with `staleTime: 5 * 60 * 1000`
- Mutations (create user, update role) → `useMutation` + `queryClient.invalidateQueries({ queryKey: queryKeys.users.all() })`

- [ ] **Step 3: Migrate FinancialsModule.tsx**

Replace its 4 direct fetches with `useQuery` calls using appropriate `queryKeys.financials.*` or `queryKeys.projects.*` keys.

- [ ] **Step 4: Migrate PostToLedgerPanel.tsx**

Replace its 3 direct fetches with `useQuery`. Use `staleTime: 30_000`.

- [ ] **Step 5: Typecheck**

```bash
npm run typecheck
```

- [ ] **Step 6: Commit**

```bash
git add src/components/Admin.tsx src/components/accounting/FinancialsModule.tsx src/components/accounting/PostToLedgerPanel.tsx
git commit -m "feat(query): migrate Admin, FinancialsModule, PostToLedgerPanel to useQuery"
```

---

## Task 16: Fix EVoucherDetailView, CustomerDetail, ContactDetail

**Files:**
- Modify: `src/components/accounting/EVoucherDetailView.tsx`
- Modify: `src/components/bd/CustomerDetail.tsx`
- Modify: `src/components/bd/ContactDetail.tsx`

- [ ] **Step 1: Read all three files**

Read each file. `EVoucherDetailView` has 10 direct calls, `CustomerDetail` has 10, `ContactDetail` has 7.

- [ ] **Step 2: Migrate EVoucherDetailView.tsx**

Consolidate its 10 queries. Most detail pages can combine into 1-2 queries using Supabase joins. Example:

```ts
const { data: evoucher, isLoading } = useQuery({
  queryKey: queryKeys.evouchers.detail(id),
  queryFn: async () => {
    const { data, error } = await supabase
      .from("evouchers")
      .select("*, users(name, email), ...") // join related tables
      .eq("id", id)
      .maybeSingle();
    if (error) throw error;
    return { ...data?.details, ...data };
  },
  enabled: !!id,
  staleTime: 30_000,
});
```

For remaining standalone fetches (workflow history, related billings), use separate `useQuery` calls with their own keys.

- [ ] **Step 3: Migrate CustomerDetail.tsx**

```ts
const { data: customer } = useQuery({
  queryKey: queryKeys.customers.detail(id),
  queryFn: async () => {
    const { data, error } = await supabase
      .from("customers")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error) throw error;
    return data;
  },
  enabled: !!id,
  staleTime: 5 * 60 * 1000,
});
```

Add separate `useQuery` for each distinct entity (contacts, projects, quotations linked to customer). Use `queryKeys.customers.detail(id)` as prefix for sub-queries.

- [ ] **Step 4: Migrate ContactDetail.tsx**

Same pattern — primary contact query + separate queries for related data. Use `queryKeys.contacts.detail(id)`.

- [ ] **Step 5: Typecheck and verify**

```bash
npm run typecheck
npm run dev
```

Navigate to a customer detail, contact detail, and e-voucher detail. Verify all data renders. Check Devtools to confirm reduced query counts.

- [ ] **Step 6: Commit**

```bash
git add src/components/accounting/EVoucherDetailView.tsx src/components/bd/CustomerDetail.tsx src/components/bd/ContactDetail.tsx
git commit -m "feat(query): consolidate EVoucherDetailView, CustomerDetail, ContactDetail queries"
```

---

## Task 17: Final verification

- [ ] **Step 1: Run typecheck**

```bash
npm run typecheck
```

Expected: Zero errors.

- [ ] **Step 2: Verify no remaining useNeuronCache usage**

```bash
grep -r "useCachedFetch\|useInvalidateCache\|NeuronCacheProvider\|useNeuronCache" src/ --include="*.ts" --include="*.tsx"
```

Expected: Zero results.

- [ ] **Step 3: Verify no remaining raw fetch anti-patterns in migrated files**

```bash
grep -rn "useState.*\[\].*isLoading\|setIsLoading(true)" src/hooks/ --include="*.ts"
```

Expected: Only in files intentionally left for Phase 4 (if any).

- [ ] **Step 4: Open the app and spot-check pages**

Navigate to: Catalog, a Project detail (Financial tab), a Customer detail, E-Vouchers list, Reports module. Each should:
- Load fast on first visit (network requests)
- Load **instantly** on second visit (React Query cache)
- Show React Query Devtools with cached entries

- [ ] **Step 5: Final commit**

```bash
git add -A
git commit -m "feat: TanStack Query migration complete — Phases 1-3"
```
