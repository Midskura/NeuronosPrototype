# Unified Expenses Tab Implementation Blueprint

## Objective
Create a single, self-contained `UnifiedExpensesTab` component that powers the Expenses view for both the Project Module and the Customer Ledger. This ensures 100% visual and functional consistency (DRY principle).

## Core Strategy
The `UnifiedExpensesTab` will encapsulate:
1.  **Filter Logic**: Search, Date Range, Status, Category, Booking ID.
2.  **Visual Components**: The "Control Bar" (Search inputs, Dropdowns), the "Metric Card" (Total Approved), and the "Detail Panel" (Slide-out).
3.  **Data Display**: It will reuse the `ExpensesTable` we just created.

## Implementation Phases

### Phase 1: Preparation & Blueprint
- [x] **1.1 Analyze Dependencies**: Identify required props and types (`OperationsExpense`, `Project`, etc.).
- [x] **1.2 Create Blueprint**: Document the plan.

### Phase 2: Create `UnifiedExpensesTab` Component
- [x] **2.1 Define Interface**: created `UnifiedExpensesTabProps`.
- [x] **2.2 Implement Component**: Moved logic from `ProjectExpensesTab` (filters, state, detail panel) into `UnifiedExpensesTab.tsx`.
- [x] **2.3 Integrate `ExpensesTable`**: Rendered the table inside this component.

### Phase 3: Refactor `ProjectExpensesTab.tsx`
- [x] **3.1 Clean Up**: Removed all local UI state from `ProjectExpensesTab`.
- [x] **3.2 Implement Unified Component**: Rendered `<UnifiedExpensesTab ... />` passing the fetched expenses.
- [x] **3.3 Verify**: Ensure the Project view looks exactly as it did before.

### Phase 4: Refactor `CustomerLedgerDetail.tsx`
- [x] **4.1 Data Mapping**: Created inline mapper to convert Customer API response to `OperationsExpense`.
- [x] **4.2 Implement Unified Component**: Replaced "Expenses" tab content with `<UnifiedExpensesTab ... />`.
- [x] **4.3 Verify**: Customer view now has full "Project-style" features.

### Phase 5: Cleanup & Polish
- [x] **5.1 Remove Duplicate Code**: Cleaned up unused imports and states in `CustomerLedgerDetail`.
- [x] **5.2 Final Consistency Check**: Both views behave identically.

## Status Log
- **[2026-02-12]**: Blueprint created.
- **[2026-02-12]**: Implementation complete.
