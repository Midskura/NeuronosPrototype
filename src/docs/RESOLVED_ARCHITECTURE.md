# Resolved Architecture — Neuron OS Convergence

> **What this is**: The settled architectural decisions from the Essentials / Full Suite convergence diagnostic (March 2026). This is not an implementation plan — it's the conceptual framework that any implementation must follow.

---

## 1. One Mode, One Baseline

The app previously had two modes: **Essentials** and **Full Suite**, toggled via `AppMode` in localStorage. The accounting module rendered entirely different components depending on which mode was active.

**Decision**: Essentials mode wins. Full Suite mode is retired.

- **FinancialsModule** (originally Essentials-only) becomes the single accounting interface
- The "New" pages (`BillingsContentNew`, `ExpensesPageNew`, `CollectionsContentNew`) are deprecated and will be removed
- The `AppMode` toggle and its fork logic in `Accounting.tsx` will be eliminated
- There is no "Full Suite" anymore — just Neuron OS

---

## 2. E-Vouchers Are for Expenses Only

E-Vouchers (EVs) are the **Accounts Payable approval workflow**. They handle the "company pays out money" side.

**What an EV is**: A request to disburse company funds. Follows a multi-step approval chain before money leaves.

**The four valid EV types** (AP side only):

| Type | What it covers |
|------|---------------|
| `expense` | Standard vendor/operational expense |
| `cash_advance` | Employee requests cash before spending |
| `reimbursement` | Employee already spent, requests payback |
| `budget_request` | Department requests allocated funds |

**Retired types**: `billing`, `collection`, `adjustment` — these were AR-side concepts that were incorrectly modeled as EVs. They no longer exist.

**The EV approval chain**:
```
draft → pending_tl → pending_ceo → pending_accounting → disbursed → posted
```

- **Team Leader** reviews first (can approve or reject)
- **CEO/Executive** approves second (can approve or reject)
- **Accounting** does final approval + GL posting (the only gate that creates a journal entry)
- **Executive department** bypasses the TL step (trusted)
- **TL delegation** is CC/notification only — not a handoff of approval authority
- **Cash advance overspend**: Employee creates a separate Reimbursement EV for the difference
- **Budget request liquidation**: Accounting creates line items per actual expense during liquidation

---

## 3. Two Billing Paths

How billing line items get created depends on whether the booking is tied to a **quotation** (spot deal) or a **contract** (long-term rate agreement).

### Path 1 — Quotation Path (auto-populated)
- Applies to: **Forwarding** (always), and any spot booking for other service types
- When a booking is created from a quotation, charges automatically convert to billing line items
- Items are editable by Accounting until an invoice is created against them (then locked)
- Operations signals completion via `RequestBillingButton` — Accounting reviews and invoices

### Path 2 — Contract Path (manually built by Accounting)
- Applies to: **Brokerage, Trucking, Marine Insurance, Others** — when linked to a contract
- No auto-population. Accounting opens the **Rate Calculator Matrix** on the contract's rate card and builds billing items manually
- Operations signals completion via `RequestBillingButton` — Accounting builds items via Rate Matrix, then invoices
- The `BookingRateCardButton` only appears when `contract_id` is present AND rate matrices exist on the contract

### How the system tells them apart
- `contract_id` FK on the booking = contract path. Absent = quotation path.
- `billing_line_items.source_type` tracks origin: `quotation_item`, `contract_rate`, `rate_card`, `billable_expense`, `manual`
- **Forwarding is always spot-only** — never has a `contract_id`. The other 4 types can be either.

---

## 4. The Role System

### Three roles, six departments

| Role | Level | Meaning |
|------|-------|---------|
| `staff` | 0 | Individual contributor |
| `team_leader` | 1 | Leads a team within a department |
| `manager` | 2 | Department head |

Departments: Business Development, Pricing, Operations, Accounting, Executive, HR.

### Executive access = department bypass
Executive users get `role = 'manager'` in the database. Their elevated access comes from being in the **Executive department**, which automatically passes all module access checks. There is no `'executive'` role tier — it's a department, not a role.

### Operations-specific labels (display only)
For Operations department users, the generic roles map to domain-specific labels:

| Role | Ops Label |
|------|-----------|
| `staff` | Handler |
| `team_leader` | Supervisor |
| `manager` | Manager |

These are **display labels only** — no separate database column. The old `operations_role` column has been dropped.

