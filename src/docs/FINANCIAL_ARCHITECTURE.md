# Financial Architecture — Neuron OS

> **Living document.** Update this when schema, join patterns, or status flows change.
> Last reviewed: 2026-03-31

---

## 1. The Flow

```
QUOTATION (rate source)
    │
    ▼
PROJECT (aggregation container)
    │
    ├──▶ BOOKING (service execution)
    │        │
    │        ├──▶ BILLING_LINE_ITEMS (charge_type='revenue') ─────▶ INVOICE ──▶ COLLECTIONS
    │        │
    │        ├──▶ BILLING_LINE_ITEMS (charge_type='cost')  ──────▶ INVOICE (tied for CoGS calc)
    │        │
    │        └──▶ EXPENSES (charge_type='cost'|'expense')
    │                  │
    │                  └── if is_billable=true ──▶ promoted to BILLING_LINE_ITEMS
    │
    └──▶ EVOUCHER (AP workflow — expense/cash_advance/reimbursement/budget_request)
             │
             ├──▶ LIQUIDATION_SUBMISSIONS (receipts filed against cash_advance / budget_request EVs)
             │
             └──▶ JOURNAL_ENTRY (double-entry GL)
```

**The canonical billing total lives on `invoices.total_amount`.**
Collections reduce the outstanding balance. Expenses and cost billing items feed the gross profit calculation.

---

## 2. Table Reference

### 2.1 `quotations` — Rate Source

Purpose: Rate matrices and quotation documents. Converted to projects when accepted.
Dual role: **`quotation_type`** distinguishes `'standard'` (spot quotes) from `'contract'` (standing rates).

Key fields:

| Field | Notes |
|---|---|
| `quotation_number` | Human ID |
| `quotation_type` | `'standard'` \| `'contract'` |
| `pricing` | JSONB — full pricing breakdown (`charge_categories`, `selling_price`, `buying_price`) |
| `total_selling` | Denormalized revenue total from pricing JSONB |
| `total_buying` | Denormalized cost total from pricing JSONB |
| `status` | See §6 |
| `contract_start_date` / `contract_end_date` | Contract validity window |
| `parent_contract_id` | FK → `quotations` (for contract renewals) |
| `project_id` | Populated when converted to a project |

Pricing JSONB structure:
```
selling_price[].line_items[]:
  { description, price, quantity, forex_rate, amount, is_taxed, rate_source }

rate_source: 'contract_rate' | 'manual' | 'quotation' | 'billable_expense'
```

---

### 2.2 `projects` — Aggregation Container

Purpose: Container for all work on a customer job. **The primary grouping key for all financial queries.**

Key fields:

| Field | Notes |
|---|---|
| `project_number` | Unique human ID (e.g. `PRJ-2026-001`). Used as the de-facto join key in financial queries. |
| `quotation_id` | FK → `quotations` (source rates) |
| `customer_id` / `customer_name` | Billed party (denorm) |
| `services` | TEXT[] — service lines on this project |
| `status` | `'Active'` \| `'Completed'` \| `'On Hold'` \| `'Cancelled'` |
| `details` | JSONB overflow for shipment metadata |

Financial role: Almost all financial reporting groups by `project_number`, not by customer or service.

---

### 2.3 `bookings` — Service Execution

Purpose: Individual shipment/service booking. One booking per service type per project.

Key fields:

| Field | Notes |
|---|---|
| `booking_number` | e.g. `FWD-001`, `BRK-001` |
| `service_type` | `'Forwarding'` \| `'Brokerage'` \| `'Trucking'` \| `'Marine Insurance'` \| `'Others'` |
| `project_id` | FK → `projects` |
| `contract_id` | FK → `quotations` (contract rates used, if any) |
| `total_revenue` / `total_cost` | Denormalized from billing items (for display) |
| `applied_rates` | JSONB array of contract rates applied to this booking |
| `status` | `'Draft'` → `'Created'` → `'Confirmed'` → `'In Transit'` → `'Delivered'` → `'Completed'` \| `'Cancelled'` |
| `details` | JSONB — service-specific fields (containers, vessel, ETD, etc.) |

Financial role: Cost center. Billing items and expenses attach here.

---

### 2.4 `billing_line_items` — Charge Atoms

Purpose: Atomic charge records. Can exist independent of an invoice (unbilled) or grouped under one.

Key fields:

