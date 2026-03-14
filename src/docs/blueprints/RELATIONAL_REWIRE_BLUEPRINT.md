# Relational Rewire Blueprint

**Goal:** Replace all KV store operations in the server layer with direct Supabase relational table queries.
**Strategy:** Same API routes, same response shapes, zero frontend changes. Only the server data layer changes.
**Key files:**
- `/supabase/functions/server/index.tsx` (~11,400 lines, 38 API sections)
- `/supabase/functions/server/accounting-handlers.tsx`
- `/supabase/functions/server/accounting-new-api.ts`
- `/supabase/functions/server/catalog-handlers.tsx`
- `/supabase/functions/server/db.ts` (NEW — relational DB client)

---

## Phase Tracker

| Phase | Domain | API Sections (index.tsx lines) | Status |
|-------|--------|-------------------------------|--------|
| 0 | **DB Client Utility** | New file: `db.ts` | DONE |
| 1 | **Users & Auth** | AUTH & USERS (85-207) | DONE (seed users via relational) |
| 2 | **CRM Core** | CUSTOMERS, CONTACTS, CONSIGNEES, CLIENT HANDLER PREFS | DONE |
| 3 | **CRM Extended** | TASKS, ACTIVITIES, BUDGET REQUESTS | DONE |
| 4 | **Service Providers** | VENDORS, NETWORK PARTNERS, VENDOR LINE ITEMS, VENDOR CHARGE CATEGORIES | DONE |
| 5 | **Catalog** | `catalog-handlers.tsx` fully rewritten | DONE |
| 6 | **Quotations & Contracts** | QUOTATIONS CRUD, CONTRACT ACTIVATION, CONTRACT ACTIVITY LOG, CONTRACT ATTACHMENTS | DONE (helpers added: getQuotationMerged, saveQuotation) |
| 7 | **Projects** | PROJECTS CRUD, PROJECT ATTACHMENTS | DONE (helpers: getProjectMerged, saveProject) |
| 8 | **Bookings** | BOOKINGS (unified table), all 5 service-type creation endpoints | DONE (helpers: getBookingMerged, saveBooking) |
| 9 | **Financial** | E-VOUCHERS, EXPENSES, billing endpoints | DONE (helpers: getEvoucherMerged, saveEvoucher) |
| 10 | **Accounting/GL** | `accounting-handlers.tsx` fully rewritten, `accounting-new-api.ts` fully rewritten, COA seeding (`coa_structure.ts`) rewritten | DONE |
| 11 | **Support** | TICKET TYPES, TICKETS, TICKET COMMENTS, ACTIVITY LOG, INQUIRY/QUOTATION/BOOKING COMMENTS | DONE |
| 12 | **Reports & Seed** | SEED DATA (`seed_data.tsx` rewritten), BD REPORTS, CONTROL CENTER REPORTS | DONE |
| 13 | **Settings & Counters** | TX VIEW SETTINGS, counters (JSONB value column in 002) | DONE |

**ALL PHASES COMPLETE.** The only remaining `kv.*` references (8 total) are inside a commented-out legacy cleanup block (~lines 5071-5200 in index.tsx) that is dead code. The `import * as kv` on line 5 of index.tsx is retained only for that dead code reference.

---

## Conversion Pattern

Every handler conversion follows this pattern:

```typescript
// BEFORE (KV store):
const customers = await kv.getByPrefix("customer:");
const customer = await kv.get(`customer:${id}`);
await kv.set(`customer:${id}`, data);
await kv.del(`customer:${id}`);

// AFTER (Relational):
const { data: customers } = await db.from("customers").select("*");
const { data: customer } = await db.from("customers").select("*").eq("id", id).maybeSingle();
await db.from("customers").upsert(data);
await db.from("customers").delete().eq("id", id);
```

### Field Name Normalization
The KV store has mixed camelCase/snake_case. The relational schema enforces snake_case.
All handlers must normalize incoming data to snake_case before writing, and the response
can stay as-is since the frontend already handles both cases.

### Response Format
All endpoints return `{ success: true, data: ... }` or `{ success: false, error: "..." }`.
This MUST NOT change.

---

## Dependency Order

```
Phase 0: db.ts (no deps)
Phase 1: users (no deps)
Phase 2: customers, contacts, consignees (depends on users)
Phase 3: tasks, activities, budget_requests (depends on customers, contacts)
Phase 4: service_providers (no deps beyond users)
Phase 5: catalog (depends on catalog_categories)
Phase 6: quotations, contracts (depends on customers, contacts)
Phase 7: projects (depends on quotations, customers)
Phase 8: bookings (depends on projects, contracts)
Phase 9: evouchers, expenses (depends on bookings, projects)
Phase 10: accounting, journal_entries, transactions (depends on accounts, evouchers)
Phase 11: tickets, comments, activity_log (depends on users)
Phase 12: reports, seed data (depends on all above)
Phase 13: settings, counters (no deps, can be done anytime)
```

---

## Notes

- The `kv_store_robust.tsx` file is kept as-is for reference. The import in index.tsx line 5 is retained only for the dead code legacy cleanup block.
- All active code paths now use relational tables via `db.ts`.
- Seed data files (`seed_data.tsx`, `coa_structure.ts`) have been rewritten to insert directly into relational tables.
- The `002_schema_adjustments.sql` migration still needs to be run against the live Supabase project (`ubspbukgcxmzegnomlgi`). Key changes in 002:
  - `details` JSONB overflow columns on quotations, projects, bookings, evouchers
  - `counters.value` changed from INTEGER to JSONB (supports both numeric counters and JSON KV storage)
  - Activity log and ticket fields additions

### Column mapping fixes applied:
- `voucher_number` → `evoucher_number` (normalized in `saveEvoucher`)
- `timestamp` → `created_at` (in all activity_log queries)
- `action` → `action_type`, `department` → `user_department`, `details` → `metadata` (evoucher history inserts)
- Contract activity uses `contract_activity` table (not `activity_log`)
- `saved_reports` insert uses only schema-valid columns