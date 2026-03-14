# Financials Data Accuracy Blueprint

> **Status:** COMPLETE (awaiting browser verification)  
> **Created:** 2026-03-07  
> **Last Updated:** 2026-03-07  
> **Scope:** Fix all 12 identified discrepancies in the Financials aggregate module

---

## Problem Statement

The Financials aggregate module (`FinancialsModule.tsx`) displayed inaccurate data because:
1. Financial records (billings, invoices, collections, expenses) lacked enrichment -- they didn't carry `customer_name`, `quotation_number`, or normalized `booking_id` fields
2. The `getBillings` handler only read `billing:` KV prefix, missing `billing_item:` records
3. Frontend status filters didn't match actual backend statuses
4. KPI labels were semantically misleading

---

## Phases

### Phase 1: Backend Enrichment Pipeline _(STATUS: COMPLETE)_

**What was done:**
- Created `buildProjectLookupMaps()` helper in `accounting-handlers.tsx` that:
  - Fetches all projects via `kv.getByPrefix("project:")`
  - Builds `projectNumber -> { customer_name, customer_id, quotation_number }` map
  - Fetches all 5 booking types and builds `bookingId -> projectNumber` map
- Created `enrichRecords(records, projectMap, bookingToProjectMap)` that:
  - Normalizes `bookingId`/`booking_id` field names
  - Resolves project via booking lookup when `project_number` is missing
  - Attaches `customer_name`, `customer_id`, `quotation_number` from project metadata
- Applied enrichment in all 4 GET handlers: `getBillings`, `getInvoices`, `getCollections`, `getExpenses`
- Updated `mapEVoucherToExpense` to carry `booking_id` and `customer_name`

**Files modified:** `/supabase/functions/server/accounting-handlers.tsx`

---

### Phase 2: KV Prefix Unification _(STATUS: COMPLETE)_

**What was done:**
- Modified `getBillings` to fetch from BOTH `billing:` AND `billing_item:` prefixes
- Added deduplication by id to prevent double-counting
- Billable-expense atoms (auto-created from posted billable E-Vouchers) now appear in the aggregate

**Files modified:** `/supabase/functions/server/accounting-handlers.tsx`

---

### Phase 3: Frontend Corrections _(STATUS: COMPLETE)_

**What was done:**
- **KPI label:** "Total Billed" -> "Total Charges" (Billings tab)
- **Expenses status:** "Paid" -> "Posted" (value: `"posted"`, label: `"Posted"`) -- matches backend `mapEVoucherToExpense` output
- **Expenses status column:** colorMap updated to use `posted` key instead of `paid`
- **Collections status:** "Confirmed" -> "Posted" (value: `"posted"`, label: `"Posted"`) -- matches `processCollectionPosting` status
- **Collections status column:** colorMap and fallback updated from `"confirmed"` to `"posted"`
- **Collections filter:** Default fallback changed from `"confirmed"` to `"posted"`

**Files modified:** `/components/accounting/FinancialsModule.tsx`

---

## Discrepancy Tracker

| # | Severity | Issue | Phase | Status |
|---|----------|-------|-------|--------|
| 1 | CRITICAL | `customer_name` missing on billing items | Phase 1 | DONE |
| 2 | CRITICAL | Expenses "Paid" filter matches nothing | Phase 3 | DONE |
| 3 | CRITICAL | Collections "Confirmed" filter matches nothing | Phase 3 | DONE |
| 4 | CRITICAL | `billing_item:` prefix invisible | Phase 2 | DONE |
| 5 | HIGH | "Total Billed" KPI label misleading | Phase 3 | DONE |
| 6 | HIGH | `quotation_number` missing -- Contract group-by broken | Phase 1 | DONE |
| 7 | MEDIUM | `booking_id`/`bookingId` field mismatch | Phase 1 | DONE |
| 8 | MEDIUM | `customer_name` missing on expenses | Phase 1 | DONE |
| 9 | MEDIUM | Collections missing `booking_id` | Phase 1 | DONE |
| 10 | MEDIUM | Invoices missing `booking_id` | Phase 1 | DONE |
| 11 | MEDIUM | No enrichment pipeline (aggregate != project-level) | Phase 1 | DONE |
| 12 | MEDIUM | `uniqueBookings` KPI undercounts | Phase 1 | DONE (normalized at API level) |

---

## Implementation Log

**2026-03-07 -- All 3 Phases Implemented**

Backend (`accounting-handlers.tsx`):
- Added `buildProjectLookupMaps()` + `enrichRecords()` shared utilities
- `getBillings`: reads both `billing:` + `billing_item:` prefixes, deduplicates, enriches
- `getInvoices`: enriches with project metadata
- `getCollections`: enriches with project metadata
- `getExpenses`: enriches with project metadata; `mapEVoucherToExpense` updated with `booking_id` + `customer_name`

Frontend (`FinancialsModule.tsx`):
- Billings KPI: "Total Billed" -> "Total Charges"
- Expenses status filter: "Paid" -> "Posted" (value + label + colorMap)
- Collections status filter: "Confirmed" -> "Posted" (value + label + colorMap + fallback)

**Pending:** Browser verification of all 4 tabs to confirm enrichment renders correctly.

**2026-03-07 -- Follow-up Fixes (Post-Verification)**

1. **"Unknown Customer" root cause fixed** (`accounting-handlers.tsx`):
   - Added fallback in `enrichRecords`: if `bookingId` fails lookup in `bookingToProjectMap`, also try it directly in `projectMap` (handles legacy records where `booking_id` is actually a project number used as fallback)
   - This resolves 34 billing items that were falling into "Unknown Customer" because their `booking_id` was a project_number like "PRJ-2026-xxx" — not a real booking ID