| Field | Notes |
|---|---|
| `invoice_id` | FK → `invoices`. **NULL = unbilled.** |
| `booking_id` | FK → `bookings` |
| `project_id` / `project_number` | Scope (denorm) |
| `charge_type` | `'revenue'` \| `'cost'` \| `'expense'` — see §5 |
| `category` | `'Origin Charges'` \| `'Freight'` \| `'Destination'` \| `'Government'` |
| `service_type` | Which service line |
| `description` | Charge description (e.g. "O/F Charges", "CFS Fee") |
| `amount` | Line total = `quantity × unit_price × forex_rate` |
| `unit_type` | `'per_cbm'` \| `'per_container'` \| `'per_shipment'` \| `'per_bl'` \| `'per_set'` \| `'flat_fee'` |
| `is_taxed` / `tax_code` / `tax_amount` | VAT tracking |
| `catalog_item_id` | FK → `catalog_items` (item master) |
| `status` | `'active'` \| `'inactive'` \| `'archived'` |

**Gotcha:** Cost-type items (`charge_type='cost'`) have `booking_id` but may or may not have `invoice_id`. When they do have an `invoice_id`, they are used in the gross profit calculation for that invoice. See §3.3.

---

### 2.5 `invoices` — Invoice Documents

Purpose: Parent billing document grouping revenue charges for a customer. **Canonical billed amount lives here.**

Key fields:

| Field | Notes |
|---|---|
| `invoice_number` | Unique human ID (e.g. `INV-2026-001`) |
| `project_id` / `project_number` | Parent project (denorm) |
| `customer_id` / `customer_name` | Billed to (denorm) |
| `booking_id` | Single booking (optional) |
| `booking_ids` | TEXT[] — multiple bookings (multi-booking invoices) |
| `billing_item_ids` | TEXT[] — references to `billing_line_items` composing this invoice |
| `service_types` | TEXT[] — service lines on this invoice |
| `subtotal` / `tax_amount` / `total_amount` | **`total_amount` is the canonical billed amount** |
| `status` | `'draft'` → `'sent'` → `'posted'` → `'paid'` \| `'void'` |
| `posted` / `posted_at` | GL posted flag |
| `journal_entry_id` | FK → `journal_entries` (created when posted) |
| `evoucher_id` | FK → `evouchers` (AR voucher, optional) |

---

### 2.6 `collections` — Customer Payments

Purpose: Cash received from customers against invoices.

Key fields:

| Field | Notes |
|---|---|
| `collection_number` | Human ID (e.g. `COL-20260315-001`) |
| `invoice_id` | FK → `invoices` — which invoice is being paid |
| `project_id` / `project_number` | Scope (denorm) |
| `customer_id` / `customer_name` | Received from (denorm) |
| `booking_id` / `booking_ids` | Optional booking scope |
| `amount` | Amount received |
| `payment_method` | `'Cash'` \| `'Check'` \| `'Bank Transfer'` \| `'Online'` |
| `collection_date` | Actual payment date (not system timestamp) |
| `status` | `'pending'` → `'posted'` \| `'void'` |
| `posted` / `posted_at` | GL posted flag |
| `journal_entry_id` | FK → `journal_entries` (AR reduction entry) |
| `evoucher_id` | FK → `evouchers` (AR voucher) |

**Note:** Collections link to `invoice_id`, not to `booking_id` directly. To trace a collection back to a booking, go via the invoice.

---

### 2.7 `expenses` — Operational Costs

Purpose: Vendor/operating costs on a booking. May be billable to the customer.

Key fields:

| Field | Notes |
|---|---|
| `booking_id` | FK → `bookings` |
| `project_id` / `project_number` | Scope (denorm) |
| `evoucher_id` | FK → `evouchers` (AP voucher) |
| `charge_type` | `'cost'` \| `'expense'` — see §5 |
| `category` | `'Brokerage'` \| `'Trucking'` \| `'Documentation'` \| `'Handling'` \| `'Government'` \| `'Other'` |
| `service_type` / `service_tag` | Which service line |
| `amount` | Expense amount |
| `vendor_name` | Who incurred the cost |
| `is_billable` | Can this be promoted to a customer charge? |
| `status` | `'active'` → `'approved'` → `'posted'` → `'paid'` \| `'partial'` |

**Expenses vs billing_line_items:** These are different concepts. An expense is a vendor cost recorded at the booking level. A `billing_line_item` with `charge_type='cost'` is that same cost reflected in the billing layer (after promotion). When `is_billable=true`, an expense can be promoted to a `billing_line_item`.

