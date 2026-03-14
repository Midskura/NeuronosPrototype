# Auditing Module Blueprint

**Created:** 2026-02-28
**Status:** ALL PHASES COMPLETE
**Goal:** Promote the Catalog Management Page from a settings page into a full Auditing Module with a pivot-table "Charge & Expense Matrix," a Summary view, and the existing Item Catalog as an admin tab.

---

## Problem

The Expense & Charge Catalog gave us standardized `catalog_item_id` references on every billing/expense line item. But there's no way to *use* that standardization for reporting. The real value is cross-booking aggregation: "How much total Documentation Fee across all Brokerage bookings in February?" The current Catalog page is just CRUD. The data is there; the visibility is not.

---

## Design Summary

The existing `acct-catalog` sidebar item becomes `acct-auditing` (label: "Auditing"). The `CatalogManagementPage` is demoted to a tab inside a new `AuditingModule` shell that hosts 3 tabs:

1. **Charge & Expense Matrix** (default) — pivot table: bookings as rows, catalog items as columns, amounts as values
2. **Summary** — aggregated totals per catalog item with appearance counts and averages
3. **Item Catalog** — the existing `CatalogManagementPage` (unchanged, just nested)

---

## Data Architecture

### Source Data

The matrix reads from existing KV prefixes — no new data structures needed:

- **Billing items**: `billing_item:{id}` — has `booking_id`, `description`, `amount`, `currency`, `catalog_item_id`, `created_at`
- **Billings (legacy)**: `billing:{id}` — has `bookingId`, `description`, `amount`, `currency`, `catalog_item_id`
- **Expenses**: `expense:{id}` — has `booking_id`/`bookingId`, `description`, `amount`, `currency`, `catalog_item_id`
- **Bookings**: `brokerage_booking:{id}`, `trucking_booking:{id}`, `forwarding_booking:{id}`, `marine_insurance_booking:{id}`, `others_booking:{id}`

### Aggregation Endpoint Response Shape

```json
{
  "success": true,
  "data": {
    "columns": [
      { "catalog_item_id": "ci_doc_fee_001", "name": "Documentation Fee" },
      { "catalog_item_id": "ci_brk_fee_001", "name": "Brokerage Fee" },
      { "catalog_item_id": "__unlinked__", "name": "Unlinked Items" }
    ],
    "rows": [
      {
        "booking_id": "BRK-2026-017",
        "project_number": "PRJ-2026-005",
        "client_name": "ABC Corp",
        "created_at": "2026-02-05T...",
        "cells": {
          "ci_doc_fee_001": { "amount": 4500, "currency": "PHP" },
          "ci_brk_fee_001": { "amount": 2500, "currency": "PHP" },
          "__unlinked__": { "amount": 0, "currency": "PHP" }
        }
      }
    ],
    "totals": {
      "ci_doc_fee_001": 13500,
      "ci_brk_fee_001": 5000,
      "__unlinked__": 8200
    },
    "meta": {
      "total_bookings": 18,
      "total_line_items": 142,
      "unlinked_count": 4,
      "linked_percentage": 97.2
    }
  }
}
```

---

## UX Spec: Charge & Expense Matrix

### Layout

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│  Auditing                                                     [Export CSV ▾]   │
│  ─────────────────────────────────────────────────────────────────────────────  │
│  [ Charge & Expense Matrix ]  [ Summary ]  [ Item Catalog ]                    │
│                                                                                │
│  Period: [February 2026 ▾]   Service: [Brokerage ▾]   Client: [All ▾]         │
│  View:   (●) Charges  (○) Expenses  (○) Both                                  │
│                                                                                │
│  ┌──────────────┬───────────────┬──────────────┬──────────────┬──────────┐     │
│  │ Booking #    │ Documentation │ Brokerage    │ Arrastre/    │ Duties & │ ... │
│  │ (sticky)     │ Fee           │ Fee          │ Wharfage     │ Taxes    │     │
│  ├──────────────┼───────────────┼──────────────┼──────────────┼──────────┤     │
│  │ BRK-2026-017 │         4,500 │        2,500 │        (120) │    —     │     │
│  │ BRK-2026-018 │         4,500 │        2,500 │        (120) │    —     │     │
│  │ BRK-2026-019 │         4,500 │            — │        (120) │  12,400  │     │
│  ├──────────────┼───────────────┼──────────────┼──────────────┼──────────┤     │
│  │ TOTAL        │        13,500 │        5,000 │        (360) │  12,400  │     │
│  └──────────────┴───────────────┴──────────────┴──────────────┴──────────┘     │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### Ergonomic Rules (ERP data density)

