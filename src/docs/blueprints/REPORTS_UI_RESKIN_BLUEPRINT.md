# Reports UI Reskin Blueprint

## Goal

Reskin the Reports module to match the reference design aesthetic (Uxerflow financial reports): clean full-width layout, horizontal tab navigation, white KPI cards with embedded mini-charts, professional control bar, and dense table. All changes are visual/layout only — no data logic, API, or hook changes.

## Reference Design Key Traits

1. **No secondary sidebar** — report switching via horizontal tabs at top
2. **Full-width content** — table gets maximum horizontal space
3. **White KPI cards** — no colored backgrounds; subtle border, embedded mini-charts
4. **Clean page header** — title + subtitle left, ScopeBar right, tab bar below
5. **Professional control bar** — result count, group-by, search, export in one row
6. **Restrained color** — color only in data (chart bars, conditional text), not in card fills
7. **Generous whitespace** — `px-10 pt-8` padding, breathing room between sections

## Neuron Alignment

All reskinned elements will use:
- Neuron tokens from `/styles/globals.css` (`--neuron-ink-primary`, `--neuron-ui-border`, etc.)
- Existing shared components: `NeuronKPICard`, `ScopeBar`, `DataTable`, `GroupingToolbar` patterns
- Same tab rendering pattern as `FinancialsModule.tsx` (underline tabs with icons)
- `recharts` for mini-charts (already used in dashboard: `PLTrendCard`, `RevenueTrendChart`)

## Files Affected

| File | Action | Phase |
|---|---|---|
| `ReportsModule.tsx` | **Major rewrite** — remove sidebar, add horizontal tabs, restructure to full-width layout with shared header | Phase 1 |
| `SalesReport.tsx` | **Major rewrite** — remove own header/scope, use white NeuronKPICards with mini-charts, cleaner control bar, keep all data logic intact | Phase 2 |
| `SalesReport.tsx` | **Major rewrite** — transform from dashboard-style layout into formal report document | Phase 3 |

## Phased Plan

### Phase 1: ReportsModule Shell Reskin
**Scope:** Rewrite `ReportsModule.tsx` to replace sidebar layout with full-width horizontal-tab layout.

**Changes:**
1. Remove the 220px left sidebar entirely
2. Add page header: "Reports" title (32px) + subtitle left, `ScopeBar` (standalone) right
3. Add horizontal tab bar below header (same pattern as `FinancialsModule` — underline tabs with icons + "Coming soon" badge for unready reports)
4. Full-width content area below tabs for active report
5. Move `ScopeBar` state to shell level (already done — scope/onScopeChange passed to reports)
6. Coming-soon placeholder rendered inside full content area (centered, not in sidebar)