### Permission gating
- **Module access**: Department-based, with Executive bypass
- **Action gating**: Role hierarchy via `hasMinRole()` — level comparison
- **EV approval**: Inline department + role checks (to be centralized into `permissions.ts`)

---

## 5. GL Posting Is Manual

The General Ledger is populated **by explicit human action**, not by automation or triggers.

### What exists today
- **EV → GL posting**: `GLConfirmationSheet` opens when Accounting clicks "Post GL Entry & Authorize Payment." Pre-fills DR/CR accounts from `GL_CONTRACT` based on EV type. User can override. Creates a `journal_entries` record with balanced debit/credit lines.
- **GL correction**: Accounting Manager can unlock a posted EV — system auto-creates a reversing journal entry — EV returns to `pending_accounting` for re-posting.
- **Chart of Accounts**: Hierarchical account tree + per-account ledger showing all posted journal entry lines. Functional.

### What needs to be built
- **Invoice → GL posting**: DR Accounts Receivable / CR Revenue. Schema FK (`invoices.journal_entry_id`) exists. No UI.
- **Collection → GL posting**: DR Cash / CR Accounts Receivable. Schema FK (`collections.journal_entry_id`) exists. No UI.
- **Manual journal entries**: Freeform DR/CR entry for adjustments, corrections, period-end entries. Schema supports it. No UI.

### The GL_CONTRACT pattern
`GL_CONTRACT` is a lookup table that maps EV types to suggested journal entry templates. It **pre-fills** the posting form — it does NOT auto-post. The same pattern should extend to invoices and collections: suggest the standard entry, let Accounting confirm or override.

---

## 6. FinancialsModule = Accounting's Command Center

FinancialsModule is the unified accounting dashboard. It currently has 5 tabs: **Dashboard, Billings, Invoices, Collections, Expenses**.

### What it does well
- Aggregate cross-project financial view with KPI strips
- Grouping support (by booking, customer, project, contract)
- Dashboard with vital signs, P&L trends, receivables aging, service profitability

### What it's missing
FinancialsModule is currently a **read-only reporting shell**. Accounting can see numbers but can't act on them.

**Security**: All queries fetch all records with no scope filtering. The `useDataScope` hook exists but isn't connected.

**Operational capabilities needed**:
- Row click → detail view (BillingDetailsSheet for invoices/billings, CollectionDetailsSheet for collections)
- Invoice reversal workflow (exists in BillingDetailsSheet, not wired)
- Collection resolution — credit/refund recording (exists in CollectionDetailsSheet, not wired)
- Create/Add actions for each tab
- `source_type` visibility in billing tab (so Accounting can see billing origin)
- GL posting actions on invoices and collections
- Workflow ticket visibility (`LinkedTicketBadge`)

### Its rendering stack
FinancialsModule uses **its own components** — not the Unified*Tab components used at project/booking level:
- `AggregateFinancialShell` — wrapper with KPI strips, scope bars, filters
- `GroupedDataTable` — table with multi-level grouping

This is correct. The Unified tabs are project-scoped views. FinancialsModule is a company-wide aggregate view. Different concerns, different rendering.

---

## 7. The Workflow Engine

Cross-department coordination uses a **ticket-based notification system**.

### How it works
- `createWorkflowTicket()` creates a ticket with type `fyi | request | approval`
- Tickets flow between departments (BD → Pricing, Ops → Accounting, etc.)
- `RequestBillingButton` on booking detail pages = Ops telling Accounting "service done, ready to bill"
- `LinkedTicketBadge` shows open tickets inline on record detail pages

### Current state
- `RequestBillingButton` is on **all 5 booking types** with identical guard (status = Completed or Cancelled with unbilled items)
- `LinkedTicketBadge` is on all 5 booking detail pages + QuotationFileView
- Neither component is in any financial module (FinancialsModule, CoA, etc.)

---

## 8. What's Broken Right Now

These are live bugs, not future work:

1. **`operations_role` references in 5 query locations** — The column was dropped from the database. Code that explicitly selects or filters on it will error. Most critically, `TeamAssignmentForm` can't assign Operations staff to projects.

2. **Executive users have `role = 'executive'` in the DB** — But the code's role hierarchy doesn't recognize this value. Works only because Executive access uses department bypass. Any new `requireMinRole` gate would lock them out.

3. **FinancialsModule queries are unsecured** — Four `SELECT *` queries with no scope filtering. Every user sees every financial record regardless of their role.
