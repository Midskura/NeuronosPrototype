# Financial Dashboard Redesign Blueprint

## Overview
Replace the current `ProjectFinancialOverview`-based dashboard tab in `FinancialsModule.tsx` with a purpose-built, 6-zone company-wide financial dashboard designed for asset-light freight forwarding SMEs.

**Current state:** The dashboard tab reuses the project-level `ProjectFinancialOverview` component + a mini `AgingStrip`. It only shows margin, income/cost bars, open/overdue/paid, and category breakdowns — insufficient for company-wide financial oversight.

**Target state:** A dedicated `FinancialDashboard.tsx` component with 6 information zones ordered by priority, using progressive disclosure and period-over-period comparisons.

---

## Architecture

### New files
| File | Purpose |
|------|---------|
| `/components/accounting/dashboard/FinancialDashboard.tsx` | Main dashboard orchestrator — receives all raw data + scope, computes derived metrics, renders 6 zones |
| `/components/accounting/dashboard/VitalSignsStrip.tsx` | Zone 1 — 5 hero KPI cards with delta badges |
| `/components/accounting/dashboard/CashFlowWaterfall.tsx` | Zone 2L — Recharts waterfall chart |
| `/components/accounting/dashboard/RevenueTrendChart.tsx` | Zone 2R — 6-month revenue bar + margin line |
| `/components/accounting/dashboard/ReceivablesAgingBar.tsx` | Zone 3 — Full-width proportional AR aging bar |
| `/components/accounting/dashboard/ServiceProfitability.tsx` | Zone 4L — Revenue/cost/margin by service type |
| `/components/accounting/dashboard/TopCustomers.tsx` | Zone 4R — Top 5 customers ranked bar chart |
| `/components/accounting/dashboard/IncomeVsCostBreakdown.tsx` | Zone 5 — Improved dual breakdown tables |
| `/components/accounting/dashboard/AttentionPanel.tsx` | Zone 6 — Actionable alert strip |

### Modified files
| File | Change |
|------|--------|
| `FinancialsModule.tsx` | Dashboard tab renders `<FinancialDashboard>` instead of `<ProjectFinancialOverview>` + inline `<AgingStrip>` |

### Data flow
All raw data is already fetched in `FinancialsModule.tsx` (billingItems, invoices, collections, expenses). The `FinancialDashboard` component receives these as props along with the `scope` and `onScopeChange`. It computes all derived metrics internally. No new API calls needed.

### Previous-period comparison
To show "vs last period" deltas, the dashboard will compute a `previousScope` (same duration, shifted back) and filter data through both scopes. For example, if scope = "this-month" (Mar 1-31), previousScope = Feb 1-28.

---

## Phased Plan

### Phase 1: Foundation + Zone 1 (Vital Signs) + Zone 6 (Attention Panel)
**Status: COMPLETE**

**Scope:**
- Create `/components/accounting/dashboard/` directory
- Create `FinancialDashboard.tsx` — main wrapper with ScopeBar + zone layout
- Create `VitalSignsStrip.tsx` — 5 KPI cards: Net Revenue, Net Profit/Margin, Cash Collected, Outstanding AR (with DSO), Pending Expenses. Each card shows value, delta vs previous period (▲/▼ with color), subtext.
- Create `AttentionPanel.tsx` — Compact alert strip with 4 rows: overdue invoices, unbilled charges, pending expenses, collection rate vs 80% target. Each row: severity dot, label, amount, "View" click handler.
- Wire into `FinancialsModule.tsx` dashboard tab (replace `ProjectFinancialOverview` + inline `AgingStrip`)
- Keep the `ScopeBar` at the top of the dashboard

**Files to create:**
- `/components/accounting/dashboard/FinancialDashboard.tsx`
- `/components/accounting/dashboard/VitalSignsStrip.tsx`
- `/components/accounting/dashboard/AttentionPanel.tsx`

**Files to modify:**
- `/components/accounting/FinancialsModule.tsx` (dashboard tab render block only)

**Implementation notes:**
- DSO = (Outstanding AR / Total Revenue) x Days in Period
- Previous-period helper: `createPreviousScope(scope)` shifts from/to back by the same duration
- Delta display: green ▲ for improvements (revenue up, expenses down), red ▼ for regressions

---

