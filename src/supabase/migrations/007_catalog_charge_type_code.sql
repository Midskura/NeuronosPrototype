-- ============================================================================
-- Migration 007 — Add stable charge_type_code to catalog_items
-- ============================================================================
-- Adds a stable, immutable code field so the rate engine can match catalog
-- items by code rather than by display name. Renaming an item's name field
-- never breaks billing or contract rate calculations.
-- ============================================================================

ALTER TABLE catalog_items
  ADD COLUMN IF NOT EXISTS charge_type_code TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_catalog_items_charge_type_code
  ON catalog_items (charge_type_code)
  WHERE charge_type_code IS NOT NULL;

-- Backfill: BOC Processing Fee maps cleanly to the legacy processing_fee preset
UPDATE catalog_items SET charge_type_code = 'processing_fee' WHERE id = 'ci-012';

-- Insert registry presets that don't have a DB equivalent yet
INSERT INTO catalog_items (id, name, category_id, currency, unit_type, tax_code, is_active, service_types, sort_order, charge_type_code)
VALUES
  ('ci-101', 'Documentation Fee', 'cat-004', 'PHP', 'per_entry',     'VAT',  true, ARRAY['Brokerage'], 20, 'documentation_fee'),
  ('ci-102', 'Handling Fee',      'cat-004', 'PHP', 'per_entry',     'VAT',  true, ARRAY['Brokerage'], 21, 'handling_fee'),
  ('ci-103', 'Brokerage Fee',     'cat-004', 'PHP', 'per_entry',     'VAT',  true, ARRAY['Brokerage'], 22, 'brokerage_fee'),
  ('ci-104', 'Stamps and Notary', 'cat-004', 'PHP', 'per_bl',        'VAT',  true, ARRAY['Brokerage'], 23, 'stamps_and_notary'),
  ('ci-105', 'Examination Fee',   'cat-004', 'PHP', 'per_container', 'VAT',  true, ARRAY['Brokerage'], 24, 'examination_fee'),
  ('ci-106', 'DEA Examination',   'cat-004', 'PHP', 'per_shipment',  'NVAT', true, ARRAY['Brokerage'], 25, 'dea_examination'),
  ('ci-107', 'BAI Processing',    'cat-004', 'PHP', 'per_shipment',  'NVAT', true, ARRAY['Brokerage'], 26, 'bai_processing'),
  ('ci-108', '20ft / 40ft',       'cat-003', 'PHP', 'per_container', 'VAT',  true, ARRAY['Trucking'],  27, '20ft_40ft'),
  ('ci-109', 'Back to Back',      'cat-003', 'PHP', 'per_container', 'VAT',  true, ARRAY['Trucking'],  28, 'back_to_back'),
  ('ci-110', '4-Wheeler',         'cat-003', 'PHP', 'per_container', 'VAT',  true, ARRAY['Trucking'],  29, '4wheeler'),
  ('ci-111', '6-Wheeler',         'cat-003', 'PHP', 'per_container', 'VAT',  true, ARRAY['Trucking'],  30, '6wheeler')
ON CONFLICT (id) DO NOTHING;
