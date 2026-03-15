# Multi-Line Trucking Blueprint

## Problem

The current trucking data model supports exactly **one destination, one truck type, one quantity** per quotation and per booking. Real-world freight forwarding requires quoting and billing for multiple truck types across multiple destinations in a single quotation/booking (e.g., "2x 40ft to Valenzuela + 3x 4W to Metro Manila").

### Current Single-Pipe Architecture

```
TruckingFormData { truckType, deliveryAddress, qty }
  -> extractTruckingSelections({ truckType, deliveryAddress }, matrices)
  -> extractQuantitiesFromTruckingForm({ qty })
  -> calculateContractBilling(matrices, "Trucking", mode, quantities, selections)
  -> single SellingPriceCategory / single AppliedRate[] result
```

Every layer is locked to one set of inputs. The limitation is structural.

### Solution: Multi-Pass Engine Architecture

A `TruckingLineItem[]` data model with a thin multi-pass wrapper that loops over line items, calling the existing engine once per item. The core engine filter logic stays **completely untouched**.

```
TruckingFormData.truckingLineItems: TruckingLineItem[]
  -> for each lineItem:
       extractTruckingSelections({ truckType: li.truckType, deliveryAddress: li.destination }, matrices)
       quantities = { containers: li.quantity, ... }
       calculateContractBilling(matrices, "Trucking", mode, quantities, selections)
  -> aggregate: N SellingPriceCategory[] / grouped AppliedRate[]
```

## Data Model

```ts
interface TruckingLineItem {
  id: string;              // nanoid/crypto.randomUUID for React keys
  destination: string;     // free-text delivery address
  truckType: string;       // form value: "4W", "6W", "10W", "20ft", "40ft", "45ft"
  quantity: number;        // how many trucks of this type to this destination
}

interface TruckingLineResult {
  id: string;              // unique ID for the line item result
  destination: string;     // free-text delivery address
  truckType: string;       // form value: "4W", "6W", "10W", "20ft", "40ft", "45ft"
  quantity: number;        // how many trucks of this type to this destination
  rates: AppliedRate[];    // rates for this line item
}

interface MultiLineTruckingResult {
  categories: SellingPriceCategory[];
  lineResults: TruckingLineResult[];
}
```

- Stored as `truckingLineItems` on `TruckingFormData` (quotation) and booking `formData`
- Legacy single fields (`truckType`, `deliveryAddress`, `qty`) kept for backward compat
- `normalizeTruckingLineItems()` auto-migrates old data to one-element array

## Phasing

### Phase 1 — Data Model + Normalizer + Multi-Pass Wrappers
**Files**: `types/pricing.ts`, `utils/contractQuantityExtractor.ts`, `utils/contractRateEngine.ts`

| Task | File | Change |
|---|---|---|
| 1.1 | `types/pricing.ts` | Export `TruckingLineItem`, `TruckingLineResult`, `MultiLineTruckingResult` interfaces |
| 1.2 | `utils/contractQuantityExtractor.ts` | Add `normalizeTruckingLineItems()` export (handles camelCase, snake_case, and empty data) |
| 1.3 | `utils/contractQuantityExtractor.ts` | Add `LineItemExtraction` interface |
| 1.4 | `utils/contractQuantityExtractor.ts` | Add `extractMultiLineSelectionsAndQuantities()` — loops line items, calls existing `extractTruckingSelections()` per item — zero new fuzzy matching logic |
| 1.5 | `utils/contractRateEngine.ts` | Add `calculateMultiLineTruckingBilling()` — loops `calculateContractBilling()` per item, aggregates results |
| 1.6 | `utils/contractRateEngine.ts` | Add `multiLineRatesToSellingPrice()` — loops `contractRatesToSellingPrice()` per item, relabels categories with destination/truck context, makes IDs unique per line item while preserving matrixId prefix for scoped replacement |
| 1.7 | `utils/contractRateEngine.ts` | Core engine functions (`instantiateRates`, `calculateContractBilling`, `contractRatesToSellingPrice`) remain completely untouched |

### Phase 2 — Quotation Builder UI (Line Items Repeater)
**Files**: `TruckingServiceForm.tsx`, `QuotationBuilderV3.tsx`

| Task | File | Change |
|---|---|---|
| 2.1 | `TruckingServiceForm.tsx` | Add repeatable `[Destination x Truck Type x Qty]` line items section, min 1 row, add/remove buttons |
| 2.2 | `TruckingServiceForm.tsx` | Emit `truckingLineItems` via `onChange` alongside legacy fields |
| 2.3 | `QuotationBuilderV3.tsx` | Update `TruckingFormData` interface to include `truckingLineItems?: TruckingLineItem[]` |
| 2.4 | `QuotationBuilderV3.tsx` | Update save path to persist `trucking_line_items` in `service_details` |
| 2.5 | `QuotationBuilderV3.tsx` | Update `loadServiceData("Trucking")` to restore `truckingLineItems` with normalizer fallback |
| 2.6 | `QuotationBuilderV3.tsx` | Update rate bridge `handleApplyContractRatesForService("Trucking")` to use multi-pass wrappers |
| 2.7 | `QuotationBuilderV3.tsx` | Update auto-recalc useEffect to watch `truckingLineItems` instead of individual fields |
| 2.8 | `QuotationBuilderV3.tsx` | Update `getQuantitiesForService("Trucking")` and `getSelectionsForService("Trucking")` for breakdown sheet |

