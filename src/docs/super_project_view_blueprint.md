# Super Project View Implementation Plan

**Goal:** Combine `ProjectProfitabilityDetail.tsx` (Accounting) and `ProjectDetail.tsx` (BD/Pricing) into a unified, DRY "Super Project View".

**Strategy:** Modularize & Integrate. Refactor `ProjectDetail.tsx` to be the master container and extract logic/UI into reusable hooks and components.

---

## Phase 1: Logic Extraction (The Brain)
**Objective:** Extract data fetching and calculation logic into a shared custom hook.

- [x] **1.1 Create `useProjectFinancials` Hook**
    - Source: `ProjectProfitabilityDetail.tsx`.
    - Functionality: Fetch Invoices, Billing Atoms, Expenses. Calculate Totals, Profit Margin, KPIs.
    - Location: `/hooks/useProjectFinancials.ts`.

## Phase 2: Component Modularization (The Limbs)
**Objective:** Break down the UI into focused, reusable components for each tab.

- [x] **2.1 Extract `ProjectFinancialOverview`**
    - Content: Charts, KPIs, Profit/Loss bars from `ProjectProfitabilityDetail.tsx`.
    - Location: `/components/projects/tabs/ProjectFinancialOverview.tsx`.
- [x] **2.2 Extract `ProjectInvoices`**
    - Content: Invoice list, "Receive Payment" logic.
    - Location: `/components/projects/tabs/ProjectInvoices.tsx`.
- [x] **2.3 Extract `ProjectBillings`**
    - Content: Billing atoms table, "Create Invoice" logic (checkboxes).
    - Location: `/components/projects/tabs/ProjectBillings.tsx`.
- [x] **2.4 Extract `ProjectExpenses`**
    - Content: Expenses list (enhanced version from Profitability view).
    - Location: `/components/projects/tabs/ProjectExpenses.tsx`.
- [ ] **2.5 Extract/Refine Other Tabs**
    - `ProjectQuotation` (Current Overview from ProjectDetail).
    - `ProjectBookings` (Existing logic).
    - `ProjectAttachments` & `ProjectComments`.

## Phase 3: The Super View (The Body)
**Objective:** Assemble the "Super Project View" in `ProjectDetail.tsx`.

- [x] **3.1 Refactor `ProjectDetail.tsx` Structure**
    - Implement the new Tab navigation (Financial Overview, Quotation, Bookings, Expenses, Billings, Invoices, Attachments, Comments).
    - Integrate `useProjectFinancials` hook.
- [x] **3.2 Integrate Components**
    - Render the components created in Phase 2 based on the active tab.

## Phase 4: Cleanup & Validation
**Objective:** Remove redundancy and ensure system stability.

- [x] **4.1 Verify Routes**
    - Ensure both Accounting and Operations users can access this new view (potentially replacing the old Accounting route).
- [x] **4.2 Delete Legacy Code**
    - Remove `ProjectProfitabilityDetail.tsx` once functionality is fully migrated.

---

## Current Status
- **Status:** COMPLETE
- **Outcome:** Successfully combined `ProjectProfitabilityDetail.tsx` and `ProjectDetail.tsx` into a single, modular `ProjectDetail.tsx`.
- **Key Changes:**
    - Created `useProjectFinancials` hook.
    - Extracted components: `ProjectFinancialOverview`, `ProjectInvoices`, `ProjectBillings`, `ProjectExpenses`.
    - Updated `ProjectDetail.tsx` to handle all tabs.
    - Updated `AccountingProjects.tsx` to use the new `ProjectDetail.tsx`.
    - Deleted `ProjectProfitabilityDetail.tsx`.
