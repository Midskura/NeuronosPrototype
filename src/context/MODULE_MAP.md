# Module Map — All Major Modules & Their Key Files

## 1. Business Development (`/components/bd/`)

**Purpose:** Sales pipeline — contacts, customers, inquiries, tasks, activities, budget requests.

| File | Role |
|---|---|
| `AddInquiryPanel.tsx` | Create new inquiry |
| `CustomerDetail.tsx` | Customer 360 view with tabs |
| `ContactDetail.tsx` | Contact profile |
| `TasksList.tsx`, `TaskDetailInline.tsx` | Task management |
| `ActivitiesList.tsx`, `ActivityDetailInline.tsx` | Activity tracking |
| `BudgetRequestList.tsx`, `BudgetRequestDetailPanel.tsx` | Budget requests |
| `CustomDropdown.tsx` | Portal-based dropdown (shared, critical pattern) |
| `reports/ReportsModule.tsx` | BD reporting |

## 2. Pricing / Quotations (`/components/pricing/`)

**Purpose:** Quotation building, contract management, vendor management.

| File | Role |
|---|---|
| `quotations/QuotationBuilderV3.tsx` | **Main quotation/contract editor** (complex, manually edited) |
| `QuotationsListWithFilters.tsx` | Quotation list page with status filters |
| `QuotationDetail.tsx` | Quotation detail view |
| `ContractDetailView.tsx` | Contract detail with bookings & financials (manually edited) |
| `quotations/ContractGeneralDetailsSection.tsx` | Contract header fields |
| `quotations/ContractRateToolbar.tsx` | Rate matrix toolbar |
| `quotations/ContractRateMatrixEditor.tsx` | Rate matrix editor |
| `quotations/QuotationRateBreakdownSheet.tsx` | Rate breakdown display |
| `quotations/TruckingDestinationBlocks.tsx` | Multi-destination trucking UI |
| `quotations/EditableBulletList.tsx` | Editable terms/conditions |
| `VendorsList.tsx`, `VendorDetail.tsx` | Vendor/partner management |
| `NetworkPartnersModule.tsx` | Network partners module |

### Shared Pricing Components (`/components/shared/pricing/`)
| File | Role |
|---|---|
| `CatalogItemCombobox.tsx` | Catalog item selector with one-click add |
| `FormattedNumberInput.tsx` | Numeric input with formatting |
| `PricingTableHeader.tsx` | Table header for pricing grids |
| `SharedPricingRow.tsx` | Reusable pricing row |
| `UniversalPricingRow.tsx` | Universal pricing row with all service support |

## 3. Operations (`/components/operations/`)

**Purpose:** Booking management for 5 service types.

| File | Role |
|---|---|
| `forwarding/ForwardingBookings.tsx` | Forwarding bookings list |
| `forwarding/ForwardingBookingDetails.tsx` | Forwarding booking detail |
| `forwarding/CreateForwardingBookingPanel.tsx` | Create forwarding booking |
| `BrokerageBookings.tsx` + `BrokerageBookingDetails.tsx` | Brokerage |
| `TruckingBookings.tsx` + `TruckingBookingDetails.tsx` | Trucking |
| `MarineInsuranceBookings.tsx` + details | Marine Insurance |
| `OthersBookings.tsx` + details | Others |
| `BookingFullView.tsx` | Universal booking detail with tabs |
| `shared/BookingCreationPanel.tsx` | Shared booking creation base |
| `shared/ContractDetectionBanner.tsx` | Shows active contract for customer |
| `shared/ProjectAutofillSection.tsx` | Auto-populates from project data |
| `shared/ExpensesTab.tsx` | Booking expenses |
| `shared/ServiceBookingRow.tsx` | Booking row in lists |

## 4. Projects (`/components/projects/`)

**Purpose:** Project management — the central entity linking quotations, bookings, and financials.

| File | Role |
|---|---|
| `ProjectsModule.tsx` | Module shell (used by BD, Pricing, Accounting) |
| `ProjectsList.tsx` | Project list with filters/tabs |
| `ProjectDetail.tsx` | Project detail with tabs |
| `ProjectFinancialsTab.tsx` | Financial overview |
| `ProjectBillingsTab.tsx` | Billing items |
| `ProjectExpensesTab.tsx` | Expenses |
| `ProjectBookingsTab.tsx` | Linked bookings |
| `ProjectCollectionsTab.tsx` | Collections |
| `ProjectAttachmentsTab.tsx` | File attachments |
| `invoices/InvoiceBuilder.tsx` | Invoice creation |
| `invoices/InvoiceDocument.tsx` | Invoice preview/print |
| `collections/CollectionCreatorPanel.tsx` | Record collections |

## 5. Contracts (`/components/contracts/`)

**Purpose:** Contract lifecycle — list, create bookings from contracts, rate cards.

| File | Role |
|---|---|
| `ContractsModule.tsx` | Module shell |
| `ContractsList.tsx` | Contract list (design reference for table styling) |
| `ContractStatusSelector.tsx` | Contract status workflow |
| `CreateBookingFromContractPanel.tsx` | Create booking under contract |
| `RateCalculationSheet.tsx` | Rate breakdown calculation |
| `BookingRateCardButton.tsx` | Rate card generation trigger |
| `RateCardGeneratorPopover.tsx` | Rate card generation UI |

## 6. Accounting (`/components/accounting/`)

