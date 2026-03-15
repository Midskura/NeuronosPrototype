# Contract Billings Rework Blueprint

**Created:** 2026-02-25
**Status:** COMPLETE
**Current Phase:** ALL PHASES COMPLETE (5A–5E done, Phase 6 deferred)

---

## Problem Statement

Contract Billings and Project Billings are the same job (creating billing line items for bookings) but use two completely different UX patterns:

- **Project Billings** = full-page editable workspace (`UnifiedBillingsTab` + `BillingsTable` + `UniversalPricingRow`), with categories, inline editing, search/filters, batch save.
- **Contract Billings** = modal-based "calculate and dump" flow (`ContractRatePreviewModal`), producing locked read-only lines in a flat table with no editing.

Additionally, the data is stored under different KV prefixes (`billing:` for projects vs `evoucher:` for contracts), making the two systems incompatible at the persistence layer.

---

## Solution

**Kill the modal. Reuse `UnifiedBillingsTab`.**

The contract billings tab should render the **same** `UnifiedBillingsTab` component used by project billings. The rate engine becomes a "Smart Pre-Fill" action that injects billing rows into this standard interface, rather than a separate calculator that produces locked output.

### ~~Original Flow (Phases 1–3, COMPLETED)~~

> Phases 1–3 built the contract billings tab using `UnifiedBillingsTab` with rate-card generation
> at the **contract level**. This worked but created a disconnected data model — billing items
> stored with `contract_id` didn't appear in individual booking billings tabs, and billable
> expenses logged by Ops (which auto-create billing items with `booking_id`) didn't appear in
> contract billings. **Phases 5–6 fix this with a "Booking-Owned Billings" architecture.**

### Revised Flow (Phases 5–6)

**Core principle:** Billing items belong to **bookings**, not contracts. The contract is the pricing agreement; the booking is the unit of work that gets invoiced.

1. **Ops** logs a "Billable Expense" on a booking → backend auto-creates a billing item with `booking_id` + `source_type: 'billable_expense'`
2. **Accounting** opens a booking's Billings tab → sees auto-created items from billable expenses
3. For **contract bookings**, Accounting clicks "⚡ Generate from Rate Card" → rate engine runs using parent contract's rate matrices → editable `BillingItem[]` injected with `booking_id` + `source_type: 'contract_rate'`
4. Accounting edits, adjusts, saves — all at the **booking level**
5. **Contract Billings tab** = read-only aggregate view → fetches all billing items where `booking_id ∈ linked_bookings` → grouped by booking with subtotals

### Key Design Decisions (Revised)

- Billing items always stored with `booking_id` (single source of truth)
- Rate engine still runs **client-side** via `/utils/contractRateEngine.ts`
- "Generate from Rate Card" button lives on the **booking** Billings tab (not contract level)
- Contract Billings tab is **read-only** — click a booking to drill into its editable Billings tab
- Billable expenses auto-create billing items **immediately** on posting (already implemented in backend)
- Role-based visibility (Phase 6, future): Billings tab hidden from Operations users

### Data Flow Diagram

```
Ops logs "Billable Expense" on Booking
  → Backend auto-creates billing_item with booking_id + source_type:'billable_expense'
  → Shows up in Booking Billings tab (Accounting sees it)
  → Shows up in Contract Billings tab (aggregate)

Accounting clicks "⚡ Generate from Rate Card" on Booking Billings tab
  → Rate engine runs → editable BillingItem[] injected
  → Saved with booking_id + source_type:'contract_rate'
  → Shows up in Contract Billings tab (aggregate)

Contract Billings tab
  → Fetches all billing_items where booking_id ∈ linked bookings
  → Read-only view, grouped by booking, with subtotals
  → Click booking → drills into that booking's Billings tab
```

---

## Phase 1 — Foundation

**Status:** DONE (2026-02-25)

