# Derived Quantities Refactor Blueprint

> **Living Document** — Updated after every implementation phase.
> Last Updated: 2026-02-23
> Current Phase: **ALL PHASES COMPLETE**

---

## Problem Statement

The previous "Booking Quantities" implementation (see `BOOKING_QUANTITIES_BLUEPRINT.md`)
added **manual numeric counter inputs** to booking creation forms and detail views.
Operations had to manually type `containers=3, bls=2, sets=1` — duplicating data
that already exists in the booking's operational text fields.

### What's Wrong

The booking already captures the actual container IDs and B/L numbers as part of
normal operational workflow. Asking ops to *also* manually count them is:

- **Redundant** — the data is already there in `containerNumbers`, `mblMawb`, etc.
- **Error-prone** — human counting can mismatch the actual IDs entered
- **Extra work** — ops shouldn't need to do accounting's math

### The Fix: DERIVE, Don't Store

Quantities should be **auto-computed** by parsing the booking's existing text fields:

```
BEFORE (wrong — manual counters):
  Ops types: containerNumbers = "MSCU5285725, HLXU2008419, TLLU5146210"
  Ops ALSO types: containerCount = 3    ← REDUNDANT!
  Ops ALSO types: blCount = 2           ← REDUNDANT!

AFTER (correct — auto-derived):
  Ops types: containerNumbers = "MSCU5285725, HLXU2008419, TLLU5146210"
  Ops types: mblMawb = "MSCU123456789, COSU987654321"
  System auto-derives: containers=3, bls=2
  Billing modal shows: "3 containers, 2 B/Ls" (pre-populated, adjustable)
```

### Source Field Audit

| Booking Type | Field | Type | Derives → | Example |
|---|---|---|---|---|
| Brokerage | `containerNumbers` | `string` | `containers` | `"MSCU5285725, HLXU2008419"` → 2 |
| Brokerage | `mblMawb` | `string` | `bls` | `"MSCU123456789, COSU987654321"` → 2 |
| Forwarding | `containerNumbers` | `string[]` | `containers` | `["ABCD1234567", "EFGH7654321"]` → 2 |
| Forwarding | `mblMawb` | `string` | `bls` | Same as Brokerage |
| Forwarding | `qty20ft/40ft/45ft` | `string` | `containers` (fallback) | `"10" + "8"` → 18 |
| Trucking | `vehicleReferenceNumber` | `string` | `containers` (trucks) | `"ABC-123, DEF-456"` → 2 |
| Others | *(none)* | — | defaults to 1 | — |

**Document Sets (`sets`):** No source field exists in any booking type. Defaults to 1.
Accountant can adjust in the billing modal if needed.

---

## Phased Implementation Plan

### Phase 1: New Utility — `deriveQuantitiesFromBooking()`
**Status:** COMPLETE
**Effort:** Small | **Impact:** HIGH (foundation for everything)

**Tasks:**
- [x] 1.1 Add `countEntries(text)` helper to `utils/contractQuantityExtractor.ts`
      — splits string by comma/semicolon/newline, trims, filters empty, returns count
- [x] 1.2 Add `deriveQuantitiesFromBooking(booking, serviceType)` function
      — calls `countEntries()` on the appropriate fields per service type
      — handles both `string` and `string[]` for `containerNumbers`
      — Forwarding fallback: `qty20ft + qty40ft + qty45ft` if `containerNumbers` is empty
      — Returns `BookingQuantities` shape
- [x] 1.3 Update `extractQuantitiesFromSavedBooking()` to call `deriveQuantitiesFromBooking()`
      instead of reading `booking.shipment_quantities`
      — keeps backward compat signature but changes internal logic

**Files Modified:**
- `utils/contractQuantityExtractor.ts`

---

### Phase 2: Rollback Creation Panels — Remove Manual Counters
**Status:** COMPLETE
**Effort:** Medium | **Impact:** HIGH (removes wrong UX)

**Tasks:**
- [x] 2.1 `CreateBrokerageBookingPanel.tsx`:
      - Remove `containerCount`, `blCount`, `setCount` state variables
      - Remove "Shipment Quantities" UI card with counter inputs
      - Remove `shipment_quantities` object from submission data
- [x] 2.2 `CreateTruckingBookingPanel.tsx`:
      - Remove `truckContainerCount` state variable
      - Remove "Shipment Quantities" UI card
      - Remove `shipment_quantities` object from submission data
- [x] 2.3 `CreateOthersBookingPanel.tsx`:
      - Remove `serviceQuantity` state variable
      - Remove "Shipment Quantities" UI card
      - Remove `shipment_quantities` object from submission data

**Files Modified:**
- `components/operations/CreateBrokerageBookingPanel.tsx`
- `components/operations/CreateTruckingBookingPanel.tsx`
- `components/operations/CreateOthersBookingPanel.tsx`

---

### Phase 3: Rollback Detail Views — Remove Manual Quantity Sections
**Status:** COMPLETE
**Effort:** Medium | **Impact:** HIGH (removes wrong UX from detail views)

**Tasks:**
- [x] 3.1 `BrokerageBookingDetails.tsx`: Remove entire "Shipment Quantities" section
      (the card with editable Container Count / B/L Count / Set Count / Shipments)
      — Kept "Examination & Flags" section with Examination Type dropdown
- [x] 3.2 `TruckingBookingDetails.tsx`: Remove entire "Shipment Quantities" section
      — Removed unused `Package` icon import
- [x] 3.3 `OthersBookingDetails.tsx`: Remove entire "Shipment Quantities" section
      — Removed unused `Package` icon import

