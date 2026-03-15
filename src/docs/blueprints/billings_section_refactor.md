# Blueprint: Billings Section Refactor

## Status: Completed
**Current Phase:** Completed

## Objective
Refactor the Billings UI in `UnifiedBillingsTab` to use a unified `BillingsSection` wrapper component. This matches the visual structure of the `SellingPriceSection`, introducing a card container, centralized header, and the ability to dynamically add new billing categories.

## Phases

### Phase 1: Preparation & Analysis [COMPLETED]
- [x] Analyze `SellingPriceSection` for visual structure.
- [x] Analyze `UnifiedBillingsTab` to identify current integration.
- [x] Confirm `CategoryPresetDropdown` availability.

### Phase 2: Create BillingsSection Component [COMPLETED]
- [x] Create `/components/shared/billings/BillingsSection.tsx`.
- [x] Implement local state for `expandedCategories` and `visibleCategories`.
- [x] Integrate `CategoryPresetDropdown` for adding new categories.
- [x] Implement `handleRefresh` callback to propagate updates up.
- [x] Styling: Match `SellingPriceSection` (White card, header with green accents).

### Phase 3: Integration into UnifiedBillingsTab [COMPLETED]
- [x] Modify `UnifiedBillingsTab.tsx`.
- [x] Remove the manual `.map()` loop over categories.
- [x] Replace with `<BillingsSection />`.
- [x] Pass necessary props (`bookingId`, `projectId`, `items`, `viewMode`).

### Phase 4: Refinement [COMPLETED]
- [x] Verify "Empty Category" behavior (rendering a section with no items).
- [x] Verify "Add Item" flow within a newly created category.
- [x] Check visual consistency (padding, borders, fonts).

## Technical Notes
- **State Strategy:** `UnifiedBillingsTab` fetches the raw items. `BillingsSection` receives these items. It groups them by category. It also maintains a list of "extra" categories that the user added manually but don't have items yet.
- **Data Flow:**
    - `UnifiedBillingsTab` -> `items` -> `BillingsSection`
    - `BillingsSection` -> groups items -> `BillingCategorySection`