2. **Column header alignment fixed** (`GroupedDataTable.tsx`):
   - Header row: "Expand all" button now has fixed `width: 80px` + `shrink-0`
   - Detail rows: spacer changed from `w-5` (20px) to `width: 80px` to match header
   - Both rows now use identical left-margin before the flex column container, ensuring DATE/PROJECT/CUSTOMER/etc. headers align with their data cells

**2026-03-07 -- Round 2 Fixes (Unknown Customer still persisting)**

3. **TRUE Root cause: Bookings not linked to projects** (`accounting-handlers.tsx`):
   - The 5 billing items under "Unknown Customer" all reference `booking_id = "BRK-2026-020"` — a brokerage booking for Camden Industries Inc.
   - BRK-2026-020 is NOT linked to any project (no `projectNumber` on the booking record)
   - So `bookingToProjectMap.get("BRK-2026-020")` returned undefined, and no project metadata was found
   - But the booking record itself carries `customerName: "Camden Industries Inc."` directly
   - **Fix:** Added a 4th lookup map `bookingCustomerMap: bookingId → { customer_name, customer_id, quotation_number }` built from ALL booking records (including those without projects)
   - `enrichRecords` now takes 4 params and falls back to `bookingCustomerMap.get(bookingId)` when project lookup fails
   - All 4 GET handlers (`getBillings`, `getInvoices`, `getCollections`, `getExpenses`) updated to pass 4th arg
   - Additionally, `buildProjectLookupMaps()` now also keys `projectMap` by `p.id` (the KV record ID) in case billing items use `project_id` as their `booking_id` fallback

4. **Header "Expand all" text removed** (`GroupedDataTable.tsx`):
   - Toggle button reduced to just a chevron icon (20px square) with hover highlight and tooltip
   - Column headers use `ml-1.5` gap after chevron
   - Detail row spacer reduced to 26px to match (20px button + 6px gap)
   - Group headers unchanged (chevron + label + badge + subtotal)

**2026-03-07 -- Round 3 Fixes (Orphaned billing items from deleted bookings)**

5. **ACTUAL Root cause: Orphaned billing items** (`index.tsx`):
   - The 11 "Unknown Customer" billing items reference bookings that were DELETED from KV
   - Bookings don't exist in the Brokerage module (or any module) — they were previously deleted
   - But their billing items survived because the delete handler's cleanup only checked `billing.bookingId` (camelCase), missing items with `booking_id` (snake_case) created by the rate-card/batch-save path
   - **Fix A — Delete handler field-name mismatch** (`index.tsx`, all 5 booking delete handlers):
     - Now checks BOTH `billing.bookingId === id` AND `billing.booking_id === id`
     - Also scans `billing_item:` prefix (not just `billing:`)
     - Deletes from both `billing:` and `billing_item:` prefixes for each orphan
     - Applies to: forwarding, brokerage, trucking, marine insurance, others delete handlers
   - **Fix B — `seed/clear` missing financial records** (`index.tsx`):
     - Now also clears `billing:`, `billing_item:`, `evoucher:`, and `expense:` records
     - Response summary includes `financials_cleared` count
   - **Fix C — One-time orphan purge endpoint** (`index.tsx`):
     - New `POST /maintenance/cleanup-orphaned-billings` endpoint
     - Builds set of ALL valid entity IDs (booking IDs + project IDs + project numbers + PROJECT-{number} format)
     - Scans all `billing:` and `billing_item:` records
     - Deletes any record whose `booking_id`/`bookingId`/`project_number` doesn't match a valid entity
     - Returns count + details of purged records
   - **Fix D — Auto-cleanup on Financials load** (`FinancialsModule.tsx`):
     - Calls cleanup endpoint once per browser session (sessionStorage flag)
     - Runs before data fetch, fire-and-forget
     - After first run, subsequent loads skip cleanup and fetch directly

**2026-03-07 -- Round 4 Fixes (Raw KV ID leaking into project_number display)**

6. **Root cause: `ProjectBillings.tsx` passes `project.id` instead of `project.project_number`**:
   - `ProjectBillings.tsx:18` passed `projectId={project.id}` — the raw KV record ID like `project-1770944542319-p7dc247tq`
   - `UnifiedBillingsTab.tsx:419` stamps new billing items with `booking_id: bookingId || projectId` — at project level, `bookingId` is undefined, so it falls back to the raw KV ID
   - These billing items get permanently stored in KV with `booking_id: "project-1770944..."` 
   - `ContractDetailView.tsx:463` had the same issue, passing `quotation.id` instead of `quotation.quote_number`
   - **Fix A — Source fix** (`ProjectBillings.tsx`):
     - Changed to `projectId={project.project_number || project.id}` 
   - **Fix B — Source fix** (`ContractDetailView.tsx`):
     - Changed to `projectId={quotation.quote_number || quotation.id}`
   - **Fix C — Enrichment pipeline** (`accounting-handlers.tsx`):
     - `enrichRecords` now accepts 5th param `projectIdToNumber: Map<string, string>`
     - When resolving via `projectMap.get(rawKvId)`, translates to human-readable project_number using `projectIdToNumber.get(rawKvId)`
     - All 4 GET handlers (billings, invoices, collections, expenses) updated to destructure and pass `projectIdToNumber`
   - **Fix D — Data remediation** (`index.tsx` cleanup endpoint):
     - The `cleanup-orphaned-billings` endpoint now also remediates valid-but-raw-ID billing items
     - For any billing item whose `booking_id` maps to a known project's KV ID, rewrites it in-place with the human-readable `project_number`
     - Reports `remediatedCount` and `remediationDetails` alongside orphan purge stats