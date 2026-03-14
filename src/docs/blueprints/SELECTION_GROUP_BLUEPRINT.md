# Selection Group Blueprint
## Unified Additive + Alternative Row Handling in the Rate Engine

## Problem

The contract rate engine (`instantiateRates()` in `contractRateEngine.ts`) treats every row as **additive** — if a row has a non-zero rate and the quantity is > 0, it bills it. This is correct for Brokerage (Container Handling + Documentation + Stamps all apply simultaneously), but **wrong for Trucking** where rows are **alternatives** — you pick ONE truck type for ONE destination.

**Example**: A trucking matrix with 4 truck configs x 3 destinations = 12 rows. A booking for "5 x 40ft to Valenzuela" should bill ONE row (20ft/40ft under Valenzuela x 5), but the engine bills ALL 12 rows.

This isn't just a Trucking problem. Even Brokerage could have alternative rows (e.g., "20ft Container" vs "40ft Container" as separate rate entries) — a unified mechanism is needed.

## Design Decision

Add **one field** to `ContractRateRow` and **one parameter** to the engine. No service-specific branching.

### Data Model: `selection_group` on `ContractRateRow`

```ts
interface ContractRateRow {
  // ... existing fields ...
  selection_group?: string;   // undefined = additive (always billed)
                              // same string = mutually exclusive alternatives
}
```

