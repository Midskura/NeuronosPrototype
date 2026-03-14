-- ============================================================================
-- NEURON OS — Full Relational Schema Migration
-- ============================================================================
-- Target: Supabase project ubspbukgcxmzegnomlgi (fresh database)
-- Replaces: kv_store_c142e950 (47 KV prefixes -> 35 normalized tables)
-- Generated: 2026-03-13
-- ============================================================================

-- ============================================================================
-- PHASE 1: FOUNDATION — Extensions, Helpers, Core Identity
-- ============================================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Helper: auto-update updated_at on every row change
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Helper macro: attach the trigger to a table
-- Usage: SELECT add_updated_at_trigger('table_name');
CREATE OR REPLACE FUNCTION add_updated_at_trigger(tbl TEXT)
RETURNS VOID AS $$
BEGIN
  EXECUTE format(
    'CREATE TRIGGER trg_%I_updated_at BEFORE UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION update_updated_at()',
    tbl, tbl
  );
END;
$$ LANGUAGE plpgsql;

-- --------------------------------------------------------------------------
-- 1. users
-- KV prefix: user:
-- --------------------------------------------------------------------------
CREATE TABLE users (
  id            TEXT PRIMARY KEY,
  name          TEXT NOT NULL,
  email         TEXT,
  role          TEXT,                -- 'Admin','Manager','Operations','Accounting','BD','HR','Executive'
  department    TEXT,                -- 'Executive','Operations','Accounting','Business Development','HR','IT'
  avatar        TEXT,                -- URL or initials
  phone         TEXT,
  permissions   TEXT[] DEFAULT '{}', -- array of permission strings
  status        TEXT DEFAULT 'Active',
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now()
);
SELECT add_updated_at_trigger('users');

-- --------------------------------------------------------------------------
-- 2. settings
-- KV prefix: settings:* (e.g. settings:transaction-view)
-- --------------------------------------------------------------------------
CREATE TABLE settings (
  key           TEXT PRIMARY KEY,    -- e.g. 'transaction-view'
  value         JSONB NOT NULL DEFAULT '{}',
  updated_at    TIMESTAMPTZ DEFAULT now()
);

-- --------------------------------------------------------------------------
-- 3. counters
-- KV keys: trucking_booking_counter, brokerage_booking_counter, etc.
-- --------------------------------------------------------------------------
CREATE TABLE counters (
  key           TEXT PRIMARY KEY,    -- e.g. 'trucking_booking_counter'
  value         INTEGER NOT NULL DEFAULT 0,
  updated_at    TIMESTAMPTZ DEFAULT now()
);


-- ============================================================================
-- PHASE 2: CRM
-- ============================================================================

-- --------------------------------------------------------------------------
-- 4. customers
-- KV prefix: customer:
-- --------------------------------------------------------------------------
CREATE TABLE customers (
  id                TEXT PRIMARY KEY,
  name              TEXT NOT NULL,
  industry          TEXT,            -- 'Garments','Automobile','Energy','Food & Beverage', etc.
  client_type       TEXT,            -- 'Local','International'
  status            TEXT DEFAULT 'Active',  -- 'Prospect','Active','Inactive'
  registered_address TEXT,
  phone             TEXT,
  email             TEXT,
  website           TEXT,
  credit_terms      TEXT,
  payment_terms     TEXT,
  lead_source       TEXT,
  owner_id          TEXT REFERENCES users(id) ON DELETE SET NULL,
  notes             TEXT,
  created_by        TEXT REFERENCES users(id) ON DELETE SET NULL,
  created_at        TIMESTAMPTZ DEFAULT now(),
  updated_at        TIMESTAMPTZ DEFAULT now()
);
SELECT add_updated_at_trigger('customers');

