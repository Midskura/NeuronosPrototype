-- ============================================================================
-- Migration 008 — Add catalog_snapshot to billing_line_items
-- ============================================================================
-- Stores a point-in-time snapshot of the catalog item's metadata at the moment
-- a billing line is created. This means renaming or recategorizing a catalog
-- item never changes historical billing records.
--
-- Shape written at creation time:
-- {
--   "name": "Processing Fee",
--   "unit_type": "per_entry",
--   "tax_code": "VAT",
--   "category_name": "Government Fees",
--   "default_price": 1500.00,
--   "currency": "PHP"
-- }
-- ============================================================================

ALTER TABLE billing_line_items
  ADD COLUMN IF NOT EXISTS catalog_snapshot JSONB DEFAULT '{}';
