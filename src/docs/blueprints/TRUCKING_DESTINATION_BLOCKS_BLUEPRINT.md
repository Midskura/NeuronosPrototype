# Trucking Destination Blocks Blueprint

> **Living Document** -- Updated after every implementation phase.
> Last Updated: 2026-02-22
> Current Phase: **Phase 2 -- COMPLETE (all phases done)**

---

## Problem Statement

The current Trucking rate entry in `ContractRateCardV2` uses the same flat row-by-row grid as other services: one row per truck config × destination combination. For 10 destinations × 4 configs, that's **40 separate add-charge-select-config-type-destination** operations — massive repetitive data entry.

### Goal

Replace the Trucking grid with a **Destination Block Card** pattern — destination-first batch entry that pre-populates all 4 truck configs per destination and lets the user tab through cost fields.

### Before (Row-by-Row)

```
| TRUCK CONFIG  | COST (PHP) | DESTINATION       | 🗑 |
| 20ft / 40ft   | 19,500     | Valenzuela City   | 🗑 |
| Back to back  | 31,500     | Valenzuela City   | 🗑 |
| 4Wheeler      | 7,500      | Valenzuela City   | 🗑 |
| 6Wheeler      | 9,500      | Valenzuela City   | 🗑 |
| 20ft / 40ft   | 28,000     | Carmona Cavite    | 🗑 |
...40 rows for 10 destinations
```

### After (Destination Blocks)

```
┌─ Trucking Charges ──────────────── [+ Add Destination] ─┐
│                                                          │
│  ┌─ 📍 Valenzuela City ─────────── [Duplicate] [🗑️] ─┐ │
│  │  ☑ 20ft / 40ft    [ 19,500 ]                       │ │
│  │  ☑ Back to back   [ 31,500 ]                       │ │
│  │  ☑ 4Wheeler       [  7,500 ]                       │ │
│  │  ☑ 6Wheeler       [  9,500 ]                       │ │
│  └─────────────────────────────────────────────────────┘ │
│                                                          │
│  ┌─ 📍 Carmona Cavite ─────────── [Duplicate] [🗑️] ─┐ │
│  │  ☑ 20ft / 40ft    [ 28,000 ]                       │ │
│  │  ☑ Back to back   [ 36,500 ]                       │ │
│  │  ☐ 4Wheeler       [    —   ]  N/A                   │ │
│  │  ☑ 6Wheeler       [ 12,500 ]                       │ │
│  └─────────────────────────────────────────────────────┘ │
│                                                          │
│  2 destinations · 7 active configs                       │
└──────────────────────────────────────────────────────────┘
```

### Design Constraints

- **Zero data model changes** — each enabled config is still a `ContractRateRow` with `particular` = truck config, `remarks` = destination, `rates.Cost` = price, `charge_type_id` = registry ID
- **Zero rate engine changes** — engine reads `matrix.rows` flat as before
- **Backward compatible** — existing Trucking matrices with old row-by-row data auto-group by `remarks` (destination) on load
- **Neuron design system** — deep green `#12332B`, teal `#0F766E`, white backgrounds, stroke borders
- **Tab-flow optimized** — cost fields within a block are sequential tab targets
- **Truck config presets from ChargeTypeRegistry** — `20ft_40ft`, `back_to_back`, `4wheeler`, `6wheeler`

### Data Flow

```
UI (Destination Blocks)                     Data (matrix.rows)
─────────────────────                       ──────────────────
📍 Valenzuela City                     ──>  { particular: "20ft / 40ft", remarks: "Valenzuela City", rates: { Cost: 19500 }, charge_type_id: "20ft_40ft" }
  ☑ 20ft / 40ft  [19,500]             ──>  { particular: "Back to back", remarks: "Valenzuela City", rates: { Cost: 31500 }, charge_type_id: "back_to_back" }
  ☑ Back to back [31,500]             ──>  { particular: "4Wheeler", remarks: "Valenzuela City", rates: { Cost: 7500 }, charge_type_id: "4wheeler" }
  ☑ 4Wheeler     [ 7,500]             ──>  { particular: "6Wheeler", remarks: "Valenzuela City", rates: { Cost: 9500 }, charge_type_id: "6wheeler" }
  ☑ 6Wheeler     [ 9,500]

📍 Carmona Cavite                      ──>  { particular: "20ft / 40ft", remarks: "Carmona Cavite", rates: { Cost: 28000 }, charge_type_id: "20ft_40ft" }
  ☑ 20ft / 40ft  [28,000]             ──>  { particular: "Back to back", remarks: "Carmona Cavite", rates: { Cost: 36500 }, charge_type_id: "back_to_back" }
  ☑ Back to back [36,500]                  (no row — 4Wheeler is N/A)
  ☐ 4Wheeler     [  N/A ]             ──>  { particular: "6Wheeler", remarks: "Carmona Cavite", rates: { Cost: 12500 }, charge_type_id: "6wheeler" }
  ☑ 6Wheeler     [12,500]
```