**Files Modified:**
- `components/operations/BrokerageBookingDetails.tsx`
- `components/operations/TruckingBookingDetails.tsx`
- `components/operations/OthersBookingDetails.tsx`

---

### Phase 4: Rewire Billing Modal — Use Derived Quantities
**Status:** COMPLETE
**Effort:** Small | **Impact:** CRITICAL (the payoff)

**Tasks:**
- [x] 4.1 `ContractDetailView.tsx`: Change `bookingQuantities` prop from
      `ratePreviewBooking.shipment_quantities` to
      `deriveQuantitiesFromBooking(ratePreviewBooking, serviceType)`
      — import the new function from `contractQuantityExtractor`
- [x] 4.2 Verify `ContractRatePreviewModal.tsx` still works with the derived values
      (no changes expected — it already receives `BookingQuantities` via prop)

**Files Modified:**
- `components/pricing/ContractDetailView.tsx`

---

### Phase 5: Cleanup — Types & Blueprint Updates
**Status:** COMPLETE
**Effort:** Small | **Impact:** LOW (housekeeping)

**Tasks:**
- [x] 5.1 Optionally remove `shipment_quantities` field from booking interfaces
      in `types/operations.ts` (since we no longer store it).
      Decision: KEEP for now — it doesn't hurt, and legacy bookings may still have it.
- [x] 5.2 Update `BOOKING_QUANTITIES_BLUEPRINT.md` with refactor notes
- [x] 5.3 Update `CONTRACT_RATE_AUTOMATION_BLUEPRINT.md` with refactor notes
- [x] 5.4 Update this blueprint to mark COMPLETE

**Files Modified:**
- `docs/blueprints/BOOKING_QUANTITIES_BLUEPRINT.md`
- `docs/blueprints/CONTRACT_RATE_AUTOMATION_BLUEPRINT.md`
- `docs/blueprints/DERIVED_QUANTITIES_BLUEPRINT.md`

---

## Dependency Graph

```
Phase 1 (New Utility)
  |
  +---> Phase 2 (Rollback Creation Panels)     --> [Remove wrong UX from forms]
  |
  +---> Phase 3 (Rollback Detail Views)         --> [Remove wrong UX from details]
  |
  +---> Phase 4 (Rewire Billing Modal)          --> [Billing reads derived quantities]
  |
  +---> Phase 5 (Cleanup & Blueprint Updates)   --> [Documentation sync]
```

Phase 1 is prerequisite for Phase 4.
Phases 2 and 3 are independent of each other (pure removal).
Phase 5 comes last.

---

## File Map (Quick Reference)

| Purpose | File |
|---|---|
| Blueprint (this file) | `docs/blueprints/DERIVED_QUANTITIES_BLUEPRINT.md` |
| Quantity Extractor (Phase 1) | `utils/contractQuantityExtractor.ts` |
| Brokerage Creation (Phase 2) | `components/operations/CreateBrokerageBookingPanel.tsx` |
| Trucking Creation (Phase 2) | `components/operations/CreateTruckingBookingPanel.tsx` |
| Others Creation (Phase 2) | `components/operations/CreateOthersBookingPanel.tsx` |
| Brokerage Details (Phase 3) | `components/operations/BrokerageBookingDetails.tsx` |
| Trucking Details (Phase 3) | `components/operations/TruckingBookingDetails.tsx` |
| Others Details (Phase 3) | `components/operations/OthersBookingDetails.tsx` |
| Contract Detail View (Phase 4) | `components/pricing/ContractDetailView.tsx` |
| Operations Types (Phase 5) | `types/operations.ts` |

---

## Progress Log

| Date | Phase | Action | Notes |
|---|---|---|---|
| 2026-02-23 | Phase 0 | Blueprint created | Full audit of source fields. 5-phase plan. Replaces manual counter approach from BOOKING_QUANTITIES_BLUEPRINT. |
| 2026-02-23 | Phase 1 | COMPLETE | Added `countEntries()` + `deriveQuantitiesFromBooking()` to `contractQuantityExtractor.ts`. Refactored `extractQuantitiesFromSavedBooking()` to delegate to derive function when serviceType provided, with legacy fallback. |
| 2026-02-23 | Phase 2 | COMPLETE | Removed manual counter state variables and "Shipment Quantities" UI cards from all 3 creation panels. Removed `shipment_quantities` from submission data in all 3 panels. |
| 2026-02-23 | Phase 3 | COMPLETE | Removed "Shipment Quantities" editable sections from all 3 detail views. Kept Examination Type in Brokerage. Cleaned up unused `Package` icon imports in Trucking/Others. |
| 2026-02-23 | Phase 4 | COMPLETE | `ContractDetailView.tsx` now imports `deriveQuantitiesFromBooking` and passes derived quantities into `ContractRatePreviewModal` instead of reading stored `shipment_quantities`. |
| 2026-02-23 | Phase 5 | COMPLETE | Updated `BOOKING_QUANTITIES_BLUEPRINT.md` with SUPERSEDED notice. Updated `CONTRACT_RATE_AUTOMATION_BLUEPRINT.md` with Derived Quantities Refactor section. This blueprint marked ALL COMPLETE. |
| 2026-02-23 | — | NOTE | Multi-Input Fields refactor (see `MULTI_INPUT_FIELDS_BLUEPRINT.md`) replaced comma-separated text inputs with dynamic input lists for MBL/MAWB, Container Numbers, Registry Numbers, and Vehicle Reference Numbers. `countEntries()` continues to work unchanged — it already splits by comma, which is the format the new `MultiInputField` component emits. No changes needed to this utility. |