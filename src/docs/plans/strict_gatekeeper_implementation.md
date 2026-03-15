# Strict Gatekeeper Implementation Plan for Neuron OS

## Objective
Implement a "Strict Gatekeeper" workflow where:
1.  **Approve E-Voucher:** Creates a "Draft" transaction in the Transactions Module.
2.  **Transactions Module:** The Accountant reviews the draft, categorizes it (if needed), and posts it to the General Ledger (COA).

## Prerequisites (Current Focus)
1.  **Source Account in E-Voucher:** Add "Payment Method" and "Bank/Source Account" selection to the E-Voucher creation/approval flow.
2.  **Chart of Accounts:** Ensure a proper COA structure exists to support the dropdowns.

## Implementation Steps

### Phase 1: Source Account Selection (Immediate)
*   **Frontend:** Update the E-Voucher form (`BudgetRequestForm.tsx` or equivalent) to include:
    *   **Payment Method:** Dropdown (Cash, Check, Bank Transfer).
    *   **Source Account:** Dynamic Dropdown fetching `Asset` accounts from the COA.
*   **Backend:** Ensure the `evoucher` object in `kv_store` persists `payment_method` and `source_account_id`.

### Phase 2: Auto-Create Draft Transaction (Backend)
*   **Endpoint:** `POST /evouchers/:id/approve`
*   **Logic:**
    *   When status changes to `Approved`:
        *   Create a new `Transaction` record (`accounting:txn:...`).
        *   **Status:** `draft` (For Review).
        *   **Amount:** Negative (Expense).
        *   **Description:** `${evoucher.purpose} (Ref: ${evoucher.voucher_number})`.
        *   **Source Document ID:** `evoucher.id`.
        *   **Bank Account ID:** Map from the E-Voucher's `source_account_id`.

### Phase 3: Post to Ledger from Transactions (Frontend & Backend)
*   **Endpoint:** `POST /evouchers/:id/post-to-ledger` (Update)
    *   Accept `debit_account_id` (Category) and `credit_account_id` (Bank) from the request.
    *   Find the associated **Draft Transaction** and update its status to `posted`.
    *   Create the **Journal Entry** (JE).
    *   Update **Account Balances**.
*   **Frontend:** `TransactionsModule.tsx`
    *   **"Add" Action:**
        *   Detect if the transaction is linked to a source document.
        *   Call `post-to-ledger` instead of just local state update.
        *   Refresh the table to show the transaction as "Categorized/Posted".

## Technical Considerations
*   **DRY Principle:** Reuse `AccountSelect` components. Do not duplicate account fetching logic.
*   **Data Integrity:** Ensure `source_document_id` links are maintained to prevent duplicate postings.
*   **Visibility:** Draft transactions without a `source_account_id` will require an "Unassigned" filter in the Transactions Module.
