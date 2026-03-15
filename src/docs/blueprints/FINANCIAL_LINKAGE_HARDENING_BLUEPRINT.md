# Financial Linkage Hardening Blueprint

## Problem Statement

The financial data model has a **broken traceability chain** from Collections → Bookings. The current linkage:

```
Billing Items ── booking_id ✅, project_number ✅, invoice_number (when billed) ✅
Invoices ─────── project_number ✅, billing_item_ids (from frontend) ✅
                 booking_ids ❌ MISSING, service_types ❌ MISSING
Collections ──── invoice_number ✅, project_number ✅, linked_billings[] ✅
                 booking_ids ❌ MISSING, service_types ❌ MISSING
Expenses ─────── booking_id ✅, project_number ✅ — clean ✅
```

**Impact:** The Booking Cash Flow Report (and any per-booking financial analysis) cannot accurately trace collections to bookings. Collections link to invoices, but invoices don't record which bookings they cover. To resolve this today requires a full scan of all billing items to match by `invoice_number` — fragile, expensive, and error-prone.

**Risks of current state:**
1. Double-counting: billing items under both `billing:` and `billing_item:` KV prefixes
2. Orphaned collections: collection references a voided/deleted invoice
3. Missing attribution: invoice bundles 3 bookings, partial payment can't be allocated
4. Revenue leakage: billable expense creates billing atom, but linkage is implicit

## Target State

```
Billing Items ── booking_id ✅, project_number ✅, invoice_number ✅, invoice_id ✅
Invoices ─────── project_number ✅, billing_item_ids ✅
                 booking_ids ✅ NEW, service_types ✅ NEW
Collections ──── invoice_number ✅, project_number ✅, linked_billings[] ✅
                 booking_ids ✅ NEW, service_types ✅ NEW
Expenses ─────── booking_id ✅, project_number ✅ — unchanged
```

Every financial record knows which bookings it belongs to. The Booking Cash Flow Report can pro-rate collections across bookings by their billing weight — standard accounting practice.

---

## Affected Files

| File | Change Type |
|---|---|
| `/supabase/functions/server/accounting-handlers.tsx` | **Modified** — `createInvoice`, `processCollectionPosting`, `getInvoices`, `getCollections` |
| `/supabase/functions/server/index.tsx` | **Modified** — register backfill endpoint |

---

## Phase 1: Enrich Invoice Creation ✅ COMPLETE

**File:** `accounting-handlers.tsx` → `createInvoice()`

**What:** When creating an invoice from billing items, derive `booking_ids` and `service_types` from the billing items being bundled, and store them on the invoice record.

**Current flow (lines ~1097-1118):**
```
1. Receive billing_item_ids from frontend
2. For each billing_item_id:
   a. Fetch billing item from KV
   b. If exists and not already billed, stamp invoice_number + invoice_id + status="billed"
3. Save invoice
```

**New flow:**
```
1. Receive billing_item_ids from frontend
2. For each billing_item_id:
   a. Fetch billing item from KV
   b. If exists and not already billed, stamp invoice_number + invoice_id + status="billed"
   c. ✨ Collect booking_id and service_type from the item
3. ✨ Deduplicate → store booking_ids[] and service_types[] on invoice
4. Save invoice
```

**Code change (~15 lines):**
- After the billing item loop, before saving the invoice:
  ```ts
  // Derive booking lineage from billing items
  const derivedBookingIds = [...new Set(fetchedItems.map(b => b.booking_id).filter(Boolean))];
  const derivedServiceTypes = [...new Set(fetchedItems.map(b => b.service_type).filter(Boolean))];
  invoice.booking_ids = derivedBookingIds;
  invoice.service_types = derivedServiceTypes;
  ```

**Validation:** After implementation, create a test invoice via the UI and verify the stored record contains `booking_ids` and `service_types`.

---

## Phase 2: Enrich Collection Creation ✅ COMPLETE

**File:** `accounting-handlers.tsx` → `processCollectionPosting()`

**What:** When posting a collection e-voucher, look up the invoice by `invoice_number` and inherit its `booking_ids` and `service_types`.

**Current flow (lines ~888-919):**
```
1. Validate e-voucher
2. Build collection record from e-voucher fields
3. Save collection
```

**New flow:**
```
1. Validate e-voucher
2. Build collection record from e-voucher fields
3. ✨ Look up invoice by invoice_number → inherit booking_ids, service_types
4. Save collection
```

