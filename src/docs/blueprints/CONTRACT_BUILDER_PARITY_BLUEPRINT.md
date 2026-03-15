# Contract Builder Parity Blueprint

> **Living Document** — Updated after every implementation phase.
> Last Updated: 2026-02-21
> Current Phase: **Phase 4 — COMPLETE**

---

## Problem Statement

The contract quotation builder is a stripped-down experience compared to the project builder.
When `quotationType === "contract"`, the builder hides Movement, ALL 5 service forms, Vendors,
Buying/Selling Price, and Financial Summary — leaving only GeneralDetailsSection + rate matrices.

Real-world contract quotations (sample: A Plus Falcons) include scope parameters (ports, entry
type, transportation mode), scope of services text, and terms & conditions. The builder should
capture these.

### Goal
Make the contract builder feel like the project builder — same flow, same richness — while
only hiding shipment-specific fields (container counts, weights, dimensions) that don't apply
to annual rate agreements.

---

## Phased Implementation Plan

### Phase 1: Service Form Scope Fields (Quick Wins)
**Status:** COMPLETE
**Effort:** Low | **Impact:** High

**Tasks:**
- [x] 1.1 `GeneralDetailsSection.tsx` — Un-hide Movement toggle for contracts (remove `quotationType !== "contract"` guard)
- [x] 1.2 Add `contractMode?: boolean` prop to all 5 service forms:
  - `BrokerageServiceForm.tsx` — Show: brokerageType, typeOfEntry, pod, mode. Hide: cargoType, commodity, delivery, containers, FCL/LCL/Air fields, All-Inclusive specifics
  - `ForwardingServiceForm.tsx` — Show: incoterms, mode, aolPol, aodPod, cargoNature. Hide: cargoType, containers, FCL/LCL/Air fields, carrier, transit, route, commodity, delivery, collection
  - `TruckingServiceForm.tsx` — Show: truckType. Hide: pullOut, delivery, qty, deliveryInstructions
  - `MarineInsuranceServiceForm.tsx` — Show: aolPol, aodPod. Hide: commodity, hsCode, invoiceValue
  - `OthersServiceForm.tsx` — Show as-is (serviceDescription IS scope)
- [x] 1.3 `QuotationBuilderV3.tsx` — Change `!isContractMode && selectedServices.includes(...)` → `selectedServices.includes(...)`, pass `contractMode={isContractMode}` to each form
- [x] 1.4 `QuotationBuilderV3.tsx` — Fix save: change `services_metadata: isContractMode ? [] : services_metadata` to save services_metadata in both modes (scope data needs persisting)

**Scope field mapping (which fields to show per form in contractMode):**

| Form | Scope Fields (SHOW) | Shipment Fields (HIDE) |
|---|---|---|
| Brokerage (Standard) | brokerageType, typeOfEntry checkboxes, pod, mode | cargoType, commodity, delivery, containers, LCL, Air |
| Brokerage (All-Inclusive) | brokerageType | countryOfOrigin, preferentialTreatment, commodity |
| Forwarding | incoterms, mode, aolPol, aodPod, cargoNature | cargoType, containers, LCL, Air, carrier, transit, route, commodity, delivery, collection |
| Trucking | truckType | pullOut, delivery, qty, instructions, aolPol |
| Marine Insurance | aolPol, aodPod | commodity, hsCode, invoiceValue |
| Others | serviceDescription (all) | (none) |

**Files Modified:**
- `/components/pricing/quotations/GeneralDetailsSection.tsx`
- `/components/pricing/quotations/BrokerageServiceForm.tsx`
- `/components/pricing/quotations/ForwardingServiceForm.tsx`
- `/components/pricing/quotations/TruckingServiceForm.tsx`
- `/components/pricing/quotations/MarineInsuranceServiceForm.tsx`
- `/components/pricing/quotations/OthersServiceForm.tsx`
- `/components/pricing/quotations/QuotationBuilderV3.tsx`

---

### Phase 2: Scope of Services + Terms & Conditions
**Status:** COMPLETE
**Effort:** Medium | **Impact:** High

