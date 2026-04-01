# Architectural Diagnostic: E-Voucher System & Mode Convergence

## What This Document Is

This is a pre-implementation diagnosis. It identifies every conceptual problem that must be resolved before the E-Voucher approval workflow can be designed and before Essentials/Full Suite convergence can be attempted. It does not contain solutions, implementations, or technical proposals.

## The ERP Vision

Marcus's goal: **Every peso in and every peso out has a traceable path from origin to GL. Every paper form and manual process is replaced by Neuron OS. The books are audit-ready at any moment.**

This is the standard against which every architectural decision should be tested.

---

## PROBLEM 1: The Expense Ontology

### What We Learned

The real business ALWAYS requires prior authorization before money leaves the company. There are no "pre-approved" expenses. The paper E-Voucher is an existing business process — Neuron OS needs to digitize it, not invent it.

Essentials mode's "record expenses directly" pattern does not reflect how the business actually works. It was a software shortcut that skipped a real business step.

### The Four Real Transaction Types

| Type | What It Authorizes | Accounting Consequence |
|---|---|---|
| **Expense** | Pay a vendor for a service rendered | Creates an expense (cost on the books) + cash leaves |
| **Cash Advance** | Give an employee money before a job | Creates an advance (asset — money owed back by employee) + cash leaves |
| **Reimbursement** | Pay an employee back for out-of-pocket spending | Creates an expense + cash leaves to employee |
| **Budget Request** | Lump sum disbursement for a dept/project | Creates an advance (similar to cash advance but at dept level) + cash leaves |

Three types in the current codebase are **dead concepts** that should be removed from the E-Voucher: `collection`, `billing`, `adjustment`. These are AR-side or GL-side processes that don't go through the voucher workflow.

### Why This Matters

The four transaction types share an approval workflow but produce **completely different accounting events**. A direct expense creates a cost. A cash advance creates an asset. These are opposite sides of the balance sheet. Any system that treats them identically at the GL level will produce incorrect books.

### Unresolved

- **The cash advance liquidation process is undefined.** Marcus knows liquidation must happen (receipts + return unused cash) but the exact steps aren't defined. This is the single largest undefined business process in the system. Without it, the cash advance lifecycle has no ending.
- **Budget request liquidation:** If a budget request is a lump sum disbursement (like a cash advance), does it also require liquidation? If so, the same undefined process applies.
- **Overspend handling:** When a handler spends more than their cash advance, the difference is handled "informally." The system needs a formal path for this — likely a reimbursement E-Voucher, but that creates a circular dependency (the advance lifecycle spawns a reimbursement lifecycle).

---

## PROBLEM 2: The E-Voucher's Identity

### What We Learned

The E-Voucher is one document type with a `transaction_type` discriminator. Its scope is strictly AP (money going out). AR documents don't belong. This matches the real paper process — one form, informal differences per type.

### The Core Tension

The E-Voucher is a **single concept** at the approval level but **multiple concepts** at the accounting level. The approval chain (TL → CEO → Accounting → Treasury) is the same for all four types. But what happens after approval is radically different:

- Expense approval → create expense record, DR Expense account, CR AP
- Cash advance approval → create advance record, DR Advances to Employees, CR Cash
- Reimbursement approval → create expense record, DR Expense account, CR Cash (to employee)
- Budget request approval → create advance record, DR Advances, CR Cash

The system must branch post-approval based on type. The approval workflow is shared. The accounting consequences are not.

### Unresolved

- **The type system is polluted.** Seven transaction types exist in code. Only four are real. The dead types are wired into existing components (`CollectionsContent.tsx` filters evouchers by `transaction_type === 'collection'`). Removing them will break things.
- **GL category mapping per transaction type.** Each type maps to different GL accounts. The current system has one set of GL categories (Revenue, Cost of Sales, Operating Expenses, Assets, Liabilities, Equity) applied uniformly. But an expense E-Voucher and a cash advance E-Voucher need different default account mappings.

---

## PROBLEM 3: The E-Voucher ↔ Expense Relationship

### What We Learned

The E-Voucher is the authorization document. The Expense is the accounting record. They are separate entities. The expense is created when Accounting processes the approved E-Voucher (posts the accrual).

### The Lifecycle Gap

For a **direct expense** E-Voucher, the lifecycle is clean:
1. E-Voucher created (request)
2. Approved (TL → CEO)
3. Accounting processes → Expense record created
4. Treasury disburses → Cash leaves