---

### 2.8 `evouchers` — AP Workflow Wrapper

Purpose: Authorization and disbursement voucher for all money going **out** of the company. Gateway to GL for AP transactions. Strictly AP-side — AR documents (invoices, collections) do not go through this workflow.

**Four real AP transaction types:**

| Type | What it authorizes | GL at disbursement |
|---|---|---|
| `expense` | Pay a vendor for a service | DR Expense / CR Accounts Payable → DR AP / CR Cash |
| `cash_advance` | Give an employee money before a job | DR Advances to Employees / CR Cash |
| `reimbursement` | Pay an employee back for out-of-pocket spending | DR Expense / CR Cash (direct, no AP) |
| `budget_request` | Lump-sum disbursement to a department | DR Advances to Employees / CR Cash |

**Legacy AR-side types** (`collection`, `billing`, `adjustment`) are stored in the same table by the billings/collections modules but do **not** go through the AP approval workflow. They are kept only for backwards compatibility. Do not use them for new records.

Key fields:

| Field | Notes |
|---|---|
| `evoucher_number` | Human ID (e.g. `EV-2026-001`) |
| `transaction_type` | `'expense'` \| `'cash_advance'` \| `'reimbursement'` \| `'budget_request'` (AP types) or legacy `'collection'` \| `'billing'` \| `'adjustment'` (AR-side only) |
| `source_module` | `'bd'` \| `'operations'` \| `'accounting'` \| `'pricing'` \| `'hr'` \| `'executive'` |
| `booking_id` / `project_id` / `project_number` | Scope |
| `vendor_name` / `requestor_id` / `requestor_name` | Who is requesting / who gets paid |
| `amount` | Requested disbursement amount |
| `gl_category` / `gl_sub_category` | GL categorization filled by Accounting during processing |
| `status` | See §6 — new canonical state machine |
| `approvers` | JSONB array — full approval trail with timestamps and remarks |
| `journal_entry_id` | FK → `journal_entries` (created at `posted` status) |
| `parent_voucher_id` | FK → `evouchers` — links a reimbursement EV to its originating cash_advance (overspend path) |

**Approval routing:**
- Every EV: Requestor → TL/Manager (`pending_tl`) → CEO/Executive (`pending_ceo`) → Accounting (`pending_accounting`) → Treasury (`disbursed`) → GL post (`posted`)
- **Delegated TL** (`ev_approval_authority = true` on the user): their team's EVs skip `pending_ceo` and go straight to `pending_accounting`
- **Executive creator:** auto-skips `pending_tl` and `pending_ceo` — lands at `pending_accounting` immediately
- **Accounting/Treasury** cannot reject; they process only

**Evouchers are workflow wrappers, not the source of truth for amounts.** `evoucher.amount` is the requested disbursement. The canonical expense amounts live on `expenses.amount`. For GL, trust `journal_entries`.

---

### 2.9 `journal_entries` — GL Double-Entry

Purpose: Consolidated GL posting created when invoices, collections, or evouchers are posted.

Key fields:

| Field | Notes |
|---|---|
| `entry_number` | Human ID (e.g. `JE-2026-001`) |
| `invoice_id` / `collection_id` / `evoucher_id` | Source document (one of these) |
| `project_number` / `customer_name` | Context (denorm) |
| `lines` | JSONB array: `[{account_id, account_code, account_name, debit, credit, description}]` |
| `total_debit` / `total_credit` | Must be equal (double-entry balance) |
| `status` | `'draft'` → `'posted'` \| `'void'` |

**GL is created after the fact.** Application logic creates the journal entry when the source document transitions to `'posted'`. The schema does not enforce creation automatically.

---

### 2.10 `accounts` — Chart of Accounts

Purpose: GL account master.

Key fields:

| Field | Notes |
|---|---|
| `code` | Account number (e.g. `'1200'`) |
| `name` | Account name (e.g. `'Accounts Receivable'`) |
| `type` | `'Asset'` \| `'Liability'` \| `'Equity'` \| `'Revenue'` \| `'Expense'` |
| `normal_balance` | `'debit'` \| `'credit'` — account polarity |
| `parent_id` | FK → `accounts` (hierarchical CoA) |
| `balance` | Cached current balance |
| `is_system` | System accounts cannot be deleted |

---

### 2.11 `liquidation_submissions` — Cash Advance Receipt Filing

