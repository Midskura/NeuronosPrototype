# Quotation Rate Bridge Generalization Blueprint

> **Living Document** -- Updated after every implementation phase.
> Last Updated: 2026-02-25
> Current Phase: **Phases 1-5 COMPLETE** (all in single implementation pass)

---

## Problem Statement

The Contract Rate Bridge in `QuotationBuilderV3.tsx` is **hardcoded to Brokerage Standard only**.
When a customer has an active contract covering multiple services (e.g., Brokerage + Trucking + Others),
only Brokerage gets auto-populated selling prices from the contract rate matrices.
Trucking and Others are left for the pricer to enter manually, even though contract rates exist.

This is the first step in fixing the **dual billing store problem** -- getting accurate,
contract-aware pricing at the quotation level (the source) before it flows downstream to projects and bookings.

## Design Decisions

1. **All services with a matching contract** get rate calculation (not just Brokerage Standard)
2. **Override allowed** -- contract rates populate selling price but are fully editable
3. **Applies to QuotationBuilderV3** (both standalone Pricing module and Project Overview tab)
4. **Rate source tagging** -- each line item tagged with `rate_source` for downstream traceability

## Existing Foundation (No Changes Needed)

| Component | File | Status |
|---|---|---|
| `contractRatesToSellingPrice()` | `/utils/contractRateEngine.ts` | Generic -- already takes `serviceType` param |
| `extractQuantitiesFromBrokerageForm()` | `/utils/contractQuantityExtractor.ts` | Ready |
| `extractQuantitiesFromTruckingForm()` | `/utils/contractQuantityExtractor.ts` | Ready |
| `extractQuantitiesFromOthersForm()` | `/utils/contractQuantityExtractor.ts` | Ready |
| `findContractForCustomerService()` | `/utils/contractLookup.ts` | Returns `ContractSummary` with `services[]` |
| `fetchFullContract()` | `/utils/contractLookup.ts` | Returns full `QuotationNew` with `rate_matrices[]` |
| `getContractModeColumns()` | `/utils/contractRateEngine.ts` | Generic per service |

## Implementation Phases

---

### Phase 1: Generalize State & Detection
**Status: COMPLETE (2026-02-25)**

**Goal:** Replace single-service state variables with per-service tracking. Generalize the
contract detection `useEffect` to check ALL selected services against the contract.

**Changes in `QuotationBuilderV3.tsx`:**

1. Replace single state variables:
   ```
   // BEFORE (single-service):
   const [contractRatesApplied, setContractRatesApplied] = useState(false);
   const [rateBridgeInfo, setRateBridgeInfo] = useState({...});
   
   // AFTER (per-service map):
   const [contractRatesAppliedMap, setContractRatesAppliedMap] = useState<Record<string, boolean>>({});
   const [rateBridgeInfoMap, setRateBridgeInfoMap] = useState<Record<string, { resolvedMode: string | null; totalContainers: number; estimatedTotal: number }>>({});
   ```

2. Generalize detection `useEffect` (lines 550-591):
   - Remove the `brokerageData.brokerageType === "Standard"` guard
   - Instead, detect if the customer has ANY active contract
   - The contract's `services[]` array tells us which services are covered
   - Keep the debounce (500ms) and cancellation pattern

3. Keep `detectedContract`, `sourceContractId`, `sourceContractNumber`, `cachedFullContract` as single values
   (one contract covers multiple services -- these stay singular)

**Backward compatibility:** The existing `contractRatesApplied` boolean is replaced by checking
`Object.values(contractRatesAppliedMap).some(v => v)` where needed (e.g., save handler).

**Files modified:** `QuotationBuilderV3.tsx` only

---

### Phase 2: Per-Service Rate Application
**Status: COMPLETE (2026-02-25)**

**Goal:** Refactor `handleApplyContractRates()` to accept a `serviceType` parameter and
call the right quantity extractor per service. Support applying rates for one service at a time
OR all contract-covered services at once.

**Changes in `QuotationBuilderV3.tsx`:**

1. Refactor `handleApplyContractRates(serviceType, options?)`:
   - Accept `serviceType` parameter (e.g., `"Brokerage"`, `"Trucking"`, `"Others"`)
   - Use the correct quantity extractor per service type:
     - Brokerage: `extractForRateBridge(brokerageData, ...)`
     - Trucking: `extractQuantitiesFromTruckingForm(truckingData)`
     - Others: `extractQuantitiesFromOthersForm()`
   - Generate selling price categories with service-scoped IDs:
     `contract-cat-brokerage-*`, `contract-cat-trucking-*`, `contract-cat-others-*`

