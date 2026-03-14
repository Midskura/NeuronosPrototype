# Consignee Entity Feature Blueprint

**Created:** 2026-03-05
**Status:** COMPLETE
**Goal:** Promote "Consignee" from a dumb text field to a lightweight sub-entity of Customer, enabling reusable consignee directories, smart autocomplete on bookings, and a "Bill To" override on invoices so the team can bill consignees directly (e.g., bill Tomoro instead of Hiland).

---

## Problem

Today, the Consignee field on bookings is a plain free-text string. There is:
- No saved directory of consignees per customer
- No autocomplete or reuse across bookings
- No way to bill a consignee directly — invoices always bill the Customer
- No TIN/address associated with consignees for proper invoice generation

The operations team manually types consignee names every time and works around billing limitations by overriding name fields by hand.

## Real-World Use Case (from the team)

> "Client: Hiland. Consignee: Tomoro. Sometimes we bill the consignee, so the name on the bill is Tomoro."

The project/financials stay under Hiland, but the printed invoice's "Bill To" section should show Tomoro's name, address, and TIN.

---

## Phases

### Phase 0: Data Foundation (Types + Backend Routes)
**Status:** COMPLETE (2026-03-05)

**Type changes:**
1. `types/bd.ts` — Add `Consignee` interface
2. `types/operations.ts` — Add optional `consignee_id?: string` to `BrokerageBooking`, `ForwardingBooking`, `TruckingBooking`

**Backend routes** (in `server/index.tsx`, after customer routes):
- `GET /consignees` — list all, optional `?customer_id=xxx` filter
- `GET /consignees/:id` — get single
- `POST /consignees` — create
- `PATCH /consignees/:id` — update
- `DELETE /consignees/:id` — delete

**New KV prefix:** `consignee:{id}`

**Files:**
| File | Action |
|------|--------|
| `/types/bd.ts` | MODIFY — add Consignee interface |
| `/types/operations.ts` | MODIFY — add consignee_id to 3 booking types |
| `/supabase/functions/server/index.tsx` | MODIFY — add 5 CRUD routes (re-read first!) |

**Implementation Log:**
- Added `Consignee` interface to `types/bd.ts`
- Added `consignee_id?: string` to `ForwardingBooking`, `BrokerageBooking`, `TruckingBooking` in `types/operations.ts`
- Added 5 CRUD routes (GET list, GET single, POST, PATCH, DELETE) to `server/index.tsx` in a new `CONSIGNEES API` section, placed between Customers and Contacts sections
- KV prefix: `consignee:{id}`, ID format: `CSG-{timestamp}`
- Validation: POST requires `customer_id` and `name`
- PATCH protects `id`, `customer_id`, and `created_at` from being overwritten

---

### Phase 1: Customer Module — Consignee Directory Tab
**Status:** COMPLETE (2026-03-05) — REDESIGNED (session 3: moved from dedicated tab to inline section in left detail card)

Add a "Consignees" tab to CustomerDetail showing a table of saved consignees for that customer, with Add/Edit/Delete.

**New files:**
| File | Action |
|------|--------|
| `/hooks/useConsignees.ts` | CREATE — hook to fetch/create/update/delete consignees by customer_id |
| `/components/bd/ConsigneesTab.tsx` | ~~CREATE — table + inline add/edit panel~~ DEPRECATED — replaced by ConsigneeInlineSection |
| `/components/bd/ConsigneeInlineSection.tsx` | CREATE — compact chip-list + inline expand/add/edit in left detail card |

**Modified files:**
| File | Action |
|------|--------|
| `/components/bd/CustomerDetail.tsx` | MODIFY — ~~add "Consignees" to tab bar and render ConsigneesTab~~ removed tab, added inline section in left card |

**Implementation Log:**
- Created `/hooks/useConsignees.ts` — full CRUD hook with `fetchConsignees`, `createConsignee`, `updateConsignee`, `deleteConsignee`
- ~~Created `/components/bd/ConsigneesTab.tsx` — table + inline add/edit form, Neuron design system styling, empty state, loading state~~
- Created `/components/bd/ConsigneeInlineSection.tsx` — compact chip-list with expand-on-click details, inline add/edit form, minimal footprint (~50px collapsed)
- Modified `/components/bd/CustomerDetail.tsx` — removed "consignees" from tab bar, removed ConsigneesTab rendering, added `<ConsigneeInlineSection>` in left detail card after Notes section (bd variant only)
- UX rationale: consignees are identity-level metadata (not a workflow) → belong in the identity card, not as a separate tab. Reduces tab bar from 9 to 8 items.

---

### Phase 2: Booking Creation — Consignee Picker Combo-Box
**Status:** COMPLETE (2026-03-05)

Replace the free-text Consignee input on booking creation panels with a searchable combo-box that:
- Shows saved consignees for the selected customer
- Allows free-text fallback (no consignee_id, just text)
- Sets both `consignee_id` and text `consignee` field on selection

