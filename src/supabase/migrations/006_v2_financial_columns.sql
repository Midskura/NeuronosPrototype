-- ============================================================================
-- Migration 006 — V2 Financial Architecture: Missing Columns
-- ============================================================================
-- Adds the columns that the V2 financial code writes to but that were absent
-- from the original schema migrations. Apply in the Supabase SQL Editor AFTER
-- migrations 001–005.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- invoices: V2 line-derived lineage columns
-- ---------------------------------------------------------------------------
-- project_refs and contract_refs are derived from the billing lines packaged
-- into the invoice — written by InvoiceBuilder.tsx at invoice creation time.
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS project_refs   TEXT[]  DEFAULT '{}';
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS contract_refs  TEXT[]  DEFAULT '{}';

-- metadata holds reversal workflow state, e.g.:
--   { "reversal_of_invoice_id": "inv-2026-001" }
-- Written by invoiceReversal.ts when creating reversal drafts.
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS metadata  JSONB DEFAULT '{}';

-- ---------------------------------------------------------------------------
-- collections: V2 multi-invoice application column
-- ---------------------------------------------------------------------------
-- linked_billings is a JSONB array of invoice application entries, used when
-- one collection payment settles more than one invoice:
--   [{ "id": "inv-...", "invoice_number": "INV-...", "amount": 50000 }, ...]
-- Written by CollectionCreatorPanel.tsx and useEVoucherSubmit.ts.
ALTER TABLE collections ADD COLUMN IF NOT EXISTS linked_billings  JSONB DEFAULT '[]';

-- ---------------------------------------------------------------------------
-- billing_line_items: fix status default to match V2 vocabulary
-- ---------------------------------------------------------------------------
-- V2 billing status values: 'unbilled' | 'invoiced' | 'voided' | 'billed'
-- The original schema defaulted to 'active', which the V2 code does not
-- recognize in its billing state calculations.
ALTER TABLE billing_line_items ALTER COLUMN status SET DEFAULT 'unbilled';

-- Back-fill any existing rows that still carry the old 'active' default
-- so the V2 hooks don't silently exclude them from unbilled totals.
UPDATE billing_line_items SET status = 'unbilled' WHERE status = 'active';

-- ---------------------------------------------------------------------------
-- Indexes for new columns (optional performance helpers)
-- ---------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_invoices_project_refs   ON invoices USING GIN (project_refs);
CREATE INDEX IF NOT EXISTS idx_invoices_contract_refs  ON invoices USING GIN (contract_refs);
CREATE INDEX IF NOT EXISTS idx_collections_linked      ON collections USING GIN (linked_billings);
