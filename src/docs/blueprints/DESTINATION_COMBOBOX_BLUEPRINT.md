# Destination Combobox Blueprint

## Problem

When a trucking contract is detected, the destination field in the multi-line trucking repeater is a plain text `<input>`. Users must manually type destination names and hope they match the contract's `selection_group` values — the fuzzy matching in `extractTruckingSelections()` frequently fails, causing:

1. **Bug #1**: Unmatched destinations return `selections = undefined` → the engine applies **zero filtering** → ALL rate rows fire (every destination group, every truck type), inflating totals.
2. **Bug #2**: If `truckType` is empty (not yet selected), the line item is filtered out by `extractMultiLineSelectionsAndQuantities()`, but `isMultiLine` still counts it → the breakdown header says "2 destinations" but only 1 section renders.

### Solution: Contract-Aware Destination Combobox

When a trucking contract is linked, the destination `<input>` becomes a **combobox** — a text input with a dropdown of known contract destinations (derived from `selection_group || remarks` on the trucking matrix rows). The user can:
- **Pick from the dropdown** → guaranteed engine match, correct rate filtering
- **Type a custom destination** → flagged as "Outside contract", rates produce ₱0 (user adds pricing manually)

## Data Flow

```
Contract rate_matrices
  → extractContractDestinations(matrices)       // NEW utility — single source of truth
  → string[] of known destination groups
  → threaded as prop to TruckingServiceForm / CreateTruckingBookingPanel
  → FormComboBox renders dropdown + allows free text
  → user picks / types destination
  → extractTruckingSelections() receives exact match (or custom text)
  → engine filters correctly
```

## New Components & Utilities

### 1. `extractContractDestinations()` — `/utils/contractQuantityExtractor.ts`

Extracts the inline `knownGroups` logic (lines 729–735 of `extractTruckingSelections`) into a standalone export:

```ts
export function extractContractDestinations(rateMatrices: ContractRateMatrix[]): string[] {
  const truckingMatrix = rateMatrices.find(m => m.service_type.toLowerCase() === "trucking");
  if (!truckingMatrix) return [];
  const groups = new Set<string>();
  for (const row of truckingMatrix.rows) {
    const group = row.selection_group || row.remarks;
    if (group) groups.add(group);
  }
  return Array.from(groups);
}
```

`extractTruckingSelections()` then calls this instead of duplicating the logic.

### 2. `FormComboBox` — `/components/pricing/quotations/FormComboBox.tsx`

A generic combobox (text input + filtered dropdown). Does NOT modify `FormSelect`.

- `options: { value: string; label: string }[]` — suggestion list
- `value: string` — current value (can be free text)
- `onChange: (value: string) => void`
- `placeholder?: string`
- `disabled?: boolean`
- On focus / typing: dropdown shows filtered options (substring match)
- Selecting from dropdown: sets value to `option.value`
- Typing custom text: value accepted as-is
- Visual indicator: when value doesn't match any option, show subtle amber "Outside contract" badge inline

### 3. Props threading

| Consumer | New prop | Source |
|---|---|---|
| `TruckingServiceForm` | `contractDestinations?: string[]` | Parent computes from contract |
| `CreateTruckingBookingPanel` | (internal state) | Derives from linked contract |
| `DispatchRow` | `contractDestinations?: string[]` | Passed through from form |

When `contractDestinations` is provided and non-empty, `DispatchRow` renders `<FormComboBox>` instead of `<input>` for the destination column.

### 4. Engine fix: `undefined` → `{}` fallback

