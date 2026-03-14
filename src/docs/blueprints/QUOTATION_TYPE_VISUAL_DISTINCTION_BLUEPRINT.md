# Quotation Type Visual Distinction Blueprint

## Objective
Replace the surface-level `[CONTRACT]` badge with **structural, multi-signal visual distinction** between Project and Contract quotations in all list views, following the "Contextual Row Variants" pattern.

## Design Principles
- **DRY**: One shared icon/utility module, one row component per list (conditional rendering inside cells)
- **Multi-channel signals**: Icon + left accent strip + adaptive context column + type sub-label
- **Information-correct**: Each quotation type shows its most decision-relevant data in the context column

## Visual Specification

| Signal | Project Quotation | Contract Quotation |
|--------|------------------|-------------------|
| **Leading Icon** | Document icon (Figma SVG - `ProjectIcon`) | Contract-signing icon (Figma SVG - `ContractIcon`) |
| **Left Accent** | None | None (removed by design decision) |
| **Name Sub-label** | `{quote_number} · Project` | `{quote_number} · Contract` (same muted color) |
| **Context Column** | `PHP 45,000` (financial total) | `Feb 2026 - Dec 2026` (validity range) |
| **[CONTRACT] Badge** | Removed | Removed |

## Files Affected
- `/components/pricing/QuotationTypeIcons.tsx` *(new - shared icons + utilities)*
- `/components/pricing/QuotationsListWithFilters.tsx` *(BD list - most complex)*
- `/components/pricing/QuotationsList.tsx` *(Pricing list)*
- `/components/pricing/PricingQuotations.tsx` *(Pricing alternate view)*
- `/components/pricing/CreateQuotationMenu.tsx` *(refactor to import shared icons)*

---

## Phase 1: Shared Icons & Utilities Module
**Status: COMPLETE**

### Scope
- Create `/components/pricing/QuotationTypeIcons.tsx` exporting:
  - `ProjectIcon` and `ContractIcon` (from Figma SVGs)
  - `QuotationTypeLabel` - inline component rendering `{number} . {type}` sub-label
  - `getQuotationTypeAccentStyle()` - returns left border style for contract rows
- Refactor `CreateQuotationMenu.tsx` to import icons from shared module

### Acceptance Criteria
- [x] Icons render identically to current `CreateQuotationMenu` SVGs
- [x] `CreateQuotationMenu` imports from shared module (no duplication)
- [x] Module exports are typed and documented

---

## Phase 2: Update QuotationsListWithFilters (BD List)
**Status: COMPLETE**

### Scope
- Replace `FileText` leading icon with `ProjectIcon`/`ContractIcon` based on `item.quotation_type`
- Add 3px teal left accent border on contract rows
- Replace `[CONTRACT]` badge with type sub-label beneath quote number
- Context column already adaptive (has project total vs contract validity) - verify correct

### Acceptance Criteria
- [x] Leading icon changes based on quotation type
- [x] Contract rows have visible teal left accent
- [x] No `[CONTRACT]` badge remains
- [x] Type sub-label shows "Project" or "Contract" beneath quote number
- [x] Hover and zebra-stripe styling preserved with accent border

---

## Phase 3: Update QuotationsList & PricingQuotations (Pricing Lists)
**Status: COMPLETE**

### Scope
- Apply same 4 visual signals to both Pricing list components
- `QuotationsList.tsx`: Thread `quotation_type` through `CombinedItem` or access via `rawData`
- `PricingQuotations.tsx`: Already has `isContract` detection - apply visual signals
- Remove `[CONTRACT]` badge from both

### Acceptance Criteria
- [x] Both Pricing lists show identical visual treatment to BD list
- [x] `CombinedItem` in `QuotationsList` carries quotation type info
- [x] All `[CONTRACT]` badges removed across codebase
- [x] Context column correct in both files

---

## Post-Implementation Notes
- All 3 phases complete
- Visual distinction is structural and multi-signal across all list views
- DRY principle maintained via shared `QuotationTypeIcons.tsx` module
- **Left accent strip removed** (design decision) — `getQuotationTypeAccentStyle()` now returns empty style
- **Contract sub-label color normalized** — both "Project" and "Contract" use same muted `#9CA3AF`

## Post-Phase Fix: Contract Quotation Click Flow (Parity with Projects)

**Problem**: Clicking a contract quotation in BD/Pricing lists immediately opened `ContractDetailView`
(the contract management screen) instead of going through the approval workflow like projects do.

**Fix applied**:
- Removed `quotation_type === "contract" ? ContractDetailView : QuotationDetail` branching from
  `BusinessDevelopment.tsx` and `Pricing.tsx` — all quotations now go through `QuotationDetail` → `QuotationFileView`
- Added "Activate Contract" button in `QuotationFileView` (parallel to "Create Project") for contract
  quotations at "Accepted by Client" status
- Added backend endpoint `POST /quotations/:id/activate-contract` — sets `contract_status: "Active"`,
  `status: "Converted to Contract"`
- `ContractsModule` filtering tightened to only show activated contracts (status = "Converted to Contract"
  or contract_status in Active/Expiring/Expired/Renewed)
- `StatusChangeButton` hides for "Converted to Contract" status (same as "Converted to Project")
- `ContractDetailView` now only used in `ContractsModule` (sidebar Contracts page) — where it belongs

**Files modified**:
- `/supabase/functions/server/index.tsx` — new activate-contract endpoint
- `/components/pricing/QuotationFileView.tsx` — `onConvertToContract` prop, `handleActivateContract`, "Activate Contract" button, locked indicator for contracts
- `/components/pricing/QuotationDetail.tsx` — pass-through `onConvertToContract` prop
- `/components/BusinessDevelopment.tsx` — removed ContractDetailView import + branching
- `/components/Pricing.tsx` — removed ContractDetailView import + branching
- `/components/pricing/StatusChangeButton.tsx` — hide for "Converted to Contract"
- `/components/contracts/ContractsModule.tsx` — filter to activated contracts only
