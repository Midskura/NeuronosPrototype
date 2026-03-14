# Financial Report Overhaul Blueprint — Sales Report

## Goal

Transform the Sales Report from a "styled DataTable" into a **real financial document** — one that Philippine freight forwarding accountants would recognize as a proper ledger. Inspired by reference app's information density and column-level color coding, but executed in Neuron OS visual language: quiet containers, loud data, green/teal/amber palette.

## Design Principles

1. **Column zone tinting** creates vertical scanning lanes — accountants track categories top-to-bottom
2. **Two-line composite cells** increase density without adding columns
3. **Document framing** signals "this is a printable financial document, not a dashboard widget"
4. **Show the math** — computation block replaces flat summary strip
5. **Accounting typography** — parentheses for at-risk values, em-dashes for zero, double-rule totals
6. **Grouped column headers** — category labels above individual column names

## Files Affected

| File | Action |
|---|---|
| `SalesReport.tsx` | Major rewrite — all 4 phases |
| `server/accounting-handlers.tsx` | Bug fix — getBillings filter |

## Completed Phases (A–D)

Phases A through D are **COMPLETE** — see change log below for details. They delivered:
- Column zone tinting (teal/amber/green backgrounds)
- Two-line composite cells (9 → 7 columns)
- Document envelope + double-row grouped headers
- Summary computation block with stepped ledger + metric tiles

## Current Phase: Data Visibility Bug Fix (Phase E)

### Phase E1: getBillings Filter Bug Fix

**Root cause identified:** The `getBillings` handler (line 1496 in `accounting-handlers.tsx`) uses `!b.invoice_number` to distinguish invoice *documents* from billing *line items*. Both share the `billing:` KV prefix.

However, `createInvoice` (line 1321-1328) stamps `invoice_number` onto every billing item it references. This causes invoiced billing items to be **filtered out** of the `getBillings` response — making them invisible to the Sales Report.

**The fix:** Replace the `!b.invoice_number` filter with a check that identifies invoice *documents* specifically. Invoice documents have:
- `id` starting with `"INV"` (from `generateId("INV")`)
- A `billing_item_ids` array (referencing constituent line items)

Billing line items should be returned regardless of whether they have `invoice_number` (which just means they've been invoiced — a status, not a type change).

**Filter change:**
```
// BEFORE (buggy): excludes invoiced billing items
billingPrefixed.filter((b: any) => !b.invoice_number)

// AFTER (fixed): excludes only invoice aggregate documents
billingPrefixed.filter((b: any) => !b.billing_item_ids)
```

---

## Status

| Phase | Status | Notes |
|---|---|---|
| Phase A: Column Zone Tinting + Accounting Typography | COMPLETE | See change log |
| Phase B: Two-Line Composite Cells + Column Reduction | COMPLETE | See change log |
| Phase C: Document Envelope + Double-Row Header | COMPLETE | See change log |
| Phase D: Summary Computation Block | COMPLETE | See change log |
| Phase E1: getBillings Filter Bug Fix | COMPLETE | Fixed filter in `getBillings` (line 1496) and `getInvoices` linkage hardening (line 1192). Changed `!b.invoice_number` → `!b.billing_item_ids` to stop excluding invoiced billing items from the Sales Report. |

## Change Log

- Blueprint created
- **Phase A complete:** Column zone tinting + accounting typography.
- **Phase B complete:** Two-line composite cells (9→7 columns).
- **Phase C complete:** Document envelope header, double-row grouped column headers, report footer.
- **Phase D complete:** Two-panel summary computation block.
- **Blueprint updated:** Replaced E1-E3 (seed/masthead/chrome) with E1 data visibility bug fix after investigation revealed existing data was being filtered out by getBillings handler.
- **Phase E1 complete:** Fixed `getBillings` filter — changed `!b.invoice_number` → `!b.billing_item_ids` in two locations (getBillings handler + getInvoices linkage hardening reverse lookup). Invoiced billing items are now visible to the Sales Report.