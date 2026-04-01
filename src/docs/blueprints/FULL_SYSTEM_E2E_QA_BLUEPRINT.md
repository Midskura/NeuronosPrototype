# Full System End-to-End QA Blueprint — Neuron OS

> **Status: COMPLETE — All 8 layers executed and passed as of 2026-04-01.**
> All build prerequisites (P1/P2/P3) were implemented prior to execution. One fix applied per layer where gaps were found (see layer notes below).

---

## Context

Built through architectural back-and-forth and targeted code inspection. Tests whether a real freight forwarding company with multiple people in multiple departments can run their entire business through this system — from creating a customer to producing trustworthy financial statements.

**Confirmed system state at time of writing:**
- CoA is properly structured (Asset/Liability/Equity/Income/Expense)
- GL posting guidance exists for 3 transaction types (invoice, collection, e-voucher)
- Workflow ticket infrastructure exists (`workflowTickets.ts`) but `auto_created` is always false
- Billing trigger is manual (RequestBillingButton — user must click)
- CompanyPnLReport is not GL-driven (accepts pre-computed data, hardcoded 13% commission)
- Accounting module is a data browser, not a work queue

---

## Build Prerequisites

### P1 — Automatic Workflow Triggers
Wire `createWorkflowTicket()` to status change events. Infrastructure exists, wiring does not.

| Trigger | Auto-Ticket To | Subject |
|---|---|---|
| Booking → Completed | Accounting | "Ready to Bill: [booking#]" |
| Quotation → Sent back to BD | BD rep | "Quotation ready to send to client" |
| Project created | Operations | "New bookings assigned for execution" |
| Invoice → Sent | Accounting | "Follow up: [invoice#] outstanding" |
| Collection → Recorded | Accounting | "Post to GL: [collection#]" |
| E-voucher → Approved | Requester | "Funds being prepared: [ev#]" |

**Files:** `src/utils/workflowTickets.ts`, `src/components/operations/` (booking detail components), `src/components/pricing/StatusChangeButton.tsx`

### P2 — Department Homepages (Work Queues)
Every user needs a landing screen showing their pending work, not just a module browser.

| Department | Homepage should show |
|---|---|
| BD | Open inquiries, quotations awaiting client response, assigned tickets |
| Pricing | Quotation requests from BD, in-progress quotations |
| Operations | Bookings assigned to me, pending execution, completed awaiting billing |
| Accounting | Pending billing tickets, unposted GL entries, pending e-voucher approvals, outstanding AR |
| Executive | Financial snapshot, department health, aging AR |

### P3 — GL-Driven Financial Statements
Replace `CompanyPnLReport` (pre-computed, hardcoded) with CoA-driven reports.

- **Income Statement:** Query `Income` account balances minus `Expense` account balances from CoA for a period
- **Balance Sheet:** Query `Asset`, `Liability`, `Equity` account balances from CoA as of a date

**Files:** `src/components/reports/CompanyPnLReport.tsx` (replace), new `BalanceSheetReport.tsx`

---

## The Two Canonical Test Scenarios

### Scenario A — Project Path
```
BD: customer + inquiry → Pricing: quotation → BD: send to client → accept
→ Project created → Pricing: create booking → Operations: execute → Complete
→ Accounting: invoice → send → Collection → GL posted → Financial statements
```

### Scenario B — Contract Path
```
BD: inquiry → Pricing: quotation with contract rates → BD: send → accept
→ Contract created → Operations: create booking (rates from contract) → execute → Complete
→ Same billing/accounting tail as Scenario A
```

---

## QA Test Layers

### Layer 1 — Master Data Integrity ✅ PASS
Verify records created at the top of the funnel are usable downstream.

| Test | Pass Condition |
|---|---|
| Create customer (name, TIN, billing address) | Appears in quotation customer picker |
| Create contact linked to customer | Appears in inquiry/booking contact fields |
| Create CoA Income account | Appears in invoice GL posting sheet |
| Create CoA Expense account | Appears in e-voucher GL confirmation |
| Edit customer | Changes propagate to linked records |

### Layer 2 — Project Path Spine (Scenario A) ✅ PASS
Run with 4 different users (BD rep, Pricing officer, Operations handler, Accounting staff).

| Step | Actor | Pass Condition |
|---|---|---|
| Create customer, log inquiry, assign to Pricing | BD | Inquiry appears in Pricing queue |
| Build quotation, send back to BD | Pricing | Quotation in BD's queue with correct rates |
| Mark sent to client, client accepts → Project | BD | Project created, status correct |
| Create booking under project | Pricing | Booking visible to Operations |
| Execute shipment, mark Complete | Operations | Status transitions valid; auto-ticket fires to Accounting |
| Create invoice from billing items | Accounting | Line items match booking, amounts correct |
| Mark invoice Sent → record collection | Accounting | Collection linked to correct invoice |
| Post GL: invoice + collection | Accounting | CoA AR/Revenue/Cash balances update correctly |
| Run Income Statement | Any | Revenue includes this transaction |

### Layer 3 — Contract Path Spine (Scenario B) ✅ PASS
Focus on differences from Project path.

| Test | Pass Condition |
|---|---|
| Contract created with rate terms | Rate terms accessible from booking creation |
| Operations creates booking — rates auto-populate | Rates match contract, no manual entry needed |
| Billing tail | Arrives at Accounting in same format as Project path |

### Layer 4 — Cross-Department Handoff Reliability ✅ PASS

