# Contracts Module Blueprint

> **Living Document** - Updated after every implementation phase.
> Last Updated: 2026-02-19
> Current Phase: **ALL PHASES COMPLETE (including 1:1 ProjectsModule parity refactor)**

---

## Problem Statement

Contract quotations are "approved" but the only CTA is **"Create Project"** — which is wrong. Contracts are NOT Projects. The contract IS the work container. There is also no dedicated place for users to see and manage their active contracts; they're buried in the quotations list.

### Root Causes

1. `BusinessDevelopment.tsx` (line 700-748) renders ALL quotations through `QuotationDetail` → `QuotationFileView` — it **never** checks `quotation_type === "contract"` to route to `ContractDetailView`. Only the Pricing module does this.
2. `QuotationFileView.tsx` (line 472) shows "Create Project" for ANY quotation with `status === "Accepted by Client"` regardless of `quotation_type`. There's no guard.
3. No sidebar entry, route, or module for contracts. They only appear as a filter option in the quotations list.

---

## Architecture: Project/Contract Symmetry

Projects and Contracts are **sibling work containers** with parallel lifecycles:

| Phase | Project Flow | Contract Flow |
|---|---|---|
| **Create** | QuotationBuilder (project mode) | QuotationBuilder (contract mode) |
| **Negotiate** | Draft → Sent → Approved (in Quotations) | Draft → Sent → Approved (in Quotations) |
| **Activate** | "Create Project" → Project entity created | **"Activate Contract"** → contract_status = Active |
| **Work Container** | ProjectsModule (list + detail) | **ContractsModule (list + detail)** |
| **Operations** | Bookings created from Project | Bookings auto-linked via ContractDetectionBanner |
| **Financial** | Billings/Collections in Project tabs | Billings/Collections in Contract tabs |

### What We Reuse (Zero Duplication)

- `ContractDetailView.tsx` — already built (Rate Card, Bookings, Billings, Activity tabs)
- `QuotationBuilderV3.tsx` — already handles contract create/edit
- All contract backend endpoints — `/contracts/active`, `/contracts/:id/billings`, `/contracts/:id/renew`
- All types — `ContractRateMatrix`, `ContractQuotationStatus`, `QuotationType`
- `ContractDetectionBanner.tsx` — operations integration already works
- KV store — contracts ARE quotations with `quotation_type: "contract"`, no new namespace

---

## Phased Implementation Plan

### Phase 1: Guards & Routing Fixes (Quick Fixes)
**Status:** COMPLETE
**Scope:** Stop showing "Create Project" for contracts + fix BD routing

**Tasks:**
- [x] 1.1 `QuotationFileView.tsx` — Add `quotation.quotation_type !== "contract"` guard on "Create Project" button (line 472)
- [x] 1.2 `BusinessDevelopment.tsx` — Import `ContractDetailView`, add routing: when `selectedQuotation.quotation_type === "contract"`, render `ContractDetailView` instead of `QuotationDetail`
- [x] 1.3 `ContractDetailView.tsx` — Add "Activate Contract" CTA button for contracts with status "Accepted by Client" that sets `contract_status` to "Active" and quotation `status` to "Converted to Contract"

**Files Modified:**
- `/components/pricing/QuotationFileView.tsx`
- `/components/BusinessDevelopment.tsx`
- `/components/pricing/ContractDetailView.tsx`

---

### Phase 2: ContractsModule + ContractsList
**Status:** COMPLETE
**Scope:** Create the dedicated Contracts module (mirrors ProjectsModule pattern)

**Tasks:**
- [x] 2.1 Create `ContractsList.tsx` at `/components/contracts/ContractsList.tsx`
  - Filterable list showing contracts with contract_status Active/Expiring/Expired/Renewed
  - Control bar with: search, status filter, service filter
  - Table columns: Contract #, Name, Customer, Services, Validity, Status
  - Follow `ProjectsList.tsx` pattern and Neuron design system
- [x] 2.2 Create `ContractsModule.tsx` at `/components/contracts/ContractsModule.tsx`
  - List/detail router (mirrors `ProjectsModule.tsx`)
  - Fetches contracts from `/quotations?department=pricing` filtered by `quotation_type === "contract"`
  - Detail view uses existing `ContractDetailView.tsx`

**Files Created:**
- `/components/contracts/ContractsList.tsx`
- `/components/contracts/ContractsModule.tsx`

---

### Phase 3: Sidebar + App Routing
**Status:** COMPLETE
**Scope:** Wire the new module into navigation

**Tasks:**
- [x] 3.1 `NeuronSidebar.tsx` — Add `bd-contracts` and `pricing-contracts` nav items with `Handshake` icon, positioned after Projects in both BD and Pricing sub-menus
- [x] 3.2 `App.tsx` — Add:
  - `getCurrentPage()`: `/bd/contracts` → `bd-contracts`, `/pricing/contracts` → `pricing-contracts`
  - `routeMap`: `bd-contracts` → `/bd/contracts`, `pricing-contracts` → `/pricing/contracts`
  - Page type union updated with `bd-contracts` and `pricing-contracts`
  - `BDContractsPage` and `PricingContractsPage` page components
  - `<Route>` entries for `/bd/contracts` and `/pricing/contracts`
  - Unified `/contracts` route with `ContractsPage`
- [x] 3.3 BD contracts route renders `ContractsModule` directly (not via BusinessDevelopment), same pattern as `PricingProjectsPage` rendering `ProjectsModule` directly

**Files Modified:**
- `/components/NeuronSidebar.tsx`
- `/App.tsx`

---

### Phase 4: Status Types + Polish
**Status:** COMPLETE
**Scope:** "Converted to Contract" status type + status mapping

**Tasks:**
- [x] 4.1 Add "Converted to Contract" to `QuotationStatus` type in `/types/pricing.ts`
- [x] 4.2 Add "Converted to Contract" to `getDisplayStatus()` in `/utils/statusMapping.ts` (maps to "Approved" display status, same as "Converted to Project")
- [x] 4.3 Add `getInternalStatusLabel()` entry for "Converted to Contract"

**Note:** Backend enhancement (task 4.1 from original plan) was NOT needed. The existing `/quotations?department=pricing` endpoint already returns all quotations, and `ContractsModule` filters to `quotation_type === "contract"` client-side. This is the DRY approach — no new endpoints, zero backend changes.

**Files Modified:**
- `/types/pricing.ts`
- `/utils/statusMapping.ts`

---

### Parity Refactor
**Status:** COMPLETE
**Scope:** ContractsList rewritten as 1:1 copy of ProjectsList. ContractsModule enhanced to match ProjectsModule (departmentOverride, initialContract, department logic, re-fetch on update). NeuronStatusPill updated with contract statuses. All 3 App.tsx page functions updated with onCreateTicket.

**Tasks:**
- [x] 5.1 Rewrite `ContractsList.tsx` as a 1:1 copy of `ProjectsList.tsx`
- [x] 5.2 Enhance `ContractsModule.tsx` to match `ProjectsModule.tsx`:
  - Add `departmentOverride` prop
  - Add `initialContract` prop
  - Add department logic
  - Add re-fetch on update
- [x] 5.3 Update `NeuronStatusPill.tsx` to include contract statuses
- [x] 5.4 Update `App.tsx` page functions with `onCreateTicket`:
  - `BDContractsPage`
  - `PricingContractsPage`
  - `ContractsPage`

**Files Modified:**
- `/components/contracts/ContractsList.tsx`
- `/components/contracts/ContractsModule.tsx`
- `/components/NeuronStatusPill.tsx`
- `/App.tsx`

---

## File Map (Quick Reference)

| Purpose | File |
|---|---|
| Blueprint (this file) | `/docs/blueprints/CONTRACTS_MODULE_BLUEPRINT.md` |
| Contracts Module | `/components/contracts/ContractsModule.tsx` |
| Contracts List | `/components/contracts/ContractsList.tsx` |
| Contract Detail View | `/components/pricing/ContractDetailView.tsx` (existing, enhanced) |
| QuotationFileView guard | `/components/pricing/QuotationFileView.tsx` |
| BD routing fix | `/components/BusinessDevelopment.tsx` |
| Sidebar nav | `/components/NeuronSidebar.tsx` |
| App routes | `/App.tsx` |
| Types | `/types/pricing.ts` |
| Status mapping | `/utils/statusMapping.ts` |

---

## Progress Log

| Date | Phase | Action | Notes |
|---|---|---|---|
| 2026-02-19 | Planning | Blueprint created | 4 phases planned |
| 2026-02-19 | Phase 1 | COMPLETE | Guard on QuotationFileView, BD routing fix, Activate Contract CTA |
| 2026-02-19 | Phase 2 | COMPLETE | ContractsList + ContractsModule created (2 new files) |
| 2026-02-19 | Phase 3 | COMPLETE | Sidebar Handshake icon, App.tsx routing (bd-contracts, pricing-contracts, /contracts) |
| 2026-02-19 | Phase 4 | COMPLETE | "Converted to Contract" QuotationStatus + statusMapping.ts. Zero backend changes. |
| 2026-02-19 | Parity Refactor | COMPLETE | ContractsList rewritten as 1:1 copy of ProjectsList. ContractsModule enhanced to match ProjectsModule (departmentOverride, initialContract, department logic, re-fetch on update). NeuronStatusPill updated with contract statuses. All 3 App.tsx page functions updated with onCreateTicket. |