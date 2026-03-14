# Neuron Financial Architecture Implementation Plan
## Blueprint for "Billings-First" Architecture

**Goal:** Restructure the Accounting Module to strictly follow the hierarchy:
`Quotation Items -> Billings (Pool) -> Invoices (Documents) -> Collections (Cash)`

This document tracks the phased implementation of this architecture.

---

## Phase 1: The Billing Atom (Data Structure & State)
**Objective:** Decouple "Billings" from "Invoices". A Billing is a line item, not a document.

- [x] **1.1 Refine `Billing` Type Definition**
    - Verified `/types/accounting.ts`. `Billing` (Atom) and `Invoice` (Document) types are correctly defined and distinct.
- [x] **1.2 Update `getBillings` API**
    - Verified `/supabase/functions/server/index.tsx`.
    - `/accounting/billing-items` -> `getBillings` (Returns Atoms).
    - `/accounting/invoices` -> `getInvoices` (Returns Documents).
    - `/accounting/billings` -> `getInvoices` (Legacy route).
- [x] **1.3 Create "Billable Expense" Trigger**
    - Confirmed existing logic in `accounting-handlers.tsx`.

## Phase 2: Project Detail View Restructure
**Objective:** Update the UI to reflect the separation of Billings (the pool) and Invoices (the documents).

- [x] **2.1 "Billings" Tab Overhaul**
    - Implemented in `ProjectProfitabilityDetail.tsx`.
    - Shows "Billings (Charges)" with checkboxes.
- [x] **2.2 "Invoices" Tab Implementation**
    - Implemented in `ProjectProfitabilityDetail.tsx`.
    - Shows Invoices with "Receive Payment" action.

## Phase 3: Invoice Generation Workflow
**Objective:** The mechanism to bundle Billings into an Invoice.

- [x] **3.1 "Generate Invoice" Modal**
    - Created `/components/accounting/CreateInvoiceModal.tsx`.
- [x] **3.2 Implement `createInvoice` Backend Handler**
    - Implemented `createInvoice` in `accounting-handlers.tsx` and mapped in `index.tsx`.
- [x] **3.3 Integrate Modal into View**
    - Updated `ProjectProfitabilityDetail.tsx` to handle selection and call the API.

## Phase 4: Collection Integration
**Objective:** Linking Cash In to Invoices.

- [x] **4.1 Update Collection Flow**
    - Updated `CreateEVoucherModal.tsx` to accept `invoiceData` prop.
    - Pre-fills amount and links to invoice number.
- [x] **4.2 Connect UI**
    - Updated `ProjectProfitabilityDetail.tsx` to open `CreateEVoucherModal` when "Receive Payment" is clicked.

---

## Current Status
- **Status:** COMPLETE
- **Outcome:** The system now strictly follows the `Quotation -> Billing Items -> Invoice -> Collection` hierarchy. All known errors have been resolved.