For a **cash advance** E-Voucher, the lifecycle is open-ended:
1. E-Voucher created (advance request)
2. Approved (TL → CEO)
3. Treasury disburses → Cash goes to employee
4. Employee does the job, spends money
5. **LIQUIDATION** → Individual expenses extracted from the advance → Advance balance reduced
6. Unused cash returned → Advance balance reaches zero

Step 5 is where the architecture breaks down. The advance E-Voucher is approved and disbursed, but the expenses haven't been created yet. They emerge later during liquidation. The system needs to:
- Track the outstanding advance balance
- Create expense records during liquidation (each receipt → one expense)
- Handle the case where the advance is fully liquidated, partially liquidated, or over-spent

**Marcus hasn't defined how liquidation works as a business process.** This is not a system design gap — it's a business process gap. Until the business defines how liquidation happens, the system can't model it.

### Unresolved

- When does the Expense record get created for a cash advance? During liquidation? All at once? One per receipt?
- Who performs the liquidation? The handler? Accounting? The TL?
- Does the liquidation itself need approval? Or is it a reporting/reconciliation step?
- What's the relationship between the original E-Voucher and the individual expenses that emerge from it? Parent-child? Or independent records linked by reference?
- If an expense needs correction after creation, does the correction require a new E-Voucher?

---

## PROBLEM 4: The Authority Model

### What We Learned

The approval chain has exactly **two authority gates** and **two processing steps**:

| Step | Type | Can reject? | What they check |
|---|---|---|---|
| Team Leader (or Manager) | **Authority** | Yes | Legitimacy, amount reasonableness, documentation |
| CEO / Executive delegate | **Authority** | Yes | Total + purpose (can drill into details) |
| Accounting | **Processing** | No | Assigns GL accounts, creates journal entry |
| Treasury (same team as Accounting) | **Processing** | No | Releases cash, records payment |

Accounting cannot override a CEO-approved voucher. They just process it. Treasury is not a separate function — it's the same Accounting team. Audit is informal/periodic, not a per-voucher step.

### Why This Matters

The authority model is actually simpler than it initially appeared. Only two people can say "no." Everything after the CEO's approval is mechanical execution. This has implications for the state machine — there are only two real decision points, and the rest are processing confirmations.

### Unresolved

