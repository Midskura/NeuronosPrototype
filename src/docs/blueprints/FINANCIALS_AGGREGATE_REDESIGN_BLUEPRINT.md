# Financials Aggregate Redesign Blueprint

**Created:** 2026-03-06
**Status:** COMPLETE (all 6 phases done, pending browser verification)
**Goal:** Replace the "ported Unified components" in the Financials super-module with purpose-built aggregate views designed for handling hundreds to thousands of records, using a "Scope > Summarize > Group > Drill" progressive disclosure pattern inspired by NetSuite/Xero/QuickBooks.

---

## Problem

The current `FinancialsModule.tsx` tabs reuse the project-level Unified components (`UnifiedBillingsTab`, `UnifiedInvoicesTab`, `UnifiedCollectionsTab`, `UnifiedExpensesTab`) as-is. These components were designed for project-scoped views (5-50 records) where the customer/project context is already known.

At the aggregate (system-wide) level:
- **No time scoping** — all records load at once, creating noise
- **No summary metrics** — user must mentally aggregate totals
- **No hierarchical grouping** — flat list with 500+ rows is unusable
- **No aging analysis** — critical for finance, completely missing
- **No progressive disclosure** — dumps detail before context

## Design Principles

1. **Scope First** — Default to "This Month"; user narrows/widens from there
2. **Metrics Before Records** — KPI cards answer "how am I doing?" at a glance
3. **Group, Then Drill** — 500 rows become 15 collapsible customer groups with subtotals
4. **Aging Creates Urgency** — Clickable aging buckets surface what needs attention
5. **One Shell, Four Configs** — DRY shared layout, each tab provides its own config

---

## Architecture

### Shared Shell: `AggregateFinancialShell`

A single reusable container component (~250 lines) that renders:

```
AggregateFinancialShell
  |-- ScopeBar           (date range presets + custom picker)
  |-- KPIStrip           (4 metric cards, configurable per tab)
  |-- AgingStrip          (optional, clickable bucket bar)
  |-- GroupingToolbar    (group-by dropdown, search, sort, export)
  |-- GroupedDataTable   (collapsible groups with subtotals + pagination)
```

### Tab Config Interface

```typescript
interface AggregateTabConfig<T> {
  // Identity
  tabId: string;
  title: string;
  subtitle: string;
  
  // KPI strip (always 4 cards)
  computeKPIs: (items: T[], scope: DateScope) => KPICard[];
  
  // Aging (optional — only Invoices & Collections)
  agingConfig?: {
    computeBuckets: (items: T[]) => AgingBucket[];
    dateField: keyof T;
  };
  
  // Grouping
  groupByOptions: GroupOption[];
  defaultGroupBy: string;
  getGroupKey: (item: T, groupBy: string) => string;
  getGroupLabel: (key: string, groupBy: string) => string;
  getGroupSubtotal: (items: T[]) => number;
  
  // Table columns within each group
  columns: ColumnDef<T>[];
  
  // Search
  searchFields: (keyof T)[];
  
  // Status filter pills
  statusOptions: { value: string; label: string; color: string }[];
  getStatus: (item: T) => string;
  
  // Sorting
  defaultSortField: keyof T;
  defaultSortDir: "asc" | "desc";
}
```

### KPI Card Shape

```typescript
interface KPICard {
  label: string;
  value: string;            // Formatted display (e.g., "PHP 2.4M")
  subtext?: string;          // e.g., "23 items" or "+12% MoM"
  trend?: "up" | "down" | "flat";
  severity?: "normal" | "warning" | "danger";  // Controls color accent
  icon: LucideIcon;
}
```

### Aging Bucket Shape

```typescript
interface AgingBucket {
  label: string;           // "Current", "1-30d", "31-60d", "61-90d", "90d+"
  amount: number;
  count: number;
  color: string;           // Tailwind color class
  isActive?: boolean;      // Clicked = filtered
}
```

### Date Scope

```typescript
type ScopePreset = "this-week" | "this-month" | "this-quarter" | "ytd" | "all" | "custom";

interface DateScope {
  preset: ScopePreset;
  from: Date;
  to: Date;
}
```

