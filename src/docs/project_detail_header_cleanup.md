# Project Detail Header Cleanup Blueprint

## Objective
Radically simplify the `ProjectProfitabilityDetail` header by removing actions and visual ornaments, focusing purely on data density and clarity.

## Status Legend
- [ ] Pending
- [x] Completed

## Revised Design Specifications
1.  **Remove Visual Noise**:
    - [x] **Delete Buttons**: Remove "Add Bill" and "Create Invoice" buttons entirely.
    - [x] **Delete Icon Box**: Remove the 80px colored initials box.

2.  **Typography & Hierarchy**:
    - [x] **Title**: `<h1>` Project Name stands alone at the top (below the back button).
    - [x] **Unified Metadata Row**: Move `project_number` and `status` into the metadata grid/row.

3.  **New Metadata Layout (Horizontal)**:
    - Instead of a vertical list per column, use a single row of distinct data points (or a clean grid) with consistent styling (Icon + Label + Value).
    - **Data Points**:
        1.  **ID**: Icon (Hash) + Value.
        2.  **Status**: Icon (Activity) + Value.
        3.  **Client**: Icon (Users) + Value.
        4.  **Route**: Icon (MapPin) + Value.
        5.  **Service**: Icon (Package) + Value.
        6.  **Created**: Icon (Calendar) + Value.

4.  **Styling Consistency**:
    - [x] **Cards & Tables**: Removed all `shadow-sm` classes.
    - [x] **Backgrounds**: Changed hero section background from gray to white.
    - [x] **Borders**: Standardized to `border-[#E5E9F0]`.
    - [x] **Goal**: Match `CustomerLedgerDetail` visual style perfectly (clean, white, bordered).

## Implementation Plan
- [x] **Step 1**: Remove the `flex items-start justify-between` container that held the buttons.
- [x] **Step 2**: Remove the Initials Box div.
- [x] **Step 3**: Reorganize the `<h1>` and the metadata container to flow naturally (block level).
- [x] **Step 4**: Inject ID and Status into the existing metadata structure.
- [x] **Step 5**: Scan all components in `ProjectProfitabilityDetail` and remove `shadow-sm`, update backgrounds to `bg-white`, and verify borders.
