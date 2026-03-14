# Booking Shipment Quantities Blueprint

> **⚠️ SUPERSEDED** — This blueprint's manual counter approach was rolled back
> and replaced by the **Derived Quantities Refactor**. See `DERIVED_QUANTITIES_BLUEPRINT.md`.
>
> **Living Document** — Updated after every implementation phase.
> Last Updated: 2026-02-23
> Current Phase: **SUPERSEDED — Phases 2-3 rolled back, Phase 4 rewired**

---

## Problem Statement

The contract rate engine (`contractRateEngine.ts`) needs structured quantities
(`{ containers, bls, sets, shipments }`) to calculate billing. But **none of the
booking types store these numbers**. The billing generation modal
(`ContractRatePreviewModal`) forces accountants to manually type quantities that
the booking should already know.

### Root Cause

Bookings were designed as operational tracking records — they capture shipment
details like container IDs, consignee names, and delivery addresses. But they
never captured the **numeric counts** that drive billing math:

| Rate Engine Needs | Brokerage Booking Has | Gap |
|---|---|---|
| `containers` (number) | `containerNumbers` (free-text IDs) | ❌ No count |
| `bls` (number) | Nothing | ❌ Missing |
| `sets` (number) | Nothing | ❌ Missing |
| `shipments` (number) | Nothing (assumed 1) | ⚠️ Implicit |

Trucking bookings have `truckType` (string) but no truck count.
Others bookings have no quantity fields at all.

### Goal

Make bookings the **single source of truth** for all shipment quantities, so
billing generation is a one-click confirmation — not a data re-entry exercise.

```
BEFORE (current):
  Accountant clicks "Generate Billing"
    → Modal opens with BLANK quantity fields
    → Accountant must manually look up and type: containers=18, bls=2, sets=1
    → Then confirm

AFTER (target):
  Accountant clicks "Generate Billing"
    → Modal opens with PRE-POPULATED quantities from the booking
    → Accountant reviews and confirms (or adjusts edge cases)
    → Done
```

### Design Principles

- **DRY**: One `ShipmentQuantities` interface, used across all booking types.
  Direct 1:1 mapping to `BookingQuantities` — zero conversion code.
- **Incremental**: Each phase is independently valuable and testable.
- **Minimal Surface**: No new components. All changes are additions to existing
  files using existing UI patterns (`EditableField`, form inputs).
- **Department Boundaries Preserved**: Ops fills in quantities (operational facts).
  Accounting reads them for billing. No billing UI in ops flows.

---

## Phased Implementation Plan

### Phase 1: Foundation — Types + Extractor
**Status:** COMPLETE
**Effort:** Small | **Impact:** HIGH (unblocks everything)

**Tasks:**
- [x] 1.1 Add `ShipmentQuantities` interface to `types/operations.ts`
- [x] 1.2 Add `shipment_quantities?: ShipmentQuantities` field to all 4 booking
      interfaces: `BrokerageBooking`, `TruckingBooking`, `OthersBooking`, `ForwardingBooking`
- [x] 1.3 Add `examination_type` and `penalty_flags` fields to `BrokerageBooking`
      (operational event tracking — future billing implications)
- [x] 1.4 Add `extractQuantitiesFromSavedBooking(booking)` function to
      `utils/contractQuantityExtractor.ts` — reads `booking.shipment_quantities`
      directly, with fallback to `{ containers: 1, shipments: 1, bls: 1, sets: 1 }`

**Files Modified:**
- `types/operations.ts`
- `utils/contractQuantityExtractor.ts`

**DRY Notes:**
- `ShipmentQuantities` maps 1:1 to existing `BookingQuantities` — no adapter needed
- Existing form-based extractors remain untouched (used by QuotationBuilder path)

---

### Phase 2: Creation Forms — Quantity Inputs
**Status:** ROLLED BACK
**Effort:** Medium | **Impact:** HIGH (captures data at the source)

**Tasks:**
- [x] 2.1 `CreateBrokerageBookingPanel.tsx`: Add quantity fields in Shipment Details section
      - "Number of Containers" (numeric, visible when mode = FCL, default 1)
      - "Number of B/Ls" (numeric, default 1)
      - "Number of Document Sets" (numeric, default 1)
      - Save as `shipment_quantities` object in submission data
- [x] 2.2 `CreateTruckingBookingPanel.tsx`: Add quantity fields
      - "Number of Trucks/Containers" (numeric, default 1)
      - Save as `shipment_quantities` object in submission data
- [x] 2.3 `CreateOthersBookingPanel.tsx`: Add quantity fields
      - "Quantity" (numeric, default 1)
      - Save as `shipment_quantities` object in submission data

**Files Modified:**
- `components/operations/CreateBrokerageBookingPanel.tsx`
- `components/operations/CreateTruckingBookingPanel.tsx`
- `components/operations/CreateOthersBookingPanel.tsx`

**DRY Notes:**
- All three forms produce the same `ShipmentQuantities` shape
- Uses existing form field styling patterns (no new components)

---

### Phase 3: Detail Views — Editable Quantity Display
**Status:** ROLLED BACK
**Effort:** Medium | **Impact:** MEDIUM (ops can update quantities post-creation)

**Tasks:**
- [x] 3.1 `BrokerageBookingDetails.tsx`: Add "Shipment Quantities" section
      - Editable fields: Container Count, B/L Count, Set Count, Shipments
      - Uses existing `EditableField` component
      - Placed after General Information, before Shipment Information
      - Also add Examination Type dropdown
- [x] 3.2 `TruckingBookingDetails.tsx`: Add "Shipment Quantities" section
      - Editable fields: Truck/Container Count, Shipments
      - Uses existing `EditableField` component
