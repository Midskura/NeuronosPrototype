# Blueprint: Transition to Side Panel Details for Accounting

**Status:** In Progress
**Last Updated:** January 28, 2026

## Objective
Replace full-page detail views (ExpenseDetailsPage, BillingDetailsPage, CollectionDetailsPage) with read-only Side Panels (Sheets) that mimic the creation forms. This improves UX by maintaining context and following the "ticket/receipt" mental model.

## Principles
1.  **Zero Context Switching:** User stays on the list view.
2.  **Read-Only Integrity:** Displays data exactly as entered, but immutable.
3.  **DRY:** Reuse fetching logic and UI patterns from existing forms where possible.

## Phase 1: Expenses Implementation
- [x] **Step 1:** Create `ExpenseDetailsSheet.tsx`.
    -   Based on `AddRequestForPaymentPanel.tsx` layout.
    -   Props: `isOpen`, `onClose`, `expenseId`.
    -   Fetching: Fetch expense details by ID using Supabase.
    -   Layout: Read-only fields for Payee, Amount, Date, Description, Line Items, Attachments.
- [x] **Step 2:** Update `ExpensesListTable.tsx`.
    -   Remove `useNavigate` to detail page.
    -   Add state for `selectedExpenseId` and `isSheetOpen`.
    -   Render `ExpenseDetailsSheet` when a row is clicked.

## Phase 2: Billings Implementation
- [x] **Step 3:** Create `BillingDetailsSheet.tsx`.
    -   Based on Billing creation form (Identify file first).
    -   Props: `isOpen`, `onClose`, `billingId`.
    -   Fetching: Fetch billing details.
- [x] **Step 4:** Update `BillingsListTable.tsx`.
    -   Integrate the sheet.

## Phase 3: Collections Implementation
- [x] **Step 5:** Create `CollectionDetailsSheet.tsx`.
    -   Based on Collection creation form.
    -   Props: `isOpen`, `onClose`, `collectionId`.
- [x] **Step 6:** Update `CollectionsListTable.tsx` (or `CollectionsContent.tsx` if table logic is embedded).

## Phase 4: Cleanup
- [x] **Step 7:** Remove Routes.
    -   Update router config (likely in `App.tsx` or `ModuleNavigation.tsx`) to remove detail page routes.
- [x] **Step 8:** Delete/Archive old Page components.

---
**Status:** Complete

