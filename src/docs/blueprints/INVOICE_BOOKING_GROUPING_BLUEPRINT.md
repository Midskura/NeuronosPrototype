# Invoice Creator — Booking-Grouped Billing Items Blueprint

**Created:** 2026-03-05
**Status:** COMPLETE
**Goal:** Make the Invoice Creator's "Billing Items" section display items grouped by booking (matching the Billings tab pattern), using a shared hook for maximum DRY compliance.

---

## Problem

The Invoice Creator (`InvoiceBuilder.tsx`) renders billing items in a flat list grouped only by ad-hoc category inference (`service_type` → "Origin Charges", "Freight Charges", etc.). Meanwhile, the Billings tab (`BillingsTable.tsx`) groups items by booking ID with collapsible headers, service icons, item counts, and status badges. The booking-grouping logic is entirely inline in `BillingsTable.tsx` and cannot be reused.

## Solution

Extract booking-grouping logic into a shared `useBookingGrouping` hook, then consume it in both `BillingsTable.tsx` (refactor) and `InvoiceBuilder.tsx` (new feature).

---

## Phases

### Phase 1: Extract `useBookingGrouping` Hook
**Status:** COMPLETE

**Create** `/hooks/useBookingGrouping.ts`

Extract from `BillingsTable.tsx` (lines ~112–178):
- `groupItemsByBooking(items, knownBookingIds)` — pure function, groups items by `booking_id`, normalizes unknown IDs to `"unassigned"`
- `bookingIds` — sorted list (unassigned last)
- `bookingMeta` — `Map<string, any>` from `linkedBookings`
- `inferServiceType(bookingId, meta)` — derives type from ID prefix
- `expandedBookings` / `toggleBooking` / `toggleAllBookings` / `allExpanded` — collapse state
- Auto-expand on init via `useEffect`

**Key design decisions:**
- The hook accepts a generic item type with a `getBookingId: (item: T) => string` accessor so it works with both `BillingTableItem` (uses `item.originalData?.booking_id`) and `Billing/BillingItem` (uses `item.booking_id` directly).
- Pure grouping function is exported separately for non-hook use cases.
- `inferServiceType` is exported as a standalone utility (already duplicated in ContractDetailView).

**Files touched:** 1 new file

---

### Phase 2: Refactor `BillingsTable.tsx` to Use the Hook
**Status:** COMPLETE

**Modify** `BillingsTable.tsx`:
- Replace inline `bookingGroupedData`, `bookingIds`, `bookingMeta`, `inferServiceType`, and expand/collapse state with `useBookingGrouping` hook
- Remove ~70 lines of inline logic
- Zero visual/behavioral changes — pure refactor

**Verification:** Billings tab must look and behave identically.

**Files touched:** 1 modified

---

### Phase 3: Thread `linkedBookings` to Invoice Creator
**Status:** COMPLETE

**Modify** (prop threading only, no UI changes):

1. `UnifiedInvoicesTab.tsx` — Added `linkedBookings?: any[]` prop, passes `linkedBookings || project.linkedBookings || []` to `InvoiceBuilder`
2. `InvoiceBuilder.tsx` — Added `linkedBookings?: any[]` prop (no usage yet)
3. `ProjectInvoices.tsx` — No change needed; `UnifiedInvoicesTab` falls back to `project.linkedBookings`
4. `ContractDetailView.tsx` — Passes `linkedBookings={linkedBookings}` to `UnifiedInvoicesTab` in `renderInvoicesTab()`

**Files touched:** 4 modified

---

### Phase 4: Implement Booking-Grouped UI in InvoiceBuilder
**Status:** COMPLETE

**Modify** `InvoiceBuilder.tsx` — Replace the flat billing items list (lines ~722–858) with booking-grouped rendering:

- Use `useBookingGrouping` hook with `linkedBookings` prop
- Render booking headers as collapsible dividers (same visual pattern as billings tab: chevron + service icon + booking ID + service type pill + item count badge)
- Nest checkbox item rows inside each booking group
- Keep category sub-headers within each booking when multiple categories exist
- Maintain all existing functionality: select/deselect, select all, item overrides (remarks, tax), unbilled filtering
- "Select All" checkbox in the table header should toggle ALL items across ALL bookings
- Per-booking "select all" behavior is a nice-to-have but not required in v1

**Fallback:** If `linkedBookings` is empty/undefined, fall back to the current flat category-grouped rendering (backward compat for non-booking projects).

**Files touched:** 1 modified

---

## Files Inventory

| File | Phase | Action |
|------|-------|--------|
| `/hooks/useBookingGrouping.ts` | 1 | CREATE |
| `/components/shared/billings/BillingsTable.tsx` | 2 | MODIFY (re-read first!) |
| `/components/shared/invoices/UnifiedInvoicesTab.tsx` | 3 | MODIFY |
| `/components/projects/invoices/InvoiceBuilder.tsx` | 3, 4 | MODIFY |
| `/components/projects/tabs/ProjectInvoices.tsx` | 3 | MODIFY |
| `/components/pricing/ContractDetailView.tsx` | 3 | MODIFY |

## Key Data Shape Notes

- `BillingsTable` items are `BillingTableItem` — booking ID lives at `item.originalData?.booking_id`
- `InvoiceBuilder` items are `Billing[]` (from `FinancialData.billingItems`) — booking ID lives directly at `item.booking_id`
- Both have `id`, `description`, `amount`, `currency`, `status`, `service_type`/`serviceType`
- The hook's `getBookingId` accessor pattern handles this difference cleanly

## Dependencies

- `getServiceIcon` from `/utils/quotation-helpers` — already used in `BillingsTable`, will reuse in `InvoiceBuilder`

---

## Post-Implementation Fix: booking_id Resolution in useBillingMerge

**Date:** 2026-03-05
**Root Cause:** The Invoice Creator's billing items all showed under "Unassigned" despite the Billings tab correctly grouping them by booking. Root cause was a data-layer divergence:

- `UnifiedBillingsTab` has its own inline merge logic that **actively re-resolves `booking_id`** for every unbilled item using a `resolveBookingId(serviceType)` helper. This maps each item's `service_type` to the correct linked booking ID via a `serviceToBookingMap` built from `linkedBookings`.
- `useBillingMerge` (used by the invoices flow via `UnifiedInvoicesTab`) did NOT have this resolution logic — it just preserved the raw `booking_id` from the API, which is often set to the project/contract number instead of the actual booking ID (e.g., "BRK-2026-021").

**Fix applied:**
1. `useBillingMerge.ts` — Added `linkedBookings?: any[]` prop, built `serviceToBookingMap`, added `resolveBookingId` helper (same logic as `UnifiedBillingsTab` line 106-123). Applied it to both matched-item updates (line 77 `booking_id: resolveBookingId(...)`) and virtual item creation (line 98 `booking_id: resolveBookingId(...)`).
2. `UnifiedInvoicesTab.tsx` — Passes `linkedBookings: resolvedLinkedBookings` to `useBillingMerge`, ensuring the resolution logic has the booking metadata it needs.

**Files touched:** `/hooks/useBillingMerge.ts`, `/components/shared/invoices/UnifiedInvoicesTab.tsx`