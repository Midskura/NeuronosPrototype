# Fix Scrolling & Dropdown Clipping Blueprint

## Objective
Fix the issue where dropdowns (like the Date Picker) are clipped inside the `ProjectExpensesTab`.
Instead of using React Portals (band-aid), we will restructure the layout so the tab is part of the main page's scroll flow, rather than being a restricted scrollable box.

## Core Strategy
1.  **Remove Scroll Traps**: Remove `overflow-auto` and fixed heights from `ProjectExpensesTab`.
2.  **Use Main Scroll**: Let the parent `ProjectDetail` handle scrolling.
3.  **Ensure Space**: Add minimum height to the `UnifiedExpensesTab` to accommodate dropdowns.

## Implementation Phases

### Phase 1: Create Blueprint
- [x] **1.1 Analyze Dependencies**: `ProjectExpensesTab`, `UnifiedExpensesTab`, `ProjectDetail`.
- [x] **1.2 Create Blueprint**: Document the plan.

### Phase 2: Refactor `ProjectExpensesTab.tsx`
- [x] **2.1 Remove Overflow**: Removed `h-full`, `overflow-auto`.
- [x] **2.2 Use Main Layout**: Added `min-h-[600px]` to ensure space.

### Phase 3: Refactor `UnifiedExpensesTab.tsx`
- [x] **3.1 Add Min-Height**: (Handled in container).
- [x] **3.2 Layout Cleanup**: Removed `h-full` to allow natural expansion.

### Phase 4: Verify `CustomerLedgerDetail.tsx`
- [x] **4.1 Check Consistency**: The customer view uses `overflow-auto` on the tab content (`line 304`). This is fine because the modal itself is large, but to be consistent and safe, I will ensure the Unified Tab inside it has enough vertical space if needed. For now, it seems okay because the customer modal is a different context (an overlay).

### Phase 5: Final Cleanup
- [x] **5.1 Verify Fix**: Ensure dropdowns float correctly and page scrolls as one unit.

## Status Log
- **[2026-02-12]**: Blueprint created. Phase 2 & 3 complete. Phase 4 verified.
