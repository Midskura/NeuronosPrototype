# Contract Flowchart Integration Blueprint

> **Living Document** -- Updated after every implementation phase.
> Last Updated: 2026-02-21
> Current Phase: **Phase 4 -- COMPLETE** | Contract General Details Section added

---

## Problem Statement

The system has the **left side** of the flowchart fully built (Client -> Quotation -> Project/Contract), 
and the **project operational path** is solid (Project -> Bookings -> Billings -> Accounting). But the 
**contract linkage pathways** -- the arrows that connect contracts to projects via "Standard Service Rates" 
and the "Non-Project Bookings" direct path -- are either missing or only passively wired.

### Goal

Close every gap in the flowchart so the system works end-to-end:

```
Client --> Quotation --> Project --> Project Bookings --> Billings/Expenses --> Accounting
                    \                     ^
                     \                    | (Standard Service Rates)
                      --> Contract -------+
                              \
                               --> Non-Project Bookings --> Billings/Expenses --> Accounting
```

### Design Principles

- **DRY**: Reuse existing booking panels, autofill patterns, rate engine, billing generation.
- **Clean Architecture**: Shared utilities, single-responsibility modules.
- **Progressive Enhancement**: Each phase is independently valuable -- no big-bang deployment.

---

## Existing Infrastructure (Reuse Inventory)

| Asset | File | Status | Reused In |
|---|---|---|---|
| Contract Rate Engine | `utils/contractRateEngine.ts` | Complete | Phase 2, 4 |
| Contract Detection Banner | `components/operations/shared/ContractDetectionBanner.tsx` | Complete | Phase 1 (refactor) |
| Project Autofill Utils | `utils/projectAutofill.ts` | Complete | Phase 3 (pattern copy) |
| CreateBookingFromProject | `components/projects/CreateBookingFromProjectPanel.tsx` | Complete | Phase 3 (pattern copy) |
| Booking Types w/ contract_id | `types/operations.ts` | Complete | Phase 3, 4 |
| Contract Detail View (tabs) | `components/pricing/ContractDetailView.tsx` | Stubs | Phase 3, 4 |
| Server: /contracts/active | `supabase/functions/server/index.tsx` | Complete | Phase 1 |
| Server: /contracts/:id/generate-billing | `supabase/functions/server/index.tsx` | Complete | Phase 4 |
| Server: /projects/:id/link-booking | `supabase/functions/server/index.tsx` | Complete | Phase 3 (pattern) |
| 5x Booking Creation Panels | `components/operations/Create*Panel.tsx` | Complete | Phase 3 |
| ServiceBookingRow | `components/operations/shared/ServiceBookingRow.tsx` | Complete | Phase 3 |

---

## Phased Implementation Plan

### Phase 1: Foundation -- Shared Contract Lookup Utility
**Status:** COMPLETE
**Effort:** Low | **Impact:** High (unblocks everything)

**Problem:** Contract detection logic is inlined in `ContractDetectionBanner.tsx`. We need it as a 
reusable utility for the QuotationBuilder (Phase 2) and booking panels (Phase 3).

**Tasks:**
- [x] 1.1 Create `utils/contractLookup.ts` -- shared utility:
  - `fetchActiveContractsForCustomer(customerName: string)` -> `Promise<ContractSummary[]>`
  - `fetchFullContract(contractId: string)` -> `Promise<QuotationNew | null>`
  - Uses existing `GET /contracts/active` endpoint (no backend changes)
  - Returns typed `ContractSummary` with id, quote_number, services, validity, rate_matrices
- [x] 1.2 Define `ContractSummary` type in `types/pricing.ts`:
  - Slim projection of QuotationNew for detection scenarios (id, quote_number, customer, services, validity, contract_status)
- [x] 1.3 Refactor `ContractDetectionBanner.tsx` to use `fetchActiveContractsForCustomer()`:
  - Remove inlined fetch logic, replace with utility call
  - Zero visual/behavioral changes -- pure refactor
- [x] 1.4 Add `source_contract_id?: string` to `QuotationNew` and `Project` types:
  - Allows project quotations to reference the contract they pulled rates from
  - Enables the traceable link: Project -> Contract

**Files Created:**
- `utils/contractLookup.ts`

**Files Modified:**
- `types/pricing.ts` (ContractSummary type + source_contract_id fields)
- `components/operations/shared/ContractDetectionBanner.tsx` (refactor to use utility)

