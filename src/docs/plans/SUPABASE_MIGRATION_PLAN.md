# Migration Plan: Off Edge Function → Direct Supabase

## Context

The make-server-c142e950 Edge Function is currently unreachable (404) and was deployed through Figma Make's Supabase
connector — a mechanism the user can no longer use. The user is migrating to direct Supabase client calls + RLS as
the backend, eliminating the Edge Function entirely. Figma Make is being abandoned in ~3 days but is still the
editing environment for now.

JWT middleware plan is CANCELLED — no point hardening a server that will be deleted.

---

## End State

All frontend data access goes through:

```ts
import { createClient } from '@supabase/supabase-js';
// or the existing supabase client from utils/supabase/info
supabase.from('table').select(...).eq(...)
```

Security enforced by Supabase RLS policies on each table, using the user's JWT automatically.

---

## Priority Order

### Priority 1 — DB Constraints (unblocked, do now)

These SQL steps don't depend on the Edge Function at all. Run in Supabase SQL Editor.

**Step 5 — Drop password column** (was blocked by Edge Function; unblocked now):

```sql
ALTER TABLE users DROP COLUMN IF EXISTS password;
```

Safe to run immediately — the Edge Function is already dead (404), and the frontend uses
`supabase.auth.signInWithPassword()` directly.

**Add role/dept constraints** (from 004_role_constraints.sql):

```sql
ALTER TABLE users ADD CONSTRAINT users_department_check
  CHECK (department IN ('Business Development','Pricing','Operations','Accounting','Executive','HR'));
ALTER TABLE users ADD CONSTRAINT users_role_check
  CHECK (role IN ('rep','manager','director'));
ALTER TABLE users ADD CONSTRAINT users_service_type_check
  CHECK (service_type IS NULL OR service_type IN ('Forwarding','Brokerage','Trucking','Marine Insurance','Others'));
ALTER TABLE users ADD CONSTRAINT users_operations_role_check
  CHECK (operations_role IS NULL OR operations_role IN ('Manager','Supervisor','Handler'));
ALTER TABLE users DROP COLUMN IF EXISTS permissions;
```

---

### Priority 2 — RLS Policies (security foundation before migrating frontend calls)

Without the Edge Function as a security layer, RLS is the only thing preventing any authenticated user from
reading/writing any table. Must be in place before removing the Edge Function from the frontend.

**Key policies needed** (Phase 6 from original plan):

- **users** — authenticated users can SELECT their own row; managers/directors can SELECT all
- **customers / contacts** — BD CRUD; Pricing, Operations, Accounting SELECT only; HR no access
- **quotations** — BD creates; Pricing prices; others SELECT
- **evouchers / invoices** — Accounting CRUD; others SELECT
- **activity_log** — directors see all; managers see their dept; reps see own
- **tickets** — directors see all; managers see their dept inbox; reps see own

**Helper functions needed** (if not already created by 003_supabase_auth.sql):

```sql
CREATE OR REPLACE FUNCTION get_my_profile_id() RETURNS TEXT AS $$
  SELECT id FROM users WHERE auth_id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION get_my_role() RETURNS TEXT AS $$
  SELECT role FROM users WHERE auth_id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION get_my_department() RETURNS TEXT AS $$
  SELECT department FROM users WHERE auth_id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;
```

---

### Priority 3 — Frontend Migration (replace Edge Function calls)

Every `fetch(${API_URL}/...)` call in the frontend gets replaced with a direct `supabase.from()` call.

**New pattern** (src/utils/supabase/client.ts — check if already exists):

