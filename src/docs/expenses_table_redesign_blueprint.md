# Expenses Table Redesign Blueprint

## Objective
Redesign `ExpensesTable.tsx` to strictly match the visual hierarchy and design system of `ActivitiesList.tsx`, removing date grouping and adopting the CSS Grid layout.

## Design Reference
- **Source**: `ActivitiesList.tsx`
- **Key Elements**:
    - **Layout**: CSS Grid.
    - **Visuals**:
        - Single Card container.
        - Header Row: `bg-[#F7FAF8]` (Matches `var(--neuron-bg-page)`), `border-b border-[#E5E9F0]`.
        - Row Hover: `hover:bg-[#F1F6F4]` (Matches `var(--neuron-state-hover)`).
    - **Colors (Exact Match)**:
        - **Icon**: `text-[#98A2B3]` (lighter gray for icons) or `var(--neuron-ink-muted)`.
        - **Pill**: `bg-[#F1F6F4] text-[#6B7A76]` (Sage/Gray) for Categories.
        - **Reference**: `text-[#0F766E]` (Neuron Teal).
        - **Date**: `text-[#667085]`.
        - **Status**: Specific badges (Blue for Approved, Green for Paid).

## Implementation Phases

### Phase 1: Blueprint & Cleanup
- [x] **1.1 Update Blueprint**: Adjusted plan to remove date grouping.
- [x] **1.2 Remove `GroupedSection` Usage**: Complete.

### Phase 2: Refactor `ExpensesTable.tsx`
- [x] **2.1 Grid Layout Implementation**: CSS Grid implemented.
- [x] **2.2 Column Content Mapping**: Columns mapped.

### Phase 3: Final Verification & Color Polish
- [x] **3.1 Exact Color Match**:
    - Header background updated to `#F7FAF8`.
    - Row hover updated to `#F1F6F4`.
    - Category Pill updated to match `ActivitiesList`.
    - Reference color updated to `#0F766E`.
- [x] **3.2 Column Width Tuning**: Columns widths tuned for spacing.
- [x] **3.3 Separate Payee/Description**:
    - Split Payee and Description into separate columns.
    - Order: Category/Date, Reference, **Description**, **Payee**, Booking, Status, Amount.
    - Updated interface to include optional `description`.
- [x] **3.4 Fix Data Mapping**:
    - Fixed issue in `UnifiedExpensesTab.tsx` where `description` was not being passed to the table.

## Status Log
- **[2026-02-12]**: Phase 3 complete. Table layout updated with split columns and data mapping fixed.