---

### Phase 2: Contract-to-Project Rate Bridge
**Status:** COMPLETE
**Effort:** Medium | **Impact:** CRITICAL (core value proposition)

**Problem:** When Pricing creates a project quotation and picks Brokerage -> Standard, nothing 
happens. The system should detect the client's active contract and auto-populate selling prices 
with contract rates.

**Tasks:**
- [x] 2.1 Extend `utils/contractRateEngine.ts` -- add `contractRatesToSellingPrice()`:
  - Input: `rateMatrices: ContractRateMatrix[], serviceType: string, mode: string`
  - Output: `SellingPriceCategory[]` (shape QuotationBuilderV3 already renders)
  - Internally wraps existing `calculateContractBilling()` -- no rate math duplication
  - Maps `AppliedRate[]` -> `SellingPriceLineItem[]` with proper fields
- [x] 2.2 Add Contract Rate Bridge UI in `QuotationBuilderV3.tsx`:
  - Trigger: `quotationType === "project"` AND Brokerage selected AND `brokerageType === "Standard"`
  - Auto-call `fetchActiveContractsForCustomer()` (from Phase 1)
  - If contract found: show teal info banner with contract number + validity
  - "Apply Contract Rates" button -> calls `contractRatesToSellingPrice()` -> populates selling price state
  - If no contract: show subtle warning "No active contract found"
  - Store `source_contract_id` on the quotation for traceability
- [x] 2.3 Save/load `source_contract_id` in QuotationBuilderV3 payload

**Files Modified:**
- `utils/contractRateEngine.ts` (add `contractRatesToSellingPrice()`)
- `components/pricing/quotations/QuotationBuilderV3.tsx` (contract rate bridge UI + save/load)

**DRY Notes:**
- Rate math: 0 new lines -- delegates to existing `calculateContractBilling()`
- Fetch: delegates to `fetchActiveContractsForCustomer()` from Phase 1
- UI pattern: mirrors existing `ContractDetectionBanner` teal styling

---

### Phase 3: Contract Direct Bookings (Non-Project Path)
**Status:** COMPLETE
**Effort:** Medium | **Impact:** High

**Problem:** Operations cannot create bookings directly from a contract. The bookings tab in 
ContractDetailView is a stub. There is no active "navigate from contract -> create booking" flow.

**Tasks:**
- [x] 3.1 Create `utils/contractAutofill.ts` -- contract-to-booking field mapping:
  - `autofillBrokerageFromContract(contract: QuotationNew)` -> prefill object
  - `autofillTruckingFromContract(contract: QuotationNew)` -> prefill object
  - `autofillOthersFromContract(contract: QuotationNew)` -> prefill object
  - Same function signature pattern as `projectAutofill.ts` (DRY pattern)
  - Reads from `services_metadata`, `customer_name`, `movement`, `pods`, `scope_of_services`
- [x] 3.2 Create `components/contracts/CreateBookingFromContractPanel.tsx`:
  - Structural copy of `CreateBookingFromProjectPanel.tsx`
  - Props: `contract: QuotationNew, service: InquiryService, onBookingCreated`
  - Wraps existing `CreateBrokerageBookingPanel`, `CreateTruckingBookingPanel`, `CreateOthersBookingPanel`
  - Auto-fills using 3.1 utilities
  - On save: sets `contract_id` on the booking, calls `calculateContractBilling()` for `contract_applied_rates`
  - Zero new form UI -- reuses all existing panels
- [x] 3.3 Backend: `POST /contracts/:id/link-booking` endpoint:
  - Mirror of `POST /projects/:id/link-booking` pattern
  - Adds booking to contract's `linkedBookings[]` array
  - No service-type uniqueness constraint (contracts can have many bookings per service)
- [x] 3.4 Create `utils/contractAutofill.ts` -> `linkBookingToContract()`:
  - Mirrors `linkBookingToProject()` from `utils/projectAutofill.ts`
  - Calls the Phase 3.3 endpoint
- [x] 3.5 Flesh out `ContractDetailView.tsx` Bookings tab:
  - Show linked bookings list (use ServiceBookingRow or similar pattern)
  - "Create Booking" dropdown per contract service -> opens CreateBookingFromContractPanel
  - Booking count badge on tab header
  - Status indicators per booking