N/A configs simply don't emit a row. When toggling back to enabled, a new row is created.

---

## Implementation Phases

### Phase 1: Core Destination Blocks
**Status:** COMPLETE

Build the `TruckingDestinationBlocks` component and wire it into `ContractRateCardV2`.

**Scope:**
- New component `/components/pricing/quotations/TruckingDestinationBlocks.tsx`
- Grouping logic: rows grouped by `remarks` (destination), ordered by first appearance
- Each destination block renders all 4 truck config presets from ChargeTypeRegistry
- Cost input field per config (maps to `rates.Cost`)
- N/A checkbox toggle per config (unchecked = no row emitted)
- Destination name input (inline editable header)
- "+ Add Destination" button (spawns new block with all 4 configs enabled, empty costs)
- Delete destination button (removes all rows for that destination)
- Edit mode rendering (non-view mode)
- Wire into `ContractRateCardV2.tsx` — when `isTrucking`, render `TruckingDestinationBlocks` instead of the grid
- Auto-grouping of existing old row-by-row data (backward compat)
- Footer stats: "X destinations · Y active configs"

**Data Operations:**
- `addDestination(name)` — creates 4 new `ContractRateRow` entries
- `deleteDestination(destination)` — removes all rows with matching `remarks`
- `renameDestination(oldName, newName)` — updates `remarks` on all matching rows
- `toggleConfig(destination, chargeTypeId)` — adds or removes a row
- `updateCost(rowId, value)` — updates `rates.Cost` on a specific row

**Files:**
- CREATE: `/components/pricing/quotations/TruckingDestinationBlocks.tsx`
- MODIFY: `/components/pricing/quotations/ContractRateCardV2.tsx` (swap grid for blocks when Trucking)

### Phase 2: Duplicate, View Mode & Polish
**Status:** COMPLETE (merged into Phase 1 — all features were implemented together)

**Scope:**
- Duplicate destination button (clones block with "(Copy)" suffix, preserving costs and N/A state)
- Collapse/expand per destination block (toggle to summary line)
- View mode rendering (read-only destination blocks, formatted costs, N/A shown as dash)
- Empty state when no destinations exist
- Keyboard flow: Tab through cost inputs within a block, Enter to confirm destination name
- Visual polish: hover states, transitions, consistent with Neuron design system
- Update the Rate Matrix Redesign Blueprint to reference this sub-blueprint

**Files:**
- MODIFY: `/components/pricing/quotations/TruckingDestinationBlocks.tsx`
- MODIFY: `/components/pricing/quotations/ContractRateCardV2.tsx` (if needed)
- UPDATE: `/docs/blueprints/RATE_MATRIX_REDESIGN_BLUEPRINT.md`

---

## File Map

| Purpose | File |
|---|---|
| Blueprint (this file) | `/docs/blueprints/TRUCKING_DESTINATION_BLOCKS_BLUEPRINT.md` |
| Destination Blocks Component | `/components/pricing/quotations/TruckingDestinationBlocks.tsx` |
| Rate Card V2 (parent) | `/components/pricing/quotations/ContractRateCardV2.tsx` |
| Charge Type Registry | `/utils/chargeTypeRegistry.ts` |
| Types | `/types/pricing.ts` |
| Rate Engine (NO CHANGES) | `/utils/contractRateEngine.ts` |
| Rate Matrix Blueprint (parent) | `/docs/blueprints/RATE_MATRIX_REDESIGN_BLUEPRINT.md` |

---

## Progress Log

| Date | Phase | Action | Notes |
|---|---|---|---|
| 2026-02-22 | Setup | Blueprint created | 2-phase plan for Trucking Destination Blocks |
| 2026-02-22 | Phase 1 | COMPLETE | Created TruckingDestinationBlocks component, wired into ContractRateCardV2 for Trucking. Destination block cards with all 4 configs, N/A toggles, cost inputs, add/delete/rename/duplicate destination, collapse/expand, auto-grouping of old row-by-row data, footer stats. Header "Add Charge" button hidden for Trucking (replaced by "Add Destination" inside the component). |
| 2026-02-22 | Phase 2 | COMPLETE | All Phase 2 features (duplicate, collapse/expand, view mode, empty state, keyboard flow, hover states) were implemented as part of Phase 1. Updated parent Rate Matrix Redesign Blueprint. |