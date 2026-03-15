# Feature Specification: Cash Advance Liquidation (Parked)

> **Status:** ⏸ PARKED
> **Date:** 2025-05-19
> **Blocker:** Multi-currency Architecture (Need to resolve USD Advance vs. PHP Expense handling first)

## 1. Context & Goal
The E-Vouchers module currently handles "Money Out" (Expenses, Advances). We need a workflow to **liquidate** Cash Advances.
*   **Current State:** Cash Advances are created as independent vouchers. Expenses are created as independent vouchers. No link exists.
*   **Desired State:** When recording an Expense, the user can select an "Open Cash Advance" to offset.

## 2. The "DRY" Architecture Strategy
Instead of building a separate "Liquidation Module", we will reuse the existing `AddRequestForPaymentPanel` (Expense Form).

### Concept: "Expense as Liquidation"
A liquidation is simply an Expense Voucher that has a `parent_voucher_id` pointing to a Cash Advance.

1.  **User Flow:**
    *   User opens "New Expense".
    *   Toggles "Liquidate Advance?" switch.
    *   Selects from list of their Open Advances (fetched via API).
    *   Enters expense items as normal.
    *   System calculates: `Total Expense` vs `Advance Balance`.

2.  **Accounting Scenarios (The Edge Cases):**
    *   **Exact Match:** Expense (10k) == Advance (10k). Status: `Liquidated`. Action: Close Advance.
    *   **Reimbursement (Overage):** Expense (12k) > Advance (10k). Result: 10k offset, 2k payable to employee.
    *   **Refund (Underage):** Expense (8k) < Advance (10k). Result: 8k offset. 2k remains "Open" on Advance until money is returned (requires interaction with Collections module or a "Return of Cash" logic).

## 3. Data Structure Changes (`types/evoucher.ts`)

We need to add linking fields to the `EVoucher` interface:

```typescript
export interface EVoucher {
  // ... existing fields

  // Liquidation Linking
  is_liquidation?: boolean;          // Is this voucher liquidating another?
  parent_voucher_id?: string;        // ID of the Cash Advance being liquidated
  
  // Advance Tracking (On the Cash Advance Record)
  original_amount?: number;
  remaining_liquidatable_amount?: number; // Decreases as liquidations are approved
  liquidation_status?: 'open' | 'partial' | 'liquidated' | 'overdue';
}
```

## 4. UI/UX Implementation Plan

### A. The Form (`AddRequestForPaymentPanel.tsx`)
*   **New State:** `isLiquidationMode` (boolean).
*   **New Selector:** `<SelectOpenAdvance />` (Dropdown showing user's advances).
*   **Visual Feedback:**
    *   If `isLiquidationMode`:
    *   Header changes to "Liquidation Entry".
    *   Total bar shows: `Expense Total` - `Advance Balance` = `Net Payable/Refund`.

### B. The Logic (`useEVoucherSubmit.ts`)
*   **Validation:** Prevent submitting a liquidation if the Advance is already closed.
*   **Backend Hook:** On approval of the Liquidation Voucher, a server-side trigger must update the `remaining_liquidatable_amount` of the parent Cash Advance.

## 5. Critical Questions to Resolve (The Blocker)
**The Multi-Currency Problem:**
*   *Scenario:* Employee gets **$500 USD** Cash Advance.
*   *Reality:* Employee spends **₱20,000 PHP** on taxi/meals.
*   *The Issue:* How do we offset PHP expenses against a USD advance balance in the system?
    *   Do we fix the exchange rate at the time of Advance?
    *   Do we fix it at the time of Liquidation?
    *   Do we require a manual Forex gain/loss entry?

**Decision:** This feature is parked until the Global Currency/Forex architecture is defined for Neuron OS.
