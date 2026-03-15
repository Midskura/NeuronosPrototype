-- ============================================================================
-- Schema Adjustments — Columns discovered during rewiring
-- ============================================================================
-- These columns exist in KV data but were missed in the initial schema.
-- Run this AFTER 001_full_schema.sql has been applied.
-- ============================================================================

-- === users: additional fields from seed data ===
ALTER TABLE users ADD COLUMN IF NOT EXISTS password TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE users ADD COLUMN IF NOT EXISTS service_type TEXT;       -- 'Forwarding','Brokerage','Trucking','Marine Insurance','Others'
ALTER TABLE users ADD COLUMN IF NOT EXISTS operations_role TEXT;    -- 'Manager','Supervisor','Handler'

-- Index for operations team lookups (e.g., GET /users?service_type=Trucking&operations_role=Handler)
CREATE INDEX IF NOT EXISTS idx_users_ops_team ON users(service_type, operations_role) WHERE service_type IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_department ON users(department);
CREATE INDEX IF NOT EXISTS idx_users_active ON users(is_active) WHERE is_active = true;

-- === customers: additional fields from seed data ===
ALTER TABLE customers ADD COLUMN IF NOT EXISTS status_detail TEXT;  -- 'New','Open','In Progress', etc. (lead_status)
ALTER TABLE customers ADD COLUMN IF NOT EXISTS lifecycle_stage TEXT; -- 'Lead','Customer','MQL','SQL'

-- === quotations: overflow JSONB for flexible KV-like storage ===
-- The KV store quotation records contain many fields (movement, incoterm, carrier,
-- charge_categories, buying_price, selling_price, financial_summary, etc.)
-- Rather than adding 20+ columns, store overflow in a JSONB details column.
ALTER TABLE quotations ADD COLUMN IF NOT EXISTS details JSONB DEFAULT '{}';
ALTER TABLE quotations ADD COLUMN IF NOT EXISTS quote_number TEXT;       -- frontend uses this alias
ALTER TABLE quotations ADD COLUMN IF NOT EXISTS quotation_name TEXT;
ALTER TABLE quotations ADD COLUMN IF NOT EXISTS contact_person_id TEXT;  -- alias for contact_id
ALTER TABLE quotations ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMPTZ;
ALTER TABLE quotations ADD COLUMN IF NOT EXISTS converted_at TIMESTAMPTZ;
ALTER TABLE quotations ADD COLUMN IF NOT EXISTS project_id TEXT;
CREATE INDEX IF NOT EXISTS idx_quotations_customer ON quotations(customer_id);
CREATE INDEX IF NOT EXISTS idx_quotations_status ON quotations(status);
ALTER TABLE quotations ADD COLUMN IF NOT EXISTS quotation_date TIMESTAMPTZ;
ALTER TABLE quotations ADD COLUMN IF NOT EXISTS expiry_date TIMESTAMPTZ;

-- === projects: overflow JSONB for flexible KV-like storage ===
ALTER TABLE projects ADD COLUMN IF NOT EXISTS details JSONB DEFAULT '{}';

-- === bookings: overflow JSONB + extra filter columns ===
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS details JSONB DEFAULT '{}';
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS movement_type TEXT;    -- 'Import','Export','Domestic'
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS mode TEXT;             -- 'Sea','Air','Land'

-- === evouchers: overflow JSONB + extra filter columns ===
ALTER TABLE evouchers ADD COLUMN IF NOT EXISTS details JSONB DEFAULT '{}';
ALTER TABLE evouchers ADD COLUMN IF NOT EXISTS service_type TEXT;    -- for filtering by service
ALTER TABLE evouchers ADD COLUMN IF NOT EXISTS ledger_entry_id TEXT; -- links to journal entry used as ledger posting
ALTER TABLE evouchers ADD COLUMN IF NOT EXISTS reference_number TEXT; -- external reference (check #, bank ref, etc.)

-- === expenses: additional field ===
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS booking_number TEXT;  -- denormalized for display
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS service_tag TEXT;     -- 'Forwarding','Brokerage', etc.
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS is_billable BOOLEAN DEFAULT false;  -- used by billing reconciliation

-- === billing_line_items: additional fields ===
ALTER TABLE billing_line_items ADD COLUMN IF NOT EXISTS booking_number TEXT;
ALTER TABLE billing_line_items ADD COLUMN IF NOT EXISTS vendor_id TEXT;
ALTER TABLE billing_line_items ADD COLUMN IF NOT EXISTS vendor_name TEXT;

-- === collections: additional field ===
ALTER TABLE collections ADD COLUMN IF NOT EXISTS customer_id_alt TEXT; -- some records store customer differently

-- === invoices: additional fields ===
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS due_date TIMESTAMPTZ;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS payment_terms TEXT;

-- === tickets: KV uses subject/from_department/to_department etc. ===
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS subject TEXT;        -- KV uses 'subject', schema uses 'title'; keep both
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS from_department TEXT;
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS to_department TEXT;
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS assigned_at TIMESTAMPTZ;
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS due_date TIMESTAMPTZ;
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS linked_entity_type TEXT;  -- maps to entity_type
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS linked_entity_id TEXT;    -- maps to entity_id
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS linked_entity_name TEXT;
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS linked_entity_status TEXT;
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS default_due_hours INTEGER;  -- from ticket_type

-- Index for ticket queries
CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status);
CREATE INDEX IF NOT EXISTS idx_tickets_assigned ON tickets(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tickets_created_by ON tickets(created_by);
CREATE INDEX IF NOT EXISTS idx_tickets_to_dept ON tickets(to_department);
CREATE INDEX IF NOT EXISTS idx_tickets_from_dept ON tickets(from_department);

-- === ticket_types: additional fields for default_due_hours ===
ALTER TABLE ticket_types ADD COLUMN IF NOT EXISTS default_due_hours INTEGER;

-- === counters: generic counter table for sequential ID generation ===
-- Also used as a general KV store for vendor_line_items, charge_categories, etc.
-- Change value from INTEGER to JSONB so it can hold both numeric counters and JSON objects.
CREATE TABLE IF NOT EXISTS counters (
  key TEXT PRIMARY KEY,
  value JSONB DEFAULT '0'
);
-- If table already exists from 001_full_schema.sql with INTEGER value column, alter it:
-- Must drop the old INTEGER default first, then convert, then set the new JSONB default.
ALTER TABLE counters ALTER COLUMN value DROP DEFAULT;
ALTER TABLE counters ALTER COLUMN value TYPE JSONB USING to_jsonb(value);
ALTER TABLE counters ALTER COLUMN value SET DEFAULT '0';

-- === comments: add entity indexes ===
CREATE INDEX IF NOT EXISTS idx_comments_entity ON comments(entity_type, entity_id);

-- === activity_log: single table for all system activities ===
-- Note: 001_full_schema.sql already creates this table with `created_at` column.
-- This CREATE TABLE IF NOT EXISTS is a safety net only.
CREATE TABLE IF NOT EXISTS activity_log (
  id              TEXT PRIMARY KEY,
  entity_type     TEXT NOT NULL,       -- 'ticket','quotation','booking'
  entity_id       TEXT NOT NULL,
  entity_name     TEXT,
  action_type     TEXT NOT NULL,
  user_id         TEXT,
  user_name       TEXT,
  user_department TEXT,
  old_value       TEXT,
  new_value       TEXT,
  metadata        JSONB DEFAULT '{}',
  created_at      TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_activity_log_entity ON activity_log(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_created ON activity_log(created_at DESC);