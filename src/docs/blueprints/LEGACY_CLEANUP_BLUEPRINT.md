# Legacy Code Cleanup Blueprint

**Created:** 2026-02-25
**Status:** COMPLETE
**Current Phase:** All batches done

---

## Overview

Systematic deletion of ~220+ confirmed dead files (~55,000+ lines) across the Neuron OS codebase. Every file listed below has been verified as having 0 live imports (or only imported by other dead files).

---

## Batch 1 — Root-Level Dead Components (25 files)

**Status:** DONE (31 files deleted 2026-02-25)

Dead root-level `.tsx` files in `/components/` — all confirmed 0 live imports:

- [ ] `/components/Accounting.tsx` (root-level, NOT `/accounting/Accounting.tsx`)
- [ ] `/components/AccountingEntryModal.tsx`
- [ ] `/components/AccountingExpenseModal.tsx`
- [ ] `/components/AccountingRevenueModal.tsx`
- [ ] `/components/Bookings.tsx`
- [ ] `/components/BookingDetail.tsx`
- [ ] `/components/BookingSheetRight.tsx`
- [ ] `/components/BookingFullView.tsx` (root; `operations/BookingFullView.tsx` is live)
- [ ] `/components/CreateBooking.tsx` (root; `operations/CreateBooking.tsx` is live)
- [ ] `/components/CreateBookingModal.tsx`
- [ ] `/components/BillingWorkspace.tsx`
- [ ] `/components/DeliveryStatusControl.tsx`
- [ ] `/components/ExpenseModal.tsx`
- [ ] `/components/ShipmentMonitoringForm.tsx`
- [ ] `/components/ShipmentTypeSelector.tsx`
- [ ] `/components/Dashboard.tsx`
- [ ] `/components/DashboardAnalytics.tsx`
- [ ] `/components/TopBarMinimal.tsx`
- [ ] `/components/NeuronButton.tsx`
- [ ] `/components/NeuronPageHeader.tsx`
- [ ] `/components/NeuronTypography.tsx`
- [ ] `/components/Reports.tsx`
- [ ] `/components/ReportsModule.tsx`
- [ ] `/components/ReportsModuleNew.tsx`
- [ ] `/components/ReportsModuleUpdated.tsx`
- [ ] `/components/SalesProfitReport.tsx`
- [ ] `/components/Clients.tsx`
- [ ] `/components/ClientFullView.tsx`
- [ ] `/components/TopNav.tsx`
- [ ] `/components/SafeAreaTop.tsx`
- [ ] `/components/EntryFileView.tsx`

---

## Batch 2 — Dead Accounting Versions (~33 files)

**Status:** DONE (31 files deleted 2026-02-25 — 7 shell files, entire accounting-v3/ and accounting-v6/ directories)

### Shell files (7):
- [ ] `/components/AccountingV2.tsx`
- [ ] `/components/AccountingV3.tsx`
- [ ] `/components/AccountingV4.tsx`
- [ ] `/components/AccountingV5.tsx`
- [ ] `/components/AccountingV6.tsx`
- [ ] `/components/AccountingV7.tsx`
- [ ] `/components/AccountingV8.tsx`

### Entire `/components/accounting-v3/` directory (14 files):
- [ ] `AccountsScreen.tsx`
- [ ] `AddAccountModal.tsx`
- [ ] `ApprovalBanner.tsx`
- [ ] `ApproveRejectModal.tsx`
- [ ] `BookingPicker.tsx`
- [ ] `CategoriesScreen.tsx`
- [ ] `CountPills.tsx`
- [ ] `EntriesList.tsx`
- [ ] `EntriesTable.tsx`
- [ ] `EntriesTableSkeleton.tsx`
- [ ] `EntryModal.tsx`
- [ ] `EntrySheet.tsx`
- [ ] `FilterGroup.tsx`
- [ ] `LedgerScreen.tsx`
- [ ] `MonthNavigator.tsx`
- [ ] `NumericKeypad.tsx`
- [ ] `PrintRFPModal.tsx`
- [ ] `RFPStatusPill.tsx`
- [ ] `StatusFilterPills.tsx`
- [ ] `StatusPill.tsx`
- [ ] `bookings-data.ts`
- [ ] `companies.ts`
- [ ] Markdown files: `BOOKING-PICKER.md`, `README.md`

### Entire `/components/accounting-v6/` directory (11 files):
- [ ] `BillingFileView.tsx`
- [ ] `CollectionFileView.tsx`
- [ ] `ExpenseCategoriesDrawer.tsx`
- [ ] `ExpenseFileView.tsx`
- [ ] `NewBillingModal.tsx`
- [ ] `NewCollectionModal.tsx`
- [ ] `NewExpenseModal.tsx`
- [ ] Markdown files: all `.md` in directory

---

## Batch 3 — Dead Booking Modals + Dead Pricing Files (~16 files)

**Status:** DONE (16 files deleted 2026-02-25)

