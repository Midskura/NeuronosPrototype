# SERVICE TYPE ARCHITECTURE FIX BLUEPRINT

> **Status:** COMPLETE
> **Created:** 2026-03-12
> **Last Updated:** 2026-03-12
> **Current Phase:** All 4 phases complete

---

## Problem Summary

Three systemic issues in the billings/expenses data architecture:

1. **`service_type` (Booking Type) vs `quotation_category` (Charge Category) conflation** — The "Booking Type" filter reads `quotation_category` (charge categories like "Origin Charges", "Freight Charges") instead of the actual booking service type (Forwarding, Brokerage, Trucking, Marine Insurance, Others).

2. **`getRefDisplay()` prioritizes Projects over Bookings** — Billings and expenses show `PROJ-2026-XXX` in the Ref# column instead of the booking ID. Billings are made from bookings, not projects.

3. **Group-by options include Project/Contract for Billings & Expenses** — These are upstream containers; billings and expenses are atomic to bookings.

**Root Cause:** The server's `enrichRecords()` function never resolves the parent booking's service type. The booking entity stores `serviceType` (or it's implicit from the KV prefix like `forwarding_booking:`), but child records (billing items, expenses) don't get this field attached during enrichment.

---

## Canonical Service Types

These are the ONLY valid booking service types:

| Service Type | KV Prefix |
|---|---|
| Forwarding | `forwarding_booking:` |
| Brokerage | `brokerage_booking:` |
| Trucking | `trucking_booking:` |
| Marine Insurance | `marine_insurance_booking:` |
| Others | `others_booking:` |

---

## Phase Plan

### Phase 1: Server-Side Enrichment
**Status:** COMPLETE
**Files:** `/supabase/functions/server/accounting-handlers.tsx`

**What:**
- Extend `buildProjectLookupMaps()` to build a `bookingId -> serviceType` map
- Derive service type from booking entity's `serviceType` field OR from the KV prefix
- Extend `enrichRecords()` to propagate `service_type` onto every billing item and expense
- Only fill if the record doesn't already have a `service_type`

**Validation:**
- GET `/accounting/billing-items` should return items with `service_type` populated
- GET `/accounting/expenses` should return items with `service_type` populated
- Values should be one of: Forwarding, Brokerage, Trucking, Marine Insurance, Others

---

### Phase 2: Billings Tab Frontend Fixes
**Status:** COMPLETE
**Files:** `/components/accounting/FinancialsModule.tsx`

**What:**
- Change "Booking Type" filter to use enriched `service_type` instead of `quotation_category`
- Derive available types from `service_type` field (should yield Forwarding, Brokerage, etc.)
- Remove "Project" and "Contract" from billings group-by options (keep Customer, Booking only)
- Fix `getRefDisplay()` to prioritize `booking_id` over `project_number` for billings/expenses
- Update the billings column definitions: keep "Category" column for `quotation_category` (charge category), but ensure "Booking Type" filter uses `service_type`

**Validation:**
- Booking Type filter shows: Forwarding, Brokerage, Trucking, Marine Insurance, Others
- Ref# column shows booking IDs, not project numbers
- Group-by only offers Customer and Booking

---

### Phase 3: Expenses Tab Frontend Fixes
**Status:** COMPLETE
**Files:** `/components/accounting/FinancialsModule.tsx`

**What:**
- Change "Booking Type" filter on expenses to use enriched `service_type` instead of `expenseCategory`
- Remove "Project" and "Contract" from expenses group-by options (keep Customer, Booking only)
- Ensure the Ref# column for expenses also prioritizes booking_id
- Fix expenses mapping to carry through `service_type` from server enrichment
- Remove dead `project`/`contract` cases from billings and expenses grouping switch statements

**Validation:**
- Expenses Booking Type filter shows service types, not expense categories
- Group-by only offers Customer and Booking
- Ref# shows booking IDs

---

### Phase 4: Dashboard Analytics Cleanup
**Status:** COMPLETE
**Files:**
- `/components/accounting/dashboard/BreakdownTabs.tsx`
- `/components/accounting/dashboard/ServiceProfitability.tsx`
- `/components/accounting/dashboard/IncomeVsCostBreakdown.tsx`

**What:**
- Dashboard components already use `item.service_type` directly with `normalizeServiceType()` as safety net
- The critical fix was in Phase 2+3: the expenses mapping in FinancialsModule was stripping `service_type` when re-mapping server data to `OperationsExpense` shape — now fixed
- With `service_type` flowing through from the server, `normalizeServiceType()` correctly maps values like "Forwarding", "Brokerage", etc.
- Dead `project`/`contract` grouping cases removed from billings and expenses switch statements

**Validation:**
- Service Profitability table shows clean rows: Forwarding, Brokerage, Trucking, Marine Insurance, Others
- No charge categories appearing as service types
- Revenue/Cost/Margin numbers aggregate correctly by actual service type

---

## Files Modified (Running Log)

| Phase | File | Change |
|---|---|---|
| 1 | `/supabase/functions/server/accounting-handlers.tsx` | Added `bookingServiceTypeMap` to `buildProjectLookupMaps()`, derives service type from booking entity or KV prefix. `enrichRecords()` now propagates `service_type` to all billing items, expenses, collections, and invoices. |
| 2+3 | `/components/accounting/FinancialsModule.tsx` | Booking Type filter now uses `service_type` (not `quotation_category`/`expenseCategory`). `getRefDisplay()` now prioritizes `booking_id` over `project_number`. Removed "Project" and "Contract" from billings and expenses group-by options. Fixed expenses mapping to carry through `service_type` from server enrichment. Removed dead `project`/`contract` cases from billings and expenses grouping switch statements. |
| 4 | Dashboard components (BreakdownTabs, ServiceProfitability, IncomeVsCostBreakdown) | Already using `item.service_type` directly — no changes needed since the data pipeline fix in Phase 2+3 resolved the root cause. |

---

## Notes

- `quotation_category` remains a valid field — it's the charge category (e.g., "Origin Charges", "Freight Charges"). It just shouldn't be used as a proxy for service type.
- `expenseCategory` also remains valid — it's the accounting category for expenses (e.g., "Duties", "Documentation"). Same principle.
- The `normalizeServiceType()` function in dashboard components maps variants like "freight forwarding" -> "Forwarding". This should still be used as a safety net but shouldn't be the primary mechanism.