**New files:**
| File | Action |
|------|--------|
| `/components/shared/ConsigneePicker.tsx` | CREATE — shared combo-box component |

**Modified files:**
| File | Action |
|------|--------|
| `/components/operations/CreateBrokerageBookingPanel.tsx` | MODIFY — replace text input with ConsigneePicker |
| `/components/operations/forwarding/CreateForwardingBookingPanel.tsx` | MODIFY — replace text input with ConsigneePicker |
| `/components/operations/CreateTruckingBookingPanel.tsx` | MODIFY — replace text input with ConsigneePicker |

**Implementation Log:**
- Created `/hooks/useConsignees.ts` — full CRUD hook with `fetchConsignees`, `createConsignee`, `updateConsignee`, `deleteConsignee`
- Created `/components/bd/ConsigneesTab.tsx` — table + inline add/edit form, Neuron design system styling, empty state, loading state
- Modified `/components/bd/CustomerDetail.tsx` — added "consignees" to tab type union, added tab button after Contracts, renders `<ConsigneesTab customerId={customer.id} />` in tab content area
- ConsigneePicker.tsx already existed from session 1
- Brokerage panel already integrated from session 1
- Integrated ConsigneePicker into Forwarding panel: added import, `consigneeId` state, replaced text input, added `consignee_id` to submit payload
- Integrated ConsigneePicker into Trucking panel: added import, `consignee_id` to formData, replaced text input
- All 3 booking panels now use the shared ConsigneePicker combo-box with free-text fallback

---

### Phase 3: Booking Details — Consignee Entity Display
**Status:** COMPLETE (2026-03-05)

In booking detail views, if `consignee_id` exists, show consignee as a linked entity with address/TIN. Otherwise show plain text (backward compat).

**Modified files:**
| File | Action |
|------|--------|
| `/components/operations/BrokerageBookingDetails.tsx` | MODIFY — conditional consignee display |
| `/components/operations/forwarding/ForwardingBookingDetails.tsx` | MODIFY — conditional consignee display |
| `/components/operations/TruckingBookingDetails.tsx` | MODIFY — conditional consignee display |

**Implementation Log:**
- Created `/components/shared/ConsigneeInfoBadge.tsx` — small enrichment component that fetches a consignee by ID and shows a teal badge with TIN/address/contact person below the Consignee field in view mode
- Integrated into `BrokerageBookingDetails.tsx` — import + badge below Consignee EditableField (only in view mode, only when `consignee_id` exists)
- Integrated into `ForwardingBookingDetails.tsx` — same pattern
- Integrated into `TruckingBookingDetails.tsx` — same pattern
- Old bookings without `consignee_id` are unaffected (badge renders nothing when no ID)

### UX Refinement — Edit/View Mode Split (2026-03-06)
- Added `isEditing` prop to `ConsigneeInlineSection` — controls view vs edit mode rendering
- **View mode** (`isEditing=false`): read-only list of consignee names with User icon, or "None" if empty; no interactivity
- **Edit mode** (`isEditing=true`): bordered container matching other input fields, hover edit/delete actions, ghost "Add consignee..." row, inline inputs with confirm/cancel
- Edit mode header uses plain uppercase label (matching other edit fields like Notes, Status, Lead Source); view mode keeps icon+label header
- `useEffect` auto-resets add/edit state when leaving edit mode
- Modified `CustomerDetail.tsx` — passes `isEditing={false}` in view block, `isEditing={true}` in edit block (before Save/Cancel buttons)

### Customer Detail Save Fix (2026-03-06)
- `handleSave` now persists to backend via `PUT /customers/:id` endpoint (was previously a no-op)
- Introduced `localCustomer` state — initialized from `customer` prop, updated on save, used by view mode for display
- `handleCancel` reverts `editedCustomer` to `localCustomer` (not stale prop)
- Save button shows "Saving..." loading state, Cancel disabled during save
- All editable fields in view mode (name, status, client_type, industry, registered_address, lead_source, notes) now read from `localCustomer` so changes reflect immediately after save

---

### Phase 4: Invoice Builder — "Bill To" Override
**Status:** COMPLETE (2026-03-05)

Add a "Bill To" selector in InvoiceBuilder: Customer (default) vs Consignee. When consignee is selected, override the Bill To name/address/TIN on the invoice payload.

**Modified files:**
| File | Action |
|------|--------|
| `/components/projects/invoices/InvoiceBuilder.tsx` | MODIFY — add Bill To selector, consignee dropdown, override logic |
| `/components/projects/invoices/InvoiceDocument.tsx` | VERIFY — should work if overridden at creation time |

**Invoice payload additions:**
- `billed_to_type: "customer" | "consignee"`
- `billed_to_consignee_id?: string`