**Files Created:**
- `utils/contractAutofill.ts`
- `components/contracts/CreateBookingFromContractPanel.tsx`

**Files Modified:**
- `supabase/functions/server/index.tsx` (add link-booking-to-contract endpoint)
- `components/pricing/ContractDetailView.tsx` (flesh out bookings tab)

**DRY Notes:**
- Autofill: same pattern as `projectAutofill.ts` (5 functions -> 3 functions, contract-eligible only)
- Booking panels: 0 new form components -- reuses all existing Create*Panel components
- Backend: same linking pattern as project link-booking endpoint

---

### Phase 4: Contract Billing Flow
**Status:** COMPLETE
**Effort:** Medium | **Impact:** High

**Problem:** When contract-linked bookings are completed, there is no UI to generate billing 
using contract rates. The billings tab in ContractDetailView is a stub.

**Tasks:**
- [x] 4.1 "Generate Billing" button on Contract Bookings tab:
  - Per-booking button (same visual as `ProjectBookingsTab.tsx` generate button)
  - Opens rate preview modal showing applied rates + totals before confirming
  - Calls existing `POST /contracts/:id/generate-billing` endpoint (already built!)
  - Stores generated billing IDs on the booking
- [x] 4.2 Flesh out `ContractDetailView.tsx` Billings tab:
  - Show all EVouchers generated from this contract's bookings
  - Aggregate totals: total billed, total collected, outstanding balance
  - Filter/group by booking, by service type
  - Reuse billing table patterns from `ProjectBillingsTab`
- [x] 4.3 Rate Preview Modal component (`components/contracts/ContractRatePreviewModal.tsx`):
  - Shows contract rate matrix applied to booking quantities
  - Line-by-line breakdown with subtotals
  - "Confirm & Generate" button
  - Reusable for both bookings tab generate button and future inline billing

**Files Created:**
- `components/contracts/ContractRatePreviewModal.tsx`

**Files Modified:**
- `components/pricing/ContractDetailView.tsx` (billings tab + generate button on bookings)

**DRY Notes:**
- Billing generation: delegates to existing server endpoint (0 new backend)
- Rate math: uses existing `calculateContractBilling()` for preview
- Table patterns: mirrors `ProjectBillingsTab` layout

---

### Phase 5: Accounting Unification
**Status:** NOT STARTED
**Effort:** Low | **Impact:** Medium

**Problem:** Both project and contract billing streams should flow into Accounting with 
source attribution so accountants can filter and report by origin.

**Tasks:**
- [ ] 5.1 Add source tagging to EVoucher type (`types/evoucher.ts`):
  - `source_type?: "project" | "contract" | "standalone"`
  - `source_contract_id?: string`
  - Ensure contract billing generation sets these fields
- [ ] 5.2 Update contract billing generation endpoint to tag source:
  - Set `source_type: "contract"` and `source_contract_id` on generated billings
- [ ] 5.3 Add "Source" filter to Accounting billing views:
  - Filter pills: All | Project | Contract | Standalone
  - Reuses existing `FilterGroup` or `StatusFilterPills` patterns
- [ ] 5.4 Reports: Add contract billing breakdown to financial reports

**Files Modified:**
- `types/evoucher.ts` (add source fields)
- `supabase/functions/server/index.tsx` (tag source on billing generation)
- `components/accounting/` (add source filter pills)

---

## Dependency Graph

```
Phase 1 (Foundation)
  |
  +---> Phase 2 (Rate Bridge) ------> [Quotation -> Contract -> Project rates work]
  |
  +---> Phase 3 (Direct Bookings) --> Phase 4 (Billing Flow) --> Phase 5 (Accounting)
```

Phase 1 is prerequisite for both Phase 2 and Phase 3.
Phase 2 and Phase 3 can be done in parallel after Phase 1.
Phase 4 depends on Phase 3 (needs bookings to generate billing from).
Phase 5 depends on Phase 4 (needs billings to tag and filter).

---

## File Map (Quick Reference)

| Purpose | File |
|---|---|
| Blueprint (this file) | `/docs/blueprints/CONTRACT_FLOWCHART_INTEGRATION_BLUEPRINT.md` |
| Contract Lookup (NEW Phase 1) | `utils/contractLookup.ts` |
| Contract Rate Engine | `utils/contractRateEngine.ts` |
| Contract Autofill (NEW Phase 3) | `utils/contractAutofill.ts` |
| Project Autofill (pattern source) | `utils/projectAutofill.ts` |
| Contract Detection Banner | `components/operations/shared/ContractDetectionBanner.tsx` |
| Create Booking From Contract (NEW Phase 3) | `components/contracts/CreateBookingFromContractPanel.tsx` |
| Create Booking From Project (pattern source) | `components/projects/CreateBookingFromProjectPanel.tsx` |
| Contract Detail View | `components/pricing/ContractDetailView.tsx` |
| Rate Preview Modal (NEW Phase 4) | `components/contracts/ContractRatePreviewModal.tsx` |
| Contract General Details Section | `components/pricing/quotations/ContractGeneralDetailsSection.tsx` |
| Dropdown Tag Input (hybrid) | `components/pricing/quotations/DropdownTagInput.tsx` |
| QuotationBuilderV3 | `components/pricing/quotations/QuotationBuilderV3.tsx` |
| Types: Pricing | `types/pricing.ts` |
| Types: Operations | `types/operations.ts` |
| Types: EVoucher | `types/evoucher.ts` |
| Server | `supabase/functions/server/index.tsx` |

---

## Progress Log

| Date | Phase | Action | Notes |
|---|---|---|---|
| 2026-02-21 | Phase 1 | COMPLETE | contractLookup.ts created, ContractSummary type added, ContractDetectionBanner refactored to use shared utility, source_contract_id added to QuotationNew + Project |
| 2026-02-21 | Phase 2 | COMPLETE | contractRatesToSellingPrice() added to engine, Contract Rate Bridge banner + detection + apply in QuotationBuilderV3, source_contract_id save/load wired |
| 2026-02-21 | Phase 3 | COMPLETE | contractAutofill.ts created, CreateBookingFromContractPanel created, backend link/unlink-booking endpoints added, ContractDetailView bookings tab fleshed out with Create Booking button + service dropdown + fallback fetch |
| 2026-02-21 | Phase 4 | COMPLETE | ContractRatePreviewModal created, Generate Billing now opens preview modal with quantity inputs + live rate calculation, confirm triggers existing billing endpoint, billings tab already fully built with summary cards + table |
| 2026-02-21 | Contract UX | Contract General Details Section | New `ContractGeneralDetailsSection.tsx` component added between GeneralDetailsSection and rate matrices. Fields: Port of Entry/s (DropdownTagInput hybrid), Transportation (DropdownTagInput hybrid), Type of Entry (single-select buttons), Releasing (single-select dropdown). Type of Entry and POD removed from BrokerageServiceForm in contract mode. Data stored in `contract_general_details` on QuotationNew. CustomDropdown extended with `multiSelect`/`multiValue`/`onMultiChange` props. New `DropdownTagInput.tsx` component created — hybrid of TagInput + Dropdown: selected items show as teal tag chips wrapping vertically, dropdown with checkboxes for selection, inline type-to-filter. |
| 2026-02-21 | Contract UX | Rate Matrix Redesign | `ContractRateMatrixEditor` replaced with `ContractRateCardV2` — SellingPriceSection-matching outer shell (branded header, teal accent, outline-only), category-based hierarchy using `CategoryHeader`, CSS grid rows replacing HTML `<table>`. `ContractRateCategory` type added. Auto-migration from flat rows to categories. Rate engine unchanged (reads `matrix.rows` flat array). See `/docs/blueprints/RATE_MATRIX_REDESIGN_BLUEPRINT.md` for full details. |
| 2026-02-21 | Contract UX | Rate Matrix V2 Revision | Removed categories (flat list), title changed to "{Service} Charges", 2-row line items (data row + detail row), inline `+ Mode` in grid header, tiered pricing as visible checkbox with inline config, At Cost as visible checkbox, remarks moved to detail row. |
| 2026-02-21 | Contract UX | Trucking Charges Layout | Trucking Charges card now uses dedicated 3-column grid: Truck Config / Amount (PHP) / Destination. Default columns changed from ["Standard", "Wing Van", "Flat Bed"] to ["Amount"]. Destination maps to `row.remarks` (zero schema changes). "Add Mode" button hidden, column rename/delete disabled. Unit auto-defaults to per_container (hidden). Placeholder text updated. See RATE_MATRIX_REDESIGN_BLUEPRINT Phase 5. |