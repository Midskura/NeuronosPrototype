-- ============================================================================
-- Migration 021 — Catalog taxonomy cleanup
-- ============================================================================
-- Simplifies catalog_items to a pure taxonomy: id, name, category_id.
-- Removes all price-list / classification fields that were never consistently
-- used and caused confusion about charge vs expense context.
--
-- Dropped columns:
--   type, default_price, currency, unit_type, tax_code, is_active,
--   service_types, sort_order, description, charge_type_code
--
-- Kept columns:
--   id, name, category_id, created_at, updated_at
--
-- Context (charge vs expense) is now determined by WHERE the line item lives:
--   selling_price section  → charge
--   buying_price section   → expense
--   billing_line_items     → charge
--   evouchers              → expense
-- ============================================================================

-- Drop the unique index on charge_type_code before dropping the column
DROP INDEX IF EXISTS idx_catalog_items_charge_type_code;

-- Drop all taxonomy/price-list columns
ALTER TABLE catalog_items
  DROP COLUMN IF EXISTS type,
  DROP COLUMN IF EXISTS default_price,
  DROP COLUMN IF EXISTS currency,
  DROP COLUMN IF EXISTS unit_type,
  DROP COLUMN IF EXISTS tax_code,
  DROP COLUMN IF EXISTS is_active,
  DROP COLUMN IF EXISTS service_types,
  DROP COLUMN IF EXISTS sort_order,
  DROP COLUMN IF EXISTS description,
  DROP COLUMN IF EXISTS charge_type_code;