### Tasks:
- [x] 1.1 Create this blueprint document
- [x] 1.2 Create `useContractBillings` hook at `/hooks/useContractBillings.ts`
  - Fetches ALL `billing:` items via `GET /accounting/billing-items`
  - Filters client-side by `contract_id`
  - Returns `{ billingItems, isLoading, refresh }`
  - Compatible with `UnifiedBillingsTab` props
- [x] 1.3 Create `generateRateCardBillingItems()` utility at `/utils/rateCardToBilling.ts`
  - Takes: `rateMatrices`, `serviceType`, `mode`, `bookingQuantities`, `bookingId`, `contractId`, `contractNumber`, `customerName`
  - Runs `instantiateRates()` from the existing rate engine
  - Converts `AppliedRate[]` to `BillingItem[]` format (matching `UnifiedBillingsTab` schema)
  - Sets `source_type: 'contract_rate'`, `contract_id`, `source_booking_id`, `quotation_category` (service type as category)

---

## Phase 2 — Contract Billings Tab Rework

**Status:** DONE (2026-02-25)

### Tasks:
- [x] 2.1 Replace `renderBillingsTab()` in `ContractDetailView.tsx` with `UnifiedBillingsTab`
  - Wire `useContractBillings(quotation.id)` for data
  - Pass contract's `quotation.id` as the `projectId` prop (for batch save context)
  - Summary cards deferred — UnifiedBillingsTab handles its own header
- [x] 2.2 Remove old billings state (`contractBillings`, `billingSummary`, `isLoadingBillings`, `fetchContractBillings`)
  - Replaced with `useContractBillings` hook
  - Old `handleConfirmBillingGeneration` function removed (was referencing undefined `BookingQuantities` type and `fetchContractBillings`)
- [x] 2.3 Remove the `ContractRatePreviewModal` import and rendering from `ContractDetailView`
  - Import removed, modal rendering block removed from JSX
  - `ContractRatePreviewModal.tsx` file still exists (will be deleted in Phase 4)
- [x] 2.4 "Generate Billing" button in Bookings tab redirects to Billings tab via toast
  - `handleGenerateBilling` now shows info toast: "Billing generation has moved to the Billings tab"
  - Dead state vars (showRatePreview, ratePreviewBooking, generatingBillingFor) retained for now — harmless, cleaned in Phase 4

---

## Phase 3 — "Generate from Rate Card" Popover

**Status:** DONE (2026-02-25)

### Tasks:
- [x] 3.1 Create `RateCardGeneratorPopover` component at `/components/contracts/RateCardGeneratorPopover.tsx`
  - Renders as a popover (not modal) anchored to the trigger button
  - Lists unbilled bookings (filtered from `linkedBookings` where no billing items exist with matching `source_booking_id`)
  - Each row: Booking ID, Service Type, Mode, auto-detected quantities (via `deriveQuantitiesFromBooking`)
  - "Generate" button per-booking + "Generate All" at top
  - Duplicate detection: already-billed bookings show green "Generated" badge
  - Missing matrix bookings show amber "No matrix" warning
- [x] 3.2 Wire into `UnifiedBillingsTab` header area
  - Added `extraActions`, `title`, `subtitle` props to `UnifiedBillingsTab` (non-breaking)
  - "Generate from Rate Card" button renders alongside "Add Billing" via `extraActions` prop
  - Title shows "Contract Billings" with contextual subtitle
  - Linked bookings now fetched when billings tab is active (not just bookings tab)
- [x] 3.3 On generate: call `generateRateCardBillingItems()` → inject into `generatedItems` state → merged with persisted items via `allBillingItems` → user edits → saves via standard `batchUpsertBillings` → `generatedItems` auto-cleared on refresh
- [x] 3.4 Add `extraActions`, `title`, `subtitle` props to `UnifiedBillingsTab` in `/components/shared/billings/UnifiedBillingsTab.tsx`
- [x] 3.5 Wire popover, `generatedItems` state, and `allBillingItems` merge in `/components/pricing/ContractDetailView.tsx`

---

## Phase 4 — ~~Cleanup & Polish~~ SUPERSEDED