1. **Frozen first column** — Booking # is `position: sticky; left: 0` so it never scrolls away
2. **Sticky totals row** — `position: sticky; bottom: 0` with a subtle top border, always visible
3. **Dense table** — 28px row height, 13px font, 6-8px cell padding. Maximize data density.
4. **Right-aligned numbers** — with `Intl.NumberFormat` for commas. Parentheses for negatives: `(120)`. Em-dash `—` for zero/empty (not "0").
5. **Dynamic columns** — only catalog items that actually appear in the filtered dataset get columns. No empty columns.
6. **"Unlinked" column** — always last. Aggregates amounts from line items with no `catalog_item_id`. Yellow-tinted header as a data quality signal.
7. **Conditional cell styling** — negatives in `#DC2626`, zero/empty as `#D1D5DB` em-dash, unlinked amounts with `#FEF9C3` background
8. **Horizontal scroll** — the table container scrolls horizontally, with the frozen first column staying put
9. **Monospace numbers** — `font-variant-numeric: tabular-nums` for perfect column alignment

### Filters

| Filter | Options | Default |
|--------|---------|---------|
| Period | Month/Year picker | Current month |
| Service Type | Brokerage, Trucking, Forwarding, Marine Insurance, Others, All | Brokerage |
| Client | All + list of clients from bookings | All |
| View | Charges, Expenses, Both (radio) | Charges |

### Interactions

- **Click a cell** — no action (read-only matrix, not a spreadsheet)
- **Click a booking #** — navigates to that booking's detail view (future enhancement)
- **Export CSV** — downloads the current filtered matrix as CSV, matching the visual layout exactly

---

## UX Spec: Summary Tab

### Layout

```
┌──────────────────────────────────────────────────────────────────────┐
│  Period: [February 2026 ▾]   Service: [All ▾]                       │
│                                                                      │
│  ┌──────────────────────┬────────┬──────────┬───────────┬─────────┐ │
│  │ Item Name            │ Type   │ Bookings │ Total Amt │ Avg/Bkg │ │
│  ├──────────────────────┼────────┼──────────┼───────────┼─────────┤ │
│  │ Documentation Fee    │ charge │       18 │    81,000 │   4,500 │ │
│  │ Brokerage Fee        │ charge │       12 │    30,000 │   2,500 │ │
│  │ Arrastre/Wharfage    │ expense│       15 │    (1,800)│    (120)│ │
│  │ ...                  │        │          │           │         │ │
│  ├──────────────────────┼────────┼──────────┼───────────┼─────────┤ │
│  │ Unlinked Items       │   —    │        4 │     8,200 │   2,050 │ │
│  └──────────────────────┴────────┴──────────┴───────────┴─────────┘ │
│                                                                      │
│  Data Quality: 97.2% of line items linked to catalog (142/146)      │
│  ████████████████████████████████████████████░░  97%                  │
└──────────────────────────────────────────────────────────────────────┘
```

### Columns

| Column | Description |
|--------|-------------|
| Item Name | Catalog item name, sorted by total descending |
| Type | Pill badge: charge / expense / both |
| Bookings | Count of distinct bookings where this item appears |
| Total Amount | Sum of all amounts for this catalog item in the period |
| Avg/Booking | Total / Bookings |

### Data Quality Bar

A progress bar showing what percentage of line items have a `catalog_item_id`. This is the key metric for adoption — it should trend to 100% over time. The "Unlinked Items" row at the bottom shows the aggregate of items without catalog linkage.

---

## Affected Files

| File | Change |
|------|--------|
| `/components/accounting/AuditingModule.tsx` | **NEW** — shell with 3 tabs, renders Matrix/Summary/Catalog |
| `/components/accounting/ChargeExpenseMatrix.tsx` | **NEW** — pivot table component |
| `/components/accounting/AuditingSummary.tsx` | **NEW** — summary aggregation view |
| `/components/accounting/CatalogManagementPage.tsx` | Unchanged — just nested as a tab |
| `/components/accounting/Accounting.tsx` | Change `catalog` view to render `AuditingModule` instead of `CatalogManagementPage` |
| `/components/NeuronSidebar.tsx` | Rename `acct-catalog` label from "Catalog" to "Auditing" + change icon |
| `/supabase/functions/server/catalog-handlers.tsx` | Add `auditMatrix` and `auditSummary` aggregation handlers |
| `/supabase/functions/server/index.tsx` | Register new `/catalog/audit/matrix` and `/catalog/audit/summary` routes |

---

## Server Endpoints

All prefixed with `/make-server-c142e950/catalog/audit`.

| Method | Route | Description |
|--------|-------|-------------|
| `GET` | `/catalog/audit/matrix` | Aggregated pivot data: bookings x catalog items. Params: `?period=2026-02`, `?service_type=Brokerage`, `?view=charges\|expenses\|both`, `?client=` |
| `GET` | `/catalog/audit/summary` | Per-catalog-item aggregation: total, count, average. Same filter params. |

