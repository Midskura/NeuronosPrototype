-- ============================================================================
-- Migration 009 — Catalog type architecture: schema + data backfill
-- ============================================================================
-- Fixes five gaps found by live DB audit (2026-03-20):
--
--   1. ADD catalog_items.type column (was missing entirely)
--   2. ADD evouchers.catalog_item_id column (expenses had no catalog link)
--   3. Backfill charge_type_code on old items missing it (ci-001 → ci-019)
--   4. Backfill catalog_items.type on all existing items
--   5. Insert expense-type catalog items (vendor cost side)
--   6. Link seeded billing_line_items to catalog by best-match description
--   7. Backfill catalog_snapshot on now-linked billing lines
--
-- Safe to run multiple times (idempotent via IF NOT EXISTS / WHERE guards).
-- ============================================================================


-- ============================================================================
-- FIX 1 — Add type column to catalog_items
-- ============================================================================

ALTER TABLE catalog_items
  ADD COLUMN IF NOT EXISTS type TEXT
  CHECK (type IN ('charge', 'expense', 'both'))
  DEFAULT 'charge';


-- ============================================================================
-- FIX 2 — Add catalog_item_id to evouchers (expense ↔ catalog link)
-- ============================================================================

ALTER TABLE evouchers
  ADD COLUMN IF NOT EXISTS catalog_item_id TEXT REFERENCES catalog_items(id);


-- ============================================================================
-- FIX 3 — Backfill charge_type_code on old items that are missing it
-- ============================================================================

UPDATE catalog_items SET charge_type_code = 'origin_documentation_fee'    WHERE id = 'ci-001' AND charge_type_code IS NULL;
UPDATE catalog_items SET charge_type_code = 'origin_container_seal'        WHERE id = 'ci-002' AND charge_type_code IS NULL;
UPDATE catalog_items SET charge_type_code = 'export_customs_clearance'     WHERE id = 'ci-003' AND charge_type_code IS NULL;
UPDATE catalog_items SET charge_type_code = 'ocean_freight_fcl_20ft'       WHERE id = 'ci-004' AND charge_type_code IS NULL;
UPDATE catalog_items SET charge_type_code = 'ocean_freight_fcl_40ft'       WHERE id = 'ci-005' AND charge_type_code IS NULL;
UPDATE catalog_items SET charge_type_code = 'baf'                          WHERE id = 'ci-006' AND charge_type_code IS NULL;
UPDATE catalog_items SET charge_type_code = 'destination_documentation_fee' WHERE id = 'ci-007' AND charge_type_code IS NULL;
UPDATE catalog_items SET charge_type_code = 'customs_examination_fee'      WHERE id = 'ci-008' AND charge_type_code IS NULL;
UPDATE catalog_items SET charge_type_code = 'port_handling_cy'             WHERE id = 'ci-009' AND charge_type_code IS NULL;
UPDATE catalog_items SET charge_type_code = 'formal_entry_processing'      WHERE id = 'ci-010' AND charge_type_code IS NULL;
UPDATE catalog_items SET charge_type_code = 'import_duties_taxes'          WHERE id = 'ci-011' AND charge_type_code IS NULL;
UPDATE catalog_items SET charge_type_code = 'peza_boi_facilitation'        WHERE id = 'ci-013' AND charge_type_code IS NULL;
UPDATE catalog_items SET charge_type_code = 'trucking_port_to_warehouse'   WHERE id = 'ci-014' AND charge_type_code IS NULL;
UPDATE catalog_items SET charge_type_code = 'trucking_provincial_surcharge' WHERE id = 'ci-015' AND charge_type_code IS NULL;
UPDATE catalog_items SET charge_type_code = 'trucking_loading_labor'       WHERE id = 'ci-016' AND charge_type_code IS NULL;
UPDATE catalog_items SET charge_type_code = 'marine_insurance_all_risk'    WHERE id = 'ci-017' AND charge_type_code IS NULL;
UPDATE catalog_items SET charge_type_code = 'marine_insurance_war_risk'    WHERE id = 'ci-018' AND charge_type_code IS NULL;
UPDATE catalog_items SET charge_type_code = 'warehousing_per_day'          WHERE id = 'ci-019' AND charge_type_code IS NULL;
UPDATE catalog_items SET charge_type_code = 'miscellaneous_expenses'       WHERE id = 'ci-020' AND charge_type_code IS NULL;


-- ============================================================================
-- FIX 4 — Backfill type on all existing charge items
-- ============================================================================