**Status:** SUPERSEDED by Phases 5A–5E (Booking-Owned Billings Architecture)

> The original Phase 4 cleanup tasks are absorbed into Phase 5E below.
> The architectural shift to booking-owned billings makes the original Phase 4 tasks
> part of a larger refactor rather than standalone cleanup.

### ~~Tasks:~~
- ~~4.1 Delete or deprecate `ContractRatePreviewModal.tsx`~~ → moved to 5E.1
- ~~4.2 Remove `deriveQuantitiesFromBooking` import from `ContractDetailView` if no longer referenced~~ → moved to 5E.2
- ~~4.3 Remove old server-side `generate-billing` endpoint reference if no longer called~~ → moved to 5E.3
- ~~4.4 Clean up related state variables (`showRatePreview`, `ratePreviewBooking`, `generatingBillingFor`)~~ → moved to 5E.4
- ~~4.5 Final test: verify contract billings tab is identical UX to project billings tab~~ → absorbed into 5C
- ~~4.6 Update this blueprint status to COMPLETE~~ → moved to 5E.6

---

## Phase 5A — Backend: Fix Billable Expense → Billing Item Link

**Status:** DONE (2026-02-25)

**Problem:** When a billable expense is posted (`accounting-handlers.tsx`, line ~296–314), the auto-created billing item stores `project_number` but **not** `booking_id`. This means it won't surface correctly when the contract billings tab aggregates by booking ID.

### Tasks:
- [x] 5A.1 — Add `booking_id: evoucher.booking_id || evoucher.bookingId || evoucher.project_number` to the auto-created billing item in `postToLedger()` handler
- [x] 5A.2 — Verified: `AddRequestForPaymentPanel` sends `bookingId` in form data → e-voucher creation uses `...evoucherData` spread → field preserved on evoucher record → `postToLedger` can now access it via `evoucher.bookingId`

### Files:
- `/supabase/functions/server/accounting-handlers.tsx` — edited (added `booking_id` field + enhanced log message)

---

## Phase 5B — Rewrite `useContractBillings` as Booking Aggregator

**Status:** DONE (2026-02-25)

**Problem:** Currently filters by `contract_id`. Needs to filter by `booking_id ∈ linkedBookingIds` instead, matching the same pattern used by `useProjectFinancials`.

### Tasks:
- [x] 5B.1 — Changed signature: `useContractBillings(linkedBookingIds: string[])` — accepts array of booking IDs, uses `JSON.stringify` for stable memoization key
- [x] 5B.2 — Filter billing items where `booking_id` OR `project_number` OR `source_booking_id` matches any linked booking ID (3-way match)
- [x] 5B.3 — Added `groupedByBooking` output: `BookingBillingSummary[]` with `bookingId`, `items`, `totalAmount`, `unbilledAmount` per booking — uses `useMemo` for performance
- [x] 5B.4 — Updated `ContractDetailView.tsx` call site: derives `linkedBookingIds` from `linkedBookings.map(b => b.bookingId || b.id).filter(Boolean)` and passes to hook

### Files:
- `/hooks/useContractBillings.ts` — rewritten (new signature, booking-based filtering, groupedByBooking output)
- `/components/pricing/ContractDetailView.tsx` — updated call site (line ~93–94)

---

## Phase 5C — Contract Billings Tab: Read-Only Aggregate

**Status:** DONE (2026-02-25)

**Problem:** Currently renders a full editable `UnifiedBillingsTab` with `RateCardGeneratorPopover`. Should become read-only with a drill-down to booking-level editing.

### Tasks:
- [x] 5C.1 — Set `readOnly={true}` on the `UnifiedBillingsTab` in `renderBillingsTab()`
- [x] 5C.2 — Removed `RateCardGeneratorPopover` from `extraActions` (moves to booking level in 5D)
- [x] 5C.3 — Removed `generatedItems` state, `allBillingItems` merge logic, and the `generatedItems` cleanup `useEffect` from `ContractDetailView`
- [x] 5C.4 — Updated `subtitle` to indicate read-only aggregate: "Read-only aggregate across N linked bookings — CTR-XXX · Customer"
- [x] 5C.5 — Items passed directly from `contractBillingsData.billingItems` (no merge); tab count updated accordingly

