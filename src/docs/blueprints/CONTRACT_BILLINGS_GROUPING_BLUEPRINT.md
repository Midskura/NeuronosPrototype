# Contract Billings: Group-by-Booking Design Blueprint

**Created:** 2026-02-28
**Status:** COMPLETE
**Goal:** Add a "Group by Booking / Category" toggle to the contract billings view so accounting staff can see per-booking billing breakdowns at scale.

---

## Design Summary

Contracts are long-lived umbrella entities that may spawn dozens or hundreds of bookings. The current flat category-grouped view works for 2 bookings but breaks down at scale. This feature adds:

1. **Group-by toggle** (Booking | Category) in the contract billings toolbar
2. **Booking-grouped view** (default) — one collapsible card per booking with subtotals, service icon, and booking ID
3. **Expand All / Collapse All** control
4. **Per-booking subtotals** visible in collapsed state
5. **Category-grouped view** preserved as alternate (current behavior)

---

## Affected Files

| File | Change |
|------|--------|
| `/components/shared/billings/UnifiedBillingsTab.tsx` | Add `groupBy` prop, toggle UI, pass to BillingsTable |
| `/components/shared/billings/BillingsTable.tsx` | Add booking-grouped rendering path with booking cards |
| `/components/pricing/ContractDetailView.tsx` | Pass `linkedBookings` data + `groupBy` support to UnifiedBillingsTab |

---

## Phases

### Phase 1: Toggle UI + Data Plumbing
- [x] Add `groupBy?: "category" | "booking"` and `linkedBookings?: any[]` props to `UnifiedBillingsTab`
- [x] Add toggle radio buttons in the toolbar (only visible when `groupBy` prop is provided)
- [x] Pass `groupBy` and booking metadata through to `BillingsTable`
- [x] `ContractDetailView.renderBillingsTab()` passes `linkedBookings` and enables groupBy

### Phase 2: Booking-Grouped Rendering in BillingsTable
- [x] When `groupBy === "booking"`, group items by `booking_id` instead of `quotation_category`
- [x] Render booking card headers with: booking ID (teal, clickable), service icon, service type, item count, subtotal
- [x] Within each booking card, sub-group by category using existing CategoryHeader + PricingTableHeader + UniversalPricingRow
- [x] Add Expand All / Collapse All toggle button
- [x] Footer totals remain the same regardless of grouping mode

### Phase 3: Polish & Edge Cases
- [x] Handle bookings with no billing items (show empty card with "No billing items for this booking yet" message)
- [x] Handle billing items with no `booking_id` (group under "Unassigned Items")
- [x] Ensure filters (search, status, date, category) work correctly in both grouping modes — search also matches booking_id
- [x] Sync `allExpanded` state when individual bookings are toggled
- [x] Empty linked bookings from `linkedBookings` prop appear as cards even with zero billing items

---

## Current Status

**ALL PHASES COMPLETE.** The contract billings grouping feature is fully implemented:
- Booking/Category segmented toggle in contract billings view (defaults to Booking)
- Collapsible booking cards with service icons (via shared `getServiceIcon`), monospace booking IDs, service type badges, item counts, and subtotals
- Two-level grouping: Booking > Category with lightweight category sub-headers
- Expand All / Collapse All toggle with proper state sync
- Empty booking cards show placeholder message
- Unassigned items grouped under "Unassigned Items"
- Search filter matches booking_id in addition to description/service/category
- All existing filters work across both grouping modes
- Project billings completely unaffected (no toggle shown, existing category view unchanged)