Purpose: Incremental receipt submissions by a handler against an open `cash_advance` or `budget_request` EV. One or more submissions per EV are allowed until the advance is fully accounted for.

Key fields:

| Field | Notes |
|---|---|
| `evoucher_id` | FK → `evouchers` — the parent cash_advance or budget_request EV |
| `submitted_by` | FK → `users` — the handler filing the receipts |
| `line_items` | JSONB array: `[{id, description, amount, receipt_url?}]` |
| `total_spend` | Sum of all line items in this submission |
| `unused_return` | Cash being returned (final submission only) |
| `is_final` | `true` = handler declares the advance fully spent; Accounting will close it |
| `status` | `'pending'` → `'approved'` \| `'revision_requested'` |
| `reviewed_by` / `reviewed_at` / `reviewer_remarks` | Accounting review fields |

**Liquidation lifecycle** (applies to `cash_advance` and `budget_request` EVs only, after `posted`):
```
liquidation_open → liquidation_pending → liquidation_closed
```
- `liquidation_open`: EV posted, handler can submit receipts
- `liquidation_pending`: Handler has set `is_final = true`; Accounting is reviewing the final submission
- `liquidation_closed`: Accounting has approved the final submission; advance is fully reconciled
- **Overspend**: if `Σ(total_spend) > evoucher.amount`, system prompts to create a new `reimbursement` EV linked via `parent_voucher_id`

---

### 2.12 `users` — Role and Authority Fields

Relevant to EV routing:

| Field | Notes |
|---|---|
| `role` | `'staff'` \| `'team_leader'` \| `'manager'` \| `'executive'` — canonical 4-tier hierarchy |
| `department` | Determines routing fallback (no team → dept Manager) |
| `team_id` | Which team the user belongs to; used to find their TL approver |
| `ev_approval_authority` | `boolean` — when `true` for a `team_leader`, their team's EVs skip the CEO gate |

**`operations_role` column has been retired** (migration 025). `Supervisor` → `team_leader` in the main `role` column. Do not reference `operations_role` in any new code.

---

## 3. Join Chains

### 3.1 Core Project Financial Query

```
projects (project_number)
  └── invoices           WHERE project_number = ?
  └── billing_line_items WHERE project_number = ? OR booking_id IN (project's bookings)
  └── collections        WHERE project_number = ?
  └── expenses           WHERE project_number = ?
  └── evouchers          WHERE project_number = ?
```

The `useProjectFinancials` hook loads all five in parallel, then filters client-side. There are no SQL joins — `project_number` is denormalized everywhere for this reason.

### 3.2 Sales Report (Revenue + CoGS)

```
invoices                                           (main row)
  ├── ← billing_line_items WHERE invoice_id = inv.id AND charge_type = 'cost'
  │     → Σ(amount) = COST OF SALES
  └── ← collections WHERE invoice_id = inv.id
        → Σ(amount) = COLLECTED
        → invoice.total_amount - COLLECTED = OUTSTANDING
```

Gross Profit = `invoice.total_amount` − COST OF SALES

### 3.3 Booking → Billing → Invoice Chain

```
bookings.id
  └── billing_line_items.booking_id    (all charges on this booking)
        └── billing_line_items.invoice_id → invoices.id  (if invoiced)
              └── invoices.id ← collections.invoice_id   (payments received)
```

Cost-type items (`charge_type='cost'`) also hang off `booking_id` and may carry an `invoice_id` for CoGS tracking. They do **not** represent amounts billed to the customer.

### 3.4 Expense → GL Chain

```
expenses.booking_id → bookings.id
expenses.evoucher_id → evouchers.id
  └── evouchers.journal_entry_id → journal_entries.id  (when status='posted')
```

If `expenses.is_billable = true`, the expense is promoted to a `billing_line_item` entry. After that, the billing item carries its own `invoice_id` path.

### 3.5 Invoice → GL Chain

```
invoices.id (status='posted')
  └── invoices.journal_entry_id → journal_entries.id
        └── lines[]: [{ account_code: '1200', debit: total_amount }, { account_code: '4100', credit: total_amount }]
```

### 3.6 Collection → GL Chain

```
collections.id (status='posted')
  └── collections.journal_entry_id → journal_entries.id
        └── lines[]: [{ account_code: '1100', debit: amount }, { account_code: '1200', credit: amount }]
```

---

## 4. Known Gotchas

