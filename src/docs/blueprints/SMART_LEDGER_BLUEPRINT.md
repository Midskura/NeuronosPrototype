# Smart Ledger Blueprint — Sales Report Redesign

## Goal

Transform the Sales Report from a "dashboard with a spreadsheet pasted in" into a **dense, information-rich financial document** that feels native to Neuron OS. The table IS the report — it gets 85%+ of the viewport. The design principle: **"Quiet containers, loud data."**

## Design Reference

Cross-referenced against:
- **Executive Dashboard**: Cash Flow Alert banner, KPI card anatomy, Payment Aging progress bars
- **Financial Dashboard**: Net Revenue hero card, DataTable header styling, P&L Trend section headers
- **DataTable component** (`/components/common/DataTable.tsx`): `bg-[#F7FAF8]` header, `#E5E9F0` borders, `11px` uppercase muted header text, `px-4 py-3` cell padding, `rounded-[10px]` corners

## Visual DNA to Match

All table styling must align with DataTable patterns:
- Header bg: `var(--neuron-bg-page)` / `#F7FAF8`
- Borders: `var(--neuron-ui-border)` / `#E5E9F0`
- Header text: `var(--neuron-ink-muted)` / `#667085`, 11px, uppercase, semibold, `tracking-[0.002em]`
- Row dividers: `divide-y` with `var(--neuron-ui-border)`
- Container: `rounded-[10px]`, `bg-white`, 1px border
- Row hover: `var(--neuron-state-hover)` / `#F1F6F4`

## Files Affected

| File | Action | Phase |
|---|---|---|
| `SalesReport.tsx` | **Major rewrite** — identity strip, ledger table, inline summary | Phase 1 |
| `SalesReport.tsx` | **Enhancement** — grouped inline subtotals, conditional row accents | Phase 2 |

## Phased Plan

### Phase 1: Smart Ledger Core

**Scope:** Rewrite `SalesReport.tsx` layout from document-wrapper pattern to Smart Ledger pattern. All data logic preserved.

**Changes:**

1. **Kill document wrapper** — remove the white card envelope, document header block with green accent border, and "Totals for this period" summary cards. Content flows directly into the page.

2. **Compact identity strip + merged controls** — single bar:
   - Left: `SALES REPORT` (11px, small-caps, semibold, muted) · scope badge · booking count · charge count
   - Right: search input, group-by dropdown, print button, export CSV button
   - Height: ~40px (was ~100px for toolbar + document header combined)
   - Separated from table by a subtle divider

3. **Ledger table matching DataTable DNA:**
   - Container: `rounded-[10px]`, white bg, 1px `--neuron-ui-border`
   - Header: `bg-[#F7FAF8]` (same as DataTable), `11px` uppercase semibold muted text
   - Column group accents: thin `2px` colored top border on header cells:
     - Identifier columns (Booking ID, Service, Project, Customer): `--neuron-brand-green` top accent
     - Financial columns (Billed, Unbilled, Revenue, Charges, Date): `#0F766E` teal top accent
   - Vertical divider: slightly darker border between Customer and Total Billed columns (the identifier/financial boundary)
   - Dense rows: `px-4 py-2` (was `py-2.5` — gains ~34px row height, more rows visible)
   - Row dividers: `1px solid var(--neuron-ui-divider)`
   - Sticky header with z-index for scroll

4. **Restyled totals row:**
   - Background: `var(--neuron-bg-page)` (subtle off-white, not heavy green)
   - Top border: `2px solid var(--neuron-brand-green)` — clean break
   - Text: bold, same data colors (teal for billed, amber for unbilled)
   - Label: "Totals" (sentence case, not uppercase)

5. **Inline summary strip** (replaces 4 summary cards):
   - Single line below the table: `Total: ₱466,300 · Billed: ₱103,200 (22%) · Unbilled: ₱363,100 (78%) · Avg/Booking: ₱93,260`
   - 11px text, muted, right-aligned or centered
   - Height: ~32px (was ~120px for 4 cards)

6. **Loading skeleton** — matches the new table shape

7. **Flat view only** — grouped view uses fallback accordion for now (Phase 2 upgrades it)