### Files:
- `/components/pricing/ContractDetailView.tsx` — edited (simplified billings tab, removed merge state/effect)

### Notes:
> `RateCardGeneratorPopover` import and `BillingItem` type import are still present as dead imports — will be cleaned in 5E.
> Dead state vars (`showRatePreview`, `ratePreviewBooking`, `generatingBillingFor`) also still present — cleaned in 5E.

---

## Phase 5D — Booking Billings: Add Rate Card Generation for Contract Bookings

**Status:** DONE (2026-02-25)

**Problem:** Contract bookings need a way to generate rate-card billing items from their parent contract's rate matrices, directly from the booking's own Billings tab.

### Tasks:
- [x] 5D.1 — Created `useBookingRateCard` hook at `/hooks/useBookingRateCard.ts` — accepts `contract_id`, fetches parent contract quotation, extracts `rate_matrices`, `contractNumber`, `customerName`, `currency`
- [x] 5D.2 — Created `BookingRateCardButton` component at `/components/contracts/BookingRateCardButton.tsx` — self-contained single-booking generator. On click: derives quantities from booking, runs rate engine, batch-saves items via API, triggers refresh. Shows "Rate card applied" badge if already generated. Only renders for contract bookings with rate matrices.
- [x] 5D.3 — Wired into all 5 booking detail views via `extraActions` prop on `UnifiedBillingsTab`:
  - `BrokerageBookingDetails.tsx` — serviceType="Brokerage"
  - `TruckingBookingDetails.tsx` — serviceType="Trucking"
  - `MarineInsuranceBookingDetails.tsx` — serviceType="Marine Insurance"
  - `OthersBookingDetails.tsx` — serviceType="Others"
  - `ForwardingBookingDetails.tsx` — serviceType="Forwarding"
- [x] 5D.4 — Generated items saved with `booking_id` via `rateCardToBilling.ts` + batch API → auto-appear in contract aggregate view

### Files:
- `/hooks/useBookingRateCard.ts` — created
- `/components/contracts/BookingRateCardButton.tsx` — created
- `/components/operations/BrokerageBookingDetails.tsx` — import + `extraActions` wiring
- `/components/operations/TruckingBookingDetails.tsx` — import + `extraActions` wiring
- `/components/operations/MarineInsuranceBookingDetails.tsx` — import + `extraActions` wiring
- `/components/operations/OthersBookingDetails.tsx` — import + `extraActions` wiring
- `/components/operations/forwarding/ForwardingBookingDetails.tsx` — import + `extraActions` wiring

### Design Decision:
> Chose "generate and save immediately" pattern (not inject-as-unsaved-state) for simplicity.
> The button batch-saves items via the existing `/accounting/billings/batch` endpoint, then
> calls `onRefresh()` to reload. Items are editable afterward in the standard billings UI.
> This matches the "post first, edit later" pattern used by billable expenses.

---

## Phase 5E — Final Cleanup

**Status:** DONE (2026-02-25)

### Tasks:
- [x] 5E.1 — Deleted `ContractRatePreviewModal.tsx`
- [x] 5E.2 — Removed dead imports from `ContractDetailView`: `BillingItem` type, `RateCardGeneratorPopover`, unused lucide icons (`XCircle`, `DollarSign`, `Receipt`, `CheckCircle`, `AlertTriangle`)
- [x] 5E.3 — Old server-side `generate-billing` endpoint still exists in `index.tsx` (line ~10425) but is dead code — no frontend callers remain. Left in place (harmless, can be deleted in a future server cleanup pass). `contractBillingAutomation.ts` also dead — not imported anywhere.
- [x] 5E.4 — Removed dead state vars: `showRatePreview`, `ratePreviewBooking`, `generatingBillingFor`
- [x] 5E.5 — Removed `handleGenerateBilling` function, "Billed" column, and "Generate Billing" button from Bookings tab. Table simplified to 4 columns (Booking ID, Service, Date, Status).
- [x] 5E.6 — Blueprint status updated to COMPLETE

