# ESSENTIALS MODE BLUEPRINT
## Simplified Accounting Department + Financial Health Reports

**Created:** 2026-03-02
**Status:** COMPLETE

---

## Summary

A runtime "Essentials vs Full Suite" toggle that switches the Accounting department between a simplified operational view (Billings, Expenses, Invoices, Collections, Reports) and the full accounting infrastructure. Both modes share the same backend and data. Aggregate pages render the **exact same Unified tab components** used in project/contract detail views, ensuring 1:1 visual parity.

---

## PHASE 1: Mode Toggle Infrastructure
**Status:** DONE

### What
- Created `/config/appMode.tsx` — React context + provider + `useAppMode()` hook
- Mode stored in `localStorage` as `neuron_app_mode: "essentials" | "full"`
- Default: `"essentials"`
- Added toggle to login page — segmented control below Sign In button
- Wrapped App tree with `AppModeProvider`

---

## PHASE 2: Sidebar Gating + Routes
**Status:** DONE

### What
- Imported `useAppMode()` in `NeuronSidebar.tsx`
- Essentials mode Accounting shows: **Billings, Expenses, Invoices, Collections, Reports** only
- Full Suite mode: shows everything (Transactions, Customers, Projects, Contracts, E-Vouchers, Billings, Invoices, Collections, Expenses, Auditing, COA, Reports)
- Added `"acct-invoices"` to Page type union
- Added `/accounting/invoices` route in App.tsx

---

## PHASE 3: Aggregate Pages (Reusing Exact Unified Components)
**Status:** DONE

### What was implemented
- **3A:** Added `readOnly?: boolean` prop to `UnifiedInvoicesTab`, `UnifiedCollectionsTab`, and `UnifiedExpensesTab`. When `readOnly={true}`, create/add buttons are hidden. `UnifiedBillingsTab` already had this prop.
- **3B:** Created 4 thin aggregate wrapper pages:
  - `AggregateBillingsPage.tsx` — fetches ALL billing items → passes to `UnifiedBillingsTab` with `readOnly={true}`
  - `AggregateExpensesPage.tsx` — fetches ALL expenses → passes to `UnifiedExpensesTab` with `readOnly={true}`
  - `AggregateInvoicesPage.tsx` — fetches ALL invoices + billing items + collections → constructs `FinancialData` → passes to `UnifiedInvoicesTab` with `readOnly={true}`
  - `AggregateCollectionsPage.tsx` — fetches ALL collections + invoices → constructs `FinancialData` → passes to `UnifiedCollectionsTab` with `readOnly={true}`
- **3C:** Billings & Expenses aggregate pages include a tab bar: `All [Items] | Catalog`, with Catalog tab rendering existing `CatalogManagementPage`
- **3D:** Wired into `Accounting.tsx` — Essentials mode routes billings/expenses/collections to aggregate pages; Full Suite keeps original pages. Invoices aggregate is used in both modes.

---

## PHASE 4: Financial Health Reports Page
**Status:** DONE

### What was implemented
- **Data hook:** `/hooks/useFinancialHealthReport.ts` — fetches all projects, billing items, expenses, invoices, collections in parallel. Groups by `project_number`, calculates per-project: billing total, expenses, admin cost (3%), total expenses, collected amount, gross profit. Supports month filter (YYYY-MM format) and returns rows + summary totals.
- **Page component:** `/components/accounting/reports/FinancialHealthPage.tsx` — Full sales report page with:
  - Header with month picker (chevron nav + "All Time" toggle), Export CSV button
  - 4 summary cards: Total Billings, Total Expenses, Collected, Gross Profit (color-coded)
  - Search bar (Job No., Company, Invoice #)
  - DataTable with 9 columns: Job No./Date, Company, Invoice(s), Billing Total, Expenses, Admin 3%, Total Expenses, Collected, Gross Profit
  - Footer summary row with totals
  - Profit values color-coded: green for positive, red for negative
  - CSV export includes all filtered rows plus totals row
- **Wiring:** In `Accounting.tsx`, Essentials mode routes `reports` → `FinancialHealthPage`; Full Suite keeps `FinancialReports`

---

## Phase Checklist

- [x] Phase 1: Mode Toggle Infrastructure
- [x] Phase 2: Sidebar Gating + Routes
- [x] Phase 3: Aggregate Pages (Reusing Unified Components)
- [x] Phase 4: Financial Health Reports Page

---

## Files Created/Modified

| File | Action |
|---|---|
| `/config/appMode.tsx` | NEW — mode context + provider + hook |
| `/App.tsx` | MODIFIED — AppModeProvider wrapper, login toggle, acct-invoices route |
| `/components/NeuronSidebar.tsx` | MODIFIED — mode-aware acctSubItems, acct-invoices Page type |
| `/components/accounting/Accounting.tsx` | MODIFIED — mode-aware routing for all views |
| `/components/shared/invoices/UnifiedInvoicesTab.tsx` | MODIFIED — added readOnly prop |
| `/components/shared/collections/UnifiedCollectionsTab.tsx` | MODIFIED — added readOnly prop |
| `/components/accounting/UnifiedExpensesTab.tsx` | MODIFIED — added readOnly prop |
| `/components/accounting/AggregateBillingsPage.tsx` | NEW — wrapper with Catalog tab |
| `/components/accounting/AggregateExpensesPage.tsx` | NEW — wrapper with Catalog tab |
| `/components/accounting/AggregateInvoicesPage.tsx` | NEW — wrapper using FinancialData |
| `/components/accounting/AggregateCollectionsPage.tsx` | NEW — wrapper using FinancialData |
| `/hooks/useFinancialHealthReport.ts` | NEW — data aggregation hook |
| `/components/accounting/reports/FinancialHealthPage.tsx` | NEW — sales report page |

## Backend Impact: NONE
All data comes from existing APIs. Both modes read/write the same KV store. No new endpoints needed.
