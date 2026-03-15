# Reports Module Blueprint

## Overview

A full reports hub for the Accounting module, replacing the current single-page `FinancialHealthPage` (Essentials) and `FinancialReports` (Full Suite) with a multi-report module. Each report is a full-page view powered by the same 4 raw data streams (billing items, invoices, collections, expenses) already fetched elsewhere in the system — no new API endpoints required.

**Target user:** The accounting team of a Philippine freight forwarding SME. These reports support their weekly/monthly routines: bank reconciliation, AR follow-ups, revenue leakage checks, and management reporting.

**Design system:** Neuron OS — `#12332B` (primary text), `#0F766E` (teal actions), `#667085` (muted), `#E5E9F0` (borders), `#F9FAFB` (subtle bg). Stroke borders, no heavy shadows.

---

## Data Foundation

All reports derive from data already available via existing API endpoints:

| Stream | Endpoint | Key Fields |
|---|---|---|
| **Billing Items** | `/accounting/billing-items` | `booking_id`, `project_number`, `customer_name`, `service_type`, `quotation_category`, `amount`, `currency`, `status` (unbilled/billed/paid), `created_at` |
| **Invoices** | `/accounting/invoices` | `invoice_number`, `invoice_date`, `due_date`, `customer_name`, `project_number`, `total_amount`, `remaining_balance`, `status` |
| **Collections** | `/accounting/collections` | `collection_date`, `invoice_number`, `customer_name`, `project_number`, `amount`, `payment_method`, `mode_of_payment`, `reference_number`, `or_number`, `status` |
| **Expenses** | `/accounting/expenses` | `expenseDate`, `vendorName`/`payee_name`, `expenseCategory`, `amount`, `currency`, `isBillable`, `status`, `bookingId`, `projectNumber`, `customerName` |
| **Projects** | `/projects` | `project_number`, `customer_name`, `created_at` |

A shared data-fetching hook (`useReportsData`) will fetch all 5 in parallel (same pattern as `useFinancialHealthReport`), cached for the session, with a scope/date-range parameter.

---

## Report Inventory

### Report 1: Sales Report
> "How much money did we actually make from the things we did?"

**Grain:** Per booking (one row per booking — the work unit).

**Purpose:** Shows actual revenue earned at the most granular operational level. Each booking represents a unit of work (one service for one shipment), and this report answers: "For each piece of work we did, how much did we bill?"

**Columns:**
| Column | Source | Notes |
|---|---|---|
| Booking ID | `billing_item.booking_id` | Primary key — grouped from billing items |
| Service Type | `billing_item.service_type` | Forwarding, Brokerage, Trucking, Marine Insurance, Others |
| Project # | `billing_item.project_number` | Parent container |
| Customer | `billing_item.customer_name` | Who was charged |
| Total Billed | Sum of `amount` where status = billed or paid | Actual invoiced revenue |
| Total Unbilled | Sum of `amount` where status = unbilled | Work done but not yet invoiced |
| Total Revenue | Total Billed + Total Unbilled | Full earned revenue |
| # Charges | Count of billing items per booking | Volume indicator |
| Billing Date | Earliest `created_at` of billing items | When work was first billed |

**Summary KPI Cards (top):**
- **Total Revenue** — sum of all billing item amounts (teal)
- **Billed Revenue** — sum where status is billed/paid (green)
- **Unbilled Revenue** — sum where status is unbilled (amber — revenue leakage signal)
- **Avg Revenue per Booking** — total / unique booking count (muted)

**Grouping:** Default flat (per-booking rows). Optional group-by toggle: by Customer, by Service Type.

**Sorting:** Default by Total Revenue descending (biggest earners first).

**Filters:**
- ScopeBar (date range — filters by billing item `created_at`)
- Service Type dropdown (multi-select)
- Customer search

**Export:** CSV with all columns + summary totals row.

---

### Report 2: Booking Cash Flow Report
> "For each booking, what came in, what went out, and what's the net?"

**Grain:** Per booking (one row per booking).

**Purpose:** The full cash flow picture at the booking level. For each unit of work: how much was billed, how much was collected (actual cash in), how much was spent (expenses), and the net cash position. This is the report that tells you whether a specific job actually made or lost money on a cash basis.