### Matrix Endpoint Logic

1. Determine date range from `period` param (e.g. `2026-02` → Feb 1–28)
2. Fetch all billing_items + billings + expenses (depending on `view` filter)
3. Filter by date range, service type (inferred from booking ID prefix: BRK=Brokerage, TRK=Trucking, etc.), client
4. Group by `booking_id`
5. For each line item: if `catalog_item_id` exists, bucket under that column; else bucket under `__unlinked__`
6. Build column list from distinct `catalog_item_id` values actually present
7. Build row list with per-cell amounts
8. Compute totals row
9. Compute meta (linked %, counts)

---

## Phases

### Phase 1: Server Aggregation Endpoints
- [x] Add `auditMatrix` handler to `catalog-handlers.tsx`
- [x] Add `auditSummary` handler to `catalog-handlers.tsx`
- [x] Register routes in `index.tsx`
- [x] Service type inference from booking ID prefix (BRK→Brokerage, TRK→Trucking, FWD→Forwarding, MI→Marine Insurance, OTH→Others)
- [x] Handle both `billing_item:` and `billing:` KV prefixes for backward compatibility
- [x] Handle both `booking_id` and `bookingId` field name variations

### Phase 2: AuditingModule Shell + Routing
- [x] Create `/components/accounting/AuditingModule.tsx` with 3-tab layout
- [x] Update `Accounting.tsx` to render `AuditingModule` for `catalog` view
- [x] Rename sidebar item from "Catalog" to "Auditing" in `NeuronSidebar.tsx`
- [x] Change icon from `Palette` to `ClipboardCheck`

### Phase 3: Charge & Expense Matrix Tab
- [x] Create `/components/accounting/ChargeExpenseMatrix.tsx`
- [x] Period selector (month/year) with chevron nav buttons
- [x] Service type filter dropdown (All / Brokerage / Trucking / Forwarding / Marine Insurance / Others)
- [x] View radio (Charges / Expenses / Both)
- [x] Frozen first column (booking #) via `position: sticky; left: 0`
- [x] Sticky totals row via `position: sticky; bottom: 0` with teal top border
- [x] Dense table styling (28px rows, right-aligned numbers, tabular-nums, monospace font)
- [x] Number formatting: commas, parentheses for negatives, em-dash for empty
- [x] Dynamic columns from data + Row Total column
- [x] Service type abbreviation column (BRK/TRK/FWD/MI/OTH)
- [x] Unlinked column with yellow-tinted header (#FEF9C3) and yellow cell bg for non-empty
- [x] Horizontal scroll with frozen pane
- [x] Meta chips in filter bar (Bookings count, Line Items count, Linked %)
- [x] Loading overlay, error state with retry, empty state
- [x] Alternating row striping

### Phase 4: Summary Tab + Data Quality
- [x] Create `/components/accounting/AuditingSummary.tsx`
- [x] Per-catalog-item table: name, type badge, booking count, total, average
- [x] Sorted by total descending (server-side)
- [x] Unlinked Items row at bottom with yellow background
- [x] Data quality progress bar (% linked) with color coding (green ≥90%, yellow ≥50%, red <50%)
- [x] Summary chips (Catalog Items, Total Line Items, Period, Service)
- [x] Filter bar with period nav, service type dropdown, view radio
- [x] Toast error handling on fetch failure
- [x] Loading overlay, error state with retry, empty state

### Phase 5: Polish & Export
- [x] CSV export for Matrix tab (matching visual layout with proper escaping)
- [x] Export CSV button in Matrix filter bar (teal outlined style)
- [x] Toast notifications: success on export, error on fetch failure
- [x] Error handling with toast in both Matrix and Summary tabs
- [x] Client filter deferred — server endpoint does not yet support client param; can be added later without frontend changes

---

## Current Status

**ALL PHASES COMPLETE** — The Auditing Module is fully deployed with all 5 phases:
- Phase 1: Server aggregation endpoints (`/catalog/audit/matrix` and `/catalog/audit/summary`)
- Phase 2: AuditingModule shell with 3 tabs, sidebar renamed to "Auditing"
- Phase 3: Full Charge & Expense Matrix pivot table with frozen columns, sticky totals, dense ERP styling
- Phase 4: Summary tab with per-item aggregation, type badges, and data quality progress bar
- Phase 5: CSV export, toast error handling across both tabs

---

## Dependencies

- Requires completed Expense & Charge Catalog (all 5 phases done)
- `catalog_item_id` field must be present on billing/expense line items (done in Catalog Phase 5)
- No new KV tables needed — reads existing `billing_item:`, `billing:`, `expense:` prefixes