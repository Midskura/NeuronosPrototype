# Invoice Ledger Integration Blueprint

**Created:** 2026-02-25
**Status:** COMPLETE
**Current Phase:** ALL PHASES COMPLETE (1-3 done, Phase 4 = manual verification)

---

## Problem Statement

Invoice creation is **not wired** to the core accounting modules (Journal Entries, Chart of Accounts, Transactions). When a user creates an invoice from the contract or project Billings tab, the following happens:

- The invoice is saved to KV (`billing:{id}`) with an `invoice_number` -- **OK**
- Referenced billing items are marked as `"billed"` -- **OK**
- **No Journal Entry** is created (no `Debit AR / Credit Revenue`) -- **BUG**
- **No Draft Transaction** is created in the Transactions module -- **BUG**
- **No CoA balance update** -- AR and Revenue balances stay stale -- **BUG**

### Current (Broken) Behavior

InvoiceBuilder has an **optional** "Deposit To Account" dropdown that, if a user selects an asset account, calls `saveTransaction()` **client-side** after invoice creation. This is wrong in two ways:

1. **Conceptually wrong**: An invoice doesn't deposit cash -- it recognizes a **receivable**. Cash comes in when a Collection is posted (which already works correctly via `processCollectionPosting`: `DR Cash / CR AR`).
2. **Technically broken**: The draft transaction is created with `category_account_id: ""` (empty), so the debit-side balance update hits no account.

### Additional Issue: Dead Route

`postEVoucherToBillings` is referenced in 2 places in `index.tsx` but the handler function **does not exist** in `accounting-handlers.tsx`. This is a dead route that would cause a runtime error if called.

---

## Solution

Follow the same pattern used by `processCollectionPosting` (which correctly creates JE + updates CoA). The proper double-entry for invoice posting is:

```
Invoice Posted:
  DR  Accounts Receivable (1200)    $X
  CR  Revenue (user-selected)       $X

Collection Received (already works):
  DR  Cash (1000/1010/1020)         $X
  CR  Accounts Receivable (1200)    $X
```

### Key Design Decisions

- **Revenue account selection**: The InvoiceBuilder's "Deposit To Account" dropdown is **repurposed** into a "Revenue Account" dropdown showing Income-type accounts from the CoA. This lets the accountant choose between Brokerage Income (4100), Forwarding Income (4200), Trucking Income (4300), etc.
- **Server-side JE creation**: The journal entry is created **server-side** inside `createInvoice`, not client-side. This is consistent with how collections and expense postings work.
- **Draft transaction**: A draft `accounting:txn:` record is also created so the invoice appears in the Transactions module for review/categorization.
- **Graceful degradation**: If the AR account (1200) doesn't exist in the CoA (hasn't been seeded), the invoice is still saved but a warning is logged. Same pattern used by `processCollectionPosting`.

---

## Phases

### Phase 1: Server-Side -- JE + Draft Transaction on Invoice Creation
**File:** `/supabase/functions/server/accounting-handlers.tsx`

Enhance `createInvoice` to:

1. Accept optional `revenue_account_id` from the payload
2. Auto-lookup AR account (`code === "1200"` or `subtype === "Accounts Receivable"`) from `accounting:account:` prefix
3. If `revenue_account_id` is provided AND AR account exists:
   a. Create a Journal Entry (`journal_entry:{jeId}`) with:
      - Line 1: DR AR (1200) for `total_amount`
      - Line 2: CR Revenue (user-selected) for `total_amount`
   b. Update AR balance: `+total_amount` (Asset increases with Debit)
   c. Update Revenue balance: `+total_amount` (Income increases with Credit)
   d. Create a Draft Transaction (`accounting:txn:{txnId}`) with:
      - `amount: total_amount` (positive -- receivable)
      - `bank_account_id: arAccount.id`
      - `category_account_id: revenue_account_id`
      - `status: "posted"` (since the invoice itself is posted)
      - `source_document_id: invoice.id`
      - `source_document_type: "invoice"`
4. Store `journal_entry_id` and `draft_transaction_id` on the invoice record for traceability

**Graceful fallback**: If AR account not found or `revenue_account_id` not provided, still save the invoice normally (log warning). No JE created. This preserves backward compatibility.

### Phase 2: Frontend -- Replace "Deposit To Account" with "Revenue Account"
**File:** `/components/projects/invoices/InvoiceBuilder.tsx`

1. Rename `depositAccountId` state to `revenueAccountId`
2. Change the dropdown label from "Deposit To Account" to "Revenue Account"
3. Filter accounts to show only `type === "Income"` instead of Asset accounts
4. Pass `revenue_account_id` in the POST payload to `createInvoice`
5. **Remove** the broken client-side `saveTransaction()` call and its surrounding `if (depositAccountId)` block -- the server now handles everything
6. Remove the `saveTransaction` import if it becomes unused

### Phase 3: Dead Route Cleanup
**File:** `/supabase/functions/server/index.tsx`

1. Remove the `postEVoucherToBillings` route registration (line ~10060)
2. Remove the `postEVoucherToBillings` branch in the E-Voucher posting dispatcher (line ~6490) -- replace with a `400` error response for unsupported transaction types
3. No handler to delete (it never existed)

### Phase 4: Verification

End-to-end test:
1. Open a contract with linked bookings that have billing items
2. Create an invoice from the Billings tab, selecting a Revenue Account
3. Verify:
   - Invoice appears in the Invoices tab with `status: "posted"`
   - Billing items are marked `"billed"`
   - A Journal Entry exists (`journal_entry:` prefix) with DR AR / CR Revenue
   - AR account balance increased by invoice amount
   - Revenue account balance increased by invoice amount
   - A transaction appears in the Transactions module (`accounting:txn:` prefix)
4. Then create a Collection for the same project -- verify AR is cleared (existing flow)

---

## Files Modified

| File | Phase | Change |
|------|-------|--------|
| `/supabase/functions/server/accounting-handlers.tsx` | 1 | Enhance `createInvoice` with JE + draft txn + CoA balance updates |
| `/components/projects/invoices/InvoiceBuilder.tsx` | 2 | Replace deposit account with revenue account; remove client-side `saveTransaction` |
| `/supabase/functions/server/index.tsx` | 3 | Remove dead `postEVoucherToBillings` route references |

## Dependencies

- Chart of Accounts must be seeded (AR account `1200` and at least one Revenue account `4xxx`)
- Both balance-sheet and income-statement CoA seeds must have been run

## Risk Assessment

- **Low risk**: Phase 1 is additive (adds JE creation inside existing `createInvoice`), with graceful fallback if accounts missing
- **Low risk**: Phase 2 is a UX swap (same dropdown, different filter + label) and removal of broken code
- **Zero risk**: Phase 3 removes dead code that would crash if called