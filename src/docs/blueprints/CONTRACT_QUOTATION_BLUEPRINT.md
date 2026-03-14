# Contract Quotation System Blueprint

> **Living Document** - Updated after every implementation phase.
> Last Updated: 2026-02-18
> Current Phase: **ALL PHASES COMPLETE**

---

## Overview

Neuron OS currently supports a linear per-shipment flow:

```
Inquiry -> Quotation -> Project -> Bookings -> Billings
```

This blueprint introduces **Contract Quotations** — annual rate agreements that enable a parallel workflow for contractual clients:

```
Contract Quotation (once/year, by BD/Pricing)
       |
Operations receives shipments directly from client
       |
Booking created (auto-linked to contract)
       |
Accounting bills using contract's agreed rates
```

**Naming Convention:** Quotation types are `"project"` (per-shipment, converts to a project) and `"contract"` (annual rate table).

---

## Architecture

### Core Principle: Project and Contract Are Siblings

Both are "work containers" that connect commercial terms to operations to accounting:

| Concept | Project (Per-Shipment) | Contract (Annual) |
|---|---|---|
| **Commercial Agreement** | Quotation | Contract Quotation |
| **Work Container** | Project | Contract itself |
| **Operational Unit** | Booking (created from Project) | Booking (created by Ops, auto-linked) |
| **Financial Basis** | Quotation selling price | Contract rate matrix |
| **Billing Trigger** | Manual / from quotation items | Auto-calculated on booking completion |
| **Who Creates Bookings** | BD/Pricing/Accounting (via Projects) | Operations (directly) |
| **Lifecycle** | One-time per shipment | Year-long, many bookings |

### Rate Matrix Structure (NOT Line Items)

Contract rates are a **matrix**, not a flat list. Example for Brokerage:

```
              | FCL     | LCL / AIR | Remarks
--------------+---------+-----------+------------------------------
Container     | P4,500  | P3,500    | P1,800 per succeeding container
Clearance     | P1,500  | P1,200    | per container
Documentation | P500    | P500      | per shipment
Stamps        | P200    | P200      | per container
```

A full contract has one rate matrix **per service type** the client uses.

### Key Data Types

```typescript
// On QuotationNew (discriminator)
quotation_type: "project" | "contract";

// Contract-specific fields
contract_validity_start?: string;
contract_validity_end?: string;
contract_status?: "Draft" | "Sent" | "Active" | "Expiring" | "Expired" | "Renewed";
rate_matrices?: ContractRateMatrix[];
renewed_from_id?: string;

// Rate Matrix
interface ContractRateMatrix {
  id: string;
  service_type: ServiceType;
  columns: string[];              // ["FCL", "LCL / AIR"]
  rows: ContractRateRow[];
}

interface ContractRateRow {
  id: string;
  particular: string;             // "Container", "Clearance"
  rates: Record<string, number>;  // { "FCL": 4500, "LCL / AIR": 3500 }
  unit: string;                   // "per_container", "per_shipment"
  succeeding_rule?: {
    rate: number;                  // 1800
    after_qty: number;             // 1
  };
  remarks?: string;
}

// On Bookings (contract reference)
contract_id?: string;
contract_applied_rates?: AppliedRate[];

interface AppliedRate {
  particular: string;
  rate: number;
  quantity: number;
  subtotal: number;
  rule_applied?: string;          // Human-readable: "1 x P4,500 + 17 x P1,800"
}
```

---

## Phased Implementation Plan

### Phase 1: Foundation (Types & Rate Matrix Component)
**Status:** COMPLETE
**Scope:** Type definitions + standalone Rate Matrix UI component

**Tasks:**
- [x] 1.1 Add contract types to `/types/pricing.ts`
  - `ContractRateMatrix`, `ContractRateRow`, `AppliedRate` interfaces
  - Added `quotation_type`, `contract_validity_start`, `contract_validity_end`, `contract_status`, `rate_matrices`, `renewed_from_id` to `QuotationNew`
  - Added `ContractQuotationStatus` and `QuotationType` types
- [x] 1.2 Add `contract_id` and `contract_applied_rates` to all booking types in `/types/operations.ts`
  - `ForwardingBooking`, `BrokerageBooking`, `TruckingBooking`, `MarineInsuranceBooking`, `OthersBooking`