**Visual structure (Phase 1):**
```
┌──────────────────────────────────────────────────────────────────┐
│ SALES REPORT · All Time · 5 bookings · 47 charges   [🔍] [▼] [CSV] │  identity strip
│ ─────────────────────────────────────────────────────────────── │
│ ┌──────────────────────────────────────────────────────────────┐ │
│ │ ▌BOOKING ID │ SERVICE │ PROJ # │ CUSTOMER ║ BILLED │ UNBIL │ │  table header
│ │──────────────────────────────────────────────────────────────│ │  (sticky)
│ │ BKG-001     │ Fwd     │ P-26   │ NorthGate ║ ₱80K  │ ₱120K │ │
│ │ BKG-002     │ Brkg    │ P-27   │ Pacific   ║ ₱15K  │  ₱0   │ │  dense rows
│ │ ...         │         │        │           ║       │       │ │
│ │─────────────────────────────────────2px green border────────│ │
│ │ Totals      │         │        │           ║ ₱103K │ ₱363K │ │  totals row
│ └──────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  Total: ₱466,300 · Billed: ₱103,200 (22%) · Unbilled: ₱363,100 │  inline summary
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

### Phase 2: Grouped View + Data Intelligence

**Scope:** Upgrade grouped view from accordion sections to inline subtotal rows. Add conditional row styling.

**Changes:**

1. **Inline subtotal rows** — when grouping, render ONE unified table with group header rows embedded:
   - Group header row: full-width cell, light `--neuron-state-selected` background, group label left, subtotal right
   - Data rows below each group header
   - No accordion expand/collapse — all data visible by default
   - Group-level subtotal row after each group's last data row

2. **Conditional row accents:**
   - Rows where `totalUnbilled > totalBilled`: subtle amber left border (2px `#D97706`)
   - This silently flags bookings that need billing attention
   - No tooltip or text change — just the visual accent

3. **Polish:**
   - Verify row hover state consistency
   - Fine-tune vertical divider opacity
   - Ensure loading skeleton matches final table shape
   - Test with 50+ rows for scroll performance

---

## Status

| Phase | Status | Notes |
|---|---|---|
| Phase 1: Smart Ledger Core | COMPLETE | Identity strip with merged controls, ledger table matching DataTable DNA, column group accents (green for identifiers, teal for financials), vertical divider between Customer/Billed columns, dense rows (py-2), sticky header on scroll, restyled totals row (subtle off-white bg + 2px green top border), inline summary strip replacing 4 summary cards, loading skeleton. Grouped view uses interim accordion pattern. |
| Phase 2: Grouped View + Data Intelligence | COMPLETE | Unified `GroupedLedgerTable` with inline group header rows + data rows in a single `<table>`. Conditional amber left-border on rows where `totalUnbilled > totalBilled`. Old `GroupSection` accordion removed. |

## Change Log

- Blueprint created — plan approved by user
- **Phase 1 complete:** Rewrote `SalesReport.tsx`. Removed: document wrapper card, formal header with green accent border, "Totals for this period" summary cards, colored green/teal/amber table headers. Added: compact identity strip (11px, one line — "SALES REPORT | All Time | 5 bookings | 47 charges") with search/group/print/export controls merged into same bar. Ledger table matches DataTable DNA exactly: `bg-[#F7FAF8]` header, `#E5E9F0` borders, `11px` uppercase muted header text, `rounded-[10px]` container. Column group accents: 2px green top border on identifier columns (Booking ID, Service, Project, Customer), 2px teal top border on financial columns (Billed, Unbilled, Revenue, Charges, Date). 2px vertical divider between Customer and Total Billed. Dense rows with `py-2` (was `py-2.5`). Totals row uses subtle `#F7FAF8` background with `2px solid --neuron-brand-green` top border. Summary strip: single line below table with all 4 metrics inline ("Total Revenue: ₱X · Billed: ₱Y (Z%) · Unbilled · Avg/Booking"). GroupSection uses interim accordion with `--neuron-state-selected` background. All data logic preserved.
- **Phase 2 complete:** (1) Created `GroupedLedgerTable` component — renders ONE unified `<table>` with the same header as `LedgerTable`. Each group renders as: group header row (full-width `colSpan={4}` for identifiers + individual financial cells showing group subtotals, `--neuron-state-selected` background, group label + count badge, subtotal in `--neuron-brand-green`) → data rows → next group. Groups separated by `2px solid #E5E9F0` top border. Grand Totals row at bottom matching flat view's Totals row but labeled "Grand Totals". (2) Added conditional amber left-border (`2px solid #D97706`) on data rows where `totalUnbilled > totalBilled` — applies in both `LedgerTable` (flat view) and `GroupedLedgerTable` (grouped view). Rows where unbilled <= billed get `2px solid transparent` to maintain alignment. (3) Removed old `GroupSection` component entirely — no more accordion expand/collapse, all data visible by default. (4) Cleaned up imports: unified `import React, { useState, useMemo, useRef, useEffect } from "react"`. All data logic preserved.
- **Financial Report Overhaul:** See `/docs/blueprints/FINANCIAL_REPORT_OVERHAUL_BLUEPRINT.md` — complete redesign adding column zone tinting, two-line composite cells, document envelope, double-row headers, and computation block summary.