- **TL or Manager — which one?** Both can approve, but who gets it first? If a department has both a TL (for a specific team) and a Manager (for the whole department), who is the requestor's immediate supervisor? The system needs to resolve "this person's approver" without ambiguity.
- **CEO threshold:** Below the threshold, TL/Manager approval is final and it goes straight to Accounting. But the threshold value itself hasn't been defined. And the decision of whether it's one global threshold or per-department hasn't been made.
- **Self-approval bypass:** If a TL or Manager creates an E-Voucher, it goes to CEO regardless of amount. But what if an Executive department person creates an E-Voucher? They ARE the CEO-level approver. Does it auto-approve? Or does it require a different Executive to approve? (If there's only Sir Mark in the Executive department, this creates a deadlock.)
- **Delegation scope:** Executive-role users can approve on behalf of CEO. But can delegation be scoped? (e.g., "This delegate can approve up to PHP 100k but not above.") Or is delegation all-or-nothing?

---

## PROBLEM 5: The Role Hierarchy

### What We Learned

The hierarchy is: **Staff < Team Leader < Manager < Executive**

- **Staff** — frontline workers (handlers, reps, analysts)
- **Team Leader** — leads a team within a department (e.g., "Brokerage Team" in Operations)
- **Manager** — oversees the whole department. Can also be a TL.
- **Executive** — CEO level. Only exists in Executive department.

Manager and TL are not two ranks — they're two scopes. A Manager can be a TL. For E-Voucher approval, they have the same authority.

### Why This Matters

The approval chain's first step is "requestor's supervisor." But the supervisor could be a TL, a Manager, or a Manager-who-is-also-a-TL. The system needs a clean rule for resolving who that person is, and the rule must handle:

- A Staff member on the Brokerage Team → their TL approves
- A Staff member not on any specific team → the Department Manager approves
- A TL → goes to CEO (self-approval bypass)
- A Manager → goes to CEO (same bypass)

### Unresolved

- **Team assignment.** The system needs to know which team a staff member belongs to in order to route to the right TL. Is this tracked today? The `useTeams` hook exists in the codebase, but is team membership reliably recorded for every Operations staff member?
- **The role CHECK constraint in the database is stale.** Migration 004 enforces `rep | manager | director`. The code already uses `staff | team_leader | manager`. These don't match. The constraint needs to be updated to `staff | team_leader | manager | executive` before any approval routing can be trusted.
- **Operations-specific roles.** The `operations_role` column has its own values: `Manager | Supervisor | Handler`. These overlap with but don't map cleanly to the system-wide roles (`staff | team_leader | manager | executive`). Is `operations_role` still relevant, or has it been superseded by the 4-tier system-wide hierarchy?

---

## PROBLEM 6: Accounts Payable Doesn't Exist as a Tracked Concept

### What We Learned

Accounting tracks AP through the GL — it's a balance on account `acct-2000`, not a set of individual obligations. Due dates are not currently tracked per payable but "should be." Payment timing varies — some immediate, some with credit terms.

### Why This Matters

The AR side of the system has rich detail: invoices with amounts, due dates, customers, aging buckets, partial payment tracking. The AP side has... a single number in a GL account.

For the ERP vision (audit-ready books, full traceability), AP needs the same level of detail as AR:
- Individual payable records per vendor
- Due dates per payable
- Aging analysis (Current, 30, 60, 90+ days overdue)
- Partial payment tracking (if a vendor invoice is paid in installments)
- Vendor ledger (how much do we owe each vendor?)

### The E-Voucher Connection

The approved-but-not-yet-disbursed E-Voucher could naturally serve as the AP detail record. Each such E-Voucher represents an outstanding obligation. Its vendor, amount, and due date would form the AP sub-ledger. But this only works for direct expense E-Vouchers. Cash advance E-Vouchers create a different kind of obligation (advance to employee, not payable to vendor).

### Unresolved

- **Is AP a GL balance or a sub-ledger?** Today it's a GL balance. The ERP vision requires a sub-ledger. But building a sub-ledger is a significant architectural addition.
- **What is the AP equivalent of an invoice?** On the AR side, the invoice is the tracked document. On the AP side, is it the E-Voucher? A vendor invoice? A separate "payable" record?
- **Vendor management.** The `service_providers` table exists but its relationship to AP tracking is undefined. Do all vendors have records? Are vendor credit terms stored?
- **Cash advance tracking.** Advances to employees are tracked on account `acct-1200` (Advances to Officers and Employees). But like AP, this is a single balance — not a sub-ledger of individual outstanding advances per employee. The system can't answer "how much has Handler X not yet liquidated?" without this.

---

## PROBLEM 7: The GL Has No Contract

### What We Learned

The GL infrastructure exists (accounts, journal_entries, transactions tables). 28 accounts are seeded. But there are no defined rules for when entries are created, what they contain, or what invariants the system maintains.

### Why This Matters

The ERP vision requires that "every peso has a traceable path from origin to GL." This means every financial event must produce a journal entry, and every journal entry must be correct, balanced, and traceable to its source document.

Currently, GL posting is ad-hoc. The `PostToLedgerPanel.tsx` lets Accounting manually select debit/credit accounts. There's no automated posting based on event type. There's no validation that ensures completeness (every event gets posted) or correctness (the right accounts are hit).

### The Posting Contract

For the system to be audit-ready, there must be a defined contract:

**For each transaction type, under each circumstance, the system MUST create these specific journal entries:**

| Event | Debit | Credit | When |
|---|---|---|---|
| Expense approved | Expense account (by category) | Accounts Payable (2000) | At Accounting processing |
| Expense disbursed | Accounts Payable (2000) | Cash/Bank account | At Treasury disbursement |
| Cash advance disbursed | Advances to Employees (1200) | Cash/Bank account | At Treasury disbursement |
| Cash advance liquidated (per receipt) | Expense account (by category) | Advances to Employees (1200) | At liquidation |
| Cash advance unused returned | Cash/Bank account | Advances to Employees (1200) | At liquidation |
| Reimbursement approved + paid | Expense account | Cash/Bank account | At disbursement |

This contract doesn't exist yet. It must be defined before GL posting can be automated.

### Unresolved

- **Is GL posting automatic or manual?** Today it's manual (Accounting selects accounts). The ERP vision implies automatic (the system knows which accounts to hit based on the transaction type and GL category).
- **Account selection logic.** How does `gl_category = "Cost of Sales"` and `gl_sub_category = "Freight"` map to account code `5100`? A mapping function is needed but the mapping rules aren't defined.
- **Error handling.** What happens if a journal entry can't be created (e.g., account doesn't exist, balance would go negative)? Does the whole operation fail? Does it proceed without the GL entry?
- **Reversals.** If an expense is corrected or an E-Voucher is cancelled after GL posting, how are the journal entries reversed?

---

## PROBLEM 8: "Convergence" Is Undefined