-- Standard charges: billed to clients (revenue side)
UPDATE catalog_items
SET type = 'charge'
WHERE id IN (
  'ci-001',  -- Origin Documentation Fee
  'ci-002',  -- Origin Container Seal
  'ci-003',  -- Export Customs Clearance
  'ci-004',  -- Ocean Freight FCL 20ft
  'ci-005',  -- Ocean Freight FCL 40ft
  'ci-006',  -- BAF
  'ci-007',  -- Destination Documentation Fee
  'ci-008',  -- Customs Examination Fee
  'ci-009',  -- Port Handling CY
  'ci-010',  -- Formal Entry Processing
  'ci-012',  -- BOC Processing Fee
  'ci-013',  -- PEZA/BOI Facilitation
  'ci-014',  -- Trucking Port to Warehouse
  'ci-015',  -- Trucking Provincial Surcharge
  'ci-016',  -- Trucking Loading Labor
  'ci-017',  -- Marine Insurance Premium All Risk
  'ci-018',  -- Marine Insurance War Risk
  'ci-019',  -- Warehousing per day
  -- Migration 007 registry presets
  'ci-101',  -- Documentation Fee (Brokerage)
  'ci-102',  -- Handling Fee
  'ci-103',  -- Brokerage Fee
  'ci-104',  -- Stamps and Notary
  'ci-105',  -- Examination Fee
  'ci-106',  -- DEA Examination
  'ci-107',  -- BAI Processing
  'ci-108',  -- 20ft / 40ft (Trucking)
  'ci-109',  -- Back to Back
  'ci-110',  -- 4-Wheeler
  'ci-111'   -- 6-Wheeler
)
AND (type IS NULL OR type = 'charge');

-- Import Duties & Taxes: disbursed as expense, recharged to client → 'both'
UPDATE catalog_items SET type = 'both'  WHERE id = 'ci-011' AND (type IS NULL OR type = 'charge');

-- Miscellaneous Expenses: can be either side → 'both'
UPDATE catalog_items SET type = 'both'  WHERE id = 'ci-020' AND (type IS NULL OR type = 'charge');


-- ============================================================================
-- FIX 5 — Insert expense-type catalog items (vendor cost side)
-- ============================================================================

INSERT INTO catalog_items (
  id, name, type, category_id, description,
  currency, unit_type, tax_code, is_active, service_types, sort_order,
  charge_type_code
)
VALUES
  (
    'ci-201', 'Shipping Line Charges', 'expense', 'cat-001',
    'Freight charges paid to the shipping line / carrier on behalf of the booking',
    'PHP', 'per_container', 'ZR', true, ARRAY['Forwarding'], 50,
    'shipping_line_charges'
  ),
  (
    'ci-202', 'Origin Agent Fee', 'expense', 'cat-002',
    'Fees paid to the origin agent or overseas partner for handling at port of loading',
    'PHP', 'per_shipment', 'ZR', true, ARRAY['Forwarding'], 51,
    'origin_agent_fee'
  ),
  (
    'ci-203', 'Customs Agent Disbursement', 'expense', 'cat-004',
    'Out-of-pocket duties, taxes, and fees paid by the broker to BOC on behalf of client',
    'PHP', 'per_shipment', 'NVAT', true, ARRAY['Brokerage'], 52,
    'customs_agent_disbursement'
  ),
  (
    'ci-204', 'Truck Hire Cost', 'expense', 'cat-003',
    'Third-party trucking cost paid to the sub-contractor hauler',
    'PHP', 'per_container', 'VAT', true, ARRAY['Trucking'], 53,
    'truck_hire_cost'
  ),
  (
    'ci-205', 'Insurance Premium (Outward)', 'expense', 'cat-001',
    'Premium paid to the insurer for marine coverage',
    'PHP', 'flat_fee', 'VAT', true, ARRAY['Marine Insurance'], 54,
    'insurance_premium_outward'
  ),
  (
    'ci-206', 'Port Agency Fee', 'expense', 'cat-002',
    'Fees charged by the port agent at origin or destination',
    'PHP', 'per_shipment', 'ZR', true, ARRAY['Forwarding', 'Brokerage'], 55,
    'port_agency_fee'
  ),
  (
    'ci-207', 'Arrastre & Wharfage (Cost)', 'expense', 'cat-003',
    'PPA arrastre and wharfage charges paid directly by the company',
    'PHP', 'per_container', 'NVAT', true, ARRAY['Brokerage', 'Forwarding'], 56,
    'arrastre_wharfage_cost'
  )
