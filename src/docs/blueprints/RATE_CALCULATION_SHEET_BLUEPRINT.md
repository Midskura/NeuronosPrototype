# Rate Calculation Sheet Blueprint

> **Living Document** — Updated after every implementation phase.
> Last Updated: 2026-02-25
> Current Phase: **Phase 1.5 — COMPLETE**

---

## Problem Statement

The current "Generate from Rate Card" flow is a black-box single-click:

```
[Generate from Rate Card] -> (invisible math) -> billing items appear
```

`BookingRateCardButton.handleGenerate()` derives quantities, runs the rate engine,
saves to KV, and refreshes — all in one shot. The user never sees the calculation.

### Two Trust Gaps

1. **No transparency** — prices "just show up." Users can't verify the math
   or understand how tiered/succeeding pricing was applied.
2. **No conditional control** — "if any" charges (e.g., penalties, special handling)
   get auto-included with no way to exclude them per-booking.

### The Fix: Rate Calculation Sheet

Add a **transitionary preview step** between booking data and billing items.
The button opens a slide-over panel showing:
- What the system detected from the booking (quantities, mode)
- The full rate calculation with transparent math breakdown
- Ability to adjust quantities and toggle conditional charges before confirming

Only on explicit confirmation do billing items get saved.

---

## Architecture

### What Already Exists (Reused As-Is)

| Component / Utility | Location | Role |
|---|---|---|
| `SidePanel` | `/components/common/SidePanel.tsx` | Slide-over panel shell (ESC, backdrop, animation) |
| `deriveQuantitiesFromBooking()` | `/utils/contractQuantityExtractor.ts` | Auto-derives containers/BLs/sets from booking fields |
| `calculateContractBilling()` | `/utils/contractRateEngine.ts` | Runs rate engine, returns `AppliedRate[]` with `rule_applied` |
| `generateRateCardBillingItems()` | `/utils/rateCardToBilling.ts` | Converts `AppliedRate[]` to `BillingItem[]` |
| `useBookingRateCard` | `/hooks/useBookingRateCard.ts` | Fetches parent contract rate matrices |
| `BookingRateCardButton` | `/components/contracts/BookingRateCardButton.tsx` | Current single-click entry point (to be refactored) |

### What's New

| Component | Location | Role |
|---|---|---|
| `RateCalculationSheet` | `/components/contracts/RateCalculationSheet.tsx` | Slide-over panel with 3-section preview |

### Data Flow (After)

```
[Generate from Rate Card] 
  -> opens RateCalculationSheet (SidePanel)
    -> Section 1: Detected Inputs (editable quantities)
    -> Section 2: Calculation Table (transparent math per row)
    -> Section 3: Total + [Apply to Billings] button
  -> on confirm: save via batch API -> refresh -> close panel
```

---

## Phased Implementation Plan

### Phase 1: RateCalculationSheet Component + BookingRateCardButton Refactor
**Status: COMPLETE**

Create the `RateCalculationSheet` component and refactor `BookingRateCardButton`
to open it instead of saving directly.

| Task | Description | Status |
|---|---|---|
| 1.1 | Create `RateCalculationSheet.tsx` using `SidePanel` shell | DONE |
| 1.2 | Section 1: Detected Inputs display (mode, containers, BLs, sets) with editable overrides | DONE |
| 1.3 | Section 2: Calculation table rendering `AppliedRate[]` with rule_applied breakdown | DONE |
| 1.4 | Section 3: Total + confirm button with save logic (moved from BookingRateCardButton) | DONE |
| 1.5 | Refactor `BookingRateCardButton` to open sheet instead of direct save | DONE |
| 1.6 | "Recalculate" behavior when user adjusts quantities | DONE (reactive via useMemo) |

**Files Modified:**
- `NEW` `/components/contracts/RateCalculationSheet.tsx`
- `EDIT` `/components/contracts/BookingRateCardButton.tsx`

**Files NOT Modified (reused as-is):**
- `/components/common/SidePanel.tsx`
- `/utils/contractRateEngine.ts`
- `/utils/contractQuantityExtractor.ts`
- `/utils/rateCardToBilling.ts`
- `/hooks/useBookingRateCard.ts`
- All 5 booking detail views (they pass `BookingRateCardButton` via `extraActions` unchanged)

### Phase 1.5: UX Refinements — Banner Integration + Source Data Transparency
**Status: COMPLETE**

Replaced the tacky header button with a contextual banner and added collapsible
source data (container numbers, B/Ls) to the calculation sheet.

| Task | Description | Status |
|---|---|---|
| 1.5.1 | Transform `BookingRateCardButton` from header button to inline contextual banner | DONE |
| 1.5.2 | Move `{extraActions}` render position from header to between header and control bar in `UnifiedBillingsTab` | DONE |
| 1.5.3 | Add `extractSourceEntries()` helper to parse raw booking fields into entry arrays | DONE |
| 1.5.4 | Add collapsible detail view (View/Hide toggle) under each quantity row in `RateCalculationSheet` | DONE |
| 1.5.5 | "Already applied" state renders as subtle single-line note with item count + total | DONE |

**Files Modified:**
- `EDIT` `/components/contracts/BookingRateCardButton.tsx` — button → banner visual
- `EDIT` `/components/contracts/RateCalculationSheet.tsx` — source data detail
- `EDIT` `/components/shared/billings/UnifiedBillingsTab.tsx` — moved extraActions position

**Files NOT Modified:**
- All 5 booking detail views (same `extraActions` prop wiring, zero changes)
- No new components, hooks, or API routes

### Phase 2: Conditional Charges ("If Any" Toggle) — DEFERRED
**Status: NOT STARTED**

Add `is_conditional` flag to `ContractRateRow` type and render conditional
rows in the calculation sheet with toggle checkboxes.

| Task | Description | Status |
|---|---|---|
| 2.1 | Add `is_conditional?: boolean` to `ContractRateRow` in `/types/pricing.ts` | NOT STARTED |
| 2.2 | Add "If Any" toggle in rate matrix builder (contract quotation UI) | NOT STARTED |
| 2.3 | Render conditional rows with checkbox in `RateCalculationSheet` | NOT STARTED |
| 2.4 | Exclude unchecked conditional rows from billing generation | NOT STARTED |

---

## Design Decisions

1. **SidePanel size `md` (600px)** — sufficient for the calculation table,
   consistent with other detail panels. Can bump to `lg` if needed.
2. **Quantities editable inline** — simple number inputs next to detected values.
   On change, recalculate immediately (reactive, no separate "Recalculate" button).
3. **No new API routes** — save logic reuses the same `/accounting/billings/batch`
   endpoint already used by `BookingRateCardButton`.
4. **No new hooks** — the sheet receives all data as props from `BookingRateCardButton`.
5. **No audit snapshot** — deferred. The generated `BillingItem` already stores
   `applied_rate`, `applied_quantity`, `rule_applied` for traceability.