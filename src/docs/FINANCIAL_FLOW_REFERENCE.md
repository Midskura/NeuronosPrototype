# Neuron OS — Financial Flow Reference

> Canonical reference for how cash flows through the system.
> **Mode focus:** Essentials (E-Voucher approval workflow is Full Suite only).

---

## 1. The Cash Flow Journey (End to End)

```
Quotation (promise)
  └─► Project (container)
        └─► Booking (work unit — one per service)
              ├─► Billings   (revenue side — charge line items)
              └─► Expenses   (cost side — vendor/operational costs)
                    │
        ┌───────────┘
        ▼
Invoice (formal billing document — bundles billing items)
        │
        ▼
Collection (actual cash received — applied against invoice)
        │
        ▼
Financials Module (company-wide aggregation + visibility)
        │
        ▼
Reports (formal financial output — future)
```

### In plain language:

1. **Quotation** — BD builds a quotation for a client. This is where charges are first defined, broken down by service (Forwarding, Brokerage, Trucking, etc.) with specific line items and amounts. This is the financial promise.

2. **Project** — When the client accepts, the quotation converts into a Project. The project is just a **container** — it inherits pricing and organizes everything downstream. Projects are NOT billable entities themselves.

3. **Bookings** — Created within the project, one per service. This is where operational work happens AND where both sides of cash flow originate:
   - **Billings** are created from bookings (not projects)
   - **Expenses** are recorded against bookings

4. **Invoice** — Accounting bundles billing items into a formal document sent to the client. This flips billing item status from "unbilled" → "billed". The invoice carries a due date and tracks its remaining balance.

5. **Collection** — When the client pays, a collection is recorded against the invoice. This is actual cash hitting the bank. Multiple partial collections can apply to a single invoice.

6. **Financials Module** — Aggregates all four data streams across every project, every booking, company-wide.

### The two cash streams:

```
Cash In:   Billings ──► Invoices ──► Collections
Cash Out:  Expenses (recorded at booking level)
Profit:    Cash In − Cash Out
```

---

## 2. The Four Raw Data Streams

Everything in the Financials module derives from these four data types, fetched centrally via parallel API calls.

### 2a. Billing Items (charge atoms)

The smallest unit of revenue. Each represents a single charge line item.

| Field | Description |
|---|---|
| `booking_id` | Which booking this charge belongs to |
| `project_number` | The parent project container |
| `customer_name` | Who is being charged |
| `quotation_number` | Which quotation generated this charge |
| `quotation_category` | Category of charge (e.g. "Ocean Freight", "Documentation Fee") |
| `service_type` | Forwarding, Brokerage, Trucking, Marine Insurance, etc. |
| `description` | Human-readable detail |
| `amount` + `currency` | The charge value |
| `status` | `unbilled` → `billed` → `paid` |
| `created_at` | When the charge was created |

**Key nuances:**
- Status flips from `unbilled` → `billed` when bundled into an invoice.
- Billings are made from **bookings**, not projects.
- "Unbilled" items represent potential **revenue leakage** — work done but not yet invoiced.

### 2b. Invoices (formal billing documents)

A formal document sent to the client, bundling one or more billing items.

| Field | Description |
|---|---|
| `invoice_number` | Formal document number |
| `invoice_date` | Date issued |
| `due_date` | When payment is expected (critical for aging) |
| `customer_name` | Client |
| `project_number` | Lineage |
| `total_amount` | Face value of the invoice |
| `remaining_balance` | What's still owed after partial collections |
| `status` | `draft` → `posted` → `open` → `partial` → `paid` |
| `payment_status` | Secondary status field (fallback) |

**Key nuances:**
- `remaining_balance ≠ total_amount` — balance decreases as collections come in.
- Aging calculations use `remaining_balance` (real exposure), not `total_amount`.
- Invoices can exist at both booking and project levels.

### 2c. Collections (cash received)

Records of actual payments received from clients.

| Field | Description |
|---|---|
| `collection_date` | When money actually came in |
| `invoice_number` | Which invoice this payment applies to |
| `customer_name` | Client |
| `project_number` | Lineage |
| `amount` | How much was received |
| `payment_method` / `mode_of_payment` | Cash, Check, Bank Transfer, etc. |
| `reference_number` / `or_number` | Official receipt or bank reference |
| `status` | `posted` · `pending` · `voided` |

**Key nuances:**
- A single invoice can have **multiple collections** (partial payments over time).
- The sum of collections against an invoice reduces its `remaining_balance`.
- Collections can exist at both booking and project levels.

### 2d. Expenses (costs incurred)

Costs incurred to service bookings — vendor fees, duties, trucking charges, etc.

| Field | Description |
|---|---|
| `expenseDate` | When the cost was incurred |
| `vendorName` / `payee_name` | Who was paid |
| `expenseCategory` | Trucking, Duties, Freight, Documentation, etc. |
| `description` | Detail |
| `amount` + `currency` | The cost |
| `isBillable` | Whether this cost can/should be charged back to the client |
| `status` | `pending` → `approved` → `posted` |
| `bookingId`, `projectNumber`, `customerName`, `quotationNumber` | Full lineage |

**Key nuances:**
- In **Essentials mode**, expenses are recorded directly as incurred (already approved). No E-Voucher workflow.
- **E-Vouchers are ONLY the approval system for expenses, and ONLY in Full Suite mode.** They are NOT a universal financial document.
- The **billable ratio** tracks what percentage of expenses are recoverable from clients. Low ratio = absorbing costs.
- Billable ≠ billed — an expense can be marked billable but not yet actually charged to the client.