---

## Tab-Specific KPIs

### Billings
| # | Metric | Calculation | Severity Logic |
|---|--------|------------|----------------|
| 1 | Total Billed | `SUM(amount)` for all in scope | normal |
| 2 | Unbilled | `SUM(amount) WHERE status='unbilled'` | warning if > 30% of total |
| 3 | Items Count | `COUNT(*)` | normal |
| 4 | Avg per Booking | `Total / unique bookings` | normal |

### Invoices
| # | Metric | Calculation | Severity Logic |
|---|--------|------------|----------------|
| 1 | Total Invoiced | `SUM(total_amount)` | normal |
| 2 | Outstanding | `SUM(remaining_balance) WHERE status != 'paid'` | warning if > 50% |
| 3 | Overdue | `SUM(remaining_balance) WHERE past_due` | danger if > 0 |
| 4 | Collection Rate | `Collected / Invoiced * 100%` | danger if < 60% |

### Collections
| # | Metric | Calculation | Severity Logic |
|---|--------|------------|----------------|
| 1 | Total Collected | `SUM(amount)` | normal |
| 2 | This Month | `SUM(amount) in current month` | normal |
| 3 | Avg Days to Collect | `AVG(collection_date - invoice_date)` | warning if > 45 |
| 4 | Collection Rate | `Collected / Outstanding * 100%` | danger if < 60% |

### Expenses
| # | Metric | Calculation | Severity Logic |
|---|--------|------------|----------------|
| 1 | Total Expenses | `SUM(amount)` | normal |
| 2 | Pending Approval | `COUNT WHERE status='pending'` | warning if > 10 |
| 3 | Top Category | Category with highest total | normal |
| 4 | Billable Ratio | `Billable / Total * 100%` | normal |

---

## Grouping Options per Tab

| Tab | Group By Options | Default |
|-----|-----------------|---------|
| Billings | Customer, Project, Booking, Status, Month | Customer |
| Invoices | Customer, Status, Aging Bucket, Month | Customer |
| Collections | Customer, Payment Method, Month | Customer |
| Expenses | Category, Vendor, Project, Status, Month | Category |

Each group row renders:
- Expand/collapse chevron
- Group label (e.g., customer name)
- Item count badge
- Subtotal amount (right-aligned)
- Progress/status indicator (optional)

---

## Aging Strip (Invoices & Collections only)

**UPDATE (2026-03-07):** The standalone `AgingStrip` bar has been removed from the Invoices and Collections tabs. Aging filtering is now handled via an **"Aging" dropdown** integrated into the `GroupingToolbar`, positioned between the Group By and Status controls. The dropdown shows all 5 aging buckets with their color dots, amounts, and counts, and selecting a bucket filters the table identically to the old strip. The `AgingStrip` component is retained and still used on the Dashboard tab as a mini receivables aging visualization.

Original design (archived):
~~Horizontal bar with 5 clickable buckets:~~
- **Current** (not yet due) — green `#0F766E`
- **1-30 days** — teal `#14B8A6`
- **31-60 days** — amber `#F59E0B`
- **61-90 days** — orange `#F97316`
- **90+ days** — red `#EF4444`

Clicking a bucket filters the GroupedDataTable to only records in that aging range. Clicking again deselects (shows all).

The bar width is proportional to `bucket.amount / totalAmount`.

---

## Pagination Strategy

