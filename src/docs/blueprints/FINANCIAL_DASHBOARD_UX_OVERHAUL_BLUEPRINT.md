# Financial Dashboard UX Overhaul Blueprint

## Overview
7-phase UX overhaul of `FinancialDashboard.tsx` and its zone components, inspired by
Bankio reference analysis but purpose-built for Neuron OS freight-forwarding ERP.

## Affected Files
- `/components/accounting/dashboard/FinancialDashboard.tsx` — main orchestrator
- `/components/accounting/dashboard/VitalSignsStrip.tsx` — Zone 1 KPIs
- `/components/accounting/dashboard/AttentionPanel.tsx` — Zone 6 → promoted to Zone 2
- `/components/accounting/dashboard/RevenueTrendChart.tsx` — Zone 2R chart
- `/components/accounting/dashboard/ServiceProfitability.tsx` — Zone 4L
- `/components/accounting/dashboard/TopCustomers.tsx` — Zone 4R
- `/components/accounting/dashboard/IncomeVsCostBreakdown.tsx` — Zone 5
- `/components/accounting/dashboard/ReceivablesAgingBar.tsx` — Zone 3
- `/components/accounting/dashboard/CashFlowWaterfall.tsx` — Zone 2L chart

## Design Tokens (Neuron OS)
- Deep green: `#12332B`
- Teal accent: `#0F766E`
- Border: `#E5E9F0`
- Muted text: `#667085`
- Card bg: `white`
- Section header bg: `#F8F9FB`

---

## Phase 1: Asymmetric 2+3 KPI Layout with Dark Hero Card ✅ COMPLETE
**Files:** `VitalSignsStrip.tsx`, `FinancialDashboard.tsx`
**Changes:**
- Replace 5-equal-column grid with 2-tier layout
- Top row: 2 hero cards (Net Revenue white, Net Profit dark green `#12332B` bg)
  - 36px values, larger delta badges
- Bottom row: 3 compact cards (Cash Collected, Outstanding AR, Pending Expenses)
  - 22px values, utilitarian style
- Mark first 2 signs as `hero: true` in the data array
- Loading skeleton updated to match new layout

## Phase 2: Move Attention Panel to Zone 2 ✅ COMPLETE
**Files:** `AttentionPanel.tsx`, `FinancialDashboard.tsx`
**Changes:**
- Move `<AttentionPanel>` from Zone 6 (bottom) to directly after VitalSignsStrip
- Make collapsible: collapsed by default if all items are `success`/`info` severity
- Auto-expand if any `danger`/`warning` items exist
- Collapsed state shows single-line summary: "X items need attention"
- Add expand/collapse toggle chevron

## Phase 3: Consolidate Zones 4+5 → Tabbed Breakdown ✅ COMPLETE
**Files:** New `BreakdownTabs.tsx`, `FinancialDashboard.tsx`
- Remove separate ServiceProfitability + TopCustomers + IncomeVsCostBreakdown zones
- Create single `BreakdownTabs` component with 3 tab pills:
  `[ By Service | By Customer | By Category ]`
- "By Service" → ServiceProfitability table (inlined or imported)
- "By Customer" → TopCustomers horizontal bars (inlined or imported)
- "By Category" → Simplified Income vs Cost comparison bars + single unified table
- Reduces vertical scroll by ~400px

## Phase 4: Revenue Trend — Period Toggle + Stacked Bars ✅ COMPLETE
**Files:** `RevenueTrendChart.tsx`
**Changes:**
- Add period toggle pills in card header: `6M | 12M | YTD`
- Convert from revenue-only bars to stacked Revenue (teal) + Expenses (orange) bars
- Show margin % label on each bar
- Add richer hover state: mini P&L card (Revenue, Expenses, Margin)

## Phase 5: Contextual Summary Line ✅ COMPLETE
**Files:** `FinancialDashboard.tsx`
**Changes:**
- Add single-line data-driven summary between ScopeBar and KPIs
- Format: "This period: ₱X.XM revenue across Y projects · Z customers · W% collection rate"
- 13px, color #667085, updates reactively with scope changes
- Computed from scoped data already available in FinancialDashboard

## Phase 6: "View →" Section Affordances ✅ COMPLETE
**Files:** `ReceivablesAgingBar.tsx`, `CashFlowWaterfall.tsx`, `RevenueTrendChart.tsx`,
          `BreakdownTabs.tsx` (new from Phase 3), `FinancialDashboard.tsx`
