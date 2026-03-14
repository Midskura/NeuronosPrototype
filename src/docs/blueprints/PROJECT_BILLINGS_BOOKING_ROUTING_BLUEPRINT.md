# PROJECT BILLINGS — SERVICE-TO-BOOKING ROUTING BLUEPRINT
## Billing Line Items Auto-Route to Bookings via Quotation Service Tag

**Created:** 2026-03-04
**Status:** COMPLETE

---

## Summary

Project Billings currently render as a flat category-grouped list with no awareness of
which booking each billing item belongs to. Contract Billings already support a
"Group by: Booking | Category" toggle that groups billing items by their `booking_id`.

This blueprint extends the same pattern to Projects:
1. Enable the group-by-booking toggle on Project Billings (UI parity with Contracts)
2. When quotation line items are reflected as virtual billing items, auto-route each
   item to the correct booking based on its `service` tag (e.g., "Brokerage" line item
   goes to the BRK-xxx booking linked to that project)
3. Manual "Add Billing" items also respect the service-to-booking mapping

### Key Insight
The backend already enforces **one booking per service type per project**
(`/projects/:id/link-booking` validates uniqueness). This guarantees a clean 1:1
mapping: `lineItem.service === linkedBooking.serviceType`.

---

## Data Model (Already Exists)

### Quotation Line Item (`SellingPriceLineItem` in `/types/pricing.ts`)
```
service?: string       // "Forwarding", "Brokerage", "Trucking", "Marine Insurance", "Others"
service_tag?: string   // Same values, kept in sync
```

### Project LinkedBookings (`project.linkedBookings[]`)
```
{
  bookingId: string,       // "BRK-20260301-1234"
  bookingNumber: string,   // "BRK-20260301-1234"
  serviceType: string,     // "Brokerage" (matches line item service)
  status: string,
  createdAt: string,
  createdBy: string
}
```

### Billing Item (`BillingItem` in `UnifiedBillingsTab.tsx`)
```
booking_id?: string        // Currently set to projectId for project-level items
service_type: string       // "Brokerage", "Forwarding", etc.
```

---

## PHASE 1: Wire ProjectBillings with Group-by-Booking Support
**Status:** DONE

### Files to modify
- `/components/projects/tabs/ProjectBillings.tsx`

### What
- Pass `enableGroupByToggle={true}` to `UnifiedBillingsTab`
- Pass `linkedBookings={project.linkedBookings || []}` to `UnifiedBillingsTab`
- This immediately enables the Booking/Category toggle on Project Billings

### Acceptance
- Project Billings tab shows "Group by: Booking | Category" toggle
- Defaults to "Booking" view (matching contract behavior)
- All existing billing items appear under "Unassigned" booking (since they have no booking_id yet)

---

## PHASE 2: Service-to-Booking Auto-Routing in Reflective Merge
**Status:** DONE

### Files to modify
- `/components/shared/billings/UnifiedBillingsTab.tsx`

### What
- Build a `serviceToBookingMap: Map<string, string>` from `linkedBookings` —
  maps service type (e.g., "Brokerage") to booking ID (e.g., "BRK-20260301-1234")
- In the virtual item creation block (~line 151-174), replace:
  ```
  booking_id: bookingId || projectId
  ```
  with:
  ```
  booking_id: bookingId || serviceToBookingMap.get(item.service || "") || projectId
  ```
- In the real-item reflective update block (~line 129-146), also update `booking_id`
  if the item is `unbilled` and has a service match
- For `handleAddItemToCategory` and `handleAddBilling`, default `booking_id` should
  still be `bookingId || projectId` (user can change service later, and on save the
  routing should be recalculated)

### Acceptance
- Quotation line items tagged "Brokerage" auto-appear under the BRK booking group
- Line items tagged "Forwarding" appear under the FWD booking group
- Line items with "General" or no service tag → fall back to project ID (appear under "Unassigned")
- Changing a line item's service type in the quotation builder reflects correctly
  on the Project Billings tab after refresh

---

## PHASE 3: Save Flow — Persist Correct booking_id
**Status:** DONE

### Files to modify
- `/components/shared/billings/UnifiedBillingsTab.tsx` (handleSaveChanges)

### What
- Before sending the batch save, ensure each item's `booking_id` is recalculated
  from its `service_type` → `serviceToBookingMap` mapping
- This ensures that if a user changes the service tag on a billing item, the
  `booking_id` updates when saved (not just visually)
- The backend `batchUpsertBillings` already persists whatever `booking_id` is sent

### Acceptance
- Save a billing item with service "Brokerage" → KV store has `booking_id: "BRK-xxx"`
- After page reload, the item still appears under the correct booking group
- Items with no service match still save with `booking_id: projectId`

---

## PHASE 3.1 (Hotfix): Normalize project-ID fallback to "unassigned" in BillingsTable grouping
**Status:** DONE

### Files to modify
- `/components/shared/billings/BillingsTable.tsx`

### What
- In the `groupedBillings` function, ensure that any `booking_id` that matches the `projectId` is
  normalized to "unassigned" for grouping purposes

### Acceptance
- Billing items with `booking_id` equal to `projectId` are grouped under "Unassigned" in the BillingsTable

---

## Phase Checklist

- [x] Phase 1: Wire ProjectBillings with group-by-booking toggle
- [x] Phase 2: Service-to-booking auto-routing in reflective merge
- [x] Phase 3: Save flow — persist correct booking_id
- [x] Phase 3.1 (Hotfix): Normalize project-ID fallback to "unassigned" in BillingsTable grouping

---

## Files Created/Modified

| File | Action | Phase |
|---|---|---|
| `/docs/blueprints/PROJECT_BILLINGS_BOOKING_ROUTING_BLUEPRINT.md` | NEW | — |
| `/components/projects/tabs/ProjectBillings.tsx` | MODIFIED | 1 |
| `/components/shared/billings/UnifiedBillingsTab.tsx` | MODIFIED | 2, 3 |
| `/components/shared/billings/BillingsTable.tsx` | MODIFIED | 3.1 |

## Backend Impact: NONE
No new endpoints. The existing `batchUpsertBillings` and `billing-items` endpoints
already handle `booking_id`. The `link-booking` endpoint already enforces one-booking-
per-service-type. All routing logic is frontend-only.