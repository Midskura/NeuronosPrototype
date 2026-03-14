# Multi-Currency Invoicing Blueprint (Snapshot Strategy)

**Goal:** Allow users to generate Invoices in a target currency (e.g., PHP) from source items in a different currency (e.g., USD) by providing a manual exchange rate at the time of invoice creation.

**Strategy:**
- **Source of Truth:** Projects and Billings remain in their original currency (e.g., USD).
- **Snapshot:** The Invoice acts as a converted snapshot.
- **Data Model:** Store `exchange_rate`, `original_amount`, and `original_currency` on the Invoice/Line Items to preserve the audit trail.

## Phase 1: Type Definitions & Data Model ✅ (Complete)
- [x] Update `types/accounting.ts`
    - [x] Add `exchange_rate` and `original_currency` to `Invoice` interface.
    - [x] Add `original_amount`, `original_currency`, and `exchange_rate` to `BillingLineItem` interface.

## Phase 2: Invoice Builder Logic (The Engine) ✅ (Complete)
- [x] Update `components/projects/invoices/InvoiceBuilder.tsx`
    - [x] Add state for `targetCurrency` (Default: PHP).
    - [x] Add state for `exchangeRate` (Default: 1.00 or fetch from recent if possible, but manual for now).
    - [x] Implement `convertedAmount` calculation logic:
        - If `item.currency !== targetCurrency`, `amount = item.amount * exchangeRate`.
        - Else `amount = item.amount`.
    - [x] Add UI controls for "Target Currency" and "Exchange Rate" in the sidebar.
    - [x] Update "Billing Items" list to show conversion preview (e.g., "$100 -> ₱5,600"). (Partially covered by the hint, detailed preview next if needed).

## Phase 3: Invoice Document Rendering (The Output) ✅ (Complete)
- [x] Update `components/projects/invoices/InvoiceDocument.tsx`
    - [x] Display `targetCurrency` symbol in totals.
    - [x] Update line item rendering to show converted amounts.
    - [x] Optionally append conversion details to description (e.g., "@ 56.00 USD").

## Phase 3: Invoice Document Rendering (The Output) ⏳
- [ ] Update `components/projects/invoices/InvoiceDocument.tsx`
    - [ ] Display `targetCurrency` symbol in totals.
    - [ ] Update line item rendering to show converted amounts.
    - [ ] Optionally append conversion details to description (e.g., "@ 56.00 USD").

## Phase 4: Backend & Persistence ✅ (Complete)
- [x] Verify `POST /accounting/invoices` payload handles the new fields.
    - [x] Updated `InvoiceBuilder.tsx` to send full snapshot payload (currency, exchange_rate, line_items, metadata, etc.).
    - [x] Updated `supabase/functions/server/accounting-handlers.tsx` to accept and store the snapshot payload instead of recalculating from scratch.

---

**Status:** Implementation Complete. Ready for verification.

---

**Current Status:** Starting Phase 1.