### Phase 2: Zone 3 (Receivables Aging) + Zone 4 (Service P&L + Top Customers)
**Status: COMPLETE**

**Scope:**
- Create `ReceivablesAgingBar.tsx` — Full-width horizontal stacked bar, 5 segments (Current → 90+), proportional widths, color-coded teal→red. Shows amount + count per segment. Clickable: navigates to Invoices tab filtered by bucket. Below bar: DSO trend (optional sparkline or just the number).
- Create `ServiceProfitability.tsx` — Table with rows per service type (Forwarding, Brokerage, Trucking, Marine Insurance, Others). Columns: Revenue, Costs, Margin ₱, Margin %. Derive service type from `service_type` or `quotation_category` fields. Highlight low-margin services with warning colors.
- Create `TopCustomers.tsx` — Top 5 customers by revenue. Horizontal bar chart (proportional bars) with customer name, amount, and % of total revenue. Concentration risk highlight if any customer > 40%.

**Files to create:**
- `/components/accounting/dashboard/ReceivablesAgingBar.tsx`
- `/components/accounting/dashboard/ServiceProfitability.tsx`
- `/components/accounting/dashboard/TopCustomers.tsx`

**Files to modify:**
- `/components/accounting/dashboard/FinancialDashboard.tsx` (add Zone 3 + Zone 4)

**Data notes:**
- Aging: reuse existing `getAgingDays`/`getAgingBucketLabel` logic from `FinancialsModule.tsx`
- Service type: derive from billing item `service_type` or `quotation_category`. Map to 5 service categories.
- Customer revenue: aggregate by `customer_name` across invoices/billing items

---

### Phase 3: Zone 2 (Cash Flow Waterfall + Revenue Trend) + Zone 5 (Breakdowns)
**Status: COMPLETE**

**Scope:**
- Create `CashFlowWaterfall.tsx` — Recharts waterfall: Starting (collections carry-forward) → +Collections → −Expenses → = Net Cash Position. Uses `BarChart` with calculated intermediate totals. Green for inflows, red for outflows, gray for net.
- Create `RevenueTrendChart.tsx` — 6-month lookback. Recharts `ComposedChart` with stacked bars (revenue by service type) + line overlay (profit margin %). X-axis = months. Responsive.
- Create `IncomeVsCostBreakdown.tsx` — Improved version of current breakdown: two side-by-side cards with category tables. Add a mini margin bar between them showing the gap visually. Keep the existing table style but add percentage-of-total column.

**Files to create:**
- `/components/accounting/dashboard/CashFlowWaterfall.tsx`
- `/components/accounting/dashboard/RevenueTrendChart.tsx`
- `/components/accounting/dashboard/IncomeVsCostBreakdown.tsx`

**Files to modify:**
- `/components/accounting/dashboard/FinancialDashboard.tsx` (add Zone 2 + Zone 5)

**Dependencies:**
- `recharts` (already available in project)

---

## Completion Checklist

| Phase | Zone(s) | Status | Browser Verified |
|-------|---------|--------|-----------------|
| Phase 1 | Z1 Vital Signs + Z6 Attention | COMPLETE | PENDING |
| Phase 2 | Z3 Aging + Z4 Service P&L / Top Customers | COMPLETE | PENDING |
| Phase 3 | Z2 Waterfall / Trend + Z5 Breakdowns | COMPLETE | PENDING |

---

## Design Tokens (Neuron Style)

- Primary green: `#12332B` (ink), `#0F766E` (brand teal)
- Severity: success `#16A34A`, warning `#D97706`, danger `#EF4444`
- Borders: `var(--neuron-ui-border)` / `#E5E9F0`
- Background: white cards on `var(--neuron-bg-page)` 
- Text: primary `#12332B`, secondary `#667085`, muted `#9CA3AF`
- Delta badges: green `#DCFCE7`/`#16A34A` (positive), red `#FEE2E2`/`#EF4444` (negative), gray for flat
- Card radius: `rounded-xl` (12px)
- Card border: `1px solid #E5E9F0`

---

## Notes
- `ProjectFinancialOverview` is NOT deleted — it's still used in the project-level detail view. Only the dashboard tab stops importing it.
- The `AgingStrip` component continues to exist for the `GroupingToolbar` aging dropdown — we just build a better full-width version for the dashboard.
- All computations are client-side from already-fetched data. No new server endpoints.