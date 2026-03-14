# Project Expenses V2 Redesign Blueprint (Inquiries Style)

## Objective
Redesign `ProjectExpensesTab.tsx` to mirror the structure and UX of `InquiriesModule.tsx`. This creates a cohesive "Neuron Business" experience, focusing on clear hierarchy, searchability, and tab-based workflow for high-volume data.

## Design Reference
- **Source**: `InquiriesModule.tsx`
- **Key Elements**:
    - large Page Title (32px) + Subtitle.
    - Full-width Search Bar.
    - Tab Navigation for status/workflow stages.
    - CSS Grid-based Table Rows (not HTML `<table>`).
    - Status Pills with soft backgrounds.

## Implementation Phases

### Phase 1: Skeleton & Header Structure
- [x] **1.1 Layout Shell**: Created the main container with standard padding (`32px 48px`).
- [x] **1.2 Header**: Implemented the "Project Expenses" title (32px) and subtitle.
    - Added the "Total Approved" metric card in the top-right.
- [x] **1.3 Tab Navigation**: Implemented the main tabs:
    - `All Expenses`
    - `Pending Approval`
    - `Approved`
    - `Posted / Paid`

### Phase 2: Command Center (Search & Filters)
- [x] **2.1 Search Bar**: Full-width input with Search icon, identical to Inquiries.
- [x] **2.2 Filter Row**: Below search, added:
    - `CustomDatePicker` (Date Range)
    - `CustomDropdown` (Booking, Category)
    - **"Group by Booking"** Toggle button.

### Phase 3: Grid-Based Table System
- [x] **3.1 Grid Layout Definition**: Defined the column tracks:
    - `48px 110px 1fr 160px 140px 140px`
- [x] **3.2 Header Row**: Created the sticky header using the grid definition.
- [x] **3.3 Expense Row Component**: Created the functional component `ExpenseRow`.
    - Uses `div` with `display: grid`.
    - Implemented hover effects (`#F9FAFB`).
    - Smart Cell: "Details" column merging Payee + Description.

### Phase 4: Logic Integration & Cleanup
- [x] **4.1 Data Filtering**: Connected Tabs and Search input to the `expenses` array filter logic.
- [x] **4.2 Grouping Logic**: Adapted the "Group by Booking" feature to work with the new Grid rows (inserting "Header Rows" into the list).
- [x] **4.3 Final Polish**: Verified status colors, currency formatting, and empty states.

## Status Log
- **[2026-02-12]**: Blueprint created.
- **[2026-02-12]**: Phases 1-4 completed in initial rewrite. `ProjectExpensesTab` now matches `InquiriesModule` architecture.