**Changes:**
- Add "View →" link (right-aligned, teal #0F766E, 12px) to section headers
- Each links to relevant Financials tab via `onNavigateTab`
- Subtle hover border-color shift on card containers
- Pass `onNavigateTab` to all zone components that need it

## Phase 7: Aging Trend Indicators ✅ COMPLETE
**Files:** `ReceivablesAgingBar.tsx`, `FinancialDashboard.tsx`
**Changes:**
- Accept `previousInvoices` prop (previous-period invoices)
- Compute aging buckets for previous period
- Show ↑/↓ trend arrow per bucket with red/green color
- Arrow shows direction of change (growing = bad for overdue buckets)

## Phase 8: Receivables Aging — Clarity & Inline Drill-Down ✅ COMPLETE
**Files:** `ReceivablesAgingBar.tsx`
**Changes:**
### Phase 8a: Clarity & Polish
- Added "As of [date]" chip with calendar icon next to header (clarifies scope-independence)
- Promoted total outstanding amount to prominent 18px callout in header row with invoice count
- DSO badge now uses severity coloring: teal (≤30d), amber (31–60d), red (61+d)

### Phase 8b: Visual Redesign — Horizontal Row-Based Chart
- **Replaced** the proportional stacked bar + 5 legend cards with **5 horizontal rows**
- Each row: colored square dot → label (fixed 76px) → proportional horizontal bar → amount → count → share % → trend arrow → expand chevron
- Bars are proportional to the **largest bucket** (not total), so smaller amounts remain visible
- Zero-amount buckets show a muted gray placeholder with em-dash — visually quiet, no wasted attention
- Severity color gradient runs vertically: teal (Current) → amber → orange → red → dark red (90d+)
- All columns are fixed-width for perfect vertical alignment

### Phase 8c: Inline Drill-Down (integrated into rows)
- Click any non-empty row → drill-down panel expands **directly below that row** (not at card bottom)
- Panel shows up to 5 invoices sorted by largest balance: invoice number, customer, due date, overdue badge, amount
- "View all in Invoices →" link for full navigation
- Accordion-style: only one row open at a time
- Expanded row gets bucket's bgLight background + colored chevron rotated 90°

### Phase 8d: Unbilled / Pending Billings Row ✅ COMPLETE
- Added `unbilledItems` and `onUnbilledClick` props to `ReceivablesAgingBar`
- **Unbilled row** renders above aging buckets with distinct visual treatment:
  - Muted gray color (`#667085`) — separate color family from teal→red aging spectrum
  - Open circle dot (vs. filled squares for aging) signals "pre-invoice" category
  - Solid bar pattern distinguishes from solid aging bars
  - Count label says "bkgs" (bookings) since drill-down is grouped by booking
  - Share % column shows "—" (unbilled isn't part of AR share calculation)
- **Dashed divider** separates unbilled from aging rows — visual boundary between stages
- **Header split totals**: "Billed: PHP X (N)" · "Unbilled: PHP Y (M bkgs)" — CFO sees both at a glance, count reflects unique bookings
- **Unbilled drill-down**: click row to expand accordion showing top 5 **bookings** (grouped from billing items) by unbilled amount
  - Each row: `BookingID · Customer · ₱Amount`
  - Multi-charge bookings show a "N charges" badge for context
  - Groups billing items by `booking_id` → aggregates unbilled amounts per booking
  - **Filters out project-number fallbacks** (PROJ-/PRJ- prefixed IDs) — projects are containers, not billable entities. The server enrichment falls back `booking_id` to `project_number` when no real booking exists; these are excluded from the drill-down so only actionable bookings appear
  - Reframes the drill-down as an **actionable work queue** — accounting sees which bookings need billing attention
  - Supports partial billing: only unbilled charges contribute to each booking's total
  - "View all in Billings →" navigation preserved
- **Bar scaling** includes unbilled amount in `maxBucketAmount` for honest proportions
- `FinancialDashboard.tsx` passes `billingItems.filter(status === "unbilled")` and wires click to `onNavigateTab("billings")`
- Empty state updated: card only shows "No outstanding receivables" if both billed AND unbilled are zero

---

## Current Status
**✅ Phases 1–9 COMPLETE** — Full actionability overhaul finished (9a–9e).

## Change Log
- Phase 1 implemented: Asymmetric 2+3 KPI layout with dark hero card
- Phase 2 implemented: Attention Panel promoted to Zone 2, collapsible
- Phase 3 implemented: Zones 4+5 consolidated into BreakdownTabs
- Phase 4 implemented: Revenue Trend with period toggle + stacked bars
- Phase 5 implemented: Contextual summary line
- Phase 6 implemented: "View →" section affordances on all zone components
- Phase 7 implemented: Aging trend indicators with previous-period comparison
- Phase 8 implemented: Receivables Aging full redesign — horizontal row-based chart with inline drill-down, replacing stacked bar + legend cards
- Phase 8d implemented: Unbilled / Pending Billings row with booking-grouped drill-down — groups billing items by booking_id so accounting sees bookings as an actionable work queue instead of raw billing file IDs. Filters out PROJ-prefixed project fallbacks from drill-down rows.
- Phase 9a implemented: Removed BreakdownTabs (Zone 5) from dashboard — component file preserved for future Reports module.
- Phase 9b implemented: Clickable Vital Signs — each card is a launchpad with hover lift effect + teal click hint text. Cards navigate to billings/collections/invoices/expenses tabs.
- Phase 9c implemented: Attention Panel redesigned as Action Items queue — verb-based CTAs ("Follow Up", "Create Invoice", "View Uncollected"), two-line items with detail lines showing the oldest/largest actionable data point, per-session dismiss with collapsed "Dismissed" section.
- Phase 9d implemented: Inline micro-actions on Receivables Aging drill-down rows — "Record Payment" and "Send Reminder" on invoice rows (hover-reveal ghost buttons), "Create Invoice" on unbilled booking rows. Send Reminder copies a pre-formatted message to clipboard with toast confirmation.
- Phase 9e implemented: P&L Trend anomaly insight line — auto-generated single-line insight comparing each month's expenses to 3-month moving average, surfacing the worst anomaly with top category breakdown. Shows "tracking within normal range" when no anomalies detected.

---

## Phase 9: Actionability Overhaul

**Goal:** Transform the dashboard from a "report you read" into a "command center you operate from." Every zone should connect to an action within 2 clicks: Data → Insight → Action.

**Design principle:** The dashboard should support the accounting team's morning workflow:
1. Glance at Vital Signs (5s) → 2. Scan Action Items (10s) → 3. Click a verb CTA → start working (30s)

### Phase 9a: Remove Zone 5 (BreakdownTabs) ✅ COMPLETE
**Files:** `FinancialDashboard.tsx`
**Changes:**
- Remove `<BreakdownTabs>` rendering and its import from the dashboard layout
- The BreakdownTabs component file stays in the codebase (future Reports module will reuse it)
- Dashboard reduces to 4 zones: Vital Signs → Attention Panel → P&L Trend → Receivables Aging
- This is a clean removal — no other component depends on BreakdownTabs being in the dashboard

**Rationale:** Breakdown answers "how is revenue distributed?" — a quarterly review / reporting question, not a daily operational one. It belongs in a Reports module with full-page tables, date range pickers, and export capabilities.

### Phase 9b: Clickable Vital Signs ✅ COMPLETE
**Files:** `VitalSignsStrip.tsx`, `FinancialDashboard.tsx`
**Changes:**
- Add `onCardClick?: () => void` to `VitalSign` interface
- HeroCard + CompactCard: wrap in a clickable container when `onCardClick` is present
  - Hover state: slight translateY(-1px) lift + shadow-sm transition + cursor:pointer
  - Micro-label appears on hover below subtext: "View invoices →" (13px, teal, opacity transition)
- In `FinancialDashboard.tsx`, wire each vital sign's `onCardClick`:

| Card | Click Destination |
|---|---|
| Net Revenue | `onNavigateTab("billings")` |
| Net Profit | `onNavigateTab("billings")` (revenue vs cost context) |
| Cash Collected | `onNavigateTab("collections")` |
| Outstanding AR | `onNavigateTab("invoices")` |
| Total Expenses | `onNavigateTab("expenses")` |

- Add `clickHint` string field to VitalSign for the hover micro-label text (e.g. "View billings →", "View unpaid invoices →")

### Phase 9c: Attention Panel → Action Items Queue ✅ COMPLETE
**Files:** `AttentionPanel.tsx`, `FinancialDashboard.tsx`
**Changes:**
- Rename header from "Attention Required" to "Action Items"
- Expand `AttentionItem` interface:
  - Add `detailLine?: string` — second line showing the most important specific detail
  - Add `actionLabel2?: string` + `onAction2?: () => void` — secondary action (e.g. "Dismiss")
  - Rename existing `actionLabel` values from "View" to verb-based CTAs
- Redesign each alert row to two-line format:
  ```
  🔴 Follow up on 3 overdue invoices (₱480K)
     Oldest: INV-2024-0284 — Delta Corp — 47 days
                                    [Follow Up] [Dismiss]
  ```
- Line 1: issue summary (existing `label`) + amount badge (existing `detail`)
- Line 2: `detailLine` — the single most actionable data point (oldest invoice, largest unbilled booking, etc.)
- CTA buttons: primary verb button (teal bg, white text, 11px) + optional secondary "Dismiss" (ghost, gray)
- In `FinancialDashboard.tsx`, compute `detailLine` for each attention item:
  - Overdue invoices → find the oldest/largest: "Oldest: {invNumber} — {customer} — {days}d"
  - Unbilled charges → find the largest booking: "Largest: {bookingId} — ₱{amount} — {customer}"
  - Collection rate (below target) → show gap: "₱{uncollected} uncollected from {count} invoices"
- Update CTA labels:
  - "View" → "Follow Up" (overdue invoices)
  - "View" → "Create Invoice" (unbilled charges)
  - "View" → "View Uncollected" (low collection rate)
- Success items (collection rate ≥ 80%) keep no CTA — they're reassurance, not tasks
- Dismiss functionality: local state (per session), dismissed items move to a collapsed "Dismissed (N)" section at the bottom

### Phase 9d: Receivables Aging — Inline Micro-Actions ✅ COMPLETE
**Files:** `ReceivablesAgingBar.tsx`
**Changes:**
- Add action buttons to each invoice row in `InvoiceDrillDown`:
  ```
  INV-2024-0284 · Delta Corp · ₱180,000 · 47d overdue
                              [Record Payment]  [Send Reminder]  [View ↗]
  ```
  - **Record Payment** — calls `onRecordPayment?.(invoiceId)` prop callback (parent handles modal/navigation)
  - **Send Reminder** — calls `onSendReminder?.(invoice)` prop callback (parent can copy template to clipboard or navigate to a communication flow)
  - **View ↗** — existing navigation behavior (`onBucketClick`)
- Add action buttons to each booking row in `UnbilledDrillDown`:
  ```
  BK-2024-0847 · Acme Corp · ₱82,000 · 3 charges
                                      [Create Invoice]  [View ↗]
  ```
  - **Create Invoice** — calls `onCreateInvoice?.(bookingId)` prop callback
  - **View ↗** — existing `onUnbilledClick` navigation
- Button styling: ghost buttons, 10px text, teal color, appear on row hover (opacity-0 → opacity-100 transition), always visible on touch devices
- New props on `ReceivablesAgingBar`:
  - `onRecordPayment?: (invoiceId: string) => void`
  - `onSendReminder?: (invoice: any) => void`
  - `onCreateInvoice?: (bookingId: string) => void`
- In `FinancialDashboard.tsx`, wire these props:
  - `onRecordPayment` → `onNavigateTab("collections")` (initial implementation — future: inline modal)
  - `onSendReminder` → copy a pre-formatted reminder to clipboard via `navigator.clipboard.writeText()` + toast confirmation
  - `onCreateInvoice` → `onNavigateTab("billings")` (initial implementation — future: pre-filled invoice flow)

### Phase 9e: P&L Trend — Anomaly Insight Line ✅ COMPLETE
**Files:** `PLTrendCard.tsx`
**Changes:**
- Add a single auto-generated insight line below the chart (13px, #667085)
- Logic: compare each month's expenses to the 3-month moving average. If any month deviates 30%+, generate:
  "📊 Expenses in {month} were {X}% above your 3-month average — primarily from {topCategory} (₱{amount})."
- If no anomaly, show a neutral insight: "Expenses are tracking within normal range."
- The insight line is NOT clickable in this phase (future: click → filtered expense view)
- Uses expense data already available in the component

---

### Implementation Order

| Sub-phase | Effort | Dependencies |
|---|---|---|
| **9a** Remove BreakdownTabs | 5 min | None |
| **9b** Clickable Vital Signs | 20 min | None |
| **9c** Attention Panel redesign | 30 min | None |
| **9d** Aging inline actions | 30 min | None |
| **9e** P&L anomaly insight | 15 min | None |

All sub-phases are independent — can be implemented in any order.
Recommended: 9a → 9b → 9c → 9d → 9e (least to most complex)