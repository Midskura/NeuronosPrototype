# Relational Database Migration Blueprint

**Target:** Supabase project `ubspbukgcxmzegnomlgi` (fresh database)
**Source:** KV store `kv_store_c142e950` (47 unique prefixes -> 35 normalized tables)
**File:** `/supabase/migrations/001_full_schema.sql`

---

## Phase Tracker

| Phase | Description | Tables | Status |
|-------|-------------|--------|--------|
| 1 | Foundation: extensions, helpers, core identity | `users`, `settings`, `counters` | DONE |
| 2 | CRM | `customers`, `contacts`, `consignees`, `client_handler_preferences`, `tasks`, `crm_activities`, `budget_requests` | DONE |
| 3 | Pricing & Vendors | `service_providers`, `catalog_categories`, `catalog_items` | DONE |
| 4 | Quotations & Contracts | `quotations`, `contract_bookings`, `contract_activity`, `contract_attachments` | DONE |
| 5 | Projects & Bookings | `projects`, `bookings`, `project_bookings`, `project_attachments` | DONE |
| 6 | Financial: Billing & Collections | `evouchers`, `evoucher_history`, `invoices`, `billing_line_items`, `collections`, `expenses` | DONE |
| 7 | Accounting & GL | `accounts`, `journal_entries`, `transactions` | DONE |
| 8 | Support & System | `tickets`, `ticket_types`, `comments`, `activity_log`, `saved_reports` | DONE |
| 9 | Indexes, RLS policies, triggers | (cross-cutting) | DONE |

---

## KV Prefix -> Table Mapping (Quick Reference)

```
user:                        -> users
customer:                    -> customers
contact:                     -> contacts
consignee:                   -> consignees
client-handler-preference:   -> client_handler_preferences
task:                        -> tasks
activity:                    -> crm_activities
budget_request:              -> budget_requests
vendor: + partner:           -> service_providers  (MERGED)
catalog_item:                -> catalog_items
catalog_category:            -> catalog_categories
quotation:                   -> quotations  (includes contracts)
contract_activity:           -> contract_activity
contract_attachment:         -> contract_attachments
project:                     -> projects
booking: + 5 svc prefixes    -> bookings  (UNIFIED)
project_attachment:          -> project_attachments
evoucher:                    -> evouchers
evoucher_history:            -> evoucher_history
billing: (invoices)          -> invoices  (SPLIT)
billing: + billing_item:     -> billing_line_items  (SPLIT)
collection:                  -> collections
expense:                     -> expenses
account: + accounting:account: -> accounts  (MERGED)
journal_entry:               -> journal_entries
accounting:txn:              -> transactions
ticket:                      -> tickets
ticket_type:                 -> ticket_types
ticket_comment: + inquiry_comment: + booking_comment: -> comments  (POLYMORPHIC)
activity_log: + ticket_activity: + quotation_activity: + booking_activity: -> activity_log  (MERGED)
saved_report:                -> saved_reports
settings:*                   -> settings
*_counter keys               -> counters
vendor_line_items:           -> JSONB on service_providers
vendor_charge_categories:    -> JSONB on service_providers
```

---

## Notes

- All tables use `TEXT` primary keys to match existing KV ID formats (e.g., `BKG-1234567890-abc123`)
- `created_at` / `updated_at` are `TIMESTAMPTZ DEFAULT now()`
- Auto-update `updated_at` via trigger on every table
- JSONB columns for deeply nested document-style data (quotation pricing, evoucher approvers, etc.)
- RLS enabled on all tables; permissive policies for now (service-role key)