- [x] 1.3 Build `ContractRateMatrixEditor` component at `/components/pricing/quotations/ContractRateMatrixEditor.tsx`
  - Editable table: rows = particulars, columns = configurable modes (FCL, LCL/AIR, etc.)
  - Per-row unit selector (per container, per shipment, per BL, per set)
  - Succeeding rule editor (optional per row, with inline expand)
  - Remarks column
  - Add/remove rows and columns (with double-click rename on column headers)
  - Read-only `viewMode` prop support
  - Neuron design system styling (stroke borders, no shadows, #12332B/#0F766E palette)
  - `createEmptyMatrix()` factory function with service-specific default columns

**Files Created:**
- `/components/pricing/quotations/ContractRateMatrixEditor.tsx`

**Files Modified:**
- `/types/pricing.ts`
- `/types/operations.ts`

**Verification:** Component renders standalone with mock data, all row/column CRUD works.

---

### Phase 2: Contract Mode in QuotationBuilderV3
**Status:** COMPLETE
**Scope:** QuotationBuilderV3 supports creating/editing contract quotations

**Tasks:**
- [x] 2.1 Add `quotation_type` toggle to `GeneralDetailsSection.tsx`
  - Segmented toggle: "Project" | "Contract" (only in create mode, locked in edit mode)
  - When "Contract": show validity date range fields (start + end), hide `validity` (single-use field)
  - Contract name label, Movement hidden in contract mode
  - Pass `quotationType` up to parent via new prop
- [x] 2.2 Modify `QuotationBuilderV3.tsx` conditional rendering
  - New state: `quotationType: "project" | "contract"` + `isContractMode` derived
  - Contract mode hides: service forms, VendorsSection, BuyingPriceSection, SellingPriceSection, FinancialSummaryPanel
  - Contract mode shows: ContractRateMatrixEditor for each selected service
  - Auto-manages rate matrices when services are toggled
- [x] 2.3 Contract-specific save logic
  - CQ prefix for contract quote numbers (regenerated on type toggle)
  - Save `rate_matrices`, `contract_validity_start/end`, `contract_status`
  - Validates: customer, services, validity dates, at least one rate row
- [x] 2.4 Contract-specific header & button labels
  - Title: "Create Contract Quotation" / "Edit Contract Quotation"
  - Submit button: "Submit Contract for Approval"
  - Save as Draft works the same

**Files Modified:**
- `/components/pricing/quotations/QuotationBuilderV3.tsx`
- `/components/pricing/quotations/GeneralDetailsSection.tsx`

**Verification:** Can create a contract quotation with rate matrices, save to backend, load in edit mode.

---

### Phase 3: List, Filtering & Contract Detail View
**Status:** COMPLETE
**Scope:** Contracts visible in quotation lists + dedicated detail view

**Tasks:**
- [x] 3.1 Add type filter to `QuotationsListWithFilters.tsx`
  - Segmented pill filter: "All" | "Project" | "Contract" (right-aligned in filter row)
  - CONTRACT badge on contract rows (9px uppercase, #12332B on #E8F2EE)
  - Contracts show validity period instead of grand total in TOTAL column
  - Contract-specific status colors (Active=green, Sent=blue, Expiring=amber, Expired=gray, Renewed=purple)
  - Type filter integrated into filteredQuotations useMemo
- [x] 3.2 Add type filter to `PricingQuotations.tsx`
  - CONTRACT badge on Number column for contract rows
  - Contracts show validity period instead of total in TOTAL column
  - Contract-specific status colors in status column (uses contract_status)
- [x] 3.3 Build `ContractDetailView.tsx` at `/components/pricing/ContractDetailView.tsx`
  - Header: Contract number/name, customer, validity period with days-remaining, status badge, CONTRACT badge
  - Meta row: Customer, Validity Period, Services (with icons), Credit Terms
  - Tabbed layout:
    - **Rate Card** tab: Read-only rate matrices per service (ContractRateMatrixEditor viewMode)
    - **Bookings** tab: Linked bookings table (fetched via contract_id), empty state with ops messaging
    - **Billings** tab: Placeholder for Phase 5 billing automation
    - **Activity** tab: Timeline with contract creation and status changes
  - Action buttons: Back, Edit Contract
- [x] 3.4 Wire routing in `Pricing.tsx`
  - Import ContractDetailView
  - When quotation_type === "contract", render ContractDetailView instead of QuotationDetail
  - Edit action opens QuotationBuilderV3 in contract mode (existing handleEditQuotation flow)
- [x] 3.5 Backend: contract_id filter on `/bookings` endpoint
  - Added `contract_id` query parameter to existing GET /bookings endpoint
  - When contract_id specified, searches across all booking type prefixes (booking:, forwarding_booking:, trucking_booking:, brokerage_booking:, marine_insurance_booking:, others_booking:)
  - Filters results to only bookings with matching contract_id

**Files Created:**
- `/components/pricing/ContractDetailView.tsx`

**Files Modified:**
- `/components/pricing/QuotationsListWithFilters.tsx`
- `/components/pricing/PricingQuotations.tsx`
- `/components/Pricing.tsx` (routing logic)
- `/supabase/functions/server/index.tsx` (contract_id filter)

**Verification:** Contracts appear in list with correct badges/filters, detail view opens with rate card.

---

### Phase 4: Operations Integration (Smart Contract Detection)
**Status:** COMPLETE
**Scope:** Operations booking panels detect and link to active contracts

**Tasks:**
- [x] 4.1 Backend: API to check for active contracts by customer
  - `GET /contracts/active?customer_name=:name` returns active contract(s) for the customer
  - Returns: contract ID, number, validity, services covered (slim payload, no rate matrices)
  - Filters: quotation_type=contract, not expired/cancelled, within validity period
- [x] 4.2 Create `ContractDetectionBanner` component at `/components/operations/shared/ContractDetectionBanner.tsx`
  - Subtle info banner shown when active contract is detected
  - Shows: contract number, quotation name, validity period, services covered (with highlighting for matching service)
  - Debounced detection (600ms after user stops typing, min 3 chars)
  - Loading spinner state, auto-select first matching contract
  - Multi-contract support with radio selection (when customer has multiple contracts)
  - Styled with Neuron teal (#0F766E) accent, non-intrusive
- [x] 4.3 Modify booking creation panels to detect contracts
  - `CreateBrokerageBookingPanel.tsx`: ContractDetectionBanner below customer name, serviceType="Brokerage"
  - `CreateForwardingBookingPanel.tsx`: Same, serviceType="Forwarding"
  - `CreateTruckingBookingPanel.tsx`: Same, serviceType="Trucking"
  - `CreateMarineInsuranceBookingPanel.tsx`: Same, serviceType="Marine Insurance"
  - `CreateOthersBookingPanel.tsx`: Same, serviceType="Others"
  - Each panel has `detectedContractId` state, banner auto-sets via callback
- [x] 4.4 Backend: Save `contract_id` on booking creation
  - All 5 booking POST submissions include `contract_id` when detected
  - Brokerage, Forwarding, Trucking, Marine Insurance, Others all pass contract_id in JSON body
  - Backend already stores all submitted fields in KV — no server-side changes needed

**Files Created:**
- `/components/operations/shared/ContractDetectionBanner.tsx`

**Files Modified:**
- `/components/operations/CreateBrokerageBookingPanel.tsx`
- `/components/operations/forwarding/CreateForwardingBookingPanel.tsx`
- `/components/operations/CreateTruckingBookingPanel.tsx`
- `/components/operations/CreateMarineInsuranceBookingPanel.tsx`
- `/components/operations/CreateOthersBookingPanel.tsx`
- `/supabase/functions/server/index.tsx` (new endpoint + booking updates)

**Verification:** Creating a booking for a contract customer shows the banner, booking is saved with contract_id.

---

### Phase 5: Billing Automation & Contract Lifecycle
**Status:** COMPLETE
**Scope:** Auto-calculate billing from contract rates + lifecycle management

**Tasks:**
- [x] 5.1 Build Rate Instantiation Engine at `/utils/contractRateEngine.ts`
  - Input: ContractRateMatrix, service_type, mode (FCL/LCL/AIR), quantities (containers, shipment count)
  - Output: AppliedRate[] with calculated amounts
  - Handles: succeeding rules (base qty at rate A, remainder at rate B)
  - Handles: unit-based multiplication (per_container, per_shipment, per_bl, per_set)
  - Includes resolveModeColumn() for fuzzy mode matching (e.g. "LCL" → "LCL / AIR")
  - Includes calculateContractBilling() convenience wrapper
- [x] 5.2 Auto-generate draft billing when contract booking is completed
  - Backend: `POST /contracts/:contractId/generate-billing` accepts booking_id, service_type, mode, quantities
  - Server-side inline rate engine mirrors frontend logic (runs in Deno)
  - Fetches contract rate matrix, resolves mode column, calculates applied rates
  - Creates one evoucher per rate line with `source_type: "contract_rate"`, `source: "contract"`
  - Deduplication: 409 if billing already exists for same booking+contract
  - Updates booking record with `contract_applied_rates`, `contract_billing_total`
  - Backend: `GET /contracts/:contractId/billings` returns billings + summary stats
- [x] 5.3 Contract billing review in Contract Detail View
  - Billings tab replaced placeholder with live data fetched from backend
  - Summary cards: Total Billed, Outstanding, Collected, Draft Lines
  - Billings table with: Billing ID, Particular, Calculation (rule_applied), Amount, Booking, Status
  - Bookings tab enhanced with "Generate Billing" action button per row
  - Billed status shown with green checkmark, unbilled rows show action button
  - Billings count badge on tab header
- [x] 5.4 Contract lifecycle management
  - Expiry detection: `GET /contracts/active` auto-flags Active → Expiring when ≤30 days remain (persisted)
  - Renewal flow: `POST /contracts/:contractId/renew` creates new contract from existing
    - Copies all rate matrices, customer info, services
    - Sets `renewed_from_id` linking new → old
    - Marks old contract as "Renewed"
  - Renewal UI: "Renew Contract" button in ContractDetailView header (Active/Expiring/Expired only)
  - Renewal modal with start/end date pickers, confirmation, toast feedback
- [x] 5.5 Customer detail: Active Contracts section
  - New "Contracts" tab in CustomerDetail.tsx (both BD and Pricing variants)
  - Backend: `GET /contracts/by-customer/:customerName` returns all contracts for customer
  - Contract cards with: name, quote number, status badge, CONTRACT type badge, validity dates, services pills, rate matrix count

**Files Created:**
- `/utils/contractRateEngine.ts` (manually by user)

**Files Modified:**
- `/components/pricing/ContractDetailView.tsx` (billings tab, generate billing, renewal modal)
- `/components/bd/CustomerDetail.tsx` (contracts tab, fetch, render)
- `/supabase/functions/server/index.tsx` (billing generation, billings fetch, renewal, customer contracts, expiry detection)

**Verification:** Opening Bookings tab → "Generate Billing" → Billings tab shows summary + line items. Renewal creates new contract. Customer detail shows contracts.

---

## Key Design Decisions

### 1. Why "Project" not "Spot"
"Project" directly reflects the system's own workflow — these quotations convert to Projects. It uses language already familiar to users inside Neuron OS, rather than commodity-trading jargon like "Spot."

### 2. Why Contract is a QuotationNew subtype, not a separate entity
- Reuses existing KV store keys (`quotation:*`) without migration
- Shares customer linking, service selection, status management
- QuotationBuilderV3 already handles multiple modes (`builderMode: "inquiry" | "quotation"`)
- The `quotation_type` discriminator cleanly separates behavior

### 3. Why rate matrices instead of line items
The client's real-world contract is a matrix (Particular x Mode). Forcing it into line items would:
- Require duplicate entries per mode variant
- Lose the inherent relationship between FCL and LCL rates for the same particular
- Make the UI look nothing like the document the client actually signs

### 4. Why no Project for contractual bookings
- Operations doesn't have access to Projects
- A Project is a per-shipment work container — it doesn't map to an annual agreement
- The Contract itself IS the financial container (holds bookings, billings, collections)
- Inserting a Project would be a workaround, not an intentional design

### 5. Why Operations workflow barely changes
- Operators process shipments regardless of commercial arrangement
- They select a customer and create a booking — that's it
- The system handles contract detection and rate application behind the scenes
- This keeps the UX clean and role-appropriate

---

## File Map (Quick Reference)

| Purpose | File |
|---|---|
| Contract types | `/types/pricing.ts` |
| Booking contract fields | `/types/operations.ts` |
| Rate Matrix UI | `/components/pricing/quotations/ContractRateMatrixEditor.tsx` |
| Builder (contract mode) | `/components/pricing/quotations/QuotationBuilderV3.tsx` |
| General Details (toggle) | `/components/pricing/quotations/GeneralDetailsSection.tsx` |
| Contract Detail View | `/components/pricing/ContractDetailView.tsx` |
| Contract Detection Banner | `/components/operations/shared/ContractDetectionBanner.tsx` |
| Rate Instantiation Engine | `/utils/contractRateEngine.ts` |
| Quotation List Filters | `/components/pricing/QuotationsListWithFilters.tsx` |
| Pricing List Filters | `/components/pricing/PricingQuotations.tsx` |
| Pricing Router | `/components/pricing/Pricing.tsx` (was `/components/Pricing.tsx`) |
| Server API | `/supabase/functions/server/index.tsx` |
| Blueprint (this file) | `/docs/blueprints/CONTRACT_QUOTATION_BLUEPRINT.md` |

---

## Progress Log

| Date | Phase | Action | Notes |
|---|---|---|---|
| 2026-02-18 | Planning | Blueprint created | All 5 phases planned, ready for Phase 1 |
| 2026-02-18 | Phase 1 | COMPLETE | Types added to pricing.ts & operations.ts, ContractRateMatrixEditor built |
| 2026-02-18 | Phase 2 | COMPLETE | Contract mode in QuotationBuilderV3 + GeneralDetailsSection toggle/validity |
| 2026-02-18 | Phase 3 | COMPLETE | All 5 tasks done: Both list views, ContractDetailView, Pricing.tsx routing, backend endpoint |
| 2026-02-18 | Phase 4 | COMPLETE | All 4 tasks done: Backend active contract API, ContractDetectionBanner, 5 booking panels integrated, contract_id in submissions |
| 2026-02-18 | Phase 5 | COMPLETE | All 5 tasks done: Rate engine (manual), billing generation endpoint, ContractDetailView billings tab + generate billing, lifecycle (expiry detection + renewal), CustomerDetail contracts tab |