2. Selling price cleanup becomes service-aware:
   ```
   // BEFORE: removes ALL contract categories
   const nonContract = prev.filter(cat => !cat.id.startsWith("contract-cat-"));
   
   // AFTER: only removes categories for the specific service
   const servicePrefix = `contract-cat-${serviceType.toLowerCase()}`;
   const filtered = prev.filter(cat => !cat.id.startsWith(servicePrefix));
   ```

3. Add `handleApplyAllContractRates()` -- iterates over all contract-covered services
   that are currently selected, calls `handleApplyContractRates(service)` for each.

4. Update `rateBridgeInfoMap` and `contractRatesAppliedMap` per service after application.

**Files modified:** `QuotationBuilderV3.tsx` only

---

### Phase 3: Auto-Recalculation Per Service
**Status: COMPLETE (2026-02-25)**

**Goal:** The auto-recalc `useEffect` (lines 656-674) should watch form data from ALL
contract-covered services, triggering per-service recalculation independently.

**Changes in `QuotationBuilderV3.tsx`:**

1. Replace the single auto-recalc `useEffect` with per-service watchers:
   - Brokerage: watches `brokerageData.containers`, `brokerageData.mode`, etc.
   - Trucking: watches `truckingData.qty`, `truckingData.truckType`
   - Others: no auto-recalc needed (quantities are always 1)

2. Each watcher only fires if that specific service has `contractRatesAppliedMap[service] === true`

3. Use the `{ silent: true }` option so recalculations don't flash the loading state

**Files modified:** `QuotationBuilderV3.tsx` only

---

### Phase 4: Multi-Service Banner UI
**Status: COMPLETE (2026-02-25)**

**Goal:** Replace the single Brokerage-only banner with a unified multi-service contract
status display.

**Changes in `QuotationBuilderV3.tsx`:**

1. Remove the Brokerage-specific banner block (lines 2105-2261)

2. Add a new unified banner that shows:
   - Contract detection status (same as today: loading / detected / not found)
   - Per-service status rows: which services are covered, applied vs pending
   - Per-service estimated totals (from `rateBridgeInfoMap`)
   - "Apply All Contract Rates" button (calls `handleApplyAllContractRates()`)
   - Per-service "Apply" buttons for granular control

3. Banner placement: above the service forms section (where current banner is)

4. Condition: show whenever `!isContractMode && customerName && selectedServices.length > 0`
   (broader than today's Brokerage-only condition)

**Design:** Follows Neuron-style: teal border when detected, amber when not found,
Inter font, clean minimal layout.

**Files modified:** `QuotationBuilderV3.tsx` only

---

### Phase 5: Rate Source Tagging
**Status: COMPLETE (2026-02-25)**

**Goal:** Tag each selling price line item with `rate_source` metadata for downstream
traceability.

**Changes:**

1. In `contractRateEngine.ts` -- `contractRatesToSellingPrice()`:
   - Add `rate_source: "contract_rate"` to each generated `SellingPriceLineItem`

2. In `QuotationBuilderV3.tsx` -- manual selling price entries:
   - Add `rate_source: "manual"` to manually created line items

3. In `types/pricing.ts` -- `SellingPriceLineItem` type:
   - Add optional `rate_source?: "contract_rate" | "manual" | "quotation" | "billable_expense"`

4. In save handler -- ensure `rate_source` persists to KV store with the quotation

**Files modified:** `contractRateEngine.ts`, `QuotationBuilderV3.tsx`, `types/pricing.ts`

**Downstream impact:** This metadata flows into projects and bookings, enabling:
- Billing deduplication (contract_rate items vs quotation items)
- Revenue source analysis
- Contract vs non-contract pricing comparison

---

## Phase Completion Tracking

| Phase | Description | Status | Date |
|-------|-------------|--------|------|
| 1 | Generalize State & Detection | COMPLETE | 2026-02-25 |
| 2 | Per-Service Rate Application | COMPLETE | 2026-02-25 |
| 3 | Auto-Recalculation Per Service | COMPLETE | 2026-02-25 |
| 4 | Multi-Service Banner UI | COMPLETE | 2026-02-25 |
| 5 | Rate Source Tagging | COMPLETE | 2026-02-25 |

---

## Files Reference

| File | Role |
|------|------|
| `/components/pricing/quotations/QuotationBuilderV3.tsx` | Main component -- all Phase 1-4 changes |
| `/utils/contractRateEngine.ts` | Rate calculation engine -- Phase 5 tagging |
| `/utils/contractQuantityExtractor.ts` | Quantity extraction -- NO changes needed |
| `/utils/contractLookup.ts` | Contract detection -- NO changes needed |
| `/types/pricing.ts` | Type definitions -- Phase 5 type addition |