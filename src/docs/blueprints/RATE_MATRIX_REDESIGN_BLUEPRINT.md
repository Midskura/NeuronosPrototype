# Rate Matrix Redesign Blueprint

> **Living Document** -- Updated after every implementation phase.
> Last Updated: 2026-02-22
> Current Phase: **Phase 7 -- Trucking Destination Blocks -- COMPLETE**

---

## Problem Statement

The `ContractRateMatrixEditor` feels like a "prettier spreadsheet" — a raw HTML `<table>` with no
branded shell, no CSS grid rows, and no guided creation. It visually and structurally
diverges from the `SellingPriceSection` used in project quotations, breaking system cohesion.

### Goal

Rebuild the contract rate matrix UI to share the same design language as `SellingPriceSection`:
1. **Same outer shell** — branded card header, teal accent border, no drop shadows (outline only)
2. **CSS grid rows** — matching `UniversalPricingRow`'s visual rhythm, replacing `<table>`
3. **2-row line items** — top row = data (particular, rates, unit), bottom row = detail (remarks, tiered, at cost)

### Design Constraints

- **No drop shadows** — use `1px solid #E5E9E8` outlines only
- **No categories** — flat list of charges (short, focused lists don't benefit from grouping)
- **Title: "{Service} Charges"** — not "Rate Card"
- **Inline mode adding** — `+ Mode` column lives in the grid header itself
- **2-row line items** — each charge has a data row and a detail row
- **Tiered as checkbox** — always-visible checkbox toggle in detail row, config inline when checked
- **At Cost as checkbox** — visible toggle in detail row
- **Backward compatible** — existing `ContractRateMatrix.rows` flat array stays as engine source of truth
- **Zero rate engine changes** — `contractRateEngine.ts` keeps reading `matrix.rows` directly
- **Neuron design system** — deep green `#12332B`, teal `#0F766E`, white backgrounds, stroke borders

---

## Architecture

The component works directly with `matrix.rows` (flat array). No categories layer.
The rate engine (`contractRateEngine.ts`) iterates `matrix.rows` — zero changes needed.

### Line Item Layout (2-row block)

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ Container              │ ₱ 4,500  │ ₱ 3,500  │ [+ Mode] │ Per Container │🗑│  ← Data row
│ ☐ AT COST  ☑ TIERED  After first [1] → PHP [1,800] per succeeding │ Remarks│  ← Detail row
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## Implementation (All Complete)

### Phase 1: Shell + Grid Rows (Initial)
**Status:** COMPLETE → SUPERSEDED by V2 Revision

### Phase 2: Grid-Based Rate Rows (Initial)
**Status:** COMPLETE → SUPERSEDED by V2 Revision

### Phase 3: Integration (Initial)
**Status:** COMPLETE

### V2 Revision: Flat List + 2-Row Line Items
**Status:** COMPLETE

Changes from initial implementation:
- Removed category-based hierarchy (CategoryHeader, category CRUD, presets)
- Title changed from "{Service} Rate Card" → "{Service} Charges"
- Each line item is now a 2-row block:
  - **Top row (data):** Particular | Rate per mode... | [+ Mode spacer] | Unit | Delete
  - **Bottom row (detail):** ☐ AT COST | ☐ TIERED [config] | divider | Remarks input
- Inline `+ Mode` button in the grid header (not pills in header area)
- Mode column × delete and double-click rename in grid header
- Tiered pricing: always-visible checkbox, config appears inline when checked
- At Cost: always-visible checkbox with visual state
- Simplified factory function (no categories on init)

**Files Modified:**
- `components/pricing/quotations/ContractRateCardV2.tsx` (full rewrite)
- `components/pricing/quotations/QuotationBuilderV3.tsx` (removed unused import)

### Phase 5: Trucking-Specific Grid Layout
**Status:** COMPLETE

The Trucking Charges card now has a dedicated 3-column layout matching real-world Philippine freight contracts:

```
┌─────────────────────┬───────────────┬─────────────────────┬──┐
│ TRUCK CONFIG        │ AMOUNT (PHP)  │ DESTINATION         │🗑│
├─────────────────────┼───────────────┼─────────────────────┼──┤
│ 20ft/40ft           │      19,500   │ Valenzuela City     │🗑│
│  ☐ AT COST  ☐ TIERED                                      │
├─────────────────────┼───────────────┼─────────────────────┼──┤
│ Back to back        │      21,500   │ Valenzuela City     │🗑│
│  ☐ AT COST  ☐ TIERED                                      │
└─────────────────────┴───────────────┴─────────────────────┴──┘
```

**Changes:**
- Default columns: `["Standard", "Wing Van", "Flat Bed"]` → `["Cost"]` (single rate column)
- Grid template: Destination column (`minmax(140px, 2fr)`) replaces Unit column for Trucking
- Header: "Truck Config" instead of "Particular"; "Destination" instead of "Unit"
- "Add Mode" button hidden for Trucking (fixed single-column layout)
- Column rename/delete disabled for Trucking (locked layout)
- Destination field maps to `row.remarks` (no schema changes)
- Row 2 (detail row) entirely hidden for Trucking — clean single-row layout
- Row 3 (expanded remarks) skipped for Trucking
- Placeholder text: "e.g., 20ft/40ft, 4Wheeler" and "e.g., Valenzuela City"
- Footer: no "X modes" suffix for Trucking
- Unit auto-defaults to `per_container` (hidden from UI)
- **Zero rate engine changes** — engine reads `matrix.rows` as before
- **Zero type changes** — `ContractRateRow.remarks` repurposed as Destination
- Auto-migration: existing Trucking matrices with old columns (Standard/Wing Van/Flat Bed) are automatically collapsed into single "Cost" column on load, preserving the first non-zero rate value per row

**Files Modified:**
- `components/pricing/quotations/ContractRateCardV2.tsx`

### Phase 6: Charge Type Registry + Combobox
**Status:** COMPLETE

Replaced the free-text Particular/Truck Config input with a **combobox** (dropdown + custom typing) backed by a **Charge Type Registry**. This enables deterministic downstream matching (Contract → Project rates, Contract → Booking autofill) via stable `charge_type_id` keys.

**Architecture:**
- `ChargeTypeRegistry` (`/utils/chargeTypeRegistry.ts`) — hardcoded presets, designed for future migration to dynamic KV-backed registry with admin CRUD
- `ChargeTypeCombobox` (`/components/pricing/quotations/ChargeTypeCombobox.tsx`) — combobox component with grouped dropdown, type-to-filter, custom entry support
- `charge_type_id?: string` added to `ContractRateRow` — stable key for downstream matching, backward compatible (optional field)

**Brokerage Presets (from real quotation contract):**
| Category | ID | Label | Default Unit |
|---|---|---|---|
| Standard | `processing_fee` | Processing Fee | per_entry |
| Standard | `documentation_fee` | Documentation Fee | per_entry |
| Standard | `handling_fee` | Handling Fee | per_entry |
| Standard | `brokerage_fee` | Brokerage Fee | per_entry |
| Standard | `stamps_and_notary` | Stamps and Notary | per_bl |
| Other | `examination_fee` | Examination Fee | per_container |
| Other | `dea_examination` | DEA Examination | — |
| Other | `bai_processing` | BAI Processing | per_shipment |

**Trucking Presets (vehicle types):**
| ID | Label |
|---|---|
| `20ft_40ft` | 20ft / 40ft |
| `back_to_back` | Back to back |
| `4wheeler` | 4Wheeler |
| `6wheeler` | 6Wheeler |

**UX Behavior:**
- Dropdown shows grouped sections ("Standard Charges", "Other Charges", "Vehicle Types")
- Selecting a preset auto-fills `particular`, `charge_type_id`, and `unit` (if defaultUnit exists)
- Custom typing clears `charge_type_id` (falls back to string matching downstream)
- Brokerage: already-used presets are grayed out with "in use" label (prevents duplicates)
- Trucking: duplicates allowed (same vehicle type with different destinations)
- View mode: shows plain text (no combobox)

**Zero rate engine changes** — engine reads `matrix.rows` as before, ignores `charge_type_id`.

**Files Created:**
- `utils/chargeTypeRegistry.ts`
- `components/pricing/quotations/ChargeTypeCombobox.tsx`

**Files Modified:**
- `types/pricing.ts` (added `charge_type_id?: string` to `ContractRateRow`)
- `components/pricing/quotations/ContractRateCardV2.tsx` (replaced input with ChargeTypeCombobox, passed serviceType + usedChargeTypeIds)

### Phase 7: Trucking Destination Blocks
**Status:** COMPLETE

Replaced the flat row-by-row Trucking grid with a **Destination Block Card** pattern — destination-first batch entry that pre-populates all 4 truck configs per destination and lets the user tab through cost fields. Eliminates ~75% of repetitive keystrokes.

**Full details:** See `/docs/blueprints/TRUCKING_DESTINATION_BLOCKS_BLUEPRINT.md`

**Key Changes:**
- New `TruckingDestinationBlocks` component (`/components/pricing/quotations/TruckingDestinationBlocks.tsx`)
- `ContractRateCardV2` now renders `TruckingDestinationBlocks` when `isTrucking` instead of the flat grid
- Header "Add Charge" button hidden for Trucking (replaced by "Add Destination" inside the component)
- Each destination block shows all 4 truck configs with cost inputs and N/A checkboxes
- Supports: add/delete/rename/duplicate destination, collapse/expand blocks, view mode
- Auto-groups existing row-by-row data by `remarks` (destination) for backward compatibility
- **Zero data model changes** — still `ContractRateRow[]` under the hood
- **Zero rate engine changes** — engine reads `matrix.rows` flat as before

**Files Created:**
- `components/pricing/quotations/TruckingDestinationBlocks.tsx`

**Files Modified:**
- `components/pricing/quotations/ContractRateCardV2.tsx`

---

## File Map

| Purpose | File |
|---|---|
| Blueprint (this file) | `/docs/blueprints/RATE_MATRIX_REDESIGN_BLUEPRINT.md` |
| Charge Type Registry | `utils/chargeTypeRegistry.ts` |
| Charge Type Combobox | `components/pricing/quotations/ChargeTypeCombobox.tsx` |
| Trucking Destination Blocks | `components/pricing/quotations/TruckingDestinationBlocks.tsx` |
| Trucking Blocks Blueprint | `/docs/blueprints/TRUCKING_DESTINATION_BLOCKS_BLUEPRINT.md` |
| Rate Card V2 | `components/pricing/quotations/ContractRateCardV2.tsx` |
| Old Rate Matrix (deprecated) | `components/pricing/quotations/ContractRateMatrixEditor.tsx` |
| Types | `types/pricing.ts` |
| Rate Engine (NO CHANGES) | `utils/contractRateEngine.ts` |
| QuotationBuilderV3 | `components/pricing/quotations/QuotationBuilderV3.tsx` |
| ContractDetailView | `components/pricing/ContractDetailView.tsx` |
| SellingPriceSection (design reference) | `components/pricing/quotations/SellingPriceSection.tsx` |

---

## Progress Log

| Date | Phase | Action | Notes |
|---|---|---|---|
| 2026-02-21 | Setup | Blueprint created | Phased plan for rate matrix redesign |
| 2026-02-21 | Phase 1–3 | Initial build complete | Shell, categories, grid rows, integration |
| 2026-02-21 | V2 Revision | Complete | Removed categories, 2-row line items, inline mode adding, tiered/at-cost as checkboxes, title → "Charges", remarks on detail row |
| 2026-02-21 | Phase 5 | Trucking Layout complete | Trucking Charges now uses Truck Config / Cost / Destination grid. Single rate column, no mode management, no AT COST/TIERED toggles, destination maps to remarks field. Auto-migration from old multi-column layout. Zero engine/type changes. |
| 2026-02-21 | Phase 6 | Charge Type Registry + Combobox | Replaced free-text Particular with combobox backed by ChargeTypeRegistry. Presets from real quotation contract (Brokerage: 8 charge types, Trucking: 4 vehicle types). `charge_type_id` on ContractRateRow for deterministic downstream matching. Brokerage prevents duplicate presets; Trucking allows them. Zero engine changes. Hardcoded now, designed for future dynamic admin CRUD. |
| 2026-02-22 | Phase 7 | Trucking Destination Blocks | Replaced flat row-by-row Trucking grid with Destination Block Cards. Destination-first batch entry with all 4 configs pre-populated. N/A toggles, duplicate, collapse/expand, view mode. Zero data model or rate engine changes. See sub-blueprint: `/docs/blueprints/TRUCKING_DESTINATION_BLOCKS_BLUEPRINT.md` |