In `extractTruckingSelections()`, when:
- `chargeTypeId` is valid (truck type known)
- `knownGroups.size > 0` (contract has destination groups)
- But fuzzy match **fails** (destination text doesn't match any group)

Currently returns `undefined` (no filtering). Fix: return `{}` (empty selections map — all selection-group rows skipped → `appliedRates: []` → ₱0 subtotal).

This correctly handles "outside contract" destinations: they produce zero rates, prompting the user to add manual pricing.

## Phasing

### Phase 1 — Utility + Engine Fix
**Files**: `utils/contractQuantityExtractor.ts`

| Task | Description |
|---|---|
| 1.1 | Extract `extractContractDestinations()` from inline `knownGroups` logic |
| 1.2 | Refactor `extractTruckingSelections()` to call `extractContractDestinations()` internally (DRY) |
| 1.3 | Fix `extractTruckingSelections()` fallback: return `{}` instead of `undefined` when destination doesn't match but groups exist |

### Phase 2 — FormComboBox Component
**Files**: `components/pricing/quotations/FormComboBox.tsx`

| Task | Description |
|---|---|
| 2.1 | Create `FormComboBox` with text input, filtered dropdown, click-outside close |
| 2.2 | Match `FormSelect` visual styling (border, padding, font, Neuron theme tokens) |
| 2.3 | Add "Outside contract" amber indicator when value doesn't match any option |
| 2.4 | Add green checkmark / teal highlight when value matches an option |

### Phase 3 — Quotation Form Integration
**Files**: `TruckingServiceForm.tsx`, `QuotationBuilderV3.tsx`

| Task | Description |
|---|---|
| 3.1 | Add `contractDestinations?: string[]` prop to `TruckingServiceForm` |
| 3.2 | Thread prop to `DispatchRow`, conditionally render `FormComboBox` vs plain `<input>` |
| 3.3 | In `QuotationBuilderV3.tsx`, compute destinations via `extractContractDestinations(cachedFullContract.rate_matrices)` and pass to `<TruckingServiceForm>` |

### Phase 4 — Booking Panel Integration
**Files**: `CreateTruckingBookingPanel.tsx`

| Task | Description |
|---|---|
| 4.1 | Derive contract destinations from linked contract (if available) |
| 4.2 | Replace destination `<input>` with `<FormComboBox>` when contract destinations exist |

## Status

| Phase | Status |
|---|---|
| Phase 1 — Utility + Engine Fix | COMPLETE |
| Phase 2 — FormComboBox Component | COMPLETE |
| Phase 3 — Quotation Form Integration | COMPLETE |
| Phase 4 — Booking Panel Integration | COMPLETE |

## Changelog

- **2026-02-25**: Blueprint created. Architecture analysis complete, all touch points identified.
- **2026-02-25 (Phase 1)**: Utility extraction + engine fix implemented.
  - `utils/contractQuantityExtractor.ts`: Added `extractContractDestinations()` — single source of truth for collecting unique `selection_group || remarks` values from trucking matrix rows. Refactored `extractTruckingSelections()` to use it internally instead of inline `knownGroups` logic (DRY). Fixed critical bug: `extractTruckingSelections()` now returns `{}` instead of `undefined` when destination doesn't fuzzy-match any selection group — this prevents the engine from skipping all filtering and applying every rate row.
- **2026-02-25 (Phase 2)**: `FormComboBox` component created.
  - `components/pricing/quotations/FormComboBox.tsx`: Generic combobox with text input + filtered dropdown. Matches `FormSelect` visual styling (Neuron theme). Shows teal checkmark circle when value matches a contract destination, amber warning triangle when value is free-typed and unmatched. "Contract destinations" section header in dropdown. Supports keyboard (Escape to close, Enter to select single match). Click-outside-to-close via ref.
- **2026-02-25 (Phase 3)**: Quotation form integration complete.
  - `TruckingServiceForm.tsx`: Added `contractDestinations?: string[]` prop. Threaded to `DispatchRow` sub-component. When provided and non-empty, destination column renders `<FormComboBox>` instead of plain `<input>`. Non-contract quotations continue using plain text input (no regression).
  - `QuotationBuilderV3.tsx`: Added `extractContractDestinations` import. Computes destinations from `cachedFullContract.rate_matrices` and passes to `<TruckingServiceForm contractDestinations={...}>`.
- **2026-02-25 (Phase 4)**: Booking panel integration complete.
  - `CreateTruckingBookingPanel.tsx`: Added `contractDestinations` state + `useEffect` that fetches full contract via `fetchFullContract()` when `detectedContractId` changes, then extracts destinations via `extractContractDestinations()`. Destination `<input>` conditionally swapped for `<FormComboBox>` when contract destinations are available. Non-contract bookings remain unchanged.