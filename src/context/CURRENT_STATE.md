# Current State — As of March 3, 2026

## What's Working

The application is fully functional with the following modules operational:

### Core Business Flow
1. **Inquiries** → **Quotations** (spot or contract) → **Projects** (for spot) or **Contract Activation** → **Bookings** → **Billings** → **Invoices** → **Collections**
2. All 5 service types operational: Forwarding, Brokerage, Trucking, Marine Insurance, Others
3. Contract rate engine automatically calculates billing from contract rates + booking quantities
4. Smart contract detection: when creating a booking, the system detects active contracts for the customer

### Financial Pipeline
- E-voucher creation → approval workflow → posting to ledger/billings/collections
- Invoice generation from billing items
- Collection recording against invoices
- Financial calculations (revenue, expenses, profit, margins) at project, contract, and system levels

### Essentials Mode (just completed)
- Toggle on login page between "Essentials" and "Full Suite"
- Essentials: simplified Accounting sidebar (5 items) with aggregate pages
- Aggregate pages render the SAME Unified tab components as project detail views
- Financial Health sales report with per-project breakdown

### Other Operational Features
- Ticketing system (create, assign, track, comment)
- Activity logging
- File attachments (Supabase Storage)
- Comments with attachments
- Network partner management with rate cards
- HR module (employees, payroll)
- Executive dashboard with KPI cards and charts

## What's NOT Working / Known Limitations

1. **No real authentication** — mock login, any email/password works. User data stored in localStorage.
2. **No email integration** — no notifications, no email sending
3. **No real-time updates** — data refreshes only on explicit action or page load
4. **Server file is very large** — `/supabase/functions/server/index.tsx` is ~10,400 lines. Consider splitting into more handler files.
5. **Some legacy code remains** — `CreateProjectModal.tsx` and `ExpenseModal.tsx` are deprecated but not deleted
6. **Phase 6 of Inquiries/Quotations Cleanup** not formally marked done in blueprint (but work is effectively complete)

## Recently Completed (most recent session)

### Essentials Mode — Phase 3 & 4
- Added `readOnly` props to `UnifiedInvoicesTab`, `UnifiedCollectionsTab`, `UnifiedExpensesTab`
- Created 4 aggregate wrapper pages (`AggregateBillingsPage`, `AggregateExpensesPage`, `AggregateInvoicesPage`, `AggregateCollectionsPage`)
- Billings & Expenses aggregate pages have tab bars: "All Items" | "Catalog"
- Mode-aware routing in `Accounting.tsx`
- Financial Health Report page with data hook, summary cards, per-project table, CSV export

## What Might Come Next

These are items the user has discussed but not yet started:

1. **Billings Module Restructure** — parked design in `/docs/designs/BILLINGS_MODULE_RESTRUCTURE.md`. Queue-based workflow with "Needs Billing" and "Recently Billed" sections. Would replace the flat billing list with a booking-centric workflow.

2. **Booking Panel DRY** — blueprint exists at `BOOKING_PANEL_DRY_BLUEPRINT.md`. The 5 booking creation panels share a lot of code that could be consolidated.

3. **Further Financial Reports** — the Financial Health page is a starting point. More reports (client profitability, expense breakdown, receivables aging) could be built.

4. **Real Auth** — replacing mock login with Supabase Auth (the backend has scaffolding for it but it's not wired up).

## Environment Notes

- **Supabase secrets already configured:** `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_DB_URL`
- **No additional API keys needed** for current functionality
- **Data persists** in Supabase KV store — it's not reset on page refresh (unlike the original mock-data version)
- **Seed endpoints exist** for initial data: `/users/seed`, `/partners/seed`, `/seed/coa-balance-sheet`, `/seed/coa-income-statement`, `/ticket-types/seed`, `/accounts/seed`, `/client-handler-preferences/seed`
