# Sales Report Layout Overhaul Blueprint

## Goal

Adapt the reference financial report layout into Neuron OS's design system. The reference image shows a professional Philippine freight forwarding sales report with KPI cards above the table, a single-row dark header, alternating row shading, green left-border accents, and a stepped deduction summary. We translate its **information architecture** into Neuron's "quiet containers, loud data" visual language.

## Design Principles

1. **KPIs above the table** — immediate financial context before the user reads any rows
2. **Single-row header** — proven by the reference; double-row group labels add overhead with only 7 columns
3. **Alternating row shading + green left-border** — replaces column zone tinting as primary scanability aid
4. **Louder totals** — prominent total row matching the reference's visual weight
5. **Stepped deduction summary** — "LESS:" format is stronger accounting convention
6. **Document footer** — abbreviation legend + optional print signature block

## Files Affected

| File | Action |
|---|---|
| `components/accounting/reports/SalesReport.tsx` | Major rework — all phases |

## Phases

### Phase F1: KPI Summary Strip (Above Table)
**The biggest UX win.** Move financial summary from bottom to top.

- Add a horizontal KPI strip between masthead and table
- 4 metric cards: Total Revenue (green), Billed (teal), Unbilled (amber), Avg/Booking (muted)
- Each card: colored left-accent (3px), 10px uppercase label, 15px bold peso value, optional subtitle
- `#F7FAF8` card backgrounds, `#E5E9F0` borders
- ScopeBar moves to the right end of this strip
- Remove the bottom `ReportSummary` metric tiles panel (computation ledger stays — enhanced in F5)

**Status:** COMPLETE

- Replaced centered doc header + controls bar with unified masthead. Title block with green accent (16px semibold), controls row (search, group, print, export), KPI strip with 4 cards (Revenue, Billed, Unbilled, Avg/Booking) + embedded ScopeBar. Removed duplicate ScopeBar from ReportsModule page header.
- 4 KpiCard components with left-accent borders, icons, values, and subtitles.

### Phase F2: Single-Row Table Header
**Save 25px, cleaner look.**