**Purpose:** Financial tracking — billings, expenses, invoices, collections, e-vouchers, COA, reports.

| File | Role |
|---|---|
| `Accounting.tsx` | **Router** — maps view prop to sub-module (mode-aware) |
| `AggregateBillingsPage.tsx` | System-wide billings (Essentials mode) |
| `AggregateExpensesPage.tsx` | System-wide expenses (Essentials mode) |
| `AggregateInvoicesPage.tsx` | System-wide invoices |
| `AggregateCollectionsPage.tsx` | System-wide collections |
| `UnifiedExpensesTab.tsx` | Shared expense table component |
| `CatalogManagementPage.tsx` | Expense & Charge catalog management |
| `EVouchersContent.tsx` | E-voucher list and management |
| `evouchers/CreateEVoucherForm.tsx` | Create expense/collection voucher |
| `BillingsContentNew.tsx` | Billing list (Full Suite mode) |
| `ExpensesPageNew.tsx` | Expenses list (Full Suite mode) |
| `CollectionsContentNew.tsx` | Collections list (Full Suite mode) |
| `AuditingModule.tsx` | Auditing dashboard |
| `coa/ChartOfAccounts.tsx` | Chart of Accounts management |
| `reports/FinancialReports.tsx` | Income statement / balance sheet (Full Suite) |
| `reports/FinancialHealthPage.tsx` | Sales report (Essentials mode) |

### Shared Financial Components (`/components/shared/`)
| File | Role |
|---|---|
| `billings/UnifiedBillingsTab.tsx` | Billing items table (shared) |
| `invoices/UnifiedInvoicesTab.tsx` | Invoices table (shared) |
| `collections/UnifiedCollectionsTab.tsx` | Collections table (shared) |

## 7. Transactions (`/components/transactions/`)

**Purpose:** Bank account tracking and transaction management.

| File | Role |
|---|---|
| `TransactionsModule.tsx` | Main transactions view |
| `BankCardsCarousel.tsx` | Visual bank account cards |
| `TransactionsTable.tsx` | Transaction list |
| `TransactionModal.tsx` | Add/edit transaction |

## 8. CRM (`/components/crm/`)

**Purpose:** Contact and customer management (shared across BD, Pricing).

| File | Role |
|---|---|
| `ContactsModuleWithBackend.tsx` | Contacts module with API integration |
| `ContactDetailView.tsx` | Contact detail |
| `CustomersListWithFilters.tsx` | Customer list |
| `CustomerAutocomplete.tsx` | Customer search/select |
| `ContactPersonAutocomplete.tsx` | Contact person search |
| `CompanyAutocomplete.tsx` | Company name search |

## 9. HR (`/components/hr/`)

**Purpose:** Employee management, payroll, timekeeping.

## 10. Ticketing (`/components/ticketing/`)

**Purpose:** Internal ticket/issue tracking system.

## 11. Reports (`/components/reports/`)

**Purpose:** Cross-module financial reports.

| File | Role |
|---|---|
| `CompanyPnLReport.tsx` | Company P&L |
| `ClientProfitabilityReport.tsx` | Per-client profitability |
| `BookingProfitabilityReport.tsx` | Per-booking profitability |
| `ExpenseBreakdownReport.tsx` | Expense analysis |
| `ReceivablesReport.tsx` | Outstanding receivables |

---

## Key Hooks (`/hooks/`)

| Hook | Purpose |
|---|---|
| `useUser.tsx` | Auth context, user state, dev role override |
| `useProjectFinancials.ts` | Fetches all financial data for a project (invoices, billings, expenses, collections) |
| `useContractFinancials.ts` | Financial data for a contract |
| `useContractBillings.ts` | Billing items for a contract |
| `useBillingMerge.ts` | Merges virtual billing items from quotation with actual billing items |
| `useBookingRateCard.ts` | Rate card data for a booking |
| `useEVouchers.ts` | E-voucher data fetching |
| `useEVoucherSubmit.ts` | E-voucher creation/submission |
| `useFinancialHealthReport.ts` | Aggregate financial data for sales report |
| `useNeuronCache.tsx` | Client-side caching layer |
| `useNetworkPartners.ts` | Network partners data |
| `useProjectsFinancialsMap.ts` | Batch financial data for project list views |

## Key Utils (`/utils/`)

| Utility | Purpose |
|---|---|
| `contractRateEngine.ts` | Calculates billing from contract rates + booking quantities |
| `contractAdapter.ts` | Adapts quotation data for contract contexts |
| `contractAutofill.ts` | Auto-populates contract fields from quotation |
| `contractLookup.ts` | Finds active contracts for customers |
| `contractQuantityExtractor.ts` | Extracts quantities from booking data |
| `rateCardToBilling.ts` | Converts rate cards to billing line items |
| `financialCalculations.ts` | `calculateFinancialTotals()` — central financial math |
| `quotation-helpers.tsx` | Quotation utility functions (manually edited) |
| `quotationCalculations.ts` | Quotation math |
| `fetchWithRetry.ts` | Retry wrapper for fetch (manually edited) |
| `bookingStatus.ts` | Booking status helpers |
| `projectStatus.ts` | Project status helpers |
| `statusMapping.ts` | Status display mapping |
| `permissions.ts` | Role/department permission checks |
| `pricing/categoryHelpers.ts` | Charge category utilities |
| `pricing/categoryPresets.ts` | Default charge category presets |
