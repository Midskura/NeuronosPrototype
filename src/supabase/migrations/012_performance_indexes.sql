-- 012_performance_indexes.sql
-- Performance indexes for 30-concurrent-user scale on Supabase Free tier.
-- All IF NOT EXISTS — safe to re-run.

-- billing_line_items — already has idx_bli_booking, idx_bli_project from 001
-- Add project_number index (used by financial RPC joins)
CREATE INDEX IF NOT EXISTS idx_bli_project_number ON billing_line_items(project_number);

-- invoices — customer + status combo for filtered lookups
CREATE INDEX IF NOT EXISTS idx_invoices_customer_status ON invoices(customer_id, status);
CREATE INDEX IF NOT EXISTS idx_invoices_booking_id ON invoices(booking_id);
CREATE INDEX IF NOT EXISTS idx_invoices_project_number ON invoices(project_number);
CREATE INDEX IF NOT EXISTS idx_invoices_created_at ON invoices(created_at DESC);

-- collections — invoice linkage + date ordering
CREATE INDEX IF NOT EXISTS idx_collections_invoice_id ON collections(invoice_id);
CREATE INDEX IF NOT EXISTS idx_collections_created_at ON collections(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_collections_project_number ON collections(project_number);

-- evouchers — filtered by transaction_type + status in report hooks
CREATE INDEX IF NOT EXISTS idx_evouchers_project_number ON evouchers(project_number);
CREATE INDEX IF NOT EXISTS idx_evouchers_type_status ON evouchers(transaction_type, status);

-- tickets — status + date for inbox queries
CREATE INDEX IF NOT EXISTS idx_tickets_status_created ON tickets(status, created_at DESC);