- [x] 3.3 `OthersBookingDetails.tsx`: Add "Shipment Quantities" section
      - Editable fields: Service Quantity, Shipments
      - Uses existing `EditableField` component

**Files Modified:**
- `components/operations/BrokerageBookingDetails.tsx`
- `components/operations/TruckingBookingDetails.tsx`
- `components/operations/OthersBookingDetails.tsx`

**DRY Notes:**
- Reuses `EditableField` component already in every detail view
- Same `ShipmentQuantities` structure across all three

---

### Phase 4: Billing Integration — Auto-Populate from Booking
**Status:** REWIRED
**Effort:** Medium | **Impact:** CRITICAL (the payoff — one-click billing)

**Tasks:**
- [x] 4.1 Update `ContractRatePreviewModal.tsx`:
      - Add optional `bookingQuantities?: ShipmentQuantities` prop
      - When provided, pre-populate containers/shipments/bls/sets from it
      - Change quantity inputs from blank to pre-filled (still adjustable)
      - Auto-select mode from `bookingMode` prop if provided
      - Green "pre-populated" banner with CheckCircle icon when quantities come from booking
- [x] 4.2 Update callers of `ContractRatePreviewModal` to pass booking data:
      - `ContractDetailView.tsx`: passes `ratePreviewBooking.shipment_quantities` into modal
- [x] 4.3 Blueprint updated with complete progress log

**Files Modified:**
- `components/contracts/ContractRatePreviewModal.tsx`
- `components/contracts/ContractDetailView.tsx`
- `docs/blueprints/BOOKING_QUANTITIES_BLUEPRINT.md`

**DRY Notes:**
- Zero changes to rate engine — it already accepts `BookingQuantities`
- Zero changes to server endpoint — it already accepts quantities in request body
- The modal just reads from a new prop instead of starting from blank state

---

## Dependency Graph

```
Phase 1 (Types + Extractor)
  |
  +---> Phase 2 (Creation Forms)      --> [Bookings now capture quantities at birth]
  |
  +---> Phase 3 (Detail Views)        --> [Ops can update quantities post-creation]
  |
  +---> Phase 4 (Billing Integration) --> [Accountant sees pre-populated billing]
```

Phase 1 is prerequisite for all subsequent phases.
Phases 2, 3, and 4 can be done in any order after Phase 1, but the logical
flow is 2 → 3 → 4 (capture → display/edit → consume).

---

## File Map (Quick Reference)

| Purpose | File |
|---|---|
| Blueprint (this file) | `/docs/blueprints/BOOKING_QUANTITIES_BLUEPRINT.md` |
| Operations Types (Phase 1) | `types/operations.ts` |
| Quantity Extractor (Phase 1) | `utils/contractQuantityExtractor.ts` |
| Brokerage Creation Form (Phase 2) | `components/operations/CreateBrokerageBookingPanel.tsx` |
| Trucking Creation Form (Phase 2) | `components/operations/CreateTruckingBookingPanel.tsx` |
| Others Creation Form (Phase 2) | `components/operations/CreateOthersBookingPanel.tsx` |
| Brokerage Detail View (Phase 3) | `components/operations/BrokerageBookingDetails.tsx` |
| Trucking Detail View (Phase 3) | `components/operations/TruckingBookingDetails.tsx` |
| Others Detail View (Phase 3) | `components/operations/OthersBookingDetails.tsx` |
| Billing Preview Modal (Phase 4) | `components/contracts/ContractRatePreviewModal.tsx` |
| Rate Automation Blueprint (Phase 4) | `docs/blueprints/CONTRACT_RATE_AUTOMATION_BLUEPRINT.md` |

---

## Progress Log

| Date | Phase | Action | Notes |
|---|---|---|---|
| 2026-02-23 | Phase 0 | Blueprint created | Full audit complete. 10-file plan documented. |
| 2026-02-23 | Phase 1 | COMPLETE | `ShipmentQuantities` interface + `DEFAULT_SHIPMENT_QUANTITIES` + `ExaminationType` added to `types/operations.ts`. `shipment_quantities` field added to ForwardingBooking, BrokerageBooking, TruckingBooking, OthersBooking. `examination_type` + `penalty_flags` added to BrokerageBooking. `extractQuantitiesFromSavedBooking()` added to `contractQuantityExtractor.ts`. |
| 2026-02-23 | Phase 2 | COMPLETE | Quantity fields added to creation forms for Brokerage, Trucking, and Others bookings. |
| 2026-02-23 | Phase 3 | COMPLETE | Editable quantity fields added to detail views for Brokerage, Trucking, and Others bookings. |
| 2026-02-23 | Phase 4 | COMPLETE | `ContractRatePreviewModal` updated with `bookingQuantities` prop for pre-population. Green banner indicates when quantities are pre-filled. `ContractDetailView` passes `shipment_quantities` from booking into modal. |
| 2026-02-23 | Cleanup | COMPLETE | Removed unused `DEFAULT_SHIPMENT_QUANTITIES` import from `CreateBrokerageBookingPanel`. Updated `CONTRACT_RATE_AUTOMATION_BLUEPRINT.md` with cross-reference, new file map entries, updated Operations Booking Path diagram, and progress log entry. |
| 2026-02-23 | SUPERSEDED | Refactored | Manual counter inputs (Phases 2-3) rolled back. Phase 4 rewired to use `deriveQuantitiesFromBooking()` which parses existing operational text fields instead of reading stored `shipment_quantities`. Phase 1 types (`ShipmentQuantities`, `ExaminationType`) kept for backward compat. See `DERIVED_QUANTITIES_BLUEPRINT.md`. |