### What We Learned

Marcus is building for one company right now, not multi-tenant. The ERP vision is the north star. Essentials mode was a development shortcut, not a product strategy.

### Why This Matters

"Convergence" could mean:
1. **Delete Essentials code paths** — everyone gets Full Suite. The toggle disappears.
2. **Essentials becomes the default view with Full Suite depth available** — progressive disclosure.
3. **Essentials is retired but its simplicity informs the Full Suite UX** — the approval workflow is real but the UI is not more complex than necessary.

The answer affects how much of the Essentials codebase survives, how the routing works, and whether the FinancialsModule (the consolidated super-view) has a future.

### Unresolved

- **Does the FinancialsModule survive?** The consolidated dashboard (Essentials view) is actually useful regardless of mode — a single place to see billings, invoices, collections, expenses company-wide. Does it become a dashboard in Full Suite? Or is it replaced by the individual pages?
- **When does convergence happen?** Before or after the E-Voucher workflow is built? If the E-Voucher workflow is built in Full Suite only, and then convergence happens, the Essentials code paths are never updated — they're just deleted.
- **What about the expense display?** In Essentials, expenses appear immediately on bookings. In the converged system with E-Vouchers, expenses only appear after Accounting processes the voucher. Marcus said "show pending E-Voucher on booking with a badge." This is a UX change for every Operations user.

---

## THE DEPENDENCY STRUCTURE

```
PROBLEM 1 (Expense Ontology)
|   "What is an expense? When does it become real?"
|   |-- The four transaction types have different accounting consequences
|   |-- Cash advance lifecycle is UNDEFINED (liquidation process unknown)
|   '-- Overspend handling is informal (no process)
|
|---> PROBLEM 2 (E-Voucher Identity)
|       "One document, multiple accounting paths"
|       |-- Dead transaction types need removal (collection, billing, adjustment)
|       '-- GL consequences branch by type post-approval
|
|---> PROBLEM 3 (E-Voucher <-> Expense Relationship)
|       "When does the expense record appear?"
|       |-- Clean for direct expenses (at Accounting processing)
|       |-- UNDEFINED for cash advances (during liquidation? how?)
|       '-- Correction/reversal lifecycle undefined
|
|---> PROBLEM 6 (AP as a Concept)
|       "The cost side has no detail tracking"
|       |-- AP is a GL balance, not a sub-ledger
|       |-- No vendor ledger, no due dates, no aging
|       '-- Advance tracking (per employee) doesn't exist
|
'---> PROBLEM 7 (GL Contract)
        "No rules for when/how entries are created"
        |-- Posting is manual, not automatic
        |-- Account mapping is undefined
        '-- No contract for what events produce what entries

PROBLEM 4 (Authority Model)          PROBLEM 5 (Role Hierarchy)
|   "Who can say no?"                |   "Who is whose supervisor?"
|   |-- Two real authority gates     |   |-- TL and Manager are same authority
|   |-- CEO threshold undefined      |   |-- Team assignment may not be tracked
|   '-- Executive self-approval      |   |-- DB constraint is stale
|       deadlock possible            |   '-- operations_role overlap unclear
|                                    |
'------------+----------------------'
             |
             v
    PROBLEM 8 (Convergence Definition)
        "What does the merged product look like?"
        |-- Essentials was a dev shortcut, not a product
        |-- FinancialsModule may survive as dashboard
        '-- UX impact on Operations users (pending vs immediate expenses)
```

---

## THE CRITICAL UNKNOWNS (Must Be Resolved Before Any Design)

Ordered by impact:

1. **How does cash advance liquidation work as a business process?** — This is the single largest gap. Until Marcus defines the real-world steps (who submits what, who reviews it, what documents are produced), the system cannot model the cash advance lifecycle. And cash advances are ~50% of E-Voucher volume.

2. **Does budget request liquidation follow the same pattern?** — Budget requests are lump sum disbursements, similar to cash advances. If they need liquidation too, the same undefined process blocks two of the four transaction types.

3. **How does the system resolve "who is this person's supervisor"?** — Team membership must be reliably tracked, and the fallback (no TL → Department Manager) must be unambiguous.

4. **What is the GL posting contract?** — For each event type, which accounts are debited and credited? Is posting automatic or manual? This must be defined at the business rule level before it can be coded.

5. **What happens when an Executive creates an E-Voucher?** — If Sir Mark is the only Executive, he can't approve his own voucher (self-approval bypass). Does it auto-approve? Wait for a delegate who may not exist? This is a potential deadlock.