### Files:
- `/components/contracts/ContractRatePreviewModal.tsx` — DELETED
- `/components/pricing/ContractDetailView.tsx` — cleanup edits (dead imports, state, function, table columns)

### Post-5E Minor Cleanups (2026-02-25):
- [x] Deleted `/utils/contractBillingAutomation.ts` (dead utility, 0 importers)
- [x] Commented out the `POST /contracts/:contractId/generate-billing` endpoint + 3 server-side helper functions (~200 lines) in `index.tsx` — wrapped in block comment with tombstone note

---

## Phase 6 — Role-Based Visibility (Future, Deferred)

**Status:** NOT STARTED (deferred until RBAC system is implemented)

### Tasks:
- [ ] 6.1 — Add `userRole` / department check
- [ ] 6.2 — Hide Billings tab from Operations users in all 5 booking detail views
- [ ] 6.3 — Hide Contract Billings tab from Operations users
- [ ] 6.4 — Operations continues to see Expenses tab and log billable expenses — those auto-create billing items that only Accounting sees

### Notes:
> This phase is deferred. For now, all users can see the Billings tab.
> When RBAC is implemented, this is a simple conditional render based on `currentUser.department`.

---

## Files Changed (Running Log)

| Phase | File | Action |
|-------|------|--------|
| 1 | `/docs/blueprints/CONTRACT_BILLINGS_REWORK_BLUEPRINT.md` | Created |
| 1 | `/hooks/useContractBillings.ts` | Create |
| 1 | `/utils/rateCardToBilling.ts` | Create |
| 2 | `/components/pricing/ContractDetailView.tsx` | Heavy edit (Billings tab rework) |
| 3 | `/components/contracts/RateCardGeneratorPopover.tsx` | Create |
| 3 | `/components/shared/billings/UnifiedBillingsTab.tsx` | Added `extraActions`, `title`, `subtitle` props |
| 3 | `/components/pricing/ContractDetailView.tsx` | Wired popover, `generatedItems` state, `allBillingItems` merge |
| ~~4~~ | ~~`/components/contracts/ContractRatePreviewModal.tsx`~~ | ~~Delete~~ (moved to 5E) |
| 5A | `/supabase/functions/server/accounting-handlers.tsx` | Add `booking_id` to auto-created billing item |
| 5B | `/hooks/useContractBillings.ts` | Rewrite (filter by booking IDs instead of contract_id) |
| 5B | `/components/pricing/ContractDetailView.tsx` | Update hook call site |
| 5C | `/components/pricing/ContractDetailView.tsx` | Make billings tab read-only, remove popover/merge logic |
| 5D | `/hooks/useBookingRateCard.ts` | Create (fetch parent contract rate matrices) |
| 5D | `/components/contracts/BookingRateCardButton.tsx` | Create (single-booking rate card generator) |
| 5D | `/components/operations/*BookingDetails.tsx` (×5) | Wire `extraActions` for contract bookings |
| 5E | `/components/contracts/ContractRatePreviewModal.tsx` | Delete |
| 5E | `/components/pricing/ContractDetailView.tsx` | Remove dead state, imports, legacy button |

---

## Dependencies

- `/components/shared/billings/UnifiedBillingsTab.tsx` — the target reusable component (has `extraActions`, `title`, `subtitle`, `readOnly` props)
- `/utils/contractRateEngine.ts` — existing rate engine (read-only, no changes)
- `/utils/contractQuantityExtractor.ts` — existing quantity deriver (read-only, no changes)
- `/hooks/useProjectFinancials.ts` — reference for booking-level data fetching pattern (read-only)
- `/supabase/functions/server/accounting-handlers.tsx` — billable expense → billing item auto-creation (edit in 5A)
- `POST /accounting/billings/batch` — existing batch save endpoint (no changes)