### Dead Booking Modals (5):
- [ ] `/components/operations/CreateBrokerageBookingModal.tsx`
- [ ] `/components/operations/CreateMarineInsuranceBookingModal.tsx`
- [ ] `/components/operations/CreateTruckingBookingModal.tsx`
- [ ] `/components/operations/CreateOthersBookingModal.tsx`
- [ ] `/components/operations/forwarding/CreateForwardingBookingModal.tsx`

### Dead Pricing/Quotation Files (11):
- [ ] `/components/pricing/quotations/BuyingPriceSection.tsx` (V2 is live)
- [ ] `/components/pricing/quotations/CargoDetailsSection.tsx`
- [ ] `/components/pricing/quotations/ChargeCategoriesSection.tsx`
- [ ] `/components/pricing/quotations/ShipmentDetailsSection.tsx`
- [ ] `/components/pricing/quotations/NewLineItemRow.tsx`
- [ ] `/components/pricing/quotations/EditableLineItemRow.tsx`
- [ ] `/components/pricing/quotations/TagInput.tsx` (replaced by DropdownTagInput)
- [ ] `/components/pricing/quotations/MarineInsuranceForm.tsx` (V2 is live)
- [ ] `/components/pricing/quotations/OthersForm.tsx` (V2 is live)
- [ ] `/components/pricing/PricingQuotations.tsx`
- [ ] `/components/operations/shared/ContractBillingPreview.tsx`

---

## Batch 4 — Dead Data/Utils/Imports/Reporting (~30 files)

**Status:** DONE (28 files deleted 2026-02-25 — data, utils, imports, entire reporting/ directory)

### Dead data files:
- [ ] `/data/bdMockData.ts`
- [ ] `/data/pricingMockData.ts`

### Dead utility files:
- [ ] `/utils/seedData.ts`
- [ ] `/utils/seedDatabase.ts`
- [ ] `/utils/seed-users.ts`
- [ ] `/utils/migrateBookingAssignments.ts`
- [ ] `/utils/serviceTemplates.ts`
- [ ] `/config/serviceTemplates.ts`

### Dead shared files:
- [ ] `/components/shared/billings/UnifiedBillingsTab.old.tsx`

### Dead root files:
- [ ] `/test-router.tsx`
- [ ] `/scripts/update-partners.js`

### Dead `/imports/` artifacts:
- [ ] `/imports/Container.tsx`
- [ ] `/imports/Neuron20Prototype.tsx`
- [ ] `/imports/Neuron20Prototype-7087-3481.tsx`
- [ ] `/imports/PhilippinePeso.tsx`
- [ ] `/imports/Vector.tsx`

### Entire `/components/reporting/` directory (11 files):
- [ ] `ChartCard.tsx`
- [ ] `CompanySelect.tsx`
- [ ] `DataTable.tsx`
- [ ] `DateControlsCard.tsx`
- [ ] `FilterBar.tsx`
- [ ] `KPICard.tsx`
- [ ] `ReportingHeader.tsx`
- [ ] `ReportingPage.tsx`
- [ ] `TimeSeriesCard.tsx`
- [ ] `design-tokens.ts`
- [ ] `mock-data.ts`
- [ ] `README.md`

---

## Batch 5 — Root Markdown Cleanup + Minor Code Cleanup

**Status:** DONE (2026-02-25 — ~130 root markdown files deleted, isPrefilled helper removed from CreateBrokerageBookingPanel.tsx, ContractDetectionBanner confirmed still live, NeuronCard confirmed still live)

### Root-level markdown files (~130 files):
All `/*.md` files at project root. Active blueprints in `/docs/blueprints/` are NOT touched.

### Minor code cleanup:
- [ ] Remove dead `isPrefilled` helper from `CreateBrokerageBookingPanel.tsx`
- [ ] Remove stale `ContractDetectionBanner` imports if component is no longer rendered
- [ ] Verify `NeuronCard` usage in `ExecutiveDashboard.tsx` (keep or inline)

---

## Future DRY Opportunities (Post-Cleanup)

- Extract shared `BookingFormSection` / `FormField` from 5 booking panels
- Consider inlining `NeuronCard` into `ExecutiveDashboard` if it's the sole consumer
- Consolidate `CustomDropdown` vs `SearchableDropdown` usage patterns

---

## Change Log

| Date | Action | Files Affected |
|---|---|---|
| 2026-02-25 | Blueprint created, analysis complete | N/A |
| 2026-02-25 | Batch 1 DONE | 31 root-level dead components deleted |
| 2026-02-25 | Batch 2 DONE | 31 files — 7 AccountingV* shells, entire accounting-v3/ and accounting-v6/ directories |
| 2026-02-25 | Batch 3 DONE | 16 files — 5 dead booking modals, 11 dead pricing/quotation files |
| 2026-02-25 | Batch 4 DONE | 28 files — data, utils, imports, entire reporting/ directory |
| 2026-02-25 | Batch 5 DONE | ~130 root markdown files, dead isPrefilled helper, component-level markdown files |
| 2026-02-25 | ALL COMPLETE | Total: ~240+ files deleted, ~55,000+ lines removed |