**Data assembly (per booking):**
1. **Billings:** Group billing items by `booking_id` → sum amounts → split by status
2. **Collections:** Collections link to invoices, invoices link to projects. We trace: billing items (by booking) → invoices (by billing items' invoice linkage) → collections (by invoice). For MVP, we aggregate collections at the project level and distribute proportionally, OR we use the `project_number` to link collections to the booking's parent project.
3. **Expenses:** Filter expenses by `bookingId` match → sum amounts

**Columns:**
| Column | Source | Notes |
|---|---|---|
| Booking ID | Grouped key | Primary identifier |
| Service Type | From billing items or booking data | Service classification |
| Project # | `project_number` | Parent project |
| Customer | `customer_name` | Client |
| Total Billings | Sum of billing item amounts for this booking | What was charged |
| Invoiced Amount | Sum of billing items with status = billed/paid | What was formally invoiced |
| Collected Amount | Collections traced through invoices for this project (pro-rated if needed) | Actual cash received |
| Total Expenses | Sum of expenses for this booking | Cash out / costs |
| Admin Cost (3%) | `Total Expenses * 0.03` | Standard admin overhead (matches FinancialHealthPage pattern) |
| Net Cash | Collected - (Expenses + Admin) | Cash basis net position |
| Gross Profit | Billings - (Expenses + Admin) | Accrual basis profit |
| Margin % | `Gross Profit / Billings * 100` | Profitability ratio |

**Summary KPI Cards (top):**
- **Total Billings** — all bookings (teal)
- **Total Collected** — cash in (blue)
- **Total Expenses** — cash out (red)
- **Net Cash** — collected minus expenses+admin (green/red conditional)

**Color coding:**
- Margin % column: green (≥ 20%), amber (10-19%), red (< 10% or negative)
- Net Cash column: green (positive), red (negative)

**Grouping:** Default flat. Optional group-by: Customer, Service Type, Project.

**Sorting:** Default by Gross Profit descending.

**Filters:**
- ScopeBar (date range — filters by billing item `created_at` or expense date)
- Service Type dropdown
- Customer search
- Margin filter: "Show only negative margin" toggle

**Export:** CSV with all columns + summary totals row.

---

### Report 3: Receivables Aging Report
> "Who owes us money and for how long?"

**Grain:** Per invoice (one row per unpaid invoice).

**Purpose:** The #1 report every freight forwarding accounting team prints for management. Shows all outstanding receivables bucketed by how overdue they are.

**Data:** All invoices where `remaining_balance > 0` (unpaid/partial).

**Columns:**
| Column | Source | Notes |
|---|---|---|
| Invoice # | `invoice_number` | Document reference |
| Invoice Date | `invoice_date` | When issued |
| Due Date | `due_date` | When payment expected |
| Customer | `customer_name` | Who owes |
| Project # | `project_number` | Lineage |
| Invoice Amount | `total_amount` | Original face value |
| Remaining Balance | `remaining_balance` | What's still owed |
| Days Overdue | `today - due_date` | Negative = not yet due |
| Aging Bucket | Computed | Current / 1-30 / 31-60 / 61-90 / 90+ |

**Summary KPI Cards (top):**
- **Total Outstanding** — sum of remaining_balance (teal, large)
- **Current (Not Yet Due)** — sum where not overdue (green)
- **Overdue** — sum where past due (red)
- **DSO** — (Outstanding AR / Net Revenue) * Days in Period

**Aging summary strip** (below KPIs):
Horizontal bar showing distribution across buckets — reuses the same visual language as `ReceivablesAgingBar` on the dashboard but in compact table-header form.

| Bucket | Color | Filter |
|---|---|---|
| Current | Teal `#0F766E` | Not yet due |
| 1-30 days | Amber `#D97706` | Slightly overdue |
| 31-60 days | Orange `#EA580C` | Moderately overdue |
| 61-90 days | Red `#DC2626` | Significantly overdue |
| 90+ days | Dark Red `#991B1B` | Critical |

**Grouping:** Default group by Customer (accordion) → invoice rows inside. Optional: flat view.

**Sorting:** Default by Days Overdue descending (most critical first).

**Filters:**
- Aging bucket quick-filter pills (click a bucket to filter)
- Customer search
- Note: This is a point-in-time report (always "as of today") — no date range scope needed for the invoices themselves, but an optional "invoiced between" filter can narrow the set.

**Export:** CSV with all columns + per-customer subtotals + grand totals.

---

### Report 4: Collections Report
> "What money came in this period?"

**Grain:** Per collection (one row per payment received).

**Purpose:** For bank reconciliation. The accounting team matches this against bank statements weekly.

**Columns:**
| Column | Source | Notes |
|---|---|---|
| Collection Date | `collection_date` | When received |
| Invoice # | `invoice_number` | Which invoice was paid |
| Customer | `customer_name` | Who paid |
| Project # | `project_number` | Lineage |
| Amount | `amount` | Payment amount |
| Payment Method | `payment_method` / `mode_of_payment` | Cash, Check, Bank Transfer |
| Reference # | `reference_number` / `or_number` | OR or bank reference |
| Status | `status` | Posted, Pending, Voided |

**Summary KPI Cards (top):**
- **Total Collected** — sum of amounts in period (teal)
- **# Transactions** — count of collections (muted)
- **Avg Collection Size** — total / count (muted)
- **By Method breakdown** — inline mini-bar or pills showing Cash vs Check vs Bank Transfer split

**Grouping:** Default flat (chronological). Optional group-by: Customer, Payment Method.

**Sorting:** Default by Collection Date descending (newest first).

**Filters:**
- ScopeBar (date range — filters by `collection_date`)
- Payment Method dropdown
- Customer search
- Status filter (Posted / Pending / Voided)

**Export:** CSV with all columns + grand total row.

---

### Report 5: Unbilled Revenue Report
> "What work have we done but not yet invoiced?"

**Grain:** Per billing item where `status === "unbilled"`.

**Purpose:** Revenue leakage prevention. Shows all charges that have been recorded against bookings but not yet bundled into invoices. For freight forwarders, this is critical — work gets done and billing items get created from quotation rates, but nobody invoices for weeks.

**Columns:**
| Column | Source | Notes |
|---|---|---|
| Booking ID | `booking_id` | Which work unit |
| Service Type | `service_type` | What kind of work |
| Project # | `project_number` | Parent container |
| Customer | `customer_name` | Who should be invoiced |
| Category | `quotation_category` | Charge category (Ocean Freight, Documentation, etc.) |
| Description | `description` | Line item detail |
| Amount | `amount` | Unbilled charge value |
| Days Pending | `today - created_at` | How long this has been sitting |

**Summary KPI Cards (top):**
- **Total Unbilled** — sum of all unbilled amounts (amber — this is money left on the table)
- **# Items** — count of unbilled billing items
- **# Bookings** — unique booking count (how many jobs have unbilled charges)
- **Avg Days Pending** — average days since created_at (urgency signal)

**Grouping:** Default group by Customer → Booking (nested accordion). Shows per-customer subtotal of unbilled revenue.

**Sorting:** Default by Amount descending within each group (biggest leaks first).

**Filters:**
- Customer search
- Service Type dropdown
- Days Pending threshold ("Only show items > 7 days old")

**Actionable:** Each customer group shows a "Create Invoice" CTA pill — navigates to invoices tab (future: pre-filled invoice flow).

**Export:** CSV with all columns + per-customer subtotals + grand total.

---

## Architecture

### File Structure

```
/components/accounting/reports/
  ReportsModule.tsx          — Hub shell: sidebar nav + report content area
  SalesReport.tsx            — Report 1: Per-booking revenue
  BookingCashFlowReport.tsx  — Report 2: Per-booking cash flow + net
  ReceivablesAgingReport.tsx — Report 3: AR aging by invoice
  CollectionsReport.tsx      — Report 4: Collections for reconciliation
  UnbilledRevenueReport.tsx  — Report 5: Revenue leakage / unbilled items

/hooks/
  useReportsData.ts          — Shared data hook: fetches all 5 streams in parallel
```

### Existing files affected:
- `/components/accounting/Accounting.tsx` — Route `view === "reports"` to `<ReportsModule />` instead of the current conditional
- `/components/accounting/reports/FinancialHealthPage.tsx` — **Preserved** (can be deprecated later or referenced for patterns)
- `/components/accounting/reports/FinancialReports.tsx` — **Preserved** (Income Statement / Balance Sheet can be integrated as Report 6/7 in a future phase)

### Shared Components (reuse, don't recreate)

| Component | Path | Used For |
|---|---|---|
| `DataTable` | `/components/common/DataTable.tsx` | All report tables |
| `ScopeBar` | `/components/accounting/aggregate/ScopeBar.tsx` | Date range filtering on Reports 1, 2, 4 |
| `CustomDatePicker` | `/components/common/CustomDatePicker.tsx` | Used within ScopeBar |
| `SkeletonTable` | `/components/shared/NeuronSkeleton.tsx` | Loading states |
| `createDateScope`, `isInScope` | `/components/accounting/aggregate/types.ts` | Date scope utilities |
| `formatCurrencyCompact`, `formatCurrencyFull` | `/components/accounting/aggregate/types.ts` | Currency formatting |

### Data Hook: `useReportsData`

```ts
// Fetches all 5 data streams in parallel, returns raw arrays.
// Each report component filters/computes what it needs from the raw data.
// Accepts a DateScope for pre-filtering on the server side where supported,
// but most filtering is client-side since the APIs return full datasets.

interface ReportsData {
  projects: any[];
  billingItems: any[];
  invoices: any[];
  collections: any[];
  expenses: any[];
  isLoading: boolean;
  refresh: () => Promise<void>;
}
```

This is almost identical to `useFinancialHealthReport` but returns raw arrays instead of pre-computed project rows. The existing hook can be refactored to use `useReportsData` internally, or they can share a common fetch function.

---

## UI Layout: ReportsModule Shell

```
┌─────────────────────────────────────────────────────┐
│  Reports                                    [scope] │
│  ───────────────────────────────────────────────────│
│  ┌──────────┐  ┌──────────────────────────────────┐ │
│  │ Sidebar  │  │ Active Report Content            │ │
│  │          │  │                                  │ │
│  │ ● Sales  │  │ [KPI Cards]                      │ │
│  │ ○ Cash.. │  │ [Filters / Control Bar]          │ │
│  │ ○ Aging  │  │ [DataTable]                      │ │
│  │ ○ Coll.. │  │ [Footer Summary]                 │ │
│  │ ○ Unbi.. │  │                                  │ │
│  │          │  │                                  │ │
│  └──────────┘  └──────────────────────────────────┘ │
└─────────────────────────────────────────────────────┘
```

- **Left sidebar:** Fixed-width (~220px), white background, list of report names with icons. Active report highlighted with teal left border + teal text.
- **Content area:** Full remaining width. Each report renders its own KPI cards + control bar + DataTable.
- **Page title:** "Reports" (32px, `#12332B`) at top-left. Active report name shown as subtitle.

**Sidebar items:**

| Report | Icon | Label |
|---|---|---|
| Sales Report | `DollarSign` | Sales Report |
| Booking Cash Flow | `ArrowUpDown` | Booking Cash Flow |
| Receivables Aging | `Clock` | Receivables Aging |
| Collections | `Banknote` | Collections |
| Unbilled Revenue | `AlertTriangle` | Unbilled Revenue |

---

## Phased Implementation

### Phase 1: Shell + Data Hook + Sales Report
**Files:** `ReportsModule.tsx`, `useReportsData.ts`, `SalesReport.tsx`, `Accounting.tsx`
**Effort:** ~1 hour

1. Create `useReportsData.ts` — parallel fetch of all 5 streams (clone pattern from `useFinancialHealthReport`)
2. Create `ReportsModule.tsx` — sidebar shell with report switching state
3. Create `SalesReport.tsx` — KPI cards + ScopeBar + DataTable with per-booking revenue rows + CSV export
4. Update `Accounting.tsx` — route `view === "reports"` to `<ReportsModule />`

### Phase 2: Booking Cash Flow Report
**Files:** `BookingCashFlowReport.tsx`
**Effort:** ~45 min

1. Create `BookingCashFlowReport.tsx` — per-booking cash in/out/net table
2. Merge billing, expense, and collection data by booking
3. Add margin % color coding and Net Cash conditional coloring
4. CSV export

### Phase 3: Receivables Aging Report
**Files:** `ReceivablesAgingReport.tsx`
**Effort:** ~45 min

1. Create `ReceivablesAgingReport.tsx` — per-invoice aging table
2. Compute aging buckets from `due_date`
3. Add aging summary strip (compact horizontal bar)
4. Group-by-customer accordion view
5. Bucket quick-filter pills
6. CSV export

### Phase 4: Collections Report
**Files:** `CollectionsReport.tsx`
**Effort:** ~30 min

1. Create `CollectionsReport.tsx` — per-collection table
2. ScopeBar for date range
3. Payment method breakdown in KPI area
4. Group-by-customer and group-by-method toggles
5. CSV export

### Phase 5: Unbilled Revenue Report
**Files:** `UnbilledRevenueReport.tsx`
**Effort:** ~30 min

1. Create `UnbilledRevenueReport.tsx` — per-billing-item table (unbilled only)
2. Group by Customer → Booking (nested)
3. "Days Pending" urgency indicators
4. "Create Invoice" CTA per customer group
5. CSV export

### Phase 6: Polish + Integration
**Effort:** ~30 min

1. Print-friendly styling (`@media print` considerations in report layouts)
2. Empty state illustrations per report
3. Cross-linking: dashboard "View" links navigate to specific reports
4. Deprecate old `FinancialHealthPage` (redirect or remove)

---

## Design Patterns (Consistent Across All Reports)

### KPI Card Pattern
```
┌─────────────────────────────┐
│ LABEL (12px, uppercase,     │
│         muted, tracking)    │
│                     [icon]  │
│ ₱1,234,567 (22px, bold)    │
│ Period · N items (11px)     │
└─────────────────────────────┘
```
- 4 cards in a grid row
- Same pattern as `FinancialHealthPage` summary cards
- Colored backgrounds matching severity/purpose

### Control Bar Pattern
```
[🔍 Search...                    ] [Group By ▼] [Export CSV]
```
- Search input with `Search` icon (left)
- Optional group-by dropdown
- Export button (teal bg, white text)
- ScopeBar sits above the control bar (for reports that need date filtering)

### Table Pattern
- Uses `DataTable` component from `/components/common/DataTable.tsx`
- `footerSummary` prop for totals row
- `onRowClick` for drill-down (future)
- Fixed column widths for alignment
- Tabular-nums for all number columns

### CSV Export Pattern
- Same pattern as `FinancialHealthPage.handleExport()`
- Headers → data rows → totals row
- Download as `{report-name}-{date-range}.csv`

---

## Important Notes

1. **No new API endpoints.** All reports use existing endpoints. Data computation happens client-side.
2. **Collections-to-booking linkage** has been hardened via the Financial Linkage Hardening Blueprint (`FINANCIAL_LINKAGE_HARDENING_BLUEPRINT.md`). Invoices and collections now store `booking_ids[]` and `service_types[]`. Legacy records are self-healed at read time. The Booking Cash Flow report can pro-rate collections across bookings by billing weight.
3. **The admin cost (3%)** convention from `FinancialHealthPage` is carried forward to the Booking Cash Flow report.
4. **Outstanding AR is always "as of today"** — not scope-filtered. The Receivables Aging report reflects this correctly.
5. **BreakdownTabs** (`/components/accounting/dashboard/BreakdownTabs.tsx`) was preserved when removed from the dashboard (Phase 9a of the UX Overhaul) with the explicit note that it would be reused in Reports. The "By Service" and "By Customer" views could become Reports 6 and 7 in a future phase.

---

## Status

| Phase | Status | Notes |
|---|---|---|
| Phase 1: Shell + Sales Report | COMPLETE | `useReportsData.ts`, `ReportsModule.tsx`, `SalesReport.tsx` created; `Accounting.tsx` updated to route `view === "reports"` to `<ReportsModule />` |
| Phase 2: Booking Cash Flow | NOT STARTED | |
| Phase 3: Receivables Aging | NOT STARTED | |
| Phase 4: Collections | NOT STARTED | |
| Phase 5: Unbilled Revenue | NOT STARTED | |
| Phase 6: Polish + Integration | NOT STARTED | |

## Change Log

- Blueprint created with 5 reports, 6 phases
- **Pre-requisite completed:** Financial Linkage Hardening (Phases 1-3) — invoices and collections now carry `booking_ids[]` and `service_types[]`, closing the Collection → Booking traceability gap that would have made the Booking Cash Flow Report unreliable
- **Phase 1 complete:** Created `useReportsData.ts` (shared parallel-fetch hook returning raw arrays), `ReportsModule.tsx` (sidebar shell with 5 report entries, "Coming soon" states for Phases 2-5), `SalesReport.tsx` (per-booking revenue with 4 KPI cards, ScopeBar, search, group-by Customer/Service Type, DataTable with footer summary, CSV export). Updated `Accounting.tsx` to route directly to `<ReportsModule />` for both Essentials and Full Suite modes. Old `FinancialHealthPage` and `FinancialReports` imports preserved but no longer routed.