-- --------------------------------------------------------------------------
-- 5. contacts
-- KV prefix: contact:
-- --------------------------------------------------------------------------
CREATE TABLE contacts (
  id            TEXT PRIMARY KEY,
  name          TEXT NOT NULL,
  title         TEXT,                -- job title
  email         TEXT,
  phone         TEXT,
  customer_id   TEXT REFERENCES customers(id) ON DELETE SET NULL,
  is_primary    BOOLEAN DEFAULT false,
  lifecycle_stage TEXT,              -- 'Lead','Customer','MQL','SQL'
  lead_status   TEXT,
  owner_id      TEXT REFERENCES users(id) ON DELETE SET NULL,
  notes         TEXT,
  created_by    TEXT REFERENCES users(id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now()
);
SELECT add_updated_at_trigger('contacts');

-- --------------------------------------------------------------------------
-- 6. consignees
-- KV prefix: consignee:
-- --------------------------------------------------------------------------
CREATE TABLE consignees (
  id              TEXT PRIMARY KEY,
  customer_id     TEXT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  address         TEXT,
  tin             TEXT,              -- Tax ID Number
  contact_person  TEXT,
  email           TEXT,
  phone           TEXT,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);
SELECT add_updated_at_trigger('consignees');

-- --------------------------------------------------------------------------
-- 7. client_handler_preferences
-- KV prefix: client-handler-preference:
-- --------------------------------------------------------------------------
CREATE TABLE client_handler_preferences (
  id                        TEXT PRIMARY KEY,
  customer_id               TEXT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  service_type              TEXT NOT NULL,   -- 'Forwarding','Brokerage','Trucking','Marine Insurance','Others'
  preferred_manager_id      TEXT REFERENCES users(id) ON DELETE SET NULL,
  preferred_manager_name    TEXT,
  preferred_supervisor_id   TEXT REFERENCES users(id) ON DELETE SET NULL,
  preferred_supervisor_name TEXT,
  preferred_handler_id      TEXT REFERENCES users(id) ON DELETE SET NULL,
  preferred_handler_name    TEXT,
  priority                  INTEGER DEFAULT 0,
  created_at                TIMESTAMPTZ DEFAULT now(),
  updated_at                TIMESTAMPTZ DEFAULT now()
);
SELECT add_updated_at_trigger('client_handler_preferences');

-- --------------------------------------------------------------------------
-- 8. tasks
-- KV prefix: task:
-- --------------------------------------------------------------------------
CREATE TABLE tasks (
  id            TEXT PRIMARY KEY,
  title         TEXT NOT NULL,
  type          TEXT,                -- 'To-do','Call','Email','Meeting','SMS','Viber','WeChat','WhatsApp','LinkedIn'
  due_date      TIMESTAMPTZ,
  priority      TEXT DEFAULT 'Medium', -- 'Low','Medium','High'
  status        TEXT DEFAULT 'Ongoing', -- 'Ongoing','Pending','Completed','Cancelled'
  cancel_reason TEXT,                -- 'Reschedule','Others'
  remarks       TEXT,
  contact_id    TEXT REFERENCES contacts(id) ON DELETE SET NULL,
  customer_id   TEXT REFERENCES customers(id) ON DELETE SET NULL,
  owner_id      TEXT REFERENCES users(id) ON DELETE SET NULL,
  assigned_to   TEXT REFERENCES users(id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now()
);
SELECT add_updated_at_trigger('tasks');

-- --------------------------------------------------------------------------
-- 9. crm_activities
-- KV prefix: activity:  (CRM activities — NOT the system audit log)
-- --------------------------------------------------------------------------
CREATE TABLE crm_activities (
  id            TEXT PRIMARY KEY,
  type          TEXT NOT NULL,       -- 'Call Logged','Email Logged','Meeting Logged','Note','System Update', etc.
  description   TEXT,
  date          TIMESTAMPTZ,
  contact_id    TEXT REFERENCES contacts(id) ON DELETE SET NULL,
  customer_id   TEXT REFERENCES customers(id) ON DELETE SET NULL,
  task_id       TEXT REFERENCES tasks(id) ON DELETE SET NULL,
  user_id       TEXT REFERENCES users(id) ON DELETE SET NULL,
  attachments   JSONB DEFAULT '[]',  -- [{name, size, type, url}]
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now()
);
SELECT add_updated_at_trigger('crm_activities');

-- --------------------------------------------------------------------------
-- 10. budget_requests
-- KV prefix: budget_request:
-- --------------------------------------------------------------------------
CREATE TABLE budget_requests (
  id              TEXT PRIMARY KEY,
  title           TEXT NOT NULL,
  description     TEXT,
  amount          NUMERIC(15,2) DEFAULT 0,
  currency        TEXT DEFAULT 'PHP',
  status          TEXT DEFAULT 'Pending',  -- 'Pending','Approved','Rejected','Disbursed'
  category        TEXT,
  requested_by    TEXT REFERENCES users(id) ON DELETE SET NULL,
  approved_by     TEXT REFERENCES users(id) ON DELETE SET NULL,
  customer_id     TEXT REFERENCES customers(id) ON DELETE SET NULL,
  project_id      TEXT,              -- FK added after projects table exists
  notes           TEXT,
  attachments     JSONB DEFAULT '[]',
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);
SELECT add_updated_at_trigger('budget_requests');


-- ============================================================================
-- PHASE 3: PRICING & VENDORS
-- ============================================================================

-- --------------------------------------------------------------------------
-- 11. service_providers  (MERGED: vendor: + partner:)
-- KV prefixes: vendor:, partner:, vendor_line_items:{id}, vendor_charge_categories:{id}
-- --------------------------------------------------------------------------
CREATE TABLE service_providers (
  id                TEXT PRIMARY KEY,
  provider_type     TEXT NOT NULL,    -- 'overseas_agent','local_agent','subcontractor','shipping_line','forwarder','trucker','broker'
  company_name      TEXT NOT NULL,
  country           TEXT,
  territory         TEXT,
  wca_number        TEXT,
  contact_person    TEXT,
  contact_email     TEXT,
  contact_phone     TEXT,
  address           TEXT,
  emails            TEXT[] DEFAULT '{}',  -- partner: stores multiple emails
  services          TEXT[] DEFAULT '{}',  -- ['Forwarding','Brokerage','Trucking','Marine Insurance']
  charge_categories JSONB DEFAULT '[]',   -- saved rate card categories (merges vendor_charge_categories:{id} + partner.charge_categories)
  line_items        JSONB DEFAULT '[]',   -- saved rate line items (merges vendor_line_items:{id})
  total_shipments   INTEGER DEFAULT 0,
  notes             TEXT,
  created_at        TIMESTAMPTZ DEFAULT now(),
  updated_at        TIMESTAMPTZ DEFAULT now()
);
SELECT add_updated_at_trigger('service_providers');

-- --------------------------------------------------------------------------
-- 12. catalog_categories
-- KV prefix: catalog_category:
-- --------------------------------------------------------------------------
CREATE TABLE catalog_categories (
  id            TEXT PRIMARY KEY,
  name          TEXT NOT NULL,
  description   TEXT,
  sort_order    INTEGER DEFAULT 0,
  is_default    BOOLEAN DEFAULT false,
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now()
);
SELECT add_updated_at_trigger('catalog_categories');

-- --------------------------------------------------------------------------
-- 13. catalog_items
-- KV prefix: catalog_item:
-- --------------------------------------------------------------------------
CREATE TABLE catalog_items (
  id              TEXT PRIMARY KEY,
  category_id     TEXT REFERENCES catalog_categories(id) ON DELETE SET NULL,
  name            TEXT NOT NULL,
  description     TEXT,
  default_price   NUMERIC(15,2) DEFAULT 0,
  currency        TEXT DEFAULT 'PHP',
  unit_type       TEXT,              -- 'per_cbm','per_container','per_shipment','per_kg','flat_fee','per_bl','per_set'
  tax_code        TEXT,              -- 'VAT','NVAT','ZR'
  is_active       BOOLEAN DEFAULT true,
  service_types   TEXT[] DEFAULT '{}', -- which service types this item applies to
  sort_order      INTEGER DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);
SELECT add_updated_at_trigger('catalog_items');


-- ============================================================================
-- PHASE 4: QUOTATIONS & CONTRACTS
-- ============================================================================

-- --------------------------------------------------------------------------
-- 14. quotations  (includes contracts: quotation_type = 'contract')
-- KV prefix: quotation:
-- --------------------------------------------------------------------------
CREATE TABLE quotations (
  id                  TEXT PRIMARY KEY,
  quotation_number    TEXT,
  quotation_type      TEXT NOT NULL DEFAULT 'standard', -- 'standard','contract'

  -- Customer / contact references
  customer_id         TEXT REFERENCES customers(id) ON DELETE SET NULL,
  customer_name       TEXT,            -- denormalized for fast display
  contact_id          TEXT REFERENCES contacts(id) ON DELETE SET NULL,
  contact_name        TEXT,
  consignee_id        TEXT REFERENCES consignees(id) ON DELETE SET NULL,

  -- Quotation content
  services            TEXT[] DEFAULT '{}',  -- ['Forwarding','Brokerage']
  services_metadata   JSONB DEFAULT '[]',   -- detailed service specs per service type
  pricing             JSONB DEFAULT '{}',   -- full pricing breakdown (categories, line items, totals)
  vendors             JSONB DEFAULT '[]',   -- vendor selections for this quotation

  -- Workflow
  status              TEXT DEFAULT 'Draft', -- 'Draft','Sent','Accepted','Rejected','Cancelled','Converted'
  validity_date       TIMESTAMPTZ,
  created_by          TEXT REFERENCES users(id) ON DELETE SET NULL,
  created_by_name     TEXT,
  assigned_to         TEXT REFERENCES users(id) ON DELETE SET NULL,

  -- Contract-specific fields (NULL for standard quotations)
  contract_status     TEXT,            -- 'Active','Expiring','Expired','Renewed','Terminated'
  contract_start_date TIMESTAMPTZ,
  contract_end_date   TIMESTAMPTZ,
  renewal_terms       TEXT,
  auto_renew          BOOLEAN DEFAULT false,
  contract_notes      TEXT,
  parent_contract_id  TEXT REFERENCES quotations(id) ON DELETE SET NULL,  -- for renewals

  -- Financial summary (denormalized)
  total_selling       NUMERIC(15,2) DEFAULT 0,
  total_buying        NUMERIC(15,2) DEFAULT 0,
  currency            TEXT DEFAULT 'PHP',

  -- Metadata
  notes               TEXT,
  internal_notes      TEXT,
  tags                TEXT[] DEFAULT '{}',
  created_at          TIMESTAMPTZ DEFAULT now(),
  updated_at          TIMESTAMPTZ DEFAULT now()
);
SELECT add_updated_at_trigger('quotations');

-- --------------------------------------------------------------------------
-- 15. contract_bookings  (join table: contract <-> booking)
-- Tracks which bookings are linked to a contract
-- --------------------------------------------------------------------------
CREATE TABLE contract_bookings (
  id              TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  contract_id     TEXT NOT NULL REFERENCES quotations(id) ON DELETE CASCADE,
  booking_id      TEXT NOT NULL,      -- FK added after bookings table exists
  service_type    TEXT,
  linked_at       TIMESTAMPTZ DEFAULT now(),
  UNIQUE(contract_id, booking_id)
);

-- --------------------------------------------------------------------------
-- 16. contract_activity
-- KV prefix: contract_activity:{contractId}:{timestamp}
-- --------------------------------------------------------------------------
CREATE TABLE contract_activity (
  id              TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  contract_id     TEXT NOT NULL REFERENCES quotations(id) ON DELETE CASCADE,
  event_type      TEXT NOT NULL,      -- 'created','renewed','terminated','status_change','booking_linked', etc.
  description     TEXT,
  user_id         TEXT REFERENCES users(id) ON DELETE SET NULL,
  user_name       TEXT,
  metadata        JSONB DEFAULT '{}',
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- --------------------------------------------------------------------------
-- 17. contract_attachments
-- KV prefix: contract_attachment:{contractId}:{attachmentId}
-- --------------------------------------------------------------------------
CREATE TABLE contract_attachments (
  id              TEXT PRIMARY KEY,
  contract_id     TEXT NOT NULL REFERENCES quotations(id) ON DELETE CASCADE,
  file_name       TEXT NOT NULL,
  file_type       TEXT,
  file_size       INTEGER,
  file_url        TEXT,              -- storage URL or base64
  uploaded_by     TEXT REFERENCES users(id) ON DELETE SET NULL,
  uploaded_by_name TEXT,
  description     TEXT,
  created_at      TIMESTAMPTZ DEFAULT now()
);


-- ============================================================================
-- PHASE 5: PROJECTS & BOOKINGS
-- ============================================================================

-- --------------------------------------------------------------------------
-- 18. projects
-- KV prefix: project:
-- --------------------------------------------------------------------------
CREATE TABLE projects (
  id                TEXT PRIMARY KEY,
  project_number    TEXT UNIQUE,      -- human-readable: PRJ-2026-001
  quotation_id      TEXT REFERENCES quotations(id) ON DELETE SET NULL,
  customer_id       TEXT REFERENCES customers(id) ON DELETE SET NULL,
  customer_name     TEXT,             -- denormalized
  consignee_id      TEXT REFERENCES consignees(id) ON DELETE SET NULL,

  -- Project details
  status            TEXT DEFAULT 'Active', -- 'Active','Completed','On Hold','Cancelled'
  services          TEXT[] DEFAULT '{}',
  service_type      TEXT,             -- primary service type

  -- Team assignment
  manager_id        TEXT REFERENCES users(id) ON DELETE SET NULL,
  manager_name      TEXT,
  supervisor_id     TEXT REFERENCES users(id) ON DELETE SET NULL,
  supervisor_name   TEXT,
  handler_id        TEXT REFERENCES users(id) ON DELETE SET NULL,
  handler_name      TEXT,
  created_by        TEXT REFERENCES users(id) ON DELETE SET NULL,
  created_by_name   TEXT,

  -- Metadata
  notes             TEXT,
  tags              TEXT[] DEFAULT '{}',
  metadata          JSONB DEFAULT '{}',  -- flexible extra fields
  created_at        TIMESTAMPTZ DEFAULT now(),
  updated_at        TIMESTAMPTZ DEFAULT now()
);
SELECT add_updated_at_trigger('projects');

-- Now add the FK on budget_requests
ALTER TABLE budget_requests
  ADD CONSTRAINT fk_budget_requests_project
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL;

-- --------------------------------------------------------------------------
-- 19. bookings  (UNIFIED: booking: + forwarding_booking: + trucking_booking:
--                + brokerage_booking: + marine_insurance_booking: + others_booking:)
-- --------------------------------------------------------------------------
CREATE TABLE bookings (
  id                TEXT PRIMARY KEY,
  booking_number    TEXT,             -- human-readable: FWD-001, TRK-001, BRK-001, etc.
  service_type      TEXT NOT NULL,    -- 'Forwarding','Brokerage','Trucking','Marine Insurance','Others'

  -- Parent references
  project_id        TEXT REFERENCES projects(id) ON DELETE SET NULL,
  contract_id       TEXT REFERENCES quotations(id) ON DELETE SET NULL,
  customer_id       TEXT REFERENCES customers(id) ON DELETE SET NULL,
  customer_name     TEXT,             -- denormalized
  consignee_id      TEXT REFERENCES consignees(id) ON DELETE SET NULL,

  -- Booking status & workflow
  status            TEXT DEFAULT 'Draft',  -- 'Draft','Created','Confirmed','In Transit','Delivered','Completed','Cancelled'

  -- Team assignment
  manager_id        TEXT REFERENCES users(id) ON DELETE SET NULL,
  manager_name      TEXT,
  supervisor_id     TEXT REFERENCES users(id) ON DELETE SET NULL,
  supervisor_name   TEXT,
  handler_id        TEXT REFERENCES users(id) ON DELETE SET NULL,
  handler_name      TEXT,
  created_by        TEXT REFERENCES users(id) ON DELETE SET NULL,

  -- Shipment quantities (for rate calculation)
  containers        INTEGER DEFAULT 1,
  bls               INTEGER DEFAULT 1,
  sets              INTEGER DEFAULT 1,
  shipments         INTEGER DEFAULT 1,

  -- Service-specific details stored as JSONB
  -- Forwarding: {movement_type, mode, origin, destination, carrier, vessel, voyage, etd, eta, ...}
  -- Brokerage: {entry_type, entry_number, customs_office, ...}
  -- Trucking: {pickup_address, delivery_address, truck_type, plate_number, driver, ...}
  -- Marine Insurance: {policy_number, insured_value, premium, coverage_type, ...}
  -- Others: {description, ...}
  details           JSONB DEFAULT '{}',

  -- Financial summary (denormalized for list views)
  total_revenue     NUMERIC(15,2) DEFAULT 0,
  total_cost        NUMERIC(15,2) DEFAULT 0,

  -- Applied rates (from contract rate engine)
  applied_rates     JSONB DEFAULT '[]',

  -- Metadata
  notes             TEXT,
  tags              TEXT[] DEFAULT '{}',
  created_at        TIMESTAMPTZ DEFAULT now(),
  updated_at        TIMESTAMPTZ DEFAULT now()
);
SELECT add_updated_at_trigger('bookings');

-- Now add the FK on contract_bookings
ALTER TABLE contract_bookings
  ADD CONSTRAINT fk_contract_bookings_booking
  FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE;

-- --------------------------------------------------------------------------
-- 20. project_bookings  (join table: project <-> booking with metadata)
-- Derived from project.linkedBookings[] array in KV
-- --------------------------------------------------------------------------
CREATE TABLE project_bookings (
  id              TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  project_id      TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  booking_id      TEXT NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  service_type    TEXT,
  linked_at       TIMESTAMPTZ DEFAULT now(),
  UNIQUE(project_id, booking_id)
);

-- --------------------------------------------------------------------------
-- 21. project_attachments
-- KV prefix: project_attachment:{projectId}:{attachmentId}
-- --------------------------------------------------------------------------
CREATE TABLE project_attachments (
  id                TEXT PRIMARY KEY,
  project_id        TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  file_name         TEXT NOT NULL,
  file_type         TEXT,
  file_size         INTEGER,
  file_url          TEXT,
  uploaded_by       TEXT REFERENCES users(id) ON DELETE SET NULL,
  uploaded_by_name  TEXT,
  description       TEXT,
  category          TEXT,            -- 'document','image','spreadsheet','other'
  created_at        TIMESTAMPTZ DEFAULT now()
);


-- ============================================================================
-- PHASE 6: FINANCIAL — Billing & Collections
-- ============================================================================

-- --------------------------------------------------------------------------
-- 22. evouchers
-- KV prefix: evoucher:
-- --------------------------------------------------------------------------
CREATE TABLE evouchers (
  id                  TEXT PRIMARY KEY,
  evoucher_number     TEXT,

  -- Type & source
  transaction_type    TEXT,           -- 'expense','budget_request','cash_advance','collection','billing','adjustment','reimbursement'
  source_module       TEXT,           -- 'bd','operations','accounting','pricing','hr','executive'
  voucher_type        TEXT,           -- 'AR','AP' (Accounts Receivable / Payable)

  -- References
  booking_id          TEXT REFERENCES bookings(id) ON DELETE SET NULL,
  project_id          TEXT REFERENCES projects(id) ON DELETE SET NULL,
  project_number      TEXT,
  contract_id         TEXT REFERENCES quotations(id) ON DELETE SET NULL,
  customer_id         TEXT REFERENCES customers(id) ON DELETE SET NULL,
  customer_name       TEXT,

  -- Vendor / payee
  vendor_name         TEXT,
  vendor_id           TEXT REFERENCES service_providers(id) ON DELETE SET NULL,

  -- Financial
  amount              NUMERIC(15,2) DEFAULT 0,
  currency            TEXT DEFAULT 'PHP',
  payment_method      TEXT,           -- 'Cash','Check','Bank Transfer','Online'
  credit_terms        TEXT,
  description         TEXT,
  purpose             TEXT,

  -- Workflow
  status              TEXT DEFAULT 'draft', -- 'draft','pending','posted','rejected','cancelled','Submitted','Approved','Disbursed', etc.
  submitted_at        TIMESTAMPTZ,
  approved_at         TIMESTAMPTZ,
  posted_at           TIMESTAMPTZ,

  -- Approvers chain (JSONB array)
  approvers           JSONB DEFAULT '[]',   -- [{user_id, user_name, role, status, timestamp, remarks}]

  -- Accounting linkage
  journal_entry_id    TEXT,           -- FK added after journal_entries table
  draft_transaction_id TEXT,          -- FK added after transactions table
  gl_category         TEXT,
  gl_sub_category     TEXT,

  -- Liquidation (for cash advances)
  liquidation         JSONB,          -- {amount, date, receipts, status, ...}

  -- Metadata
  attachments         JSONB DEFAULT '[]',
  notes               TEXT,
  created_by          TEXT REFERENCES users(id) ON DELETE SET NULL,
  created_by_name     TEXT,
  created_at          TIMESTAMPTZ DEFAULT now(),
  updated_at          TIMESTAMPTZ DEFAULT now()
);
SELECT add_updated_at_trigger('evouchers');

-- --------------------------------------------------------------------------
-- 23. evoucher_history
-- KV prefix: evoucher_history:{evoucherId}:{historyId}
-- --------------------------------------------------------------------------
CREATE TABLE evoucher_history (
  id              TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  evoucher_id     TEXT NOT NULL REFERENCES evouchers(id) ON DELETE CASCADE,
  action          TEXT NOT NULL,     -- 'created','submitted','approved','rejected','posted','cancelled'
  status          TEXT,
  user_id         TEXT REFERENCES users(id) ON DELETE SET NULL,
  user_name       TEXT,
  user_role       TEXT,
  remarks         TEXT,
  metadata        JSONB DEFAULT '{}',
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- --------------------------------------------------------------------------
-- 24. invoices
-- KV prefix: billing: (records that HAVE billing_item_ids — parent invoice docs)
-- --------------------------------------------------------------------------
CREATE TABLE invoices (
  id                TEXT PRIMARY KEY,
  invoice_number    TEXT UNIQUE,      -- INV-2026-001
  invoice_date      TIMESTAMPTZ DEFAULT now(),

  -- References
  booking_id        TEXT REFERENCES bookings(id) ON DELETE SET NULL,
  booking_ids       TEXT[] DEFAULT '{}',  -- multiple bookings per invoice
  project_id        TEXT REFERENCES projects(id) ON DELETE SET NULL,
  project_number    TEXT,
  customer_id       TEXT REFERENCES customers(id) ON DELETE SET NULL,
  customer_name     TEXT,
  service_types     TEXT[] DEFAULT '{}',

  -- Financial
  subtotal          NUMERIC(15,2) DEFAULT 0,
  tax_amount        NUMERIC(15,2) DEFAULT 0,
  total_amount      NUMERIC(15,2) DEFAULT 0,
  currency          TEXT DEFAULT 'PHP',

  -- Status
  status            TEXT DEFAULT 'draft', -- 'draft','sent','posted','paid','void'
  posted            BOOLEAN DEFAULT false,
  posted_at         TIMESTAMPTZ,

  -- Accounting linkage
  journal_entry_id  TEXT,
  evoucher_id       TEXT REFERENCES evouchers(id) ON DELETE SET NULL,

  -- Line item references (for migration tracking)
  billing_item_ids  TEXT[] DEFAULT '{}',

  -- Metadata
  notes             TEXT,
  created_by        TEXT REFERENCES users(id) ON DELETE SET NULL,
  created_at        TIMESTAMPTZ DEFAULT now(),
  updated_at        TIMESTAMPTZ DEFAULT now()
);
SELECT add_updated_at_trigger('invoices');

-- --------------------------------------------------------------------------
-- 25. billing_line_items
-- KV prefixes: billing: (records WITHOUT billing_item_ids) + billing_item:
-- --------------------------------------------------------------------------
CREATE TABLE billing_line_items (
  id                TEXT PRIMARY KEY,
  invoice_id        TEXT REFERENCES invoices(id) ON DELETE SET NULL,
  invoice_number    TEXT,

  -- Parent references
  booking_id        TEXT REFERENCES bookings(id) ON DELETE SET NULL,
  project_id        TEXT REFERENCES projects(id) ON DELETE SET NULL,
  evoucher_id       TEXT REFERENCES evouchers(id) ON DELETE SET NULL,

  -- Charge details
  description       TEXT,
  charge_type       TEXT,            -- 'revenue','cost','expense'
  category          TEXT,            -- 'Origin Charges','Freight','Destination Charges','Government'
  service_type      TEXT,            -- 'Forwarding','Brokerage','Trucking','Marine Insurance','Others'
  customer_name     TEXT,
  project_number    TEXT,

  -- Financial
  amount            NUMERIC(15,2) DEFAULT 0,
  quantity          NUMERIC(15,4) DEFAULT 1,
  unit_price        NUMERIC(15,4) DEFAULT 0,
  currency          TEXT DEFAULT 'PHP',
  unit_type         TEXT,            -- 'per_cbm','per_container','per_shipment','per_bl','per_set','flat_fee'

  -- Tax
  is_taxed          BOOLEAN DEFAULT false,
  tax_code          TEXT,
  tax_amount        NUMERIC(15,2) DEFAULT 0,

  -- Status
  status            TEXT DEFAULT 'active',

  -- Catalog linkage
  catalog_item_id   TEXT REFERENCES catalog_items(id) ON DELETE SET NULL,

  -- Metadata
  notes             TEXT,
  created_at        TIMESTAMPTZ DEFAULT now(),
  updated_at        TIMESTAMPTZ DEFAULT now()
);
SELECT add_updated_at_trigger('billing_line_items');

-- --------------------------------------------------------------------------
-- 26. collections
-- KV prefix: collection:
-- --------------------------------------------------------------------------
CREATE TABLE collections (
  id                  TEXT PRIMARY KEY,
  collection_number   TEXT,

  -- References
  booking_id          TEXT REFERENCES bookings(id) ON DELETE SET NULL,
  booking_ids         TEXT[] DEFAULT '{}',
  project_id          TEXT REFERENCES projects(id) ON DELETE SET NULL,
  project_number      TEXT,
  customer_id         TEXT REFERENCES customers(id) ON DELETE SET NULL,
  customer_name       TEXT,
  invoice_id          TEXT REFERENCES invoices(id) ON DELETE SET NULL,
  evoucher_id         TEXT REFERENCES evouchers(id) ON DELETE SET NULL,
  service_types       TEXT[] DEFAULT '{}',

  -- Financial
  amount              NUMERIC(15,2) DEFAULT 0,
  currency            TEXT DEFAULT 'PHP',
  payment_method      TEXT,
  reference_number    TEXT,           -- check number, bank ref, etc.
  collection_date     TIMESTAMPTZ,

  -- Status
  status              TEXT DEFAULT 'pending', -- 'pending','posted','void'
  posted              BOOLEAN DEFAULT false,
  posted_at           TIMESTAMPTZ,

  -- Accounting linkage
  journal_entry_id    TEXT,

  -- Metadata
  notes               TEXT,
  created_by          TEXT REFERENCES users(id) ON DELETE SET NULL,
  created_at          TIMESTAMPTZ DEFAULT now(),
  updated_at          TIMESTAMPTZ DEFAULT now()
);
SELECT add_updated_at_trigger('collections');

-- --------------------------------------------------------------------------
-- 27. expenses
-- KV prefix: expense:
-- --------------------------------------------------------------------------
CREATE TABLE expenses (
  id                TEXT PRIMARY KEY,

  -- References
  booking_id        TEXT REFERENCES bookings(id) ON DELETE SET NULL,
  project_id        TEXT REFERENCES projects(id) ON DELETE SET NULL,
  project_number    TEXT,
  evoucher_id       TEXT REFERENCES evouchers(id) ON DELETE SET NULL,
  customer_name     TEXT,

  -- Expense details
  description       TEXT,
  category          TEXT,            -- 'Brokerage','Trucking','Documentation','Handling','Government','Other'
  charge_type       TEXT,            -- 'cost','expense'
  service_type      TEXT,

  -- Financial
  amount            NUMERIC(15,2) DEFAULT 0,
  quantity          NUMERIC(15,4) DEFAULT 1,
  unit_price        NUMERIC(15,4) DEFAULT 0,
  currency          TEXT DEFAULT 'PHP',
  unit_type         TEXT,

  -- Tax
  is_taxed          BOOLEAN DEFAULT false,
  tax_code          TEXT,

  -- Status
  status            TEXT DEFAULT 'active',

  -- Catalog linkage
  catalog_item_id   TEXT REFERENCES catalog_items(id) ON DELETE SET NULL,

  -- Metadata
  vendor_name       TEXT,
  receipt_number    TEXT,
  notes             TEXT,
  created_by        TEXT REFERENCES users(id) ON DELETE SET NULL,
  created_at        TIMESTAMPTZ DEFAULT now(),
  updated_at        TIMESTAMPTZ DEFAULT now()
);
SELECT add_updated_at_trigger('expenses');


-- ============================================================================
-- PHASE 7: ACCOUNTING & GL
-- ============================================================================

-- --------------------------------------------------------------------------
-- 28. accounts  (MERGED: account: + accounting:account:)
-- Chart of Accounts
-- --------------------------------------------------------------------------
CREATE TABLE accounts (
  id              TEXT PRIMARY KEY,
  code            TEXT NOT NULL UNIQUE,  -- '1000','1100','2000', etc.
  name            TEXT NOT NULL,
  type            TEXT NOT NULL,      -- 'Asset','Liability','Equity','Revenue','Expense'
  sub_type        TEXT,               -- 'Current Asset','Fixed Asset','Long-term Liability', etc.
  category        TEXT,               -- GL category
  sub_category    TEXT,               -- GL sub-category
  description     TEXT,
  parent_id       TEXT REFERENCES accounts(id) ON DELETE SET NULL,
  balance         NUMERIC(15,2) DEFAULT 0,
  normal_balance  TEXT DEFAULT 'debit', -- 'debit','credit'
  is_active       BOOLEAN DEFAULT true,
  is_system       BOOLEAN DEFAULT false, -- system-generated, cannot delete
  sort_order      INTEGER DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);
SELECT add_updated_at_trigger('accounts');

-- --------------------------------------------------------------------------
-- 29. journal_entries
-- KV prefix: journal_entry:
-- --------------------------------------------------------------------------
CREATE TABLE journal_entries (
  id                TEXT PRIMARY KEY,
  entry_number      TEXT,
  entry_date        TIMESTAMPTZ DEFAULT now(),

  -- Source references
  evoucher_id       TEXT REFERENCES evouchers(id) ON DELETE SET NULL,
  invoice_id        TEXT REFERENCES invoices(id) ON DELETE SET NULL,
  collection_id     TEXT REFERENCES collections(id) ON DELETE SET NULL,
  booking_id        TEXT REFERENCES bookings(id) ON DELETE SET NULL,
  project_number    TEXT,
  customer_name     TEXT,

  -- Entry details
  description       TEXT,
  reference         TEXT,

  -- Lines stored as JSONB (each line: {account_id, account_code, account_name, debit, credit, description})
  lines             JSONB DEFAULT '[]',

  -- Totals
  total_debit       NUMERIC(15,2) DEFAULT 0,
  total_credit      NUMERIC(15,2) DEFAULT 0,

  -- Status
  status            TEXT DEFAULT 'posted', -- 'draft','posted','void'

  -- Metadata
  created_by        TEXT REFERENCES users(id) ON DELETE SET NULL,
  created_at        TIMESTAMPTZ DEFAULT now(),
  updated_at        TIMESTAMPTZ DEFAULT now()
);
SELECT add_updated_at_trigger('journal_entries');

-- Now add the FK on evouchers
ALTER TABLE evouchers
  ADD CONSTRAINT fk_evouchers_journal_entry
  FOREIGN KEY (journal_entry_id) REFERENCES journal_entries(id) ON DELETE SET NULL;

-- --------------------------------------------------------------------------
-- 30. transactions
-- KV prefix: accounting:txn:
-- --------------------------------------------------------------------------
CREATE TABLE transactions (
  id              TEXT PRIMARY KEY,
  date            TIMESTAMPTZ DEFAULT now(),

  -- Account references
  debit_account_id  TEXT REFERENCES accounts(id) ON DELETE SET NULL,
  credit_account_id TEXT REFERENCES accounts(id) ON DELETE SET NULL,

  -- Details
  description     TEXT,
  reference       TEXT,
  amount          NUMERIC(15,2) DEFAULT 0,
  type            TEXT,              -- transaction type
  category        TEXT,

  -- Source
  journal_entry_id TEXT REFERENCES journal_entries(id) ON DELETE SET NULL,
  evoucher_id     TEXT REFERENCES evouchers(id) ON DELETE SET NULL,

  -- Status
  status          TEXT DEFAULT 'completed',
  is_reconciled   BOOLEAN DEFAULT false,

  -- Metadata
  created_by      TEXT REFERENCES users(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);
SELECT add_updated_at_trigger('transactions');

-- Now add the FK on evouchers for draft_transaction_id
ALTER TABLE evouchers
  ADD CONSTRAINT fk_evouchers_draft_transaction
  FOREIGN KEY (draft_transaction_id) REFERENCES transactions(id) ON DELETE SET NULL;

-- FK on invoices for journal_entry_id
ALTER TABLE invoices
  ADD CONSTRAINT fk_invoices_journal_entry
  FOREIGN KEY (journal_entry_id) REFERENCES journal_entries(id) ON DELETE SET NULL;

-- FK on collections for journal_entry_id
ALTER TABLE collections
  ADD CONSTRAINT fk_collections_journal_entry
  FOREIGN KEY (journal_entry_id) REFERENCES journal_entries(id) ON DELETE SET NULL;


-- ============================================================================
-- PHASE 8: SUPPORT & SYSTEM
-- ============================================================================

-- --------------------------------------------------------------------------
-- 31. ticket_types
-- KV prefix: ticket_type:
-- --------------------------------------------------------------------------
CREATE TABLE ticket_types (
  id              TEXT PRIMARY KEY,
  name            TEXT NOT NULL,
  description     TEXT,
  prefix          TEXT,              -- 'TKT','BUG','REQ', etc.
  color           TEXT,
  icon            TEXT,
  is_active       BOOLEAN DEFAULT true,
  sort_order      INTEGER DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);
SELECT add_updated_at_trigger('ticket_types');

-- --------------------------------------------------------------------------
-- 32. tickets
-- KV prefix: ticket:
-- --------------------------------------------------------------------------
CREATE TABLE tickets (
  id              TEXT PRIMARY KEY,
  ticket_number   TEXT,              -- TKT-2026-001
  ticket_type     TEXT REFERENCES ticket_types(id) ON DELETE SET NULL,

  -- Content
  title           TEXT NOT NULL,
  description     TEXT,
  priority        TEXT DEFAULT 'Medium', -- 'Low','Medium','High','Urgent'
  status          TEXT DEFAULT 'Open',   -- 'Open','In Progress','Resolved','Closed','Reopened'

  -- Assignment
  created_by      TEXT REFERENCES users(id) ON DELETE SET NULL,
  created_by_name TEXT,
  assigned_to     TEXT REFERENCES users(id) ON DELETE SET NULL,
  assigned_to_name TEXT,
  department      TEXT,

  -- Entity linkage (ticket can reference any entity)
  entity_type     TEXT,              -- 'booking','project','quotation','customer', etc.
  entity_id       TEXT,

  -- Resolution
  resolution      TEXT,
  resolved_at     TIMESTAMPTZ,
  closed_at       TIMESTAMPTZ,

  -- Metadata
  tags            TEXT[] DEFAULT '{}',
  attachments     JSONB DEFAULT '[]',
  comment_count   INTEGER DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);
SELECT add_updated_at_trigger('tickets');

-- --------------------------------------------------------------------------
-- 33. comments  (POLYMORPHIC: ticket_comment: + inquiry_comment: + booking_comment:)
-- --------------------------------------------------------------------------
CREATE TABLE comments (
  id              TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  entity_type     TEXT NOT NULL,      -- 'ticket','quotation','booking'
  entity_id       TEXT NOT NULL,      -- ID of the parent entity

  -- Content
  content         TEXT,
  user_id         TEXT REFERENCES users(id) ON DELETE SET NULL,
  user_name       TEXT,
  user_department TEXT,
  user_avatar     TEXT,

  -- Attachments
  attachments     JSONB DEFAULT '[]',

  -- Metadata
  is_internal     BOOLEAN DEFAULT false,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);
SELECT add_updated_at_trigger('comments');

-- --------------------------------------------------------------------------
-- 34. activity_log  (MERGED: activity_log: + ticket_activity: + quotation_activity: + booking_activity:)
-- System audit trail — NOT CRM activities
-- --------------------------------------------------------------------------
CREATE TABLE activity_log (
  id              TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  entity_type     TEXT NOT NULL,      -- 'ticket','quotation','booking','project','evoucher','customer', etc.
  entity_id       TEXT NOT NULL,
  entity_name     TEXT,              -- human-readable name/number for display

  -- Action
  action_type     TEXT NOT NULL,      -- 'created','updated','status_change','assigned','commented','deleted', etc.
  old_value       TEXT,
  new_value       TEXT,

  -- Actor
  user_id         TEXT REFERENCES users(id) ON DELETE SET NULL,
  user_name       TEXT,
  user_department TEXT,

  -- Extra context
  metadata        JSONB DEFAULT '{}',

  -- Timestamp (using created_at, no updated_at since audit logs are immutable)
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- --------------------------------------------------------------------------
-- 35. saved_reports
-- KV prefix: saved_report:{userId}:{reportId}
-- --------------------------------------------------------------------------
CREATE TABLE saved_reports (
  id              TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  user_id         TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  report_type     TEXT,              -- template identifier
  config          JSONB DEFAULT '{}', -- filters, date ranges, groupings, etc.
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);
SELECT add_updated_at_trigger('saved_reports');


-- ============================================================================
-- PHASE 9: INDEXES
-- ============================================================================

-- === customers ===
CREATE INDEX idx_customers_name ON customers(name);
CREATE INDEX idx_customers_status ON customers(status);
CREATE INDEX idx_customers_owner ON customers(owner_id);

-- === contacts ===
CREATE INDEX idx_contacts_customer ON contacts(customer_id);
CREATE INDEX idx_contacts_name ON contacts(name);

-- === consignees ===
CREATE INDEX idx_consignees_customer ON consignees(customer_id);

-- === client_handler_preferences ===
CREATE INDEX idx_chp_customer_service ON client_handler_preferences(customer_id, service_type);

-- === tasks ===
CREATE INDEX idx_tasks_customer ON tasks(customer_id);
CREATE INDEX idx_tasks_contact ON tasks(contact_id);
CREATE INDEX idx_tasks_owner ON tasks(owner_id);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_due ON tasks(due_date);

-- === crm_activities ===
CREATE INDEX idx_crm_activities_customer ON crm_activities(customer_id);
CREATE INDEX idx_crm_activities_contact ON crm_activities(contact_id);
CREATE INDEX idx_crm_activities_user ON crm_activities(user_id);
CREATE INDEX idx_crm_activities_date ON crm_activities(date DESC);

-- === budget_requests ===
CREATE INDEX idx_budget_requests_customer ON budget_requests(customer_id);
CREATE INDEX idx_budget_requests_status ON budget_requests(status);

-- === service_providers ===
CREATE INDEX idx_sp_type ON service_providers(provider_type);
CREATE INDEX idx_sp_country ON service_providers(country);
CREATE INDEX idx_sp_company_name ON service_providers(company_name);

-- === catalog_items ===
CREATE INDEX idx_catalog_items_category ON catalog_items(category_id);
CREATE INDEX idx_catalog_items_active ON catalog_items(is_active) WHERE is_active = true;

-- === quotations ===
CREATE INDEX idx_quotations_customer ON quotations(customer_id);
CREATE INDEX idx_quotations_customer_name ON quotations(customer_name);
CREATE INDEX idx_quotations_status ON quotations(status);
CREATE INDEX idx_quotations_type ON quotations(quotation_type);
CREATE INDEX idx_quotations_created ON quotations(created_at DESC);
CREATE INDEX idx_quotations_assigned ON quotations(assigned_to);
-- Partial index: active contracts only (high-value query)
CREATE INDEX idx_quotations_active_contracts
  ON quotations(customer_name, contract_status)
  WHERE quotation_type = 'contract' AND contract_status IN ('Active','Expiring');

-- === contract_bookings ===
CREATE INDEX idx_cb_contract ON contract_bookings(contract_id);
CREATE INDEX idx_cb_booking ON contract_bookings(booking_id);

-- === contract_activity ===
CREATE INDEX idx_ca_contract ON contract_activity(contract_id);
CREATE INDEX idx_ca_created ON contract_activity(created_at DESC);

-- === contract_attachments ===
CREATE INDEX idx_catt_contract ON contract_attachments(contract_id);

-- === projects ===
CREATE INDEX idx_projects_quotation ON projects(quotation_id);
CREATE INDEX idx_projects_customer ON projects(customer_id);
CREATE INDEX idx_projects_customer_name ON projects(customer_name);
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_projects_number ON projects(project_number);
CREATE INDEX idx_projects_created ON projects(created_at DESC);
CREATE INDEX idx_projects_handler ON projects(handler_id);

-- === bookings ===
CREATE INDEX idx_bookings_service_type ON bookings(service_type);
CREATE INDEX idx_bookings_project ON bookings(project_id);
CREATE INDEX idx_bookings_contract ON bookings(contract_id);
CREATE INDEX idx_bookings_customer ON bookings(customer_id);
CREATE INDEX idx_bookings_customer_name ON bookings(customer_name);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_bookings_created ON bookings(created_at DESC);
CREATE INDEX idx_bookings_handler ON bookings(handler_id);

-- === project_bookings ===
CREATE INDEX idx_pb_project ON project_bookings(project_id);
CREATE INDEX idx_pb_booking ON project_bookings(booking_id);

-- === project_attachments ===
CREATE INDEX idx_patt_project ON project_attachments(project_id);

-- === evouchers ===
CREATE INDEX idx_ev_booking ON evouchers(booking_id);
CREATE INDEX idx_ev_project ON evouchers(project_id);
CREATE INDEX idx_ev_contract ON evouchers(contract_id);
CREATE INDEX idx_ev_customer ON evouchers(customer_id);
CREATE INDEX idx_ev_status ON evouchers(status);
CREATE INDEX idx_ev_type ON evouchers(transaction_type);
CREATE INDEX idx_ev_created ON evouchers(created_at DESC);
CREATE INDEX idx_ev_vendor ON evouchers(vendor_name);

-- === evoucher_history ===
CREATE INDEX idx_evh_evoucher ON evoucher_history(evoucher_id);
CREATE INDEX idx_evh_created ON evoucher_history(created_at DESC);

-- === invoices ===
CREATE INDEX idx_inv_booking ON invoices(booking_id);
CREATE INDEX idx_inv_project ON invoices(project_id);
CREATE INDEX idx_inv_customer ON invoices(customer_id);
CREATE INDEX idx_inv_customer_name ON invoices(customer_name);
CREATE INDEX idx_inv_status ON invoices(status);
CREATE INDEX idx_inv_number ON invoices(invoice_number);
CREATE INDEX idx_inv_evoucher ON invoices(evoucher_id);
CREATE INDEX idx_inv_created ON invoices(created_at DESC);

-- === billing_line_items ===
CREATE INDEX idx_bli_invoice ON billing_line_items(invoice_id);
CREATE INDEX idx_bli_booking ON billing_line_items(booking_id);
CREATE INDEX idx_bli_project ON billing_line_items(project_id);
CREATE INDEX idx_bli_evoucher ON billing_line_items(evoucher_id);
CREATE INDEX idx_bli_service ON billing_line_items(service_type);
CREATE INDEX idx_bli_created ON billing_line_items(created_at DESC);

-- === collections ===
CREATE INDEX idx_col_booking ON collections(booking_id);
CREATE INDEX idx_col_project ON collections(project_id);
CREATE INDEX idx_col_customer ON collections(customer_id);
CREATE INDEX idx_col_invoice ON collections(invoice_id);
CREATE INDEX idx_col_evoucher ON collections(evoucher_id);
CREATE INDEX idx_col_status ON collections(status);
CREATE INDEX idx_col_created ON collections(created_at DESC);

-- === expenses ===
CREATE INDEX idx_exp_booking ON expenses(booking_id);
CREATE INDEX idx_exp_project ON expenses(project_id);
CREATE INDEX idx_exp_evoucher ON expenses(evoucher_id);
CREATE INDEX idx_exp_service ON expenses(service_type);
CREATE INDEX idx_exp_status ON expenses(status);
CREATE INDEX idx_exp_created ON expenses(created_at DESC);

-- === accounts ===
CREATE INDEX idx_acc_type ON accounts(type);
CREATE INDEX idx_acc_parent ON accounts(parent_id);
CREATE INDEX idx_acc_code ON accounts(code);
CREATE INDEX idx_acc_active ON accounts(is_active) WHERE is_active = true;

-- === journal_entries ===
CREATE INDEX idx_je_evoucher ON journal_entries(evoucher_id);
CREATE INDEX idx_je_invoice ON journal_entries(invoice_id);
CREATE INDEX idx_je_collection ON journal_entries(collection_id);
CREATE INDEX idx_je_booking ON journal_entries(booking_id);
CREATE INDEX idx_je_date ON journal_entries(entry_date DESC);
CREATE INDEX idx_je_status ON journal_entries(status);

-- === transactions ===
CREATE INDEX idx_txn_debit ON transactions(debit_account_id);
CREATE INDEX idx_txn_credit ON transactions(credit_account_id);
CREATE INDEX idx_txn_je ON transactions(journal_entry_id);
CREATE INDEX idx_txn_evoucher ON transactions(evoucher_id);
CREATE INDEX idx_txn_date ON transactions(date DESC);

-- === tickets ===
CREATE INDEX idx_tkt_type ON tickets(ticket_type);
CREATE INDEX idx_tkt_status ON tickets(status);
CREATE INDEX idx_tkt_priority ON tickets(priority);
CREATE INDEX idx_tkt_assigned ON tickets(assigned_to);
CREATE INDEX idx_tkt_created_by ON tickets(created_by);
CREATE INDEX idx_tkt_entity ON tickets(entity_type, entity_id);
CREATE INDEX idx_tkt_created ON tickets(created_at DESC);

-- === comments (polymorphic) ===
CREATE INDEX idx_comments_entity ON comments(entity_type, entity_id);
CREATE INDEX idx_comments_user ON comments(user_id);
CREATE INDEX idx_comments_created ON comments(created_at DESC);

-- === activity_log (audit trail) ===
CREATE INDEX idx_al_entity ON activity_log(entity_type, entity_id);
CREATE INDEX idx_al_user ON activity_log(user_id);
CREATE INDEX idx_al_action ON activity_log(action_type);
CREATE INDEX idx_al_created ON activity_log(created_at DESC);
-- Composite for entity-scoped timeline queries
CREATE INDEX idx_al_entity_timeline ON activity_log(entity_type, entity_id, created_at DESC);

-- === saved_reports ===
CREATE INDEX idx_sr_user ON saved_reports(user_id);


-- ============================================================================
-- PHASE 9b: ROW LEVEL SECURITY
-- ============================================================================
-- Enable RLS on all tables. For now, use permissive policies since the app
-- uses the service-role key during development. These will be tightened
-- when auth is implemented.

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE counters ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE consignees ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_handler_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE catalog_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE catalog_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE contract_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE contract_activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE contract_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE evouchers ENABLE ROW LEVEL SECURITY;
ALTER TABLE evoucher_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing_line_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_reports ENABLE ROW LEVEL SECURITY;

-- Permissive policies: allow all operations via service role
-- (These will be replaced with proper user-scoped policies when auth is added)

DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOR tbl IN
    SELECT unnest(ARRAY[
      'users','settings','counters','customers','contacts','consignees',
      'client_handler_preferences','tasks','crm_activities','budget_requests',
      'service_providers','catalog_categories','catalog_items',
      'quotations','contract_bookings','contract_activity','contract_attachments',
      'projects','bookings','project_bookings','project_attachments',
      'evouchers','evoucher_history','invoices','billing_line_items',
      'collections','expenses','accounts','journal_entries','transactions',
      'ticket_types','tickets','comments','activity_log','saved_reports'
    ])
  LOOP
    EXECUTE format(
      'CREATE POLICY "Allow all for service role" ON %I FOR ALL USING (true) WITH CHECK (true)',
      tbl
    );
  END LOOP;
END $$;


-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
-- 35 tables created across 8 logical tiers:
--
--   Tier 1 — Core Identity:    users, settings, counters
--   Tier 2 — CRM:              customers, contacts, consignees,
--                               client_handler_preferences, tasks,
--                               crm_activities, budget_requests
--   Tier 3 — Pricing/Vendors:  service_providers, catalog_categories, catalog_items
--   Tier 4 — Quotations:       quotations, contract_bookings,
--                               contract_activity, contract_attachments
--   Tier 5 — Projects/Ops:     projects, bookings, project_bookings,
--                               project_attachments
--   Tier 6 — Financial:        evouchers, evoucher_history, invoices,
--                               billing_line_items, collections, expenses
--   Tier 7 — Accounting/GL:    accounts, journal_entries, transactions
--   Tier 8 — Support/System:   ticket_types, tickets, comments,
--                               activity_log, saved_reports
--
-- Key deduplication wins:
--   - 6 booking prefixes → 1 unified bookings table
--   - 2 account prefixes → 1 accounts table
--   - 4 activity prefixes → 1 activity_log table
--   - 2 vendor/partner stores → 1 service_providers table
--   - billing:/billing_item: mixed store → invoices + billing_line_items
--   - 3 comment prefixes → 1 polymorphic comments table
-- ============================================================================