### Phase 3 — Display Updates (Grouped Breakdown)
**Files**: `QuantityDisplaySection.tsx`, `QuotationRateBreakdownSheet.tsx`

| Task | File | Change |
|---|---|---|
| 3.1 | `QuantityDisplaySection.tsx` | Add optional `truckingLineItems` prop; when provided, render one row per line item instead of flat layout |
| 3.2 | `QuotationRateBreakdownSheet.tsx` | Accept `truckingLineItems` prop; use multi-pass engine to show grouped results with per-line subtotals |

### Phase 4 — Booking Panel + Rate Card
**Files**: `CreateTruckingBookingPanel.tsx`, `BookingRateCardButton.tsx`, `RateCalculationSheet.tsx`

| Task | File | Change |
|---|---|---|
| 4.1 | `CreateTruckingBookingPanel.tsx` | Add line items repeater to form, persist `truckingLineItems` alongside legacy fields |
| 4.2 | `BookingRateCardButton.tsx` | Read `truckingLineItems` from booking (with normalizer fallback), use multi-pass engine |
| 4.3 | `RateCalculationSheet.tsx` | Accept line items, show grouped breakdown with per-line subtotals |

### Phase 5 — Cleanup + Polish
| Task | File | Change |
|---|---|---|
| 5.1 | All consumers | Audit remaining single-field usages, add deprecation comments |
| 5.2 | Cross-service sync | Ensure `deliveryAddress` sync uses first line item's destination |
| 5.3 | Polish | Edge cases: empty line items, all-zero quantities, view mode rendering |

## Status

| Phase | Status |
|---|---|
| Phase 1 — Data Model + Normalizer + Wrappers | COMPLETE |
| Phase 2 — Quotation Builder UI | COMPLETE |
| Phase 3 — Display Updates | COMPLETE |
| Phase 4 — Booking Panel + Rate Card | COMPLETE |
| Phase 5 — Cleanup + Polish | COMPLETE |

## Changelog

- **2026-02-25**: Blueprint created. Architecture analysis complete, all touch points identified.
- **2026-02-25 (Phase 1)**: Data model, normalizer, and multi-pass engine wrappers implemented.
  - `types/pricing.ts`: Added `TruckingLineItem`, `TruckingLineResult`, `MultiLineTruckingResult` interfaces.
  - `utils/contractQuantityExtractor.ts`: Added `normalizeTruckingLineItems()` (handles camelCase, snake_case, and empty data), `LineItemExtraction` interface, and `extractMultiLineSelectionsAndQuantities()` (reuses existing `extractTruckingSelections()` per item — zero new fuzzy matching logic).
  - `utils/contractRateEngine.ts`: Added `calculateMultiLineTruckingBilling()` (loops `calculateContractBilling()` per item, aggregates results) and `multiLineRatesToSellingPrice()` (loops `contractRatesToSellingPrice()` per item, relabels categories with destination/truck context, makes IDs unique per line item while preserving matrixId prefix for scoped replacement).
  - Core engine functions (`instantiateRates`, `calculateContractBilling`, `contractRatesToSellingPrice`) remain completely untouched.
- **2026-02-25 (Phase 2)**: Quotation Builder UI fully wired up.
  - `TruckingServiceForm.tsx`: Replaced separate Delivery Address / Truck Type / Qty fields with a repeatable "Dispatch Lines" section — grid layout with [Destination | Truck Type | Qty | Remove] per row, "Add Line" button, min 1 row enforced, total summary when >1 line. Shared `TRUCK_TYPE_OPTIONS` constant. Legacy fields auto-synced from first line item. DRY: extracted shared `inputStyle()`, `focusHandler`, `blurHandler`, `labelStyle`.
  - `QuotationBuilderV3.tsx`:
    - Task 2.3: Added `truckingLineItems?: TruckingLineItem[]` to `TruckingFormData` interface.
    - Task 2.4: Save path now persists `trucking_line_items` array alongside legacy flat fields (first item mirrored for backward compat).
    - Task 2.5: `loadServiceData("Trucking")` uses `normalizeTruckingLineItems()` to restore line items, with automatic legacy migration.
    - Task 2.6: Rate bridge's trucking path now uses `extractMultiLineSelectionsAndQuantities()` + `multiLineRatesToSellingPrice()` — produces N selling price categories (one per dispatch line), with early return. Falls back to legacy single-item path when no valid extractions.
    - Task 2.7: Auto-recalc useEffect now watches `JSON.stringify(truckingData.truckingLineItems)` in addition to legacy fields.
    - Task 2.8: `getSelectionsForService("Trucking")` merges all line items' selections. `getQuantitiesForService("Trucking")` sums all line items' quantities. `truckTypeLabel` derives from line items (comma-joined if multiple types).
  - `QuotationRateBreakdownSheet.tsx`: Added `truckingLineItems` prop (threaded from builder), ready for Phase 3 grouped display.