---

## 3. Derived Metrics (Dashboard)

### 3a. Vital Signs (Zone 1)

| Metric | Formula | Notes |
|---|---|---|
| **Net Revenue** | Invoiced amount + Unbilled amount | Includes charges not yet invoiced — *earned* revenue, not just *billed* |
| **Net Profit** | Net Revenue − Total Expenses | With margin % |
| **Cash Collected** | Sum of collections in period | With collection rate = collected ÷ invoiced × 100 |
| **Outstanding AR** | Sum of `remaining_balance` on all unpaid invoices | **Not scope-filtered** — balance sheet metric, always "as of today" |
| **Total Expenses** | Sum of expenses in period | Period-over-period delta comparison |

Each vital sign computes a **previous-period comparison** (delta ▲/▼) by shifting the scope window backwards by the same duration.

### 3b. Receivables Aging (Zone 4)

Unpaid invoices bucketed by days past `due_date`:

| Bucket | Range | Color | Severity |
|---|---|---|---|
| Current | Not yet due | Teal `#0F766E` | Healthy |
| 1–30 days | Slightly overdue | Amber `#D97706` | Watch |
| 31–60 days | Moderately overdue | Orange `#EA580C` | Warning |
| 61–90 days | Significantly overdue | Red `#DC2626` | Danger |
| 90+ days | Critically overdue | Dark Red `#991B1B` | Critical |

**DSO (Days Sales Outstanding)** = (Outstanding AR ÷ Net Revenue) × Days in Period
- Teal: ≤ 30 days
- Amber: 31–60 days
- Red: 61+ days

**Unbilled/Pending Billings tracker** — billing items still at "unbilled" status, grouped by booking, showing potential revenue leakage. Split header shows billed vs. unbilled totals.

### 3c. P&L Trend (Zone 3)

- Monthly grouped bar chart: Revenue vs. Expenses over last 12 months
- Cash Flow Summary sidebar: Revenue, Expenses, Net Profit, Collected, Outstanding AR, Net Cash

### 3d. Breakdown Analysis (Zone 5)

Three pivot views via tab pills:

| View | What it shows |
|---|---|
| **By Service** | Revenue, expenses, and profit per service type (Forwarding, Brokerage, Trucking, Marine Insurance). Shows which services are profitable. |
| **By Customer** | Revenue concentration per customer. |
| **By Category** | Expense breakdown by category — how costs are distributed. |

> **NOTE:** As of Phase 9, Breakdown Analysis has been **removed from the dashboard**. These views belong in the Reports module (not yet built) where they can have full-page tables, date range pickers, and export capabilities. The dashboard now has 4 zones: Vital Signs → Attention Panel → P&L Trend → Receivables Aging.

### 3e. Attention Panel (Zone 2)

Actionable task queue computed from the data:
- Invoices overdue 30+ days (with amount + oldest invoice detail line)
- Unbilled charges (revenue leakage warning + largest booking detail line)
- Collection rate vs. 80% target (pass/fail + uncollected amount)

Each item uses **verb-based CTAs** ("Follow Up", "Create Invoice", "View Uncollected") instead of generic "View" links, and includes a dismissible second line showing the single most actionable data point.

---

## 4. Grouping Dimensions

Every tab in the Financials module supports the same four grouping axes:

| Axis | Groups by | Key field |
|---|---|---|
| **Customer** | Client name | `customer_name` |
| **Project** | Project container | `project_number` |
| **Contract** | Originating quotation | `quotation_number` |
| **Booking** | Specific booking | `booking_id` |

---

## 5. Tab-Level KPIs

### Billings Tab
- Total Charges (sum of all billing item amounts)
- Unbilled (sum + count of `status === "unbilled"`)
- Items (count, with unique booking count)
- Avg per Booking

### Invoices Tab
- Total Invoiced
- Outstanding (unpaid balance)
- Overdue (past due date, with amount)
- Collection Rate (collected ÷ invoiced)

### Collections Tab
- Total Collected
- This Month (current calendar month)
- Avg Days to Collect (collection_date − invoice_date)
- Collection Rate

### Expenses Tab
- Total Expenses
- Pending Approval (count)
- Top Category (highest-spend category)
- Billable Ratio (% of expenses marked billable)

---

## 6. Status Lifecycles

```
Billing Item:   unbilled ──► billed ──► paid
Invoice:        draft ──► posted ──► open ──► partial ──► paid
Collection:     pending ──► posted    (or voided)
Expense:        pending ──► approved ──► posted    (Essentials: effectively pre-approved)
```

---

## 7. Important Distinctions

| Concept | Is | Is NOT |
|---|---|---|
| **Project** | A container for bookings | A billable entity — billings come from bookings |
| **Billing Item** | A charge line item (atom of revenue) | An invoice — invoices bundle billing items |
| **E-Voucher** | The approval system for expenses (Full Suite only) | A universal financial document |
| **Unbilled** | Work charged but not yet invoiced | Uncollected — that's Outstanding AR |
| **Outstanding AR** | Balance sheet metric (always "as of today") | Scope-filtered like other metrics |
| **Billable expense** | An expense that *can* be charged to the client | An expense that *has been* billed |
| **remaining_balance** | What's still owed on an invoice | Same as total_amount (decreases with collections) |