- Kill the double-row grouped header (remove "Identification / Revenue Breakdown / Meta" row)
- Single row: `#F7FAF8` background, 11px uppercase muted text
- Add 2px colored top-accent bars as the only zone signal:
  - Green (`var(--neuron-brand-green)`) over first 3 columns (Booking, Service, Client)
  - Teal (`#0F766E`) over financial columns (Billed, Unbilled, Revenue)
  - Muted over meta column (# Charges)

**Status:** COMPLETE

- Killed double-row grouped header. Single row with `#F7FAF8` bg, colored top-accent bars (green for identification, teal for financials, slate for meta). Applied to both LedgerTable and GroupedLedgerTable.

### Phase F3: Row Styling Overhaul
**Alternating shading + green left-border accent.**

- Add alternating row shading: even rows get `rgba(0, 0, 0, 0.015)` background
- Green left-border (3px, `var(--neuron-brand-green)`) on ALL data rows
- Amber override (`#D97706`) on "at risk" rows (unbilled > billed) — existing behavior preserved
- Remove or reduce column zone tinting to ~2% opacity (evaluate visually — may drop entirely)
- Slightly reduce row padding for density (py-1.5 stays, but evaluate)

**Status:** COMPLETE

- Added alternating row shading (`rgba(0,0,0,0.015)` on even rows). Green left-border (3px) on ALL data rows, amber override for at-risk rows. Applied to both table variants.

### Phase F4: Totals Row Enhancement
**Make it louder to match the reference.**

- Darker background: `#EEF2EF` instead of `#F7FAF8`
- Increase peso value font to 13px bold
- Keep `3px double` green top border (accounting convention)
- Add green left-border accent (matching data rows)
- "TOTALS" label at 12px bold uppercase

**Status:** COMPLETE

- Darker background `#EEF2EF`, increased peso font to 13px bold, added green left-border accent, kept 3px double green top border. Applied to both Totals and Grand Totals rows.

### Phase F5: Summary Computation Block Enhancement
**Adopt the reference's "LESS:" deduction format.**

- Remove the right-panel metric tiles (moved to KPI strip in F1)
- Computation ledger becomes full-width
- Adopt stepped deduction format:
  ```
  TOTAL REVENUE                    ₱X,XXX,XXX.XX
    Billed Revenue                 ₱X,XXX,XXX.XX
    Unbilled Revenue              (₱X,XXX,XXX.XX)
                                  ────────────────
  BILLING RATE                              XX%
  LESS: UNBILLED AT RISK         (₱X,XXX,XXX.XX)
                                  ────────────────
  NET BILLED REVENUE              ₱X,XXX,XXX.XX
                                  ════════════════
  ```
- Double-underline on final total (accounting convention)
- Section title: "Summary for {period}"
- Add booking count + avg per booking as secondary line items

**Status:** COMPLETE

- Replaced two-panel layout with full-width stepped deduction format: TOTAL REVENUE → indented Billed/Unbilled → LESS: Unbilled at Risk → NET BILLED REVENUE with double-underline. Secondary metrics (billing rate, avg/booking, total bookings) below divider.

### Phase F6: Document Footer Enhancement
**Abbreviation legend + print signature block.**

- Keep period label + booking count
- Add abbreviation legend row (if applicable — service type codes, etc.)
- Add print-only signature block: "Prepared By:", "Reviewed By:", "Approved By:" with underlines
- Hidden on screen (`@media print` or a print-specific class), visible when printing

**Status:** COMPLETE

- Combined period + booking count into single line. Added abbreviation legend (FWD/BRK/TRK/MI). Added print-only signature block (Prepared/Reviewed/Approved).

---

## Status

| Phase | Status | Notes |
|---|---|---|
| Phase F1: KPI Summary Strip | COMPLETE | Replaced centered doc header + controls bar with unified masthead. Title block with green accent (16px semibold), controls row (search, group, print, export), KPI strip with 4 cards (Revenue, Billed, Unbilled, Avg/Booking) + embedded ScopeBar. Removed duplicate ScopeBar from ReportsModule page header. |
| Phase F2: Single-Row Table Header | COMPLETE | Killed double-row grouped header. Single row with `#F7FAF8` bg, colored top-accent bars (green for identification, teal for financials, slate for meta). Applied to both LedgerTable and GroupedLedgerTable. |
| Phase F3: Row Styling Overhaul | COMPLETE | Added alternating row shading (`rgba(0,0,0,0.015)` on even rows). Green left-border (3px) on ALL data rows, amber override for at-risk rows. Applied to both table variants. |
| Phase F4: Totals Row Enhancement | COMPLETE | Darker background `#EEF2EF`, increased peso font to 13px bold, added green left-border accent, kept 3px double green top border. Applied to both Totals and Grand Totals rows. |
| Phase F5: Summary Computation Block | COMPLETE | Replaced two-panel layout with full-width stepped deduction format: TOTAL REVENUE → indented Billed/Unbilled → LESS: Unbilled at Risk → NET BILLED REVENUE with double-underline. Secondary metrics (billing rate, avg/booking, total bookings) below divider. |
| Phase F6: Document Footer | COMPLETE | Combined period + booking count into single line. Added abbreviation legend (FWD/BRK/TRK/MI). Added print-only signature block (Prepared/Reviewed/Approved). |

## Change Log

- Blueprint created with 6 phases (F1–F6).
- **Phase F1 complete:** Masthead + KPI strip above table. ScopeBar moved from ReportsModule into SalesReport KPI row. 4 KpiCard components with left-accent borders, icons, values, and subtitles.
- **Phase F2 complete:** Single-row header with colored top-accent bars replacing double-row grouped header. ~25px vertical space saved.
- **Phase F3 complete:** Alternating row shading + green left-border accent on all data rows. Amber override on at-risk rows preserved.
- **Phase F4 complete:** Louder totals row — darker background, larger font, green left-border.
- **Phase F5 complete:** Stepped deduction computation block with LESS:/TOTAL format, double-underline on final total.
- **Phase F6 complete:** Abbreviation legend in footer + print-only signature block.
- **All phases complete.** Layout overhaul finished.