- **2026-02-25 (Phase 3)**: Display updates for grouped multi-line breakdown.
  - `QuantityDisplaySection.tsx`: Added `truckingLineItems?: TruckingLineItem[]` prop. When >1 line item, renders a "Dispatch Lines" sub-section with per-item rows showing destination and "truckType × quantity" badges; single-line falls back to existing selectionContext display. No breaking changes to the editable mode path.
  - `RateBreakdownTable.tsx`: Added `hideTotal?: boolean` prop to suppress heading and total footer row when rendered inside grouped multi-line layout.
  - `QuotationRateBreakdownSheet.tsx`: Uses static imports of `extractMultiLineSelectionsAndQuantities` + `calculateMultiLineTruckingBilling` for multi-line path. When >1 line item, shows one grouped section per dispatch line (with line header showing destination/truckType/qty and per-line subtotal in teal), then a bold grand total row with thick border. Single-line path untouched. Panel title/footer show correct aggregate stats.
- **2026-02-25 (Phase 4)**: Booking panel + rate card integration complete.
  - `CreateTruckingBookingPanel.tsx`: Replaced separate Truck Type field and Delivery Address textarea with a "Dispatch Lines" repeater (same pattern as quotation form — grid with [Destination | Truck Type | Qty | Remove], Add Line button, total summary). Submit body now includes `trucking_line_items` array and syncs legacy `truckType`/`deliveryAddress` from first item.
  - `BookingRateCardButton.tsx`: Now imports `normalizeTruckingLineItems` and `extractMultiLineSelectionsAndQuantities`. Derives `truckingLineItems` from the booking object via normalizer. When multi-line, merges all line items' selections into one map. Passes `truckingLineItems` to `RateCalculationSheet`.
  - `RateCalculationSheet.tsx`: Added `truckingLineItems` prop. When multi-line, uses `calculateMultiLineTruckingBilling` for grouped breakdown with per-line subtotals + grand total (same visual pattern as `QuotationRateBreakdownSheet`). `QuantityDisplaySection` receives line items for dispatch line display. Panel title/footer show dispatch line count and aggregate totals. Single-line path untouched.
- **2026-02-25 (Phase 5)**: Cleanup and polish complete.
  - **Task 5.1 — Deprecation comments**: Added `@deprecated` annotations to legacy `truckType` and `deliveryAddress` fields in `CreateTruckingBookingPanel.tsx` (formData) and `TruckingBookings.tsx` (interface). These fields are now synced from the first `truckingLineItem` on submit and kept only for backward compatibility with list display/filtering.
  - **Task 5.2 — Cross-service sync**: Updated `CreateBookingsFromProjectModal.tsx` trucking case to pass through `trucking_line_items` from `serviceData` when available, and sync legacy `deliveryAddress` from first line item's destination. Added `@deprecated` comment on `truckType` field.
  - **Task 5.3 — Polish**:
    - `TruckingBookingDetails.tsx`: Added `normalizeTruckingLineItems` import. When multi-line items exist (>1), shows a read-only "Destinations" table in the Shipment Information section with [Destination | Truck Type | Qty] columns and total row. The "Truck Type" LockedField now shows comma-joined unique types from all line items. Legacy `deliveryAddress` EditableField kept below for backward compat.
    - `CreateTruckingBookingPanel.tsx`: Empty line items (no destination, no truckType, qty 0) are now filtered out before submit. Deprecation comments added.
- **2026-02-25 (UX Polish)**: "Destinations" repeater redesign across all surfaces.
  - Renamed "Dispatch Lines" → "Destinations" everywhere: `TruckingServiceForm.tsx`, `CreateTruckingBookingPanel.tsx`, `TruckingBookingDetails.tsx`, `QuantityDisplaySection.tsx`, `QuotationRateBreakdownSheet.tsx`, `RateCalculationSheet.tsx`.
  - **Grid proportions**: Changed from `1fr 140px 72px 32px` to `5fr 3fr 2fr 28px` (~50% / 30% / 20%) for better visual balance.
  - **Column headers conditional**: Only shown when 2+ rows. Single row feels like a simple form field with placeholder text.
  - **Ghost row "Add destination" button**: Replaced top-right floating "Add Line" button with a full-width bottom dashed-border row. On hover, border and text turn teal with subtle mint background. Feels like the next row waiting to be filled.
  - **Remove (×) on hover only**: Booking panel uses `group-hover/row:opacity-100` pattern; quotation form uses existing inline hover handlers. × button invisible by default, appears on row hover.
  - **Extracted `DispatchRow` sub-component** in `TruckingServiceForm.tsx` for cleaner JSX; shares grid proportions and hover behavior with the parent.