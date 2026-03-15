# Rate Breakdown Table DRY Consolidation Blueprint

## Problem
Two components render nearly identical rate breakdown tables with different layout engines and column widths, causing alignment/clipping issues and ~110 lines of duplicated code:

| Aspect | `RateCalculationSheet` (booking) | `QuotationRateBreakdownSheet` (quotation) |
|---|---|---|
| Layout | CSS Grid (`1fr 100px 60px 120px`) | HTML `<table>` fixed (`auto, 90px, 48px, 100px`) |
| Quantities | Editable inputs + Reset + source chips | Read-only badges |
| Footer | Cancel + "Apply to Billings" | "Close" button |
| `formatCurrency` | Local copy (en-PH) | Local copy (en-PH) |

### Clipping root cause
The Breakdown sheet's narrower columns (90/48/100px) clip formatted currency values like `₱10,600.00`. The Grid version's wider columns (100/60/120px) have more room but use `div`-based rows that lack proper table border alignment.

## Plan

### Phase 1 — Shared `RateBreakdownTable` component
- **New file**: `/components/pricing/shared/RateBreakdownTable.tsx`
- HTML `<table>` with standardized column widths: `auto / 110px / 56px / 120px`
- Accepts: `appliedRates`, `total`, `currency`
- Includes: section heading, empty state, table header/body/footer with total row
- Consistent padding: `px-4 py-3` everywhere, `px-3` only on the narrow Qty column

### Phase 2 — Shared `QuantityDisplaySection` component
- **New file**: `/components/pricing/shared/QuantityDisplaySection.tsx`
- Two modes via `mode: "editable" | "readonly"` prop
- `editable`: number inputs, Reset button, source description, source entry chips
- `readonly`: static value badges, no source detail
- Mode indicator bar included
- Shared `getQuantityInputs()` logic unified here

### Phase 3 — Wire into both parent sheets
- **Edit**: `RateCalculationSheet.tsx` — replace inline table + inputs with shared components
- **Edit**: `QuotationRateBreakdownSheet.tsx` — replace inline table + inputs with shared components
- Both files keep only: SidePanel wrapper, title, footer, and any unique logic (save handler, notices)

## Status

| Phase | Status |
|---|---|
| Phase 1 — RateBreakdownTable | COMPLETE |
| Phase 2 — QuantityDisplaySection | COMPLETE |
| Phase 3 — Wire into parents | COMPLETE |

## Changelog

- **2026-02-25**: All 3 phases implemented in a single session.
  - `/components/pricing/shared/RateBreakdownTable.tsx` — shared HTML `<table>` with standardized column widths (auto/110px/56px/120px), `whitespace-nowrap` on currency cells to prevent clipping, exported `formatCurrency` helper.
  - `/components/pricing/shared/QuantityDisplaySection.tsx` — dual-mode (editable/readonly) quantity section with source chips, mode indicator, and Reset button support.
  - `/components/pricing/quotations/QuotationRateBreakdownSheet.tsx` — slimmed from ~272 lines to ~115 lines using shared components.
  - `/components/contracts/RateCalculationSheet.tsx` — slimmed from ~477 lines to ~185 lines using shared components; CSS Grid table replaced with shared HTML `<table>`.
  - Removed duplicate `formatCurrency`, `getQuantityInputs`, `describeSource`, `extractSourceEntries` definitions from both parent files.