ON CONFLICT (id) DO NOTHING;


-- ============================================================================
-- FIX 6 — Link seeded billing_line_items to catalog by best-match description
-- ============================================================================
-- All 15 seeded rows have catalog_item_id = NULL because they predate the
-- catalog architecture. Best-effort match by description keyword below.
-- Only updates rows that are currently unlinked (idempotent).
-- ============================================================================

-- "Ocean Freight — FCL *" → ci-004 (FCL 20ft) as representative charge
UPDATE billing_line_items SET catalog_item_id = 'ci-004'
WHERE catalog_item_id IS NULL AND description ILIKE '%ocean freight%fcl%';

-- "Documentation & B/L Fee" → ci-101 Documentation Fee (Brokerage)
UPDATE billing_line_items SET catalog_item_id = 'ci-101'
WHERE catalog_item_id IS NULL AND description ILIKE '%documentation%';

-- "Port Charges — MICP" → ci-009 Port Handling CY
UPDATE billing_line_items SET catalog_item_id = 'ci-009'
WHERE catalog_item_id IS NULL AND description ILIKE '%port charges%';

-- "Origin Charges — *" → ci-001 Origin Documentation Fee
UPDATE billing_line_items SET catalog_item_id = 'ci-001'
WHERE catalog_item_id IS NULL AND description ILIKE '%origin charges%';

-- "Customs Brokerage Professional Fee" → ci-103 Brokerage Fee
UPDATE billing_line_items SET catalog_item_id = 'ci-103'
WHERE catalog_item_id IS NULL AND description ILIKE '%brokerage%fee%' OR description ILIKE '%professional fee%';

-- "Trucking — Port of Manila to *" → ci-014 Trucking Port to Warehouse
UPDATE billing_line_items SET catalog_item_id = 'ci-014'
WHERE catalog_item_id IS NULL AND description ILIKE '%trucking%port%';

-- "Marine Cargo Insurance Premium — All Risk" → ci-017
UPDATE billing_line_items SET catalog_item_id = 'ci-017'
WHERE catalog_item_id IS NULL AND description ILIKE '%marine%insurance%';

-- "Warehousing — Storage & Handling" → ci-019
UPDATE billing_line_items SET catalog_item_id = 'ci-019'
WHERE catalog_item_id IS NULL AND description ILIKE '%warehousing%';

-- "Cargo Consolidation & Repacking" → ci-020 Miscellaneous Expenses (closest match)
UPDATE billing_line_items SET catalog_item_id = 'ci-020'
WHERE catalog_item_id IS NULL AND description ILIKE '%consolidation%';


-- ============================================================================
-- FIX 7 — Backfill catalog_snapshot on now-linked billing line items
-- ============================================================================

UPDATE billing_line_items bli
SET catalog_snapshot = jsonb_build_object(
  'name',          ci.name,
  'charge_type_code', ci.charge_type_code,
  'type',          ci.type,
  'unit_type',     ci.unit_type,
  'tax_code',      ci.tax_code,
  'category_name', COALESCE(cc.name, ''),
  'default_price', COALESCE(ci.default_price, 0),
  'currency',      COALESCE(ci.currency, 'PHP')
)
FROM catalog_items ci
LEFT JOIN catalog_categories cc ON cc.id = ci.category_id
WHERE bli.catalog_item_id = ci.id
  AND (
    bli.catalog_snapshot IS NULL
    OR bli.catalog_snapshot = '{}'::jsonb
  );


-- ============================================================================
-- VERIFY — confirm all fixes applied
-- ============================================================================

-- 1. Type distribution (should show charge, both, expense)
SELECT COALESCE(type, 'NULL') AS type, COUNT(*) AS count
FROM catalog_items GROUP BY type ORDER BY type;

-- 2. Any items still missing charge_type_code?
SELECT id, name FROM catalog_items WHERE charge_type_code IS NULL ORDER BY id;

-- 3. billing_line_items linkage summary
SELECT
  COUNT(*)                                                         AS total_lines,
  COUNT(catalog_item_id)                                           AS linked,
  COUNT(*) - COUNT(catalog_item_id)                                AS unlinked,
  COUNT(*) FILTER (WHERE catalog_snapshot != '{}'::jsonb
                    AND catalog_snapshot IS NOT NULL)              AS with_snapshot
FROM billing_line_items;

-- 4. Expense items inserted
SELECT id, name, type, charge_type_code FROM catalog_items WHERE type IN ('expense','both') ORDER BY id;
