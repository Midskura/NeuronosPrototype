# Row-Click Navigation Fix — Live Blueprint

> **Created:** 2026-03-11
> **Status:** COMPLETE — Round 1 (Navigation Fix) + Round 2 (Record-Level Deep-Link) + Round 3 (Homebase UX)
> **Scope:** Fix broken row-click navigation + deep-link to the actual record within its tab + homebase UX improvements

---

## Round 1: Fix Broken Navigation (COMPLETE)

Phases 1–4c fixed the semantic conflation between `project_number`/`booking_id` and added
lineage-aware routing + module-level deep-links (`?project=`, `?contract=`, `?booking=`, `?tab=`).

| Phase | Status | Summary |
|---|---|---|
| 1 — Server field separation | COMPLETE | `enrichRecords` no longer cross-contaminates fields. Added `has_project` flag. |
| 2 — Expense mapper fix | COMPLETE | `bookingId` no longer falls back to `project_number`. |
| 3 — Smart `handleRowClick` | COMPLETE | Lineage-aware routing (project → contract → booking → toast). `getRefDisplay` helper. |
| 4a — ProjectsModule `?tab=` | COMPLETE | Reads `?tab=`, passes `initialTab` to ProjectDetail. |
| 4b — ContractsModule `?contract=` | COMPLETE | Deep-link auto-selects contract. |
| 4c — BookingsShell `?booking=` | COMPLETE | Service type auto-detection from ID prefix. |

---

## Round 2: Record-Level Deep-Link ("Goes to the file itself")

### Routing Map

| Financials Tab | Destination | Target Tab | Record Action |
|---|---|---|---|
| **Billings** (has project) | ProjectDetail | `billings` | Highlight + scroll to billing item |
| **Billings** (booking only) | BookingDetail | `billings` | Highlight + scroll to billing item |
| **Invoices** (has project) | ProjectDetail | `invoices` | Auto-open invoice in SidePanel |
| **Invoices** (has contract) | ContractDetail | `invoices` | Auto-open invoice in SidePanel |
| **Collections** (has project) | ProjectDetail | `collections` | Auto-select collection |
| **Collections** (has contract) | ContractDetail | `collections` | Auto-select collection |
| **Expenses** (any) | BookingDetail | `expenses` | Highlight + scroll to expense |

### Deep-Link URL Shape

```
/accounting/projects?project=PROJ-2025-001&tab=invoices&highlight=INV-2025-0284
/accounting/contracts?contract=QN-2025-099&tab=collections&highlight=COL-xxx
/accounting/bookings?booking=FWD-2025-001&tab=expenses&highlight=EXP-xxx
```

---

### Phase A: Add `&highlight=` to handleRowClick
**File:** `FinancialsModule.tsx`
**Status:** COMPLETE

Append `&highlight=<item.id>` to every navigation URL. Expenses now always route to
booking (not project) with `tab=expenses`, matching the data model rule that expenses
are booked against individual bookings.

---

### Phase B: Thread `highlightId` through ProjectsModule → ProjectDetail → tabs
**Files:** `ProjectsModule.tsx`, `ProjectDetail.tsx`, `ProjectBillings.tsx`, `ProjectInvoices.tsx`, `ProjectCollectionsTab.tsx`
**Status:** COMPLETE

- ProjectsModule reads `?highlight=` and passes to ProjectDetail
- ProjectDetail accepts `highlightId` and passes to the active tab component
- Each Project tab wrapper passes `highlightId` to its Unified component

---

### Phase C: UnifiedInvoicesTab — auto-open on `highlightId`
**File:** `UnifiedInvoicesTab.tsx`
**Status:** COMPLETE

Accept `highlightId` prop. On mount, if an invoice matches by `id` or `invoice_number`,
calls `setSelectedInvoice` + `setInterfaceMode('view')` to auto-open the SidePanel.
Uses `highlightConsumed` flag to prevent re-triggering.

---

### Phase D: UnifiedCollectionsTab — auto-select on `highlightId`
**File:** `UnifiedCollectionsTab.tsx`
**Status:** COMPLETE

Accept `highlightId` prop. On mount, if a collection matches by `id`, auto-selects it
and opens the view panel. Uses `highlightConsumed` flag.

---

### Phase E: UnifiedBillingsTab — highlight row on `highlightId`
**File:** `UnifiedBillingsTab.tsx`, `BillingsTable.tsx`
**Status:** COMPLETE

Accept `highlightId` prop. BillingsTable wraps matching row in a div with `ring-2 ring-[#0F766E]`
highlight + `scrollIntoView({ behavior: "smooth", block: "center" })` on mount.