**Tasks:**
- [x] 2.1 Create shared `EditableBulletList.tsx` component (add/remove/reorder bullet items, viewMode support)
- [x] 2.2 Add `scope_of_services?: string[]` and `terms_and_conditions?: string[]` to `QuotationNew` type in `/types/pricing.ts`
- [x] 2.3 Wire state + render in `QuotationBuilderV3.tsx` — two new sections below service forms, only in contract mode
- [x] 2.4 Include both fields in save payload

**Files Created:**
- `/components/pricing/quotations/EditableBulletList.tsx`

**Files Modified:**
- `/types/pricing.ts`
- `/components/pricing/quotations/QuotationBuilderV3.tsx`

---

### Phase 3: Rate Matrix Enhancements
**Status:** COMPLETE
**Effort:** Medium | **Impact:** Medium

**Tasks:**
- [x] 3.1 Add `is_at_cost?: boolean` to `ContractRateRow` type — when true, show "At Cost" text instead of numeric rate inputs
- [x] 3.2 Add `group_label?: string` to `ContractRateRow` type — when present, render as a section sub-header row in the matrix (e.g., destination zones for Trucking)
- [x] 3.3 Implement "At Cost" toggle in `ContractRateMatrixEditor.tsx` — per-row toggle ($→AT COST), grays out rate cells and unit, hides succeeding rule
- [x] 3.4 Implement group headers in `ContractRateMatrixEditor.tsx` — "Add Group" button, teal sub-header rows with editable label
- [x] 3.5 (Bonus) Separated Cargo Nature from Cargo Type in ForwardingServiceForm so it shows as scope field in contractMode

**Files Modified:**
- `/types/pricing.ts`
- `/components/pricing/quotations/ContractRateMatrixEditor.tsx`
- `/components/pricing/quotations/ForwardingServiceForm.tsx`

---

### Phase 4: Contract Service Restrictions & Scope Refinements
**Status:** COMPLETE
**Effort:** Medium | **Impact:** High

**Context — Domain Clarifications (confirmed 2026-02-21):**
- Contracts are only for **Brokerage (Standard)**, **Trucking**, and **Others** (misc charges like arrastre, wharfage, storage).
- Forwarding and Marine Insurance are per-shipment services — hidden from contract service selection entirely.
- "Standard" brokerage type in a Project quotation = "apply the client's contract rates." The contract IS the definition of standard rates.
- Contracts can be used for **direct bookings** (no project) AND within **project quotations** (mixed services).
- Brokerage mode is always **Multi-Modal** for contracts (rate matrix columns represent modes).
- **Type of Entry**: one per contract (single-select).
- **POD**: multiple ports per contract (multi-entry tag input).
- **Movement**: one per contract (single-select, no change needed).

**Tasks:**
- [x] 4.1 Create `TagInput.tsx` shared component — type → Enter → tag chip, × to remove, value is `string[]`, Neuron styling, with quick-add suggestions
- [x] 4.2 `GeneralDetailsSection.tsx` — Filter `AVAILABLE_SERVICES` to `["Brokerage", "Trucking", "Others"]` when `quotationType === "contract"`, added `CONTRACT_SERVICES` constant
- [x] 4.3 `BrokerageServiceForm.tsx` — In contractMode: hide brokerageType selector (always Standard), hide mode selector (always Multi-Modal), show info badges for Standard + Multi-Modal, Type of Entry changed to single-select toggle buttons, POD replaced with TagInput for multi-port entry with port suggestions
- [x] 4.4 `QuotationBuilderV3.tsx` — Auto-set brokerageData to `{ brokerageType: "Standard", mode: "Multi-modal" }` when entering contract mode; added `pods?: string[]` to BrokerageFormData; updated save/load logic for `pods` field; stripped non-contract services from selection on mode switch; guarded Forwarding + Marine Insurance form rendering with `!isContractMode`
- [x] 4.5 Update blueprint — mark Phase 4 COMPLETE