- Rows **without** `selection_group` → additive, billed whenever rate > 0 and qty > 0 (today's behavior)
- Rows **with** `selection_group` → only billed if the caller explicitly selects them

### Engine Input: `selections` parameter

```ts
selections?: Record<string, string>   // selection_group name → selected charge_type_id or particular
```

Passed to `instantiateRates()` and `calculateContractBilling()`. If not provided, all selection-group rows are **skipped** (safe default — you must opt in).

### Engine Filter: 4 lines in `instantiateRates()`

```ts
if (row.selection_group) {
  const picked = selections?.[row.selection_group];
  if (!picked || (picked !== row.particular && picked !== row.charge_type_id)) {
    continue;  // Not the chosen alternative → skip
  }
}
```

### Form → Selections Mapping

**Trucking form fields:**
- `truckType`: "4W", "6W", "10W", "20ft", "40ft", "45ft"
- `deliveryAddress`: free text like "123 Main St, Valenzuela City"

**Rate matrix rows (via TruckingDestinationBlocks):**
- `particular`: "20ft / 40ft", "Back to back", "4Wheeler", "6Wheeler"
- `remarks` (destination): "Valenzuela City", "Within Metro Manila", etc.
- `charge_type_id`: "20ft_40ft", "back_to_back", "4wheeler", "6wheeler"

**Mapping logic** (fuzzy):
| Form `truckType` | Matches `charge_type_id` |
|---|---|
| "20ft", "40ft", "45ft" | "20ft_40ft" |
| "4W" | "4wheeler" |
| "6W" | "6wheeler" |
| "10W" | "6wheeler" (fallback) or future preset |

| Form `deliveryAddress` | Matches `selection_group` (= destination) |
|---|---|
| "...Valenzuela..." | "Valenzuela City" (fuzzy substring) |

**Brokerage**: Currently passes no `selections` → all rows remain additive. Future-proof for adding alternative container size rows.

## Surfaces That Need `selections` Passed Through

| Surface | File | Currently calls |
|---|---|---|
| Quotation rate bridge (auto-apply) | `QuotationBuilderV3.tsx` | `contractRatesToSellingPrice()` → `calculateContractBilling()` |
| Quotation rate breakdown sheet | `QuotationRateBreakdownSheet.tsx` | `calculateContractBilling()` |
| Booking rate calculation sheet | `RateCalculationSheet.tsx` | `calculateContractBilling()` |
| `contractRatesToSellingPrice` (quantity-aware path) | `contractRateEngine.ts` | `calculateContractBilling()` |
| `contractRatesToSellingPrice` (qty=1 fallback path) | `contractRateEngine.ts` | Direct row iteration |

## Plan

### Phase 1 — Data Model + Engine Core
**Goal**: Add `selection_group` to the type and the 4-line filter to `instantiateRates()`.

| Task | File | Change |
|---|---|---|
| 1.1 | `types/pricing.ts` | Add `selection_group?: string` to `ContractRateRow` |
| 1.2 | `utils/contractRateEngine.ts` | Add `selections?: Record<string, string>` param to `instantiateRates()` signature |
| 1.3 | `utils/contractRateEngine.ts` | Add the 4-line selection filter in the `for (const row)` loop |
| 1.4 | `utils/contractRateEngine.ts` | Thread `selections` through `calculateContractBilling()` → `instantiateRates()` |
| 1.5 | `utils/contractRateEngine.ts` | Thread `selections` through `contractRatesToSellingPrice()` → both paths (quantity-aware + fallback) |

**Backward-compatible**: No `selections` passed = no filtering = identical to today.

### Phase 2 — Auto-Stamp `selection_group` in Trucking
**Goal**: When `TruckingDestinationBlocks` emits rows, each row gets `selection_group` set to its destination name.

| Task | File | Change |
|---|---|---|
| 2.1 | `components/pricing/quotations/TruckingDestinationBlocks.tsx` | In every row-emit path (add, update, rename, duplicate), stamp `selection_group: destination` on each emitted row |

**Result**: All new/edited trucking rate matrices automatically have `selection_group` on every row. Existing saved matrices without the field remain additive (Phase 1's safe default).

### Phase 3 — Trucking Selections Extractor
**Goal**: Build the `selections` map from trucking form data using fuzzy matching against rate matrix destinations.

| Task | File | Change |
|---|---|---|
| 3.1 | `utils/contractQuantityExtractor.ts` | New export: `extractTruckingSelections(truckingData, rateMatrices) → Record<string, string>` |
| 3.2 | (same file) | Fuzzy destination matching: form `deliveryAddress` substring-matched against known `selection_group` values from the trucking matrix rows |
| 3.3 | (same file) | Truck type mapping: form `truckType` → `charge_type_id` (e.g., "40ft" → "20ft_40ft", "4W" → "4wheeler") |

### Phase 4 — Wire Into Quotation Surfaces
**Goal**: Pass `selections` through the quotation builder and breakdown sheet.

| Task | File | Change |
|---|---|---|
| 4.1 | `QuotationBuilderV3.tsx` | In the trucking branch of `applyContractRateBridge()`, call `extractTruckingSelections()` and pass to `contractRatesToSellingPrice()` |
| 4.2 | `QuotationBuilderV3.tsx` | In `getQuantitiesForService()` (used by breakdown sheet), also derive and cache selections |
| 4.3 | `QuotationRateBreakdownSheet.tsx` | Accept optional `selections` prop, pass to `calculateContractBilling()` |

### Phase 5 — Wire Into Booking Rate Calculation Sheet
**Goal**: Pass `selections` through the booking-level rate calculator.

| Task | File | Change |
|---|---|---|
| 5.1 | `components/contracts/RateCalculationSheet.tsx` | Accept optional `selections` prop, pass to `calculateContractBilling()` |
| 5.2 | Booking detail panels (e.g., `TruckingBookingDetails.tsx`) | Derive `selections` from booking data and pass to `RateCalculationSheet` |

## Status

| Phase | Status |
|---|---|
| Phase 1 — Data Model + Engine Core | COMPLETE |
| Phase 2 — Auto-Stamp in Trucking | COMPLETE |
| Phase 3 — Trucking Selections Extractor | COMPLETE |
| Phase 4 — Wire Into Quotation Surfaces | COMPLETE |
| Phase 5 — Wire Into Booking Rate Calculation Sheet | COMPLETE |

## Changelog

- **2026-02-25 (Phase 1)**: Data model + engine core implemented.
  - `types/pricing.ts`: Added `selection_group?: string` to `ContractRateRow`.
  - `utils/contractRateEngine.ts`: Added `selections?: Record<string, string>` parameter to `instantiateRates()`, `calculateContractBilling()`, and `contractRatesToSellingPrice()`. Added 4-line selection group filter in `instantiateRates()` loop and duplicated filter in `contractRatesToSellingPrice()` fallback path. Fully backward-compatible — no `selections` passed = no filtering = identical to previous behavior.
- **2026-02-25 (Phase 2)**: Auto-stamp `selection_group` in all trucking row-emit paths.
  - `ContractRateCardV2.tsx`: Added `selection_group: finalName` to the 4 initial rows created by "Add Destination" button.
  - `TruckingDestinationBlocks.tsx`: Stamped `selection_group` in `toggleConfig` (add new config row), `renameDestination` (update `selection_group` alongside `remarks`), and `duplicateDestination` (stamp `selection_group: finalName` on cloned rows). All new/edited trucking matrices now carry `selection_group` on every row.
- **2026-02-25 (Phase 3)**: Trucking selections extractor implemented.
  - `utils/contractQuantityExtractor.ts`: Added `TRUCK_TYPE_TO_CHARGE_ID` mapping table (form truckType → charge_type_id), and new `extractTruckingSelections()` export that fuzzy-matches `deliveryAddress` against known `selection_group` values from the trucking matrix and maps `truckType` to `charge_type_id`. Three-tier fuzzy matching: exact → address-contains-group → group-contains-address. Auto-selects if only one destination group exists. Added `ContractRateMatrix` import from types.
- **2026-02-25 (Phase 4)**: Wired selections into quotation surfaces.
  - `QuotationBuilderV3.tsx`: Added `extractTruckingSelections` import. In the trucking branch of `applyContractRateBridge()`, derives `selections` and passes to `contractRatesToSellingPrice()`. Added `getSelectionsForService()` helper and passes `selections` prop to `QuotationRateBreakdownSheet`.
  - `QuotationRateBreakdownSheet.tsx`: Added optional `selections` prop, threaded through to `calculateContractBilling()` call and its `useMemo` dependency array.
- **2026-02-25 (Phase 5)**: Wired selections into booking-level rate calculation sheet.
  - `RateCalculationSheet.tsx`: Added optional `selections` prop, threaded through to `calculateContractBilling()` call and its `useMemo` dependency array.
  - `BookingRateCardButton.tsx`: Added `extractTruckingSelections` import. Derives `selections` from `booking.truckType` and `booking.deliveryAddress` for trucking bookings, passes to `RateCalculationSheet`. Non-trucking bookings pass `undefined` (all rows additive).
- **2026-02-25 (Bugfix: Legacy Data + Filter Semantics)**: Fixed two compounding issues causing all trucking rows to be billed additively.
  - `contractRateEngine.ts`: (1) Auto-derive `selection_group` from `remarks` for trucking rows at engine time — legacy contracts saved before Phase 2 don't have `selection_group` stamped, but already have destination names in `remarks`. Applied in both `instantiateRates()` and `contractRatesToSellingPrice()` fallback path. (2) Changed filter semantics from "skip if no matching selection" to "skip only if `selections` explicitly contains this group but picked a different row" — prevents rows from being wrongly skipped when no `selections` are passed.
  - `contractQuantityExtractor.ts`: (1) Changed `extractTruckingSelections()` return type to `Record<string, string> | undefined` — returns `undefined` (not `{}`) when `truckType` is empty, so callers pass `undefined` to the engine, which then treats all rows as additive (correct for quotation-level overview without a specific truck type selected). (2) Also collects groups from `row.remarks` as fallback for legacy data without `selection_group` stamps.
  - `BookingRateCardButton.tsx`: Consolidated duplicate import into single line.
- **2026-02-25 (Bugfix: Empty Address → Select All Destinations)**: Fixed the core behavioral gap — when `truckType` is filled but `deliveryAddress` is empty, now selects the same truck type across ALL destination groups instead of returning empty selections.
  - `contractQuantityExtractor.ts`: Changed the `!address` branch in `extractTruckingSelections()` to iterate all `knownGroups` and set `selections[group] = chargeTypeId` for each. Previously only auto-selected when exactly 1 group existed. Now: "40ft" + no address → `{ "Dest A": "20ft_40ft", "Dest B": "20ft_40ft" }` — engine filters to only 20ft/40ft rows across all destinations.
  - `QuotationBuilderV3.tsx`: Added `truckingData.deliveryAddress` to the auto-recalc `useEffect` dependency array (was missing — changing delivery address after applying didn't trigger recalculation).
  - `QuantityDisplaySection.tsx`: Added optional `selectionContext` prop (`{ destination?, truckType? }`) with a new trucking info row showing matched truck type + destination below the quantities.
  - `QuotationRateBreakdownSheet.tsx`: Added `truckTypeLabel` prop, derives and passes `selectionContext` to `QuantityDisplaySection`.
  - `RateCalculationSheet.tsx`: Same `selectionContext` pass-through for booking-level consistency.
- **2026-02-25 (Bugfix: Filter Must Exclude Unmentioned Groups)**: Fixed the remaining additive charging bug when a specific destination is selected.
  - `contractRateEngine.ts`: Changed both filter sites (line ~141 in `instantiateRates()` and line ~379 in `contractRatesToSellingPrice()` fallback path) from `if (effectiveGroup && selections && effectiveGroup in selections)` to `if (effectiveGroup && selections) { if (!(effectiveGroup in selections)) continue; ... }`. Previously, rows whose `effectiveGroup` was NOT a key in the `selections` map bypassed the filter entirely and were kept (additive). Now: if `selections` exists and a row has a group, that group MUST be present as a key in `selections` or the row is skipped. Semantic: `undefined` = "no filtering", `object` = "only keep rows whose group is explicitly listed."