---

### Phase F: ContractDetailView — `initialTab` + `highlightId`
**Files:** `ContractDetailView.tsx`, `ContractsModule.tsx`
**Status:** COMPLETE

- ContractsModule reads `?tab=` + `?highlight=` and passes to ContractDetailView
- ContractDetailView accepts `initialTab` and `highlightId`, passes to tab components
- Invoices and Collections tabs receive `highlightId` for auto-open

---

### Phase G: Booking detail views — `initialTab` + `highlightId` for expenses
**Files:** `AccountingBookingsShell.tsx`, `ForwardingBookings.tsx`, `ForwardingBookingDetails.tsx`,
`BrokerageBookings.tsx`, `BrokerageBookingDetails.tsx`, `TruckingBookings.tsx`,
`TruckingBookingDetails.tsx`, `MarineInsuranceBookings.tsx`, `MarineInsuranceBookingDetails.tsx`,
`OthersBookings.tsx`, `OthersBookingDetails.tsx`, `ExpensesTab.tsx`,
`UnifiedExpensesTab.tsx`, `ExpensesTable.tsx`
**Status:** COMPLETE

- AccountingBookingsShell reads `?tab=` + `?highlight=` and passes `pendingBookingId`,
  `pendingTab`, `pendingHighlightId` to child list components
- Each booking list component accepts `pendingBookingId` to auto-open detail view
- Each booking detail view accepts `initialTab` (defaults to `booking-info`, switches to
  `expenses` or `billings`) and `highlightId`
- ExpensesTab → UnifiedExpensesTab → ExpensesTable all accept `highlightId`
- ExpensesTable highlights matching row with `ring-2 ring-[#0F766E]` + auto-scroll

---

## Round 3: Homebase UX Improvements

### Status Filter Completeness

- **Invoices:** 5 statuses
- **Collections:** +Voided
- **Expenses:** +Draft/Approved/Rejected

### Grand Total Footer + CSV Export

- Added grand total footer to `GroupedDataTable`
- Added CSV export functionality to `GroupedDataTable`

### Quick-Action Buttons in Dashboard

- Added quick-action buttons to the Dashboard for common tasks

### Expenses Icon Fix

- Fixed the expenses icon to use the Wallet icon

---

## Change Log

| Date | Phase | What changed |
|---|---|---|
| 2026-03-11 | — | Blueprint created |
| 2026-03-11 | Phase 1 | Fixed `enrichRecords` — fields no longer cross-contaminate. Added `has_project` flag. |
| 2026-03-11 | Phase 2 | Fixed expense mapper — `bookingId` no longer falls back to `project_number`. |
| 2026-03-11 | Phase 3 | Replaced `handleRowClick` with lineage-aware routing. Added helpers. Fixed Ref # columns. |
| 2026-03-11 | Phase 4a | ProjectsModule reads `?tab=`, passes `initialTab` to ProjectDetail. |
| 2026-03-11 | Phase 4b | ContractsModule `?contract=` deep-link. |
| 2026-03-11 | Phase 4c | AccountingBookingsShell `?booking=` deep-link with service type detection. |
| 2026-03-11 | — | **Round 2 blueprint added** — Phases A–G for record-level deep-linking. |
| 2026-03-11 | Phase A | `handleRowClick` appends `&highlight=<id>` to all URLs. Expenses always route to booking. |
| 2026-03-11 | Phase B | `highlightId` threaded ProjectsModule → ProjectDetail → tab wrappers. |
| 2026-03-11 | Phase C | UnifiedInvoicesTab auto-opens invoice SidePanel on `highlightId` match. |
| 2026-03-11 | Phase D | UnifiedCollectionsTab auto-selects collection on `highlightId` match. |
| 2026-03-11 | Phase E | BillingsTable highlights + scrolls to matching row on `highlightId`. |
| 2026-03-11 | Phase F | ContractsModule reads `?tab=`+`?highlight=`, ContractDetailView uses `initialTab`+`highlightId`. |
| 2026-03-11 | Phase G | Full booking chain wired: Shell → List (auto-select) → Detail (`initialTab`) → ExpensesTab/BillingsTab (`highlightId`). All 5 service types covered. |
| 2026-03-11 | Homebase UX | Status filter completeness: Invoices (5 statuses), Collections (+Voided), Expenses (+Draft/Approved/Rejected). Grand total footer + CSV export in GroupedDataTable. Quick-action buttons in Dashboard. Expenses icon fixed (Wallet). |