**Visual structure:**
```
┌──────────────────────────────────────────────────────────────┐
│  Reports                                    [ScopeBar]       │
│  System-wide financial reporting                             │
│  ──────────────────────────────────────────────────────────  │
│  ● Sales Report  ○ Cash Flow  ○ Aging  ○ Collections  ○ Unb │
│  ────────────────────────────────────────────────────────── │
│                                                              │
│  [Active Report Content — full width]                        │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### Phase 2: SalesReport Reskin
**Scope:** Rewrite `SalesReport.tsx` KPI section and control bar. Keep all data logic (rows, filtering, grouping, CSV export) intact.

**Changes:**
1. Remove report-level header (title + ScopeBar) — now handled by shell
2. Replace colored-bg KPI cards with white `NeuronKPICard`-style cards + embedded mini-charts:
   - **Total Revenue**: white card + mini horizontal bar chart (top 5 bookings by revenue)
   - **Billed Revenue**: white card + billed/total progress bar
   - **Unbilled Revenue**: white card + amber progress bar (leakage ratio)
   - **Avg per Booking**: white card + subtle detail text
3. Use `recharts` `BarChart` (tiny, no axes) for the mini-chart and a simple div-based progress bar for the ratio cards
4. Cleaner control bar: `[count badge] [Group By ▼] ─── [🔍 Search...] [Export CSV]`
5. Keep DataTable, footerSummary, GroupSection accordion — all unchanged
6. Keep all data computation logic (rows, kpis, filteredRows, groupedData, CSV) untouched

### Phase 3: Report Document Treatment
**Scope:** Transform `SalesReport.tsx` from a dashboard-style layout into formal report document that feels like a real financial report your accounting team would print, email, or present — while keeping our Neuron polish.

**Reference:** User's actual Sales Report template — a formal spreadsheet with:
- Document header: "SALES REPORT" + "AS OF OCT 2025"
- Colored table headers (green for identifiers, other shades for financials)
- Integrated TOTALS row at bottom (highlighted)
- "Summary for [period]" section below the table
- "Totals (for this period)" summary cards at the very bottom

**Changes:**
1. **Document wrapper**: Wrap entire report in a white elevated card with subtle shadow — gives it a "printed paper" feel within the page's `--neuron-bg-page` background
2. **Formal document header** inside the wrapper:
   - "SALES REPORT" (uppercase, 20px, bold, Neuron primary ink)
   - "For the period: [scope label]" subtitle
   - "Generated: [today's date] | [n] bookings" meta line
   - Subtle left green accent border on the header block
3. **Custom report table** (purpose-built, not DataTable):
   - Colored header row: Neuron green bg for identifier columns (Booking ID, Service Type, Project #, Customer), light teal bg for financial columns (Billed, Unbilled, Revenue, Charges, Date)
   - Tight grid lines, dense rows — spreadsheet feel
   - Integrated **TOTALS row** at bottom with green-highlighted background
   - Monospace/tabular-nums for all currency values
4. **Move KPI summary to BELOW the table** as "Totals for this period":
   - 4 clean summary cards (white, bordered, no mini-charts — just label + value)
   - Horizontal layout matching the reference template's bottom section
5. **Toolbar stays outside the document** (above it) — it's a UI affordance, not part of the report
6. **Grouped view**: Keep accordion pattern but each group section also gets the formal table treatment
7. All data logic completely preserved

**Visual structure:**
```
┌──────────────────────────────────────────────────────┐
│ [n results] [Group ▼]           [Search] [Export CSV] │  toolbar
├──────────────────────────────────────────────────────┤
│                                                        │
│  ╔════════════════════════════════════════════════╗   │
│  ║  █ SALES REPORT                                ║   │  document
│  ║    For the period: All Time                    ║   │  header
│  ║    Generated: Mar 12, 2026 | 5 bookings        ║   │
│  ║  ──────────────────────────────────────────── ║   │
│  ║  ┌ BOOKING │ SVC │ PROJ │ CUST ┬ BILLED │ ... ┐ ║   │  colored
│  ║  │ data... │     │      │      │        │     │ ║   │  headers
│  ║  │ ...     │     │      │      │        │     │ ║   │
│  ║  ├─────────┴─────┴──────┴──────┼────────┼─────┤ ║   │
│  ║  │ TOTALS                      │ P103K  │ ... │ ║   │  totals row
│  ║  └─────────────────────────────┴────────┴─────┘ ║   │
│  ║                                                  ║   │
│  ║  Totals for this period                          ║   │
│  ║  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐   ║   │  summary
│  ║  │TotalRev│ │ Billed │ │Unbilled│ │  Avg   │   ║   │  cards
│  ║  │P466.3K │ │P103.2K │ │P363.1K │ │ P93.3K │   ║   │
│  ║  └────────┘ └────────┘ └────────┘ └────────┘   ║   │
│  ╚════════════════════════════════════════════════╝   │
│                                                        │
└──────────────────────────────────────────────────────┘
```

---

## Status

| Phase | Status | Notes |
|---|---|---|
| Phase 1: Shell Reskin | COMPLETE | Removed sidebar, added horizontal tabs matching FinancialsModule pattern, ScopeBar + refresh in header, Neuron tokens throughout |
| Phase 2: SalesReport Reskin | COMPLETE | White KPI cards with mini bar chart + progress bars, clean control bar with result count badge + group-by + search + export, Neuron tokens throughout, all data logic preserved |
| Phase 3: Report Document Treatment | SUPERSEDED | Was formal document wrapper style — superseded by Smart Ledger approach (see `/docs/blueprints/SMART_LEDGER_BLUEPRINT.md`) |

## Change Log

- Blueprint created
- **Phase 1 complete:** Rewrote `ReportsModule.tsx` — removed 220px sidebar, added full-width layout with 28px title + subtitle, ScopeBar + refresh button top-right, horizontal underline tab bar (matching FinancialsModule pattern) with "Soon" badges on unready reports, full-width content area below. All Neuron CSS variable tokens used.
- **Phase 2 complete:** Rewrote `SalesReport.tsx` — removed report-level header (shell handles it now). KPI cards now white `NeuronKPICard`-style with: (1) Total Revenue card with recharts mini bar chart showing top 5 bookings, (2) Billed Revenue card with teal progress bar + percentage, (3) Unbilled Revenue card with amber progress bar + leakage warning, (4) Avg per Booking card with clean detail text. Control bar reskinned: result count badge (left), group-by dropdown with LayoutGrid icon, search input (right, fixed 280px width), Export CSV button. All hardcoded hex colors replaced with Neuron CSS variables. GroupSection accordion reskinned with Neuron tokens. All data computation, filtering, grouping, CSV export logic completely preserved.
- **Phase 3 complete:** Transformed `SalesReport.tsx` from dashboard-style into formal report document. Key changes: (1) Document wrapper — white elevated card with shadow wrapping entire report, giving "printed paper" feel against the page background. (2) Formal document header — "SALES REPORT" uppercase with green left accent border, "For the period: [scope]" subtitle, "Generated: [date] | [n] bookings" meta. (3) Custom report table replacing DataTable — green header row for identifier columns (Booking ID, Service, Project, Customer), light teal/amber headers for financial columns (Billed, Unbilled, Revenue, Charges, Date), alternating row backgrounds, grid lines between columns, integrated TOTALS row at bottom with green-100 background and 2px green top border. (4) KPI summary moved BELOW the table as "Totals for this period" — 4 clean summary cards with colored top accent borders (no mini-charts, just label/value/detail). (5) Added Print button to toolbar. (6) Grouped view: group headers now use green background with white text, each group renders its own ReportTable with group-level totals. All data logic completely preserved.

> **Note:** Phase 3's document-wrapper approach was superseded by the "Smart Ledger" redesign tracked in [`SMART_LEDGER_BLUEPRINT.md`](/docs/blueprints/SMART_LEDGER_BLUEPRINT.md). The Smart Ledger keeps the dense report-document feel but aligns visually with Neuron's DataTable/Dashboard DNA.