```ts
import { createClient } from '@supabase/supabase-js';
import { projectId, publicAnonKey } from './info';
export const supabase = createClient(
  `https://${projectId}.supabase.co`,
  publicAnonKey
);
```

The JWT is forwarded automatically — Supabase JS client attaches the user's session token to every request.

**Migration by module** (rough scope):

| Module     | Edge Function calls          | Direct Supabase pattern                                   |
|------------|------------------------------|-----------------------------------------------------------|
| Users/Auth | /auth/me, /users             | supabase.from('users').select('*').eq('auth_id', user.id) |
| Customers  | /customers/*                 | supabase.from('customers').select/insert/update/delete()  |
| Contacts   | /contacts/*                  | supabase.from('contacts')...                              |
| Quotations | /quotations/*                | supabase.from('quotations')...                            |
| Tickets    | /tickets/*                   | supabase.from('tickets')...                               |
| Accounting | /billing/*, /invoices/* etc. | supabase.from('billings')...                              |

The `useUsers` hook from Phase 2 is already the correct pattern — it calls `supabase.from('users')` directly. Replicate
this for all other modules.

---

### Priority 4 — Remove Edge Function References ✅ COMPLETE

Once all frontend calls are migrated:

- [x] Delete `/utils/api.ts` (apiFetch definition) — deleted session 3
- [x] Delete `/utils/fetchWithRetry.ts` (only consumer was api.ts) — deleted session 3
- [ ] Delete `src/supabase/functions/server/` directory — BLOCKED (files are system-protected in Figma Make; delete manually after export)
- [x] Remove `API_URL` constant from all components — no active `API_URL` constants remain (only harmless comments in BD/Pricing)
- [x] Remove `publicAnonKey` usage as an auth token — no components use it for auth headers; only legitimate uses remain (SupabaseDebug.tsx, client.ts)
- [x] Remove stale `import { projectId, publicAnonKey }` — no stale imports remain; only App.tsx (projectId), SupabaseDebug.tsx, client.ts retain legitimate imports
- [x] Verify zero `apiFetch` consumers — confirmed codebase-wide scan: 0 matches outside deleted api.ts

### Remaining Manual Steps (Supabase SQL Editor)

- [ ] Apply RLS policies: run `/supabase/migrations/005_rls_policies.sql`
- [ ] Apply DB constraints: run `/supabase/migrations/004_role_constraints.sql`
- [ ] Drop password column: `ALTER TABLE users DROP COLUMN IF EXISTS password;`
- [ ] After export: delete `/supabase/functions/server/` directory manually

---

## What to Do in Figma Make (immediate)

### MIGRATION PROGRESS TRACKER (Updated: 2026-03-15)

#### COMPLETED — Phase A: Hooks & Utilities (14 files)
- [x] useUser.tsx (prior session)
- [x] useUsers.ts (prior session)
- [x] useCustomerOptions.ts
- [x] useEVouchers.ts
- [x] useConsignees.ts
- [x] useBookingRateCard.ts
- [x] useContractBillings.ts
- [x] useContractFinancials.ts
- [x] useProjectFinancials.ts
- [x] useEVoucherSubmit.ts
- [x] useNetworkPartners.ts
- [x] useFinancialHealthReport.ts
- [x] useProjectsFinancialsMap.ts
- [x] useReportsData.ts

#### COMPLETED — Phase B: Accounting Module (17 files)
- [x] AccountingCustomers.tsx (prior session)
- [x] CustomerLedgerDetail.tsx
- [x] BillingsContentNew.tsx
- [x] CollectionsContentNew.tsx
- [x] ExpensesPageNew.tsx
- [x] ExpensesPage.tsx (legacy)
- [x] BillingDetailsSheet.tsx
- [x] CollectionDetailsSheet.tsx
- [x] ExpenseDetailsSheet.tsx
- [x] FinancialReports.tsx
- [x] EVoucherHistoryTimeline.tsx
- [x] EVoucherWorkflowPanel.tsx
- [x] EVoucherDetailView.tsx
- [x] AddRequestForPaymentPanel.tsx
- [x] PostToLedgerPanel.tsx
- [x] FinancialsModule.tsx
- [x] CatalogManagementPage.tsx
- [x] ChargeExpenseMatrix.tsx
- [x] AuditingSummary.tsx
- [x] AggregateInvoicesPage.tsx

#### COMPLETED — Phase C: Core App Components (6 files)
- [x] ActivityLogPage.tsx
- [x] Admin.tsx
- [x] BusinessDevelopment.tsx
- [x] DiagnosticsPage.tsx
- [x] InboxPage.tsx
- [x] Pricing.tsx

#### COMPLETED — Phase D: Utilities (5 files)
- [x] accounting-api.ts
- [x] cleanupDuplicates.ts
- [x] contractAutofill.ts
- [x] contractLookup.ts
- [x] projectAutofill.ts

#### COMPLETED — Phase E: BD Module (20 files)
- [x] ActivitiesList.tsx
- [x] ActivityDetailInline.tsx
- [x] AddActivityPanel.tsx
- [x] AddContactPanel.tsx
- [x] AddTaskPanel.tsx
- [x] BDReports.tsx
- [x] BudgetRequestDetailPanel.tsx
- [x] BudgetRequestList.tsx
- [x] ContactDetail.tsx
- [x] CustomerDetail.tsx
- [x] TaskDetailInline.tsx
- [x] TasksList.tsx
- [x] AddInquiryPanel.tsx
- [x] CreateProjectModal.tsx
- [x] CustomerFinancialsTab.tsx
- [x] reports/ReportControlCenter.tsx
- [x] reports/ReportResults.tsx
- [x] reports/ReportTemplates.tsx
- [x] reports/SavedReports.tsx
- [x] reports/ReportsModule.tsx

#### COMPLETED — Phase F: CRM Module (6 files)
- [x] ContactsListWithFilters.tsx
- [x] ContactsModuleWithBackend.tsx
- [x] CustomersListWithFilters.tsx
- [x] CompanyAutocomplete.tsx
- [x] ContactPersonAutocomplete.tsx
- [x] CustomerAutocomplete.tsx

#### COMPLETED — Phase G: Operations Module (18 files)
- [x] BrokerageBookingDetails.tsx
- [x] BrokerageBookings.tsx
- [x] CreateBrokerageBookingPanel.tsx
- [x] CreateMarineInsuranceBookingPanel.tsx
- [x] CreateOthersBookingPanel.tsx
- [x] CreateTruckingBookingPanel.tsx
- [x] MarineInsuranceBookingDetails.tsx
- [x] MarineInsuranceBookings.tsx
- [x] OthersBookingDetails.tsx
- [x] OthersBookings.tsx
- [x] TruckingBookingDetails.tsx
- [x] TruckingBookings.tsx
- [x] OperationsReports.tsx
- [x] forwarding/CreateForwardingBookingPanel.tsx
- [x] forwarding/ForwardingBookingDetails.tsx
- [x] forwarding/ForwardingBookings.tsx
- [x] shared/ExpensesTab.tsx
- [x] shared/CreateExpenseModal.tsx

#### COMPLETED — Phase H: Pricing & Ticketing (10 files)
- [x] pricing/PricingReports.tsx
- [x] pricing/QuotationFileView.tsx
- [x] pricing/TeamAssignmentForm.tsx
- [x] pricing/VendorDetail.tsx
- [x] pricing/VendorsList.tsx
- [x] pricing/ContractDetailView.tsx
- [x] pricing/quotations/VendorsSection.tsx
- [x] pricing/CreateBookingsFromProjectModal.tsx
- [x] TicketQueuePage.tsx
- [x] TicketTestingDashboard.tsx

#### COMPLETED — Phase I: Projects Module (9 files)
- [x] projects/ProjectBookingReadOnlyView.tsx
- [x] projects/ProjectBookingsTab.tsx
- [x] projects/ProjectDetail.tsx
- [x] projects/ProjectExpensesTab.tsx
- [x] projects/ProjectsModule.tsx ✅ migrated session 2
- [x] projects/CreateBookingFromProjectModal.tsx ✅ migrated session 2
- [x] projects/ProjectBillingsTab.tsx ✅ migrated session 2
- [x] projects/ProjectFinancialsTab.tsx ✅ migrated session 2
- [x] projects/invoices/InvoiceBuilder.tsx ✅ migrated session 3 (full rewrite to fix dead code)

#### COMPLETED — Phase J: Ticketing Submodule (5 files)
- [x] ticketing/EntityPickerModal.tsx ✅ migrated session 3
- [x] ticketing/NewTicketPanel.tsx ✅ migrated session 3
- [x] ticketing/TicketDetailModal.tsx ✅ migrated session 3
- [x] ticketing/TicketManagementTable.tsx ✅ migrated session 3
- [x] ticketing/NewTicketModal.tsx ✅ migrated session 3

#### COMPLETED — Phase K: Contracts Module (2 files)
- [x] contracts/ContractsModule.tsx ✅ migrated session 3
- [x] contracts/RateCalculationSheet.tsx ✅ migrated session 3

#### COMPLETED — Phase L: Shared Components (9 files)
- [x] shared/billings/BillingCategorySection.tsx ✅ migrated session 3
- [x] shared/billings/AddChargeModal.tsx ✅ migrated session 3
- [x] shared/billings/UnifiedBillingsTab.tsx ✅ migrated session 3
- [x] shared/pricing/CatalogItemCombobox.tsx ✅ migrated session 3
- [x] shared/BookingCommentsTab.tsx ✅ migrated session 3
- [x] shared/CommentsTab.tsx ✅ migrated session 3
- [x] shared/ConsigneeInfoBadge.tsx ✅ migrated session 3
- [x] shared/ConsigneePicker.tsx ✅ migrated session 3
- [x] shared/EntityAttachmentsTab.tsx ✅ migrated session 3

#### COMPLETED — Phase M: Transactions Module (1 file)
- [x] transactions/TransactionsModule.tsx ✅ migrated session 3

**✅ MIGRATION COMPLETE — All 111 files migrated, 0 apiFetch consumers remain.**
**`/utils/api.ts` and `/utils/fetchWithRetry.ts` deleted. Edge Function server files are system-protected (delete after export).**
**Only manual steps remaining: apply RLS policies + DB constraints via Supabase SQL Editor.**

**See also**: `/docs/HANDOFF_ROLE_ARCHITECTURE_MIGRATION.md` for full context on the user role-based architecture migration, current status, and remaining manual steps.

---

## Verification

After RLS policies are in place:

- Log in as a BD rep → can SELECT customers, cannot DELETE
- Log in as Accounting → can SELECT customers but not INSERT
- Log in as HR → cannot SELECT customers at all
- Attempt `supabase.from('users').select('*')` as a rep → should only return own row