**Cost billing items have `booking_id` but may not have `invoice_id`**
`billing_line_items` with `charge_type='cost'` represent vendor costs (pass-through). They are attached to a booking. They only gain an `invoice_id` if they are explicitly linked to an invoice for gross profit tracking. Filtering by `invoice_id IS NOT NULL` for CoGS calc works — but filtering for all costs on a project should use `project_number` or `booking_id`.

**Collections link to invoices, not bookings**
There is no direct `booking_id → collections` path. To find collections for a booking, go: `booking → invoice (via billing_line_items or invoices.booking_ids[]) → collections`. For project-level totals, filter by `project_number` directly.

**Multi-booking invoices**
One invoice can span N bookings via `invoices.booking_ids[]` (TEXT array). Always check both `invoices.booking_id` (single) and `invoices.booking_ids[]` when building booking-level financial summaries.

**Expenses ≠ cost billing items**
`expenses` table = vendor costs recorded at booking level.
`billing_line_items` with `charge_type='cost'` = those same costs reflected in the billing layer.
They are separate records. Do not double-count both when computing project costs. The `useProjectFinancials` hook uses `expenses` for cost totals; `SalesReport` uses `billing_line_items.charge_type='cost'` for CoGS. Be explicit about which you need.

**Evouchers are not the source of truth for amounts**
`evoucher.amount` may differ from the underlying document (expense/invoice/collection) it wraps. Always use the canonical source: `invoices.total_amount`, `collections.amount`, `expenses.amount`.

**Virtual billing items in UnifiedBillingsTab**
When a quotation has selling prices but no real `billing_line_items` exist yet, the UI creates virtual items (`is_virtual=true`, `id='virtual-{sourceId}'`) from the quotation's `selling_price` JSONB. These are display-only and not persisted unless explicitly saved. Do not treat them as real records.

**EVoucher status has legacy values in the DB**
Old records contain mixed-case values (`'Submitted'`, `'Approved'`, `'Disbursed'`, etc.). New records use the canonical state machine (`draft → pending_tl → pending_ceo → pending_accounting → disbursed → posted`). Always normalize before comparing: `status.toLowerCase()`. See `EVoucherStatus` type in `src/types/evoucher.ts` for the full legacy list.

**EVoucher `collection`/`billing`/`adjustment` types are AR-side, not AP**
These transaction types are stored in the `evouchers` table by the billings and collections modules, but they do not go through the AP approval workflow. Do not route them through the EV approval chain. Do not use them for new records. Long-term these should migrate to their own tables.

**`operations_role` column is gone**
Migration 025 dropped it. Any code that reads `user.operations_role` will fail. The equivalent is `role = 'team_leader'` in the main `role` column.

**Cash advance expenses don't exist until liquidation**
For `cash_advance` and `budget_request` EVs, no `expenses` records are created at approval time. They are created during liquidation (each receipt in a `liquidation_submission` → one expense record). Booking cost summaries should show the outstanding advance amount as "Pending Expense" until the advance is closed.

**GL is not auto-enforced**
Journal entries are created by application logic when status transitions to `'posted'`. There is no database trigger enforcing this. If a document is `posted=true` but `journal_entry_id` is null, the GL is out of sync.

---

## 5. Charge Type Semantics

The `charge_type` field appears on both `billing_line_items` and `expenses`. It is the primary financial discriminator.

| Value | Where | Meaning | GL Treatment | P&L Line |
|---|---|---|---|---|
| `'revenue'` | `billing_line_items` only | What we bill the customer | Debit AR, Credit Service Revenue | Revenue |
| `'cost'` | Both tables | Cost paid to third parties (pass-through, CoGS) | Debit CoGS, Credit AP | Cost of Sales |
| `'expense'` | `expenses` primarily | Internal operating cost | Debit Expense Account, Credit Cash/AP | Operating Expenses |

**Gross Profit formula (SalesReport):**
```
Gross Profit = invoice.total_amount − Σ(billing_line_items.amount WHERE invoice_id = inv.id AND charge_type = 'cost')
```

---

## 6. Status Flows

### `quotations`
```
Draft → Sent → Accepted → Converted (to project)
             → Rejected
             → Cancelled
```
Contract-type quotations additionally track `contract_status`:
```
Active → Expiring → Expired
       → Renewed (new quotation created with parent_contract_id)
       → Terminated
```

### `bookings`
```
Draft → Created → Confirmed → In Transit → Delivered → Completed
                                                     → Cancelled
```