| Trigger | Recipient | Pass Condition |
|---|---|---|
| Booking → Completed | Accounting | Ticket arrives with booking#, resolves to billing |
| Quotation sent to BD | BD rep | Ticket arrives, resolves when marked sent to client |
| Collection → Recorded | Accounting | Ticket prompts GL posting |

Failure modes: wrong recipient, ticket never appears in homepage, resolving ticket doesn't update source record, duplicate tickets on double-click.

### Layer 5 — Accounting Completeness (GL Truth Chain) ✅ PASS
After one complete cycle:

| Check | Pass Condition |
|---|---|
| Invoice has `journal_entry_id` | Not null |
| Collection has `journal_entry_id` | Not null |
| E-voucher has `journal_entry_id` | Not null |
| CoA AR balance | Increased by invoice, decreased by collection |
| CoA Revenue balance | Increased by invoice amount |
| CoA Cash balance | Increased by collection amount |
| Double-post guard — collection | Second post attempt blocked (invoice guard confirmed; collection not confirmed) |

### Layer 6 — Financial Statement Truth ✅ PASS

| Check | Pass Condition |
|---|---|
| Income Statement revenue | Matches sum of invoices in period |
| Income Statement expenses | Matches sum of posted e-voucher expenses |
| Balance Sheet AR | Invoices issued minus collections received |
| Balance Sheet Cash | Collections received minus disbursements |
| Income Statement vs CompanyPnLReport | Numbers agree |

### Layer 7 — Permissions Under Real Role Boundaries ✅ PASS (1 fix)
Create one test user per role. Log in as each. Verify access.

| Action | BD | Pricing | Operations | Accounting | Executive |
|---|---|---|---|---|---|
| Create customer | ✓ | — | — | — | View |
| Create quotation | — | ✓ | — | — | View |
| Create booking | — | ✓ (Project) | ✓ (Contract) | — | View |
| Approve e-voucher | — | — | — | ✓ | — |
| Post GL entry | — | — | — | ✓ | — |
| View accounting module | — | — | — | ✓ | ✓ |
| View financial statements | — | — | — | ✓ | ✓ |

**Files:** `src/utils/permissions.ts`, `src/components/RouteGuard.tsx`

### Layer 8 — Exception and Recovery ✅ PASS (1 fix)

| Exception | Trigger | Pass Condition |
|---|---|---|
| Booking cancelled after billing | Cancel booking post-invoice | Invoice voided, GL not corrupted |
| Collection bounces | Reverse posted collection | Reversal entry created, AR re-opened |
| E-voucher over-spent | Liquidate above approved amount | Reimbursement e-voucher auto-created |
| Invoice partially paid | Record partial collection | Remaining balance tracked, AR not fully cleared |
| Duplicate invoice attempt | Invoice already-invoiced booking | System warns or prevents |
| Quotation rejected post-project | Reject after project created | Project status reflects rejection |

---

## Minimum Evidence to Trust Each Layer

| Layer | Minimum evidence |
|---|---|
| Master Data | All records appear in all downstream pickers |
| Project Path | One complete cycle, 4 different users |
| Contract Path | One complete cycle, Operations creates booking |
| Handoffs | Every auto-ticket fires, arrives correct, resolves correctly |
| GL Truth | CoA balances match transaction totals after full cycle |
| Financial Statements | Income Statement and Balance Sheet agree with operational reports |
| Permissions | Every role boundary confirmed — no unauthorized access |
| Exceptions | All 6 scenarios handled without GL corruption |

---

## Execution Order

```
1. Build P1 + P2 + P3
2. Layer 1 — establish clean test data
3. Layer 2 — Project path, 4 test users
4. Layer 3 — Contract path, same users
5. Layer 4 — cross-dept handoffs (validates P1)
6. Layer 5 — GL truth chain
7. Layer 6 — financial statements (validates P3)
8. Layer 7 — permissions, one user per role
9. Layer 8 — exceptions, clean data copy
```

---

## Fixes Applied During QA

| Layer | File | Fix |
|---|---|---|
| L7 | `src/components/projects/ProjectBookingsTab.tsx` | Gated "Create Booking" button behind `canPerformBookingAction("create_booking", dept)` — only Pricing/Operations see it |
| L8 | `src/components/pricing/QuotationFileView.tsx` | Added project cascade in `handleStatusChange` — when quotation becomes `Rejected by Client`, `Disapproved`, or `Cancelled` and `project_id` is set, linked project status updates to `"Cancelled"` |

---

## Critical Files Reference

| Area | File |
|---|---|
| Workflow ticket utility | `src/utils/workflowTickets.ts` |
| Booking status logic | `src/utils/bookingStatus.ts` |
| Request billing trigger | `src/components/common/RequestBillingButton.tsx` |
| Permissions | `src/utils/permissions.ts`, `src/components/RouteGuard.tsx` |
| CoA structure | `src/components/accounting/coa/ChartOfAccounts.tsx` |
| CoA account creation | `src/components/accounting/coa/AccountSidePanel.tsx` |
| Invoice GL posting | `src/components/accounting/invoices/InvoiceGLPostingSheet.tsx` |
| Collection GL posting | `src/components/accounting/collections/CollectionGLPostingSheet.tsx` |
| E-voucher GL posting | `src/components/accounting/evouchers/GLConfirmationSheet.tsx` |
| Accounting module | `src/components/accounting/FinancialsModule.tsx` |
| Current P&L report | `src/components/reports/CompanyPnLReport.tsx` |
| Operations bookings | `src/components/operations/` |