- Client-side pagination at **25 rows per page** (within groups)
- Groups themselves are always all visible (they're max 15-20)
- Individual group contents paginate independently
- "Show all" toggle per group for power users

---

## Phases

### Phase 1: Shared Shell + ScopeBar + KPIStrip
**Status:** COMPLETE (2026-03-06)
**Estimated complexity:** ~250 lines new code

Create the shared `AggregateFinancialShell` component with:
- `ScopeBar` with date presets (This Week / This Month / This Quarter / YTD / All / Custom)
- `KPIStrip` rendering 4 configurable metric cards
- Tab config interface (`AggregateTabConfig`)
- Wire into `FinancialsModule.tsx` for the Billings tab only (as proof of concept)

**Files:**
| File | Action |
|------|--------|
| `/components/accounting/aggregate/AggregateFinancialShell.tsx` | CREATE — shared shell |
| `/components/accounting/aggregate/ScopeBar.tsx` | CREATE — date range presets |
| `/components/accounting/aggregate/KPIStrip.tsx` | CREATE — 4-card metrics row |
| `/components/accounting/aggregate/types.ts` | CREATE — shared types/interfaces |
| `/components/accounting/FinancialsModule.tsx` | MODIFY — replace Billings tab content with shell |

**Acceptance:**
- ScopeBar renders 6 preset buttons + custom date pickers
- Changing scope filters the data passed to child components
- KPIStrip renders 4 cards with Billings-specific metrics
- Billings tab looks visibly different from old flat list

**Implementation Notes (Phase 1):**
- Created 4 new files in `/components/accounting/aggregate/`: `types.ts` (~150 lines), `ScopeBar.tsx` (~120 lines), `KPIStrip.tsx` (~120 lines), `AggregateFinancialShell.tsx` (~50 lines).
- `types.ts` includes: `DateScope`, `ScopePreset`, `createDateScope()`, `isInScope()`, `KPICard`, `AgingBucket`, `GroupOption`, `AggregateTabConfig`, and currency formatting helpers.
- `ScopeBar` uses Neuron design tokens (`--neuron-brand-green-100`, `--neuron-ui-border`, etc.) for consistency.
- `KPIStrip` supports severity-based coloring (normal=green, warning=amber, danger=red) and a loading skeleton state.
- `FinancialsModule.tsx` now has a shared `scope` state (default: "this-month"), scope-filtered billing items (`scopedBillingItems`), and 4 computed KPI cards (Total Billed, Unbilled, Items, Avg/Booking).
- The Billings tab wraps `UnifiedBillingsTab` inside `AggregateFinancialShell`, passing scoped data. Other 3 tabs are unchanged.
- Old `derivedLinkedBookings` kept for backward compat; `scopedLinkedBookings` added for the aggregate view.
- Not yet browser-verified.

---

### Phase 2: GroupedDataTable + GroupingToolbar
**Status:** COMPLETE (2026-03-06)
**Estimated complexity:** ~300 lines new code

Build the collapsible grouped table:
- `GroupingToolbar` with group-by dropdown, search, sort, status pill filters
- `GroupedDataTable` with collapsible group headers, subtotals, and per-group pagination
- Apply to Billings tab (still proof-of-concept)

**Files:**
| File | Action |
|------|--------|
| `/components/accounting/aggregate/GroupingToolbar.tsx` | CREATE — toolbar with group-by, search, filters |
| `/components/accounting/aggregate/GroupedDataTable.tsx` | CREATE — collapsible grouped table |
| `/components/accounting/aggregate/AggregateFinancialShell.tsx` | No change needed — shell accepts children composably |
| `/components/accounting/FinancialsModule.tsx` | MODIFY — Billings tab now renders GroupingToolbar + GroupedDataTable instead of UnifiedBillingsTab |

**Acceptance:**
- Group-by dropdown works (Customer / Project / Status / Month)
- Groups are collapsible with chevron animation
- Each group header shows label, count, subtotal
- Search filters across all groups in real-time
- Status pill filters work (All / Unbilled / Billed / Paid)

**Implementation Notes (Phase 2):**
- `GroupingToolbar.tsx` (~130 lines): Native `<select>` for group-by, search input with clear button, status pill filters with "All" + per-status toggles, record/group count label. All styled with Neuron design tokens.
- `GroupedDataTable.tsx` (~250 lines): Generic component `GroupedDataTable<T>`. Groups render as collapsible sections with chevron, label, count badge, and subtotal. First 5 groups default expanded, rest collapsed. Per-group pagination at 25 rows. Expand/collapse all toggle. Loading skeleton and empty state built in.
- `AggregateFinancialShell` was NOT modified — the shell simply renders `{children}`, and the Billings tab composes `<GroupingToolbar />` + `<GroupedDataTable />` as children. This keeps the shell maximally flexible.
- Billings column defs, group options, status options, and grouping logic are defined inline in `FinancialsModule.tsx` (will be extracted to a config file in Phase 3).
- `UnifiedBillingsTab` import is kept but no longer rendered in the Billings tab — it's replaced by the new aggregate components. Cleanup in Phase 6.
- `scopedLinkedBookings` and `derivedLinkedBookings` are now unused dead code — cleanup in Phase 6.
- Not yet browser-verified.

---

### Phase 3: AgingStrip + Invoices Tab
**Status:** COMPLETE (2026-03-06)
**Estimated complexity:** ~200 lines new code

Build the aging strip component and apply the full aggregate pattern to the Invoices tab:
- `AgingStrip` — clickable proportional bar with 5 buckets
- Invoices tab config (KPIs, columns, grouping, aging)
- Clicking aging bucket filters the table

**Files:**
| File | Action |
|------|--------|
| `/components/accounting/aggregate/AgingStrip.tsx` | CREATE — aging bucket bar |
| `/components/accounting/aggregate/AggregateFinancialShell.tsx` | No change — AgingStrip rendered as composable child |
| `/components/accounting/FinancialsModule.tsx` | MODIFY — wire Invoices tab to shell with full aggregate pattern |

**Acceptance:**
- Aging strip renders with 5 colored proportional segments
- Clicking a bucket filters the grouped table
- Invoices KPIs show: Total Invoiced, Outstanding, Overdue, Collection Rate
- Invoices group-by works: Customer, Status, Aging, Month

**Implementation Notes (Phase 3):**
- `AgingStrip.tsx` (~130 lines): Proportional horizontal bar with 5 clickable segments (Current / 1-30d / 31-60d / 61-90d / 90d+). Colors per blueprint (#0F766E, #14B8A6, #F59E0B, #F97316, #EF4444). Legend row below the bar shows per-bucket amount + count with colored dots. Active bucket highlights, inactive dims to 30% opacity. "Clear filter" link when a bucket is active. Empty state when no aging data.
- Invoices aggregate logic added to `FinancialsModule.tsx` (~200 lines): scope-filtered invoices, aging day/bucket computation (`getAgingDays`, `getAgingBucketLabel`), 5-bucket aging computation from unpaid invoices, 4 KPI cards (Total Invoiced, Outstanding with >50% warning, Overdue with >0 danger, Collection Rate with <60% danger / <80% warning), 8-column table (Invoice #, Date, Customer, Project, Due Date with overdue red highlight, Amount, Balance, Status), status filter pills (Draft / Posted / Open / Partial / Paid), group-by (Customer / Status / Aging Bucket / Month).
- Shell was NOT modified — `AgingStrip` is rendered as a composable child between KPIStrip and GroupingToolbar: `<AggregateFinancialShell> <AgingStrip/> <GroupingToolbar/> <GroupedDataTable/> </AggregateFinancialShell>`.
- Billings config extraction to separate file deferred to Phase 6 cleanup — all config is still inline in FinancialsModule for now.
- `UnifiedInvoicesTab` import kept as dead code — cleanup in Phase 6.
- Not yet browser-verified.

---

### Phase 4: Collections + Expenses Tabs
**Status:** COMPLETE (2026-03-06)
**Estimated complexity:** ~150 lines (mostly config, minimal new UI)

Apply the pattern to the remaining two tabs — this phase is fast because all shared components exist:
- Collections tab config (KPIs, columns, aging, grouping)
- Expenses tab config (KPIs, columns, category grouping — no aging)

**Files:**
| File | Action |
|------|--------|
| `/components/accounting/FinancialsModule.tsx` | MODIFY — wire Collections + Expenses tabs to aggregate shell |

**Acceptance:**
- All 4 financial tabs use the aggregate shell
- Collections has aging strip (same as Invoices)
- Expenses does NOT have aging strip
- Each tab has its own KPIs, grouping options, and column layouts

**Implementation Notes (Phase 4):**
- **Collections tab** (~150 lines added): Scope-filtered collections, aging buckets (based on days between invoice due date and collection date), 4 KPI cards (Total Collected, This Month, Avg Days to Collect with >45d warning, Collection Rate with <60% danger / <80% warning), 8-column table (Date, Customer, Invoice #, Project, Method, Reference, Amount, Status), 3 status pills (Confirmed / Pending / Voided), 3 group-by options (Customer / Payment Method / Month), aging strip with 5 buckets filtering the grouped table.
- **Expenses tab** (~150 lines added): Scope-filtered expenses, 4 KPI cards (Total Expenses, Pending Approval with >10 warning, Top Category showing highest-spend category name, Billable Ratio as percentage), 7-column table (Date, Project, Vendor, Description, Category, Amount, Status), 3 status pills (Pending / Approved / Paid), 5 group-by options (Category / Vendor / Project / Status / Month — default: Category). NO aging strip per blueprint spec.
- All 4 tabs now share the same visual pattern: `ScopeBar > KPIStrip > [AgingStrip?] > GroupingToolbar > GroupedDataTable`.
- Scope state is shared across all tabs (switching tabs preserves the date scope).
- `UnifiedCollectionsTab` and `UnifiedExpensesTab` imports kept as dead code — cleanup in Phase 6.
- `UnifiedBillingsTab` and `UnifiedInvoicesTab` imports also still dead code — all to be cleaned in Phase 6.
- `derivedLinkedBookings`, `scopedLinkedBookings`, `dummyProject` are now all unused — cleanup in Phase 6.
- New icon imports added: `CalendarCheck`, `Timer`, `FolderOpen`, `Layers`.
- Not yet browser-verified.

---

### Phase 5: Dashboard Tab Enhancement
**Status:** COMPLETE (2026-03-06)
**Estimated complexity:** ~150 lines

Enhance the Dashboard tab to work with the scoped data:
- Reuse `ProjectFinancialOverview` but pass scope-filtered data
- Add a top-level scope bar to the module header (shared across all tabs)
- Optional: add a mini aging summary widget to the dashboard

**Files:**
| File | Action |
|------|--------|
| `/components/accounting/FinancialsModule.tsx` | MODIFY — lift scope bar to module header, scope-filtered dashboard, mini aging widget |
| `/components/accounting/aggregate/AggregateFinancialShell.tsx` | MODIFY — add `hideScopeBar` prop |

**Acceptance:**
- Changing date scope on any tab persists when switching tabs
- Dashboard overview cards reflect the active scope
- Module-level scope bar replaces per-tab scope bars

**Implementation Notes (Phase 5):**
- `AggregateFinancialShell.tsx` updated with optional `hideScopeBar` prop — when true, the shell skips rendering its internal ScopeBar (since it's now in the module header).
- `ScopeBar` imported directly into `FinancialsModule.tsx` and rendered in the module header area, between the tab bar and the tab content. This single ScopeBar is shared by all 5 tabs (Dashboard + 4 financial tabs).
- All 4 `AggregateFinancialShell` instances now pass `hideScopeBar` to suppress their per-tab scope bars.
- New `scopedFinancials` computed value: filters all 4 data arrays (invoices, billingItems, collections, expenses) by the active scope, then recalculates `totals` via `calculateFinancialTotals`. Dashboard's `ProjectFinancialOverview` now receives `scopedFinancials` instead of unscoped `financials`.
- Dashboard includes a "Receivables Aging" mini widget below `ProjectFinancialOverview` — renders the invoices `AgingStrip` in read-only mode (clicking any bucket navigates to the Invoices tab).
- Scope state was already shared at the module level (Phase 1); this phase simply surfaced it in the UI header and connected it to the Dashboard.
- Not yet browser-verified.

---

### Phase 6: Polish + Cleanup
**Status:** COMPLETE (2026-03-06)

- Remove old Aggregate pages (`AggregateBillingsPage`, `AggregateExpensesPage`, `AggregateCollectionsPage`) — DONE (3 files deleted)
- `AggregateInvoicesPage.tsx` KEPT — still used by Full Suite mode for standalone invoices view
- Remove dead code from `FinancialsModule.tsx`: `UnifiedBillingsTab`, `UnifiedInvoicesTab`, `UnifiedCollectionsTab`, `UnifiedExpensesTab` imports, `derivedLinkedBookings`, `scopedLinkedBookings`, `dummyProject`, unscoped `financials` — DONE
- Update `Accounting.tsx` to redirect Essentials-mode billings/invoices/collections/expenses routes to `FinancialsModule` instead of old aggregate pages — DONE
- Update `ARCHITECTURE_AND_PATTERNS.md` to document the superseded aggregate pages and new aggregate component directory — DONE
- Ensure graceful empty states per tab — already handled by `GroupedDataTable` empty state
- Not yet browser-verified.

---

## File Map (All Phases)

| File | Phase | Action | Status |
|------|-------|--------|--------|
| `/components/accounting/aggregate/types.ts` | 1 | CREATE | DONE |
| `/components/accounting/aggregate/ScopeBar.tsx` | 1 | CREATE | DONE |
| `/components/accounting/aggregate/KPIStrip.tsx` | 1 | CREATE | DONE |
| `/components/accounting/aggregate/AggregateFinancialShell.tsx` | 1, 5 | CREATE, MODIFY | DONE |
| `/components/accounting/aggregate/GroupingToolbar.tsx` | 2 | CREATE | DONE |
| `/components/accounting/aggregate/GroupedDataTable.tsx` | 2 | CREATE | DONE |
| `/components/accounting/aggregate/AgingStrip.tsx` | 3 | CREATE | DONE |
| `/components/accounting/FinancialsModule.tsx` | 1-5, 6 | MODIFY | DONE |
| `/components/accounting/Accounting.tsx` | 6 | MODIFY | DONE |
| `/components/accounting/AggregateBillingsPage.tsx` | 6 | DELETE | DONE |
| `/components/accounting/AggregateExpensesPage.tsx` | 6 | DELETE | DONE |
| `/components/accounting/AggregateCollectionsPage.tsx` | 6 | DELETE | DONE |
| `/context/ARCHITECTURE_AND_PATTERNS.md` | 6 | MODIFY | DONE |

---

## Open Questions

1. ~~Default landing tab~~ **ANSWERED: Dashboard**
2. ~~Where Catalogs go~~ **ANSWERED: Separate sidebar item**
3. ~~Sidebar item name~~ **ANSWERED: "Financials"**
4. ~~Should the aging strip also appear on the Dashboard tab as a mini-widget?~~ **ANSWERED: Yes (Phase 5)**
5. Export format: CSV only, or also PDF? (Deferred — not in scope for this redesign)

---

## Summary

All 6 phases of the Financials Aggregate Redesign are **COMPLETE** (2026-03-06). The entire redesign is pending browser verification.

**Post-completion UX improvement (2026-03-07):**
- Removed standalone `AgingStrip` bar from Invoices and Collections tabs — replaced with an "Aging" dropdown in `GroupingToolbar` (positioned between Group By and Status controls). This eliminates one visual layer, reducing the layout from 5 layers to 4 (KPI cards → Toolbar → Table). The dropdown shows all 5 aging buckets with color dots, amounts, and item counts. The `AgingStrip` component is retained on the Dashboard tab as a mini receivables aging visualization.
- **Collections aging removed entirely** — aging is conceptually meaningless for collections (completed payments). Collections tab now has no aging dropdown; aging is only on the Invoices tab where it represents unpaid receivables overdue urgency.

**What was built:**
- 7 new shared components in `/components/accounting/aggregate/`
- `FinancialsModule.tsx` fully wired with 5 tabs (Dashboard + 4 financial tabs)
- All tabs use the "Scope > Summarize > Group > Drill" progressive disclosure pattern
- Module-level ScopeBar shared across all tabs
- Dashboard shows scope-filtered financial overview + mini receivables aging widget
- 3 old aggregate pages deleted, routing updated, dead code removed