### `billing_line_items`
```
active → inactive → archived
```
Mostly static once created. Status controls inclusion in billing displays.

### `invoices`
```
draft → sent → posted → paid
                      → void
```
`posted` triggers GL entry creation. `paid` means fully collected.

### `collections`
```
pending → posted → void
```
`posted` triggers GL entry that reduces Accounts Receivable.

### `expenses`
```
active → approved → posted → paid
                           → partial
```

### `evouchers` (canonical state machine — new records only)
```
draft → pending_tl → pending_ceo → pending_accounting → disbursed → posted
                   ↘ pending_accounting  (if TL has ev_approval_authority = true)
       pending_tl/pending_ceo → rejected → draft  (can be re-submitted)
       draft/rejected → cancelled  (terminal)
```

Executive creator: skips `pending_tl` and `pending_ceo`, lands directly at `pending_accounting`.

**Liquidation sub-states** (cash_advance and budget_request only, after `posted`):
```
posted → liquidation_open → liquidation_pending → liquidation_closed
```

**Legacy status values** exist in old DB records (`'Submitted'`, `'Approved'`, `'Disbursed'`, `'Disapproved'`, etc.). Normalize with `.toLowerCase()` and map to the canonical states before any comparison or display logic.

### `journal_entries`
```
draft → posted → void
```
Once `posted`, entries should not be modified — create a reversing entry instead.

---

## 7. Denormalization Map

The schema aggressively denormalizes to avoid joins in high-volume financial queries.

| Field | Denormalized Into | Source of Truth |
|---|---|---|
| `project_number` | `billing_line_items`, `invoices`, `collections`, `expenses`, `evouchers` | `projects.project_number` |
| `customer_name` | `invoices`, `billing_line_items`, `collections`, `expenses`, `evouchers`, `bookings` | `customers.name` |
| `booking_number` | `expenses` | `bookings.booking_number` |
| `service_types[]` | `invoices`, `collections` | `bookings.service_type` |
| `service_tag` | `expenses` | `bookings.service_type` |

**When denormalized fields disagree with their source of truth, the source of truth wins.** These fields are for filtering and display, not for financial calculations.

---

## 8. Quick Reference: FK Map

| From | Field | To | Purpose |
|---|---|---|---|
| `projects` | `quotation_id` | `quotations` | Source rates |
| `projects` | `customer_id` | `customers` | Billed party |
| `bookings` | `project_id` | `projects` | Parent project |
| `bookings` | `contract_id` | `quotations` | Contract rates |
| `billing_line_items` | `invoice_id` | `invoices` | Parent invoice (nullable) |
| `billing_line_items` | `booking_id` | `bookings` | Service booking |
| `billing_line_items` | `project_id` | `projects` | Project scope |
| `invoices` | `project_id` | `projects` | Project scope |
| `invoices` | `customer_id` | `customers` | Billed party |
| `invoices` | `journal_entry_id` | `journal_entries` | GL posting |
| `invoices` | `evoucher_id` | `evouchers` | AR voucher |
| `collections` | `invoice_id` | `invoices` | Invoice being paid |
| `collections` | `project_id` | `projects` | Project scope |
| `collections` | `journal_entry_id` | `journal_entries` | GL posting |
| `collections` | `evoucher_id` | `evouchers` | AR voucher |
| `expenses` | `booking_id` | `bookings` | Booking scope |
| `expenses` | `project_id` | `projects` | Project scope |
| `expenses` | `evoucher_id` | `evouchers` | AP voucher |
| `evouchers` | `booking_id` | `bookings` | Booking context |
| `evouchers` | `project_id` | `projects` | Project context |
| `evouchers` | `journal_entry_id` | `journal_entries` | GL posting |
| `journal_entries` | `invoice_id` | `invoices` | GL source |
| `journal_entries` | `collection_id` | `collections` | GL source |
| `journal_entries` | `evoucher_id` | `evouchers` | GL source |
| `journal_entries` | `booking_id` | `bookings` | Context |
| `accounts` | `parent_id` | `accounts` | CoA hierarchy |
| `liquidation_submissions` | `evoucher_id` | `evouchers` | Parent cash_advance/budget_request EV |
| `liquidation_submissions` | `submitted_by` | `users` | Handler who filed the receipts |
| `liquidation_submissions` | `reviewed_by` | `users` | Accounting reviewer |
| `evouchers` | `parent_voucher_id` | `evouchers` | Overspend reimbursement → original advance |