**Code change (~20 lines):**
- After building the collection object, before saving:
  ```ts
  // Inherit booking lineage from the invoice being paid
  if (evoucher.invoice_number) {
    const allBillings = await kv.getByPrefix("billing:");
    const invoice = allBillings.find(b => b.invoice_number === evoucher.invoice_number && b.booking_ids);
    if (invoice) {
      collection.booking_ids = invoice.booking_ids || [];
      collection.service_types = invoice.service_types || [];
    }
  }
  ```

**Edge case:** Collection e-vouchers can have `linked_billings[]` which references multiple invoices. If present, merge booking_ids from all linked invoices.

---

## Phase 3: Read-Time Enrichment (Safety Net) ✅ COMPLETE

**Files:** `accounting-handlers.tsx` → `getInvoices()`, `getCollections()`

**What:** For legacy invoices/collections created before the hardening, derive `booking_ids` at read time from billing items. This ensures reports work correctly even for historical data — no separate backfill needed.

**For `getInvoices`:**
```
After enrichRecords(), for any invoice missing booking_ids:
1. Find all billing items where invoice_number matches
2. Extract booking_ids from those items
3. Attach to the invoice response (optionally persist for future reads)
```

**For `getCollections`:**
```
After enrichRecords(), for any collection missing booking_ids:
1. Look up its invoice(s) by invoice_number or linked_billings
2. Inherit booking_ids from the invoice(s)
3. Attach to the collection response
```

**Self-healing:** If we derive booking_ids at read time, also persist them back to KV (same pattern as the `is_billable` self-healing in `getExpenses`). This means the derivation only happens once per legacy record — subsequent reads are instant.

---

## Phase 4: Backfill & Integrity Endpoint

**File:** `accounting-handlers.tsx` (new handler), `index.tsx` (register route)

**What:** A POST endpoint that scans ALL invoices and collections, derives missing `booking_ids`, and persists corrections. Also produces an integrity report.

**Endpoint:** `POST /accounting/linkage-backfill`

**Actions:**
1. Fetch all billing items → build lookup map: `invoice_number → billing_items[]`
2. Fetch all invoices → for each missing `booking_ids`, derive from billing items map
3. Fetch all collections → for each missing `booking_ids`, derive from invoice lookup
4. Persist all patched records
5. Return integrity report:
   - Invoices patched: N
   - Collections patched: N
   - Orphaned collections (no matching invoice): [list]
   - Billing items under duplicate KV prefixes: [list]

**This phase is optional** if Phase 3 (read-time enrichment) is implemented — but recommended for data cleanliness.

---

## Implementation Notes

### Pro-Rating Convention
When a collection pays a multi-booking invoice partially, the Booking Cash Flow Report pro-rates by billing weight:

```
Invoice covers: Booking A (₱100K) + Booking B (₱50K) = ₱150K total
Collection: ₱75K

Booking A allocation: 75K × (100K / 150K) = ₱50K
Booking B allocation: 75K × (50K / 150K) = ₱25K
```

This is standard practice in Philippine freight forwarding accounting. The pro-rating happens at the **report level** (client-side), not in the stored data. The stored `booking_ids` tells us WHICH bookings are involved; the billing items tell us the WEIGHTS.

### KV Prefix Note
The `billing:` prefix overload (billing items AND invoices sharing it) is a known tech debt item. This blueprint does NOT address the prefix cleanup — that's a separate, larger migration. The code already has reliable heuristics (`!!invoice_number`) to distinguish them.

---

## Status

| Phase | Status | Notes |
|---|---|---|
| Phase 1: Invoice Creation Enrichment | ✅ COMPLETE | `booking_ids` + `service_types` derived from billing items at invoice creation |
| Phase 2: Collection Creation Enrichment | ✅ COMPLETE | Inherits `booking_ids` from invoice(s) — handles both single invoice and multi-invoice (linked_billings) |
| Phase 3: Read-Time Enrichment | ✅ COMPLETE | Self-healing at read time for legacy invoices + collections. Persists corrections. |
| Phase 4: Backfill & Integrity | NOT STARTED | Optional — Phase 3 covers legacy data. Build when needed for audit. |

## Change Log
- Blueprint created with 4-phase plan
- Phase 1 implemented: `createInvoice` now collects billing items during the billed-status loop, extracts unique `booking_ids` and `service_types`, stores on invoice record
- Phase 2 implemented: `processCollectionPosting` now looks up invoice by `invoice_number`, inherits `booking_ids` and `service_types`. Handles multi-invoice collections via `linked_billings` with merged deduplication.
- Phase 3 implemented: `getInvoices` and `getCollections` now derive `booking_ids` at read time for legacy records missing the field. Uses self-healing persist pattern (async, non-blocking) so derivation only runs once per record.