**Implementation Log:**
- Added `useConsignees` import and `Consignee` type to InvoiceBuilder
- Added state: `billedToType` ("customer" | "consignee"), `billedToConsigneeId`, fetches consignees via `useConsignees(project.customer_id)`
- Added `handleBillToChange` and `handleBillToConsigneeSelect` handlers — switching to consignee auto-fills address/TIN from the selected consignee entity
- Added "Bill To" toggle UI in the "Shipment & Legal" section with Customer/Consignee pill buttons and a consignee dropdown selector
- Updated both `draftInvoice` memo and submit payload to override `customer_name` with consignee name when `billedToType === "consignee"`
- Added `billed_to_type` and `billed_to_consignee_id` to invoice payload for traceability
- Consignee button is disabled with helper text when no consignees exist for the customer

---

## Consignee Data Shape

```typescript
export interface Consignee {
  id: string;                    // "CSG-{timestamp}"
  customer_id: string;           // Parent customer (required)
  name: string;                  // e.g., "Tomoro"
  address?: string;
  tin?: string;
  contact_person?: string;
  email?: string;
  phone?: string;
  created_at: string;
  updated_at: string;
}
```

## Key Design Decisions

1. **Additive only** — all new fields are optional. Zero breaking changes to existing data.
2. **Text field kept** — `consignee: string` on bookings is preserved for backward compatibility and display. `consignee_id` is a new optional companion field.
3. **Project ownership unchanged** — billing a consignee does NOT change project/financial ownership. The project stays under the Customer. Only the invoice's "Bill To" header changes.
4. **DRY** — `ConsigneePicker` is a single shared component used by all 3 booking creation panels.
5. **Combo-box pattern** — searchable dropdown with free-text fallback, consistent with existing `CustomerAutocomplete` / `CompanyAutocomplete` patterns in the codebase.

---

## Implementation Log

_(Updated after each phase completion)_

### Phase 0 — Completed 2026-03-05
- Added `Consignee` interface to `types/bd.ts`
- Added `consignee_id?: string` to `ForwardingBooking`, `BrokerageBooking`, `TruckingBooking` in `types/operations.ts`
- Added 5 CRUD routes (GET list, GET single, POST, PATCH, DELETE) to `server/index.tsx` in a new `CONSIGNEES API` section, placed between Customers and Contacts sections
- KV prefix: `consignee:{id}`, ID format: `CSG-{timestamp}`
- Validation: POST requires `customer_id` and `name`
- PATCH protects `id`, `customer_id`, and `created_at` from being overwritten

### Phase 1 — Completed 2026-03-05 (session 3)
- Created `/hooks/useConsignees.ts` — full CRUD hook with `fetchConsignees`, `createConsignee`, `updateConsignee`, `deleteConsignee`
- ~~Created `/components/bd/ConsigneesTab.tsx` — table + inline add/edit form, Neuron design system styling, empty state, loading state~~
- Created `/components/bd/ConsigneeInlineSection.tsx` — compact chip-list with expand-on-click details, inline add/edit form, minimal footprint (~50px collapsed)
- Modified `/components/bd/CustomerDetail.tsx` — removed "consignees" from tab bar, removed ConsigneesTab rendering, added `<ConsigneeInlineSection>` in left detail card after Notes section (bd variant only)
- UX rationale: consignees are identity-level metadata (not a workflow) → belong in the identity card, not as a separate tab. Reduces tab bar from 9 to 8 items.

### Phase 2 — Completed 2026-03-05 (session 2)
- ConsigneePicker.tsx already existed from session 1
- Brokerage panel already integrated from session 1
- Integrated ConsigneePicker into Forwarding panel: added import, `consigneeId` state, replaced text input, added `consignee_id` to submit payload
- Integrated ConsigneePicker into Trucking panel: added import, `consignee_id` to formData, replaced text input
- All 3 booking panels now use the shared ConsigneePicker combo-box with free-text fallback

### Phase 4 — Completed 2026-03-05 (session 2)
- Added `useConsignees` import and `Consignee` type to InvoiceBuilder
- Added state: `billedToType` ("customer" | "consignee"), `billedToConsigneeId`, fetches consignees via `useConsignees(project.customer_id)`
- Added `handleBillToChange` and `handleBillToConsigneeSelect` handlers — switching to consignee auto-fills address/TIN from the selected consignee entity
- Added "Bill To" toggle UI in the "Shipment & Legal" section with Customer/Consignee pill buttons and a consignee dropdown selector
- Updated both `draftInvoice` memo and submit payload to override `customer_name` with consignee name when `billedToType === "consignee"`
- Added `billed_to_type` and `billed_to_consignee_id` to invoice payload for traceability
- Consignee button is disabled with helper text when no consignees exist for the customer

### Phase 3 — Completed 2026-03-05 (session 3)
- Created `/components/shared/ConsigneeInfoBadge.tsx` — small enrichment component that fetches a consignee by ID and shows a teal badge with TIN/address/contact person below the Consignee field in view mode
- Integrated into `BrokerageBookingDetails.tsx` — import + badge below Consignee EditableField (only in view mode, only when `consignee_id` exists)
- Integrated into `ForwardingBookingDetails.tsx` — same pattern
- Integrated into `TruckingBookingDetails.tsx` — same pattern
- Old bookings without `consignee_id` are unaffected (badge renders nothing when no ID)