**Files Created:**
- `/components/pricing/quotations/TagInput.tsx`

**Files Modified:**
- `/components/pricing/quotations/GeneralDetailsSection.tsx` — Added `CONTRACT_SERVICES` constant, filtered service buttons by quotationType
- `/components/pricing/quotations/BrokerageServiceForm.tsx` — Added `pods?: string[]` to interface, imported TagInput, added contract mode UI (badges, single-select entry type, multi-port TagInput), wrapped project-only sections with `!contractMode`
- `/components/pricing/quotations/QuotationBuilderV3.tsx` — Added `pods` to BrokerageFormData + save/load, added auto-default useEffect for contract mode, guarded Forwarding/Marine Insurance rendering

---

## Domain Architecture Notes

### Contract ↔ Project Relationship
```
Contract (standing rate agreement)
├── Direct Bookings (no project)
│   └── Operations handles → Accounting bills using contract rates
└── Project Quotations (mixed services)
    ├── Per-shipment services: Forwarding, Marine Insurance (quoted fresh)
    └── Contract services: Brokerage (Standard), Trucking, Others (pull rates from contract)

Trigger: brokerageType = "Standard" in project quotation → system looks up active contract for client
```

### Contract-Eligible Services
| Service | Contract? | Reason |
|---|---|---|
| Brokerage (Standard) | Yes | Standing rate card for recurring clearances |
| Trucking | Yes | Fixed delivery zone rates |
| Others | Yes | Miscellaneous charges (arrastre, wharfage, storage) |
| Forwarding | No | Per-shipment, variable by route/carrier |
| Marine Insurance | No | Per-shipment, variable by commodity/value |

---

## File Map (Quick Reference)

| Purpose | File |
|---|---|
| Blueprint (this file) | `/docs/blueprints/CONTRACT_BUILDER_PARITY_BLUEPRINT.md` |
| Quotation Builder | `/components/pricing/quotations/QuotationBuilderV3.tsx` |
| General Details | `/components/pricing/quotations/GeneralDetailsSection.tsx` |
| Brokerage Form | `/components/pricing/quotations/BrokerageServiceForm.tsx` |
| Forwarding Form | `/components/pricing/quotations/ForwardingServiceForm.tsx` |
| Trucking Form | `/components/pricing/quotations/TruckingServiceForm.tsx` |
| Marine Insurance Form | `/components/pricing/quotations/MarineInsuranceServiceForm.tsx` |
| Others Form | `/components/pricing/quotations/OthersServiceForm.tsx` |
| Rate Matrix Editor | `/components/pricing/quotations/ContractRateMatrixEditor.tsx` |
| Tag Input (multi-entry) | `/components/pricing/quotations/TagInput.tsx` |
| Types | `/types/pricing.ts` |

---

## Progress Log

| Date | Phase | Action | Notes |
|---|---|---|---|
| 2026-02-20 | Planning | Blueprint created | 3 phases planned |
| 2026-02-20 | Phase 1 | COMPLETE | Movement toggle un-hidden, contractMode prop added to all 5 service forms, service forms shown in contract mode with scope-only fields, save logic fixed to persist services_metadata |
| 2026-02-20 | Phase 2 | COMPLETE | EditableBulletList shared component created, scope_of_services + terms_and_conditions fields added to QuotationNew type, wired in QuotationBuilderV3 with state + save payload |
| 2026-02-20 | Phase 3 | COMPLETE | At Cost toggle + group headers implemented in ContractRateMatrixEditor, Cargo Nature separated as scope field in ForwardingServiceForm |
| 2026-02-21 | Phase 4 | STARTED | Domain clarifications confirmed: contracts = Brokerage+Trucking+Others only; Standard brokerage = contract rates; Multi-Modal always; POD multi-entry |
| 2026-02-21 | Phase 4 | COMPLETE | TagInput component created, service selection filtered for contracts, BrokerageServiceForm contract mode UI (Standard/Multi-Modal badges, single-select entry type, multi-port TagInput), QuotationBuilderV3 auto-defaults + save/load + rendering guards |