# Completed Features & Implementation History

This is a chronological record of major features that have been implemented. All blueprints live in `/docs/blueprints/`. Features are listed newest-first.

---

## Recently Completed

### Essentials Mode / No-Accounting MVP (4 phases — ALL DONE)
**Blueprint:** `NO_ACCOUNTING_MVP_BLUEPRINT.md`

Runtime "Essentials vs Full Suite" toggle for the Accounting department.
- Phase 1: Mode toggle infrastructure (`/config/appMode.tsx`, `useAppMode()` hook, login page toggle)
- Phase 2: Sidebar gating (`NeuronSidebar.tsx` shows different items per mode), route additions
- Phase 3: 4 aggregate wrapper pages that render the exact same Unified tab components used in project views, with `readOnly` props added to `UnifiedInvoicesTab`, `UnifiedCollectionsTab`, `UnifiedExpensesTab`. Billings & Expenses pages include Catalog tabs.
- Phase 4: Financial Health / Sales Report page (`FinancialHealthPage.tsx`) with per-project financial rows, month picker, summary cards, CSV export

**Key insight:** Invoices and Collections are business operations (stay visible everywhere). Only heavy accounting (e-vouchers, COA, journal entries, auditing) gets hidden in Essentials mode.

### Auditing Module (5 phases — ALL DONE)
**Blueprint:** `AUDITING_MODULE_BLUEPRINT.md`

Three-file auditing system (`AuditingModule.tsx`, `AuditingSummary.tsx` — both restyled to match `ContractsList.tsx` design tokens).

### Expense & Charge Catalog (6 phases — ALL DONE)
**Blueprint:** `EXPENSE_CHARGE_CATALOG_BLUEPRINT.md`

Master catalog of reusable expense/charge items with categories, one-click "+ Add" in `CatalogItemCombobox`, `itemType` prop threading, dead code cleanup.

**Files:** `CatalogManagementPage.tsx`, `CatalogItemCombobox.tsx`, `catalog-handlers.tsx`

### Contract Billings Grouping (3 phases — ALL DONE)
**Blueprint:** `CONTRACT_BILLINGS_GROUPING_BLUEPRINT.md`

Groups billing items by booking within contract views.

### Inquiries/Quotations Cleanup (6 phases — effectively complete, Phase 6 not formally marked done)
**Blueprint:** `INQUIRIES_QUOTATIONS_CLEANUP_BLUEPRINT.md`

Massive cleanup of the quotation pipeline, status flows, DRY consolidation.

### Invoice Ledger Integration (3 phases — ALL DONE)
**Blueprint:** `INVOICE_LEDGER_INTEGRATION_BLUEPRINT.md`

Connected invoices to ledger posting, journal entries, collections pipeline.

---

## Earlier Completed Features (chronological)

| Feature | Blueprint | Key Changes |
|---|---|---|
| Legacy Cleanup | `LEGACY_CLEANUP_BLUEPRINT.md` | Removed dead code, consolidated patterns |
| DRY Consolidation | Various | Extracted shared components from duplicated code |
| Contract Billings Rework | `CONTRACT_BILLINGS_REWORK_BLUEPRINT.md` | Redesigned contract billing flow |
| Rate Calculation Sheet | `RATE_CALCULATION_SHEET_BLUEPRINT.md` | `RateCalculationSheet.tsx` for rate breakdown |
| Quotation Rate Bridge Generalization | `QUOTATION_RATE_BRIDGE_GENERALIZATION_BLUEPRINT.md` | Unified rate bridge across services |
| Rate Table DRY | `RATE_TABLE_DRY_BLUEPRINT.md` | Single table component for all rate displays |
| Selection Group | `SELECTION_GROUP_BLUEPRINT.md` | Multi-select UI pattern |
| Multi-Line Trucking | `MULTI_LINE_TRUCKING_BLUEPRINT.md` | Multiple destinations per trucking quotation |
| Contract-Aware Destination Combobox | `DESTINATION_COMBOBOX_BLUEPRINT.md` | Autocomplete with contract rate awareness |
| Contract Banner Redesign (Option A) | `CONTRACT_BANNER_REDESIGN_BLUEPRINT.md` | Visual redesign of contract detection banner |
| Contract Parity | `CONTRACT_PARITY_BLUEPRINT.md` | Feature parity between spot and contract flows |
| Filter/Tab UX Overhaul | (inline work) | Projects, Contracts, Quotations, Inquiries list pages |
| Contracts in Accounting Sidebar | (inline work) | Added contracts sub-item to accounting department |
| `handleGenerateBilling` snake_case fix | (inline work) | Fixed field naming convention |
| Completed-task UI state | (inline work) | Visual distinction for completed tasks |
| Service Type Injection | (inline work) | All 5 booking creation endpoints inject `serviceType` field |
| Smart Service Type Fallback | (inline work) | `ContractDetailView.tsx` infers service type from booking ID prefix |

---

## Parked / Future Work

| Item | Location | Status |
|---|---|---|
| Billings Module Restructure (queue-based workflow) | `/docs/designs/BILLINGS_MODULE_RESTRUCTURE.md` | PARKED — design concept only |
| Booking Panel DRY | `BOOKING_PANEL_DRY_BLUEPRINT.md` | Planned consolidation of 5 booking create panels |

---

## Deprecated Code (Do Not Use)

| File | Reason |
|---|---|
| `CreateProjectModal.tsx` | Replaced by direct project creation flow |
| `ExpenseModal.tsx` | Replaced by `CreateEVoucherForm.tsx` flow |
