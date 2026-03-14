# Unified Expenses Table Refactor Blueprint

## Objective
Implement a shared `ExpensesTable` component to ensure visual consistency and code reusability (DRY) between `ProjectExpensesTab.tsx` and `CustomerLedgerDetail.tsx`.

## Context
- **Current State**: `ProjectExpensesTab` uses a div-based grid with custom rows. `CustomerLedgerDetail` uses a hardcoded HTML table.
- **Target State**: Both components utilize a single `ExpensesTable` component that adheres to the "Neuron-style" design (white background, standard borders, uppercase headers).

## Implementation Phases

### Phase 1: Create Shared Component
- [x] **1.1 Define Props Interface**: Defined `ExpenseTableItem` and `ExpensesTableProps`.
- [x] **1.2 Create `components/accounting/ExpensesTable.tsx`**: Implemented with "Neuron" table styling.
- [x] **1.3 Add Styling**: Added Tailwind classes for headers, rows, and status badges.

### Phase 2: Refactor CustomerLedgerDetail
- [x] **2.1 Import Component**: Import `ExpensesTable` into `CustomerLedgerDetail.tsx`.
- [x] **2.2 Map Data**: Transform the existing `expenses` state to match the `ExpensesTable` props.
- [x] **2.3 Replace UI**: Remove the hardcoded table in the "expenses" tab and replace with `<ExpensesTable />`.
- [x] **2.4 Verify**: Ensure filtering and display remain accurate.

### Phase 3: Refactor ProjectExpensesTab
- [x] **3.1 Import Component**: Import `ExpensesTable` into `ProjectExpensesTab.tsx`.
- [x] **3.2 Adapt Data**: Ensure the `OperationsExpense` type maps correctly to the shared component props.
- [x] **3.3 Handle Interaction**: Pass the `onRowClick` handler to trigger the existing detail panel.
- [x] **3.4 Replace UI**: Remove `ExpenseRow` sub-component and the div-grid. Replace with `<ExpensesTable />`.
- [x] **3.5 Verify**: Check that the Detail Panel still opens correctly.

### Phase 4: Cleanup
- [x] **4.1 Remove Dead Code**: Removed `ExpenseRow` and unused toggle states.
- [x] **4.2 Final Polish**: Verified column widths and alignment look consistent.

## Status Log
- **[2026-02-12]**: Phase 1 complete.
- **[2026-02-12]**: Phase 2 complete.
- **[2026-02-12]**: Phase 3 complete.
- **[2026-02-12]**: Project Complete.
