-- ============================================================================
-- Neuron OS — Financial Seed Extension
-- ============================================================================
-- Inserts billing_line_items, invoices, and collections so the V2 financial
-- hooks have real data to display.
--
-- Run AFTER:
--   1. Migrations 001–006 applied
--   2. seed.sql executed (bookings, projects, customers must exist)
--
-- Data model:
--   Completed bookings  → billing lines with status 'invoiced' + invoice + collection
--   Active bookings     → billing lines with status 'unbilled'
-- ============================================================================


-- ============================================================================
-- INVOICES — packaging documents for completed bookings
-- ============================================================================
-- INV-2026-001: Metro Retail Group — packages FWD-003 + BRK-003 + TRK-002
-- INV-2026-002: Pacific Distribution Co. — MIP-002

INSERT INTO invoices (
  id, invoice_number, invoice_date,
  booking_id, booking_ids,
  project_id, project_number,
  customer_id, customer_name,
  service_types,
  subtotal, tax_amount, total_amount, currency,
  status, posted, posted_at,
  project_refs, contract_refs, metadata,
  notes, created_by
)
VALUES
  (
    'inv-2026-001', 'INV-2026-001', '2026-02-22 08:00:00+08',
    'bk-fwd-003',
    ARRAY['bk-fwd-003','bk-brk-003','bk-trk-002'],
    'prj-2026-002', 'PRJ-2026-002',
    'cust-002', 'Metro Retail Group',
    ARRAY['Forwarding','Brokerage','Trucking'],
    112500, 0, 112500, 'PHP',
    'paid', true, '2026-02-22 09:00:00+08',
    ARRAY['PRJ-2026-002'], ARRAY[]::TEXT[], '{}'::jsonb,
    'Invoice for completed Metro Retail shipment (Busan–Cebu) — Forwarding + Brokerage + Trucking',
    (SELECT id FROM users WHERE email = 'acct.manager@neuron.ph')
  ),

  (
    'inv-2026-002', 'INV-2026-002', '2026-03-12 08:00:00+08',
    'bk-mip-002',
    ARRAY['bk-mip-002'],
    'prj-2026-003', 'PRJ-2026-003',
    'cust-003', 'Pacific Distribution Co.',
    ARRAY['Marine Insurance'],
    4200, 0, 4200, 'PHP',
    'paid', true, '2026-03-12 09:00:00+08',
    ARRAY['PRJ-2026-003'], ARRAY[]::TEXT[], '{}'::jsonb,
    'Invoice for Pacific Distribution marine insurance — UCPB General all-risk coverage',
    (SELECT id FROM users WHERE email = 'acct.manager@neuron.ph')
  )

ON CONFLICT (id) DO NOTHING;


-- ============================================================================
-- BILLING LINE ITEMS — charge atoms per booking
-- ============================================================================

-- -----------------------------------------------------------------------
-- Completed bookings: status = 'invoiced', invoice_id linked
-- -----------------------------------------------------------------------

-- bk-fwd-003: FCL 40ft Busan–Cebu (Completed) → INV-2026-001
INSERT INTO billing_line_items (
  id, booking_id, project_id, invoice_id, invoice_number,
  description, charge_type, category, service_type,
  customer_name, project_number,
  amount, quantity, unit_price, currency, unit_type,
  is_taxed, tax_code, tax_amount,
  status, catalog_item_id
) VALUES
  ('bl-fwd-003-a', 'bk-fwd-003', 'prj-2026-002', 'inv-2026-001', 'INV-2026-001',
   'Ocean Freight — FCL 40ft (Busan–Cebu)', 'revenue', 'Freight', 'Forwarding',
   'Metro Retail Group', 'PRJ-2026-002',
   75000, 1, 75000, 'PHP', 'per_container',
   false, 'ZR', 0, 'invoiced', 'ci-005'),

  ('bl-fwd-003-b', 'bk-fwd-003', 'prj-2026-002', 'inv-2026-001', 'INV-2026-001',
   'Port Handling — CY (Cebu)', 'revenue', 'Destination Charges', 'Forwarding',
   'Metro Retail Group', 'PRJ-2026-002',
   6500, 1, 6500, 'PHP', 'per_container',
   true, 'VAT', 780, 'invoiced', 'ci-009'),

  ('bl-fwd-003-c', 'bk-fwd-003', 'prj-2026-002', 'inv-2026-001', 'INV-2026-001',
   'Destination Documentation Fee', 'revenue', 'Destination Charges', 'Forwarding',
   'Metro Retail Group', 'PRJ-2026-002',
   3500, 1, 3500, 'PHP', 'per_bl',
   true, 'VAT', 420, 'invoiced', 'ci-007')

ON CONFLICT (id) DO NOTHING;

-- bk-brk-003: NAIA Brokerage (Completed) → INV-2026-001
INSERT INTO billing_line_items (
  id, booking_id, project_id, invoice_id, invoice_number,
  description, charge_type, category, service_type,
  customer_name, project_number,
  amount, quantity, unit_price, currency, unit_type,
  is_taxed, tax_code, tax_amount,
  status, catalog_item_id
) VALUES
  ('bl-brk-003-a', 'bk-brk-003', 'prj-2026-002', 'inv-2026-001', 'INV-2026-001',
   'Formal Entry Processing — NAIA', 'revenue', 'Government Fees', 'Brokerage',
   'Metro Retail Group', 'PRJ-2026-002',
   8500, 1, 8500, 'PHP', 'per_shipment',
   true, 'VAT', 1020, 'invoiced', 'ci-010'),

  ('bl-brk-003-b', 'bk-brk-003', 'prj-2026-002', 'inv-2026-001', 'INV-2026-001',
   'BOC Processing Fee', 'revenue', 'Government Fees', 'Brokerage',
   'Metro Retail Group', 'PRJ-2026-002',
   1000, 1, 1000, 'PHP', 'per_shipment',
   false, 'NVAT', 0, 'invoiced', 'ci-012'),

  ('bl-brk-003-c', 'bk-brk-003', 'prj-2026-002', 'inv-2026-001', 'INV-2026-001',
   'Import Duties & Taxes — advance on behalf of client', 'revenue', 'Government Fees', 'Brokerage',
   'Metro Retail Group', 'PRJ-2026-002',
   9000, 1, 9000, 'PHP', 'flat_fee',
   false, 'NVAT', 0, 'invoiced', 'ci-011')

ON CONFLICT (id) DO NOTHING;

-- bk-trk-002: NAIA → Caloocan DC Trucking (Delivered) → INV-2026-001
INSERT INTO billing_line_items (
  id, booking_id, project_id, invoice_id, invoice_number,
  description, charge_type, category, service_type,
  customer_name, project_number,
  amount, quantity, unit_price, currency, unit_type,
  is_taxed, tax_code, tax_amount,
  status, catalog_item_id
) VALUES
  ('bl-trk-002-a', 'bk-trk-002', 'prj-2026-002', 'inv-2026-001', 'INV-2026-001',
   'Trucking — Port to Warehouse (NAIA → Caloocan DC)', 'revenue', 'Destination Charges', 'Trucking',
   'Metro Retail Group', 'PRJ-2026-002',
   9500, 1, 9500, 'PHP', 'per_container',
   true, 'VAT', 1140, 'invoiced', 'ci-014')

ON CONFLICT (id) DO NOTHING;

-- bk-mip-002: Pacific Distribution Marine Insurance (Completed) → INV-2026-002
INSERT INTO billing_line_items (
  id, booking_id, project_id, invoice_id, invoice_number,
  description, charge_type, category, service_type,
  customer_name, project_number,
  amount, quantity, unit_price, currency, unit_type,
  is_taxed, tax_code, tax_amount,
  status, catalog_item_id
) VALUES
  ('bl-mip-002-a', 'bk-mip-002', 'prj-2026-003', 'inv-2026-002', 'INV-2026-002',
   'Marine Insurance Premium — All Risk (UCPB General, Electronics)',
   'revenue', 'Freight', 'Marine Insurance',
   'Pacific Distribution Co.', 'PRJ-2026-003',
   4200, 1, 4200, 'PHP', 'flat_fee',
   true, 'VAT', 504, 'invoiced', 'ci-017')

ON CONFLICT (id) DO NOTHING;

-- -----------------------------------------------------------------------
-- Active bookings: status = 'unbilled', no invoice_id
-- -----------------------------------------------------------------------

-- bk-fwd-001: FCL 20ft Shanghai–Manila (In Transit)
INSERT INTO billing_line_items (
  id, booking_id, project_id,
  description, charge_type, category, service_type,
  customer_name, project_number,
  amount, quantity, unit_price, currency, unit_type,
  is_taxed, tax_code, tax_amount,
  status, catalog_item_id
) VALUES
  ('bl-fwd-001-a', 'bk-fwd-001', 'prj-2026-001',
   'Ocean Freight — FCL 20ft (Shanghai–Manila)', 'revenue', 'Freight', 'Forwarding',
   'Reyes Global Trading', 'PRJ-2026-001',
   45000, 1, 45000, 'PHP', 'per_container',
   false, 'ZR', 0, 'unbilled', 'ci-004'),

  ('bl-fwd-001-b', 'bk-fwd-001', 'prj-2026-001',
   'BAF (Bunker Adjustment Factor)', 'revenue', 'Freight', 'Forwarding',
   'Reyes Global Trading', 'PRJ-2026-001',
   8000, 1, 8000, 'PHP', 'per_container',
   false, 'ZR', 0, 'unbilled', 'ci-006'),

  ('bl-fwd-001-c', 'bk-fwd-001', 'prj-2026-001',
   'Port Handling — CY (Manila)', 'revenue', 'Destination Charges', 'Forwarding',
   'Reyes Global Trading', 'PRJ-2026-001',
   6500, 1, 6500, 'PHP', 'per_container',
   true, 'VAT', 780, 'unbilled', 'ci-009'),

  ('bl-fwd-001-d', 'bk-fwd-001', 'prj-2026-001',
   'Destination Documentation Fee', 'revenue', 'Destination Charges', 'Forwarding',
   'Reyes Global Trading', 'PRJ-2026-001',
   3500, 1, 3500, 'PHP', 'per_bl',
   true, 'VAT', 420, 'unbilled', 'ci-007'),

  ('bl-fwd-001-e', 'bk-fwd-001', 'prj-2026-001',
   'Origin Documentation Fee', 'revenue', 'Origin Charges', 'Forwarding',
   'Reyes Global Trading', 'PRJ-2026-001',
   3500, 1, 3500, 'PHP', 'per_bl',
   true, 'VAT', 420, 'unbilled', 'ci-001')

ON CONFLICT (id) DO NOTHING;

-- bk-fwd-002: FCL 2×40ft Guangzhou–Manila (In Transit)
INSERT INTO billing_line_items (
  id, booking_id, project_id,
  description, charge_type, category, service_type,
  customer_name, project_number,
  amount, quantity, unit_price, currency, unit_type,
  is_taxed, tax_code, tax_amount,
  status, catalog_item_id
) VALUES
  ('bl-fwd-002-a', 'bk-fwd-002', 'prj-2026-001',
   'Ocean Freight — FCL 40ft × 2 (Guangzhou–Manila)', 'revenue', 'Freight', 'Forwarding',
   'Reyes Global Trading', 'PRJ-2026-001',
   150000, 2, 75000, 'PHP', 'per_container',
   false, 'ZR', 0, 'unbilled', 'ci-005'),

  ('bl-fwd-002-b', 'bk-fwd-002', 'prj-2026-001',
   'BAF × 2 containers', 'revenue', 'Freight', 'Forwarding',
   'Reyes Global Trading', 'PRJ-2026-001',
   16000, 2, 8000, 'PHP', 'per_container',
   false, 'ZR', 0, 'unbilled', 'ci-006'),

  ('bl-fwd-002-c', 'bk-fwd-002', 'prj-2026-001',
   'Destination Documentation Fee', 'revenue', 'Destination Charges', 'Forwarding',
   'Reyes Global Trading', 'PRJ-2026-001',
   3500, 1, 3500, 'PHP', 'per_bl',
   true, 'VAT', 420, 'unbilled', 'ci-007'),

  ('bl-fwd-002-d', 'bk-fwd-002', 'prj-2026-001',
   'Customs Examination Fee × 2', 'revenue', 'Destination Charges', 'Forwarding',
   'Reyes Global Trading', 'PRJ-2026-001',
   9000, 2, 4500, 'PHP', 'per_container',
   true, 'VAT', 1080, 'unbilled', 'ci-008')

ON CONFLICT (id) DO NOTHING;

-- bk-brk-001: MICP Brokerage for FWD-001 (Confirmed)
INSERT INTO billing_line_items (
  id, booking_id, project_id,
  description, charge_type, category, service_type,
  customer_name, project_number,
  amount, quantity, unit_price, currency, unit_type,
  is_taxed, tax_code, tax_amount,
  status, catalog_item_id
) VALUES
  ('bl-brk-001-a', 'bk-brk-001', 'prj-2026-001',
   'Formal Entry Processing — MICP', 'revenue', 'Government Fees', 'Brokerage',
   'Reyes Global Trading', 'PRJ-2026-001',
   8500, 1, 8500, 'PHP', 'per_shipment',
   true, 'VAT', 1020, 'unbilled', 'ci-010'),

  ('bl-brk-001-b', 'bk-brk-001', 'prj-2026-001',
   'BOC Processing Fee', 'revenue', 'Government Fees', 'Brokerage',
   'Reyes Global Trading', 'PRJ-2026-001',
   1000, 1, 1000, 'PHP', 'per_shipment',
   false, 'NVAT', 0, 'unbilled', 'ci-012'),

  ('bl-brk-001-c', 'bk-brk-001', 'prj-2026-001',
   'Import Duties & Taxes — advance on behalf of client', 'revenue', 'Government Fees', 'Brokerage',
   'Reyes Global Trading', 'PRJ-2026-001',
   13000, 1, 13000, 'PHP', 'flat_fee',
   false, 'NVAT', 0, 'unbilled', 'ci-011')

ON CONFLICT (id) DO NOTHING;

-- bk-brk-002: MICP Brokerage for FWD-002 (In Transit)
INSERT INTO billing_line_items (
  id, booking_id, project_id,
  description, charge_type, category, service_type,
  customer_name, project_number,
  amount, quantity, unit_price, currency, unit_type,
  is_taxed, tax_code, tax_amount,
  status, catalog_item_id
) VALUES
  ('bl-brk-002-a', 'bk-brk-002', 'prj-2026-001',
   'Formal Entry Processing — MICP (2 containers)', 'revenue', 'Government Fees', 'Brokerage',
   'Reyes Global Trading', 'PRJ-2026-001',
   17000, 2, 8500, 'PHP', 'per_shipment',
   true, 'VAT', 2040, 'unbilled', 'ci-010'),

  ('bl-brk-002-b', 'bk-brk-002', 'prj-2026-001',
   'Import Duties & Taxes — advance on behalf of client', 'revenue', 'Government Fees', 'Brokerage',
   'Reyes Global Trading', 'PRJ-2026-001',
   25000, 1, 25000, 'PHP', 'flat_fee',
   false, 'NVAT', 0, 'unbilled', 'ci-011')

ON CONFLICT (id) DO NOTHING;

-- bk-trk-001: MICP → Cavite (In Transit)
INSERT INTO billing_line_items (
  id, booking_id, project_id,
  description, charge_type, category, service_type,
  customer_name, project_number,
  amount, quantity, unit_price, currency, unit_type,
  is_taxed, tax_code, tax_amount,
  status, catalog_item_id
) VALUES
  ('bl-trk-001-a', 'bk-trk-001', 'prj-2026-001',
   'Trucking — Port to Warehouse (MICP → Cavite)', 'revenue', 'Destination Charges', 'Trucking',
   'Reyes Global Trading', 'PRJ-2026-001',
   9500, 1, 9500, 'PHP', 'per_container',
   true, 'VAT', 1140, 'unbilled', 'ci-014'),

  ('bl-trk-001-b', 'bk-trk-001', 'prj-2026-001',
   'Trucking — Provincial Surcharge (Cavite)', 'revenue', 'Destination Charges', 'Trucking',
   'Reyes Global Trading', 'PRJ-2026-001',
   2000, 1, 2000, 'PHP', 'per_container',
   true, 'VAT', 240, 'unbilled', 'ci-015')

ON CONFLICT (id) DO NOTHING;

-- bk-mip-001: Reyes Global Marine Insurance (Confirmed)
INSERT INTO billing_line_items (
  id, booking_id, project_id,
  description, charge_type, category, service_type,
  customer_name, project_number,
  amount, quantity, unit_price, currency, unit_type,
  is_taxed, tax_code, tax_amount,
  status, catalog_item_id
) VALUES
  ('bl-mip-001-a', 'bk-mip-001', 'prj-2026-001',
   'Marine Insurance Premium — All Risk (Pioneer, Garments)', 'revenue', 'Freight', 'Marine Insurance',
   'Reyes Global Trading', 'PRJ-2026-001',
   3200, 1, 3200, 'PHP', 'flat_fee',
   true, 'VAT', 384, 'unbilled', 'ci-017')

ON CONFLICT (id) DO NOTHING;

-- bk-oth-001: Metro Retail Warehousing (Draft)
INSERT INTO billing_line_items (
  id, booking_id, project_id,
  description, charge_type, category, service_type,
  customer_name, project_number,
  amount, quantity, unit_price, currency, unit_type,
  is_taxed, tax_code, tax_amount,
  status, catalog_item_id
) VALUES
  ('bl-oth-001-a', 'bk-oth-001', 'prj-2026-002',
   'Warehousing — 14 days (DP World Calamba ICT)', 'revenue', 'Destination Charges', 'Others',
   'Metro Retail Group', 'PRJ-2026-002',
   21000, 14, 1500, 'PHP', 'flat_fee',
   true, 'VAT', 2520, 'unbilled', 'ci-019')

ON CONFLICT (id) DO NOTHING;

-- bk-oth-002: Reyes Global Repacking (In Transit)
INSERT INTO billing_line_items (
  id, booking_id, project_id,
  description, charge_type, category, service_type,
  customer_name, project_number,
  amount, quantity, unit_price, currency, unit_type,
  is_taxed, tax_code, tax_amount,
  status, catalog_item_id
) VALUES
  ('bl-oth-002-a', 'bk-oth-002', 'prj-2026-001',
   'Cargo Consolidation & Repacking — Cavite Warehouse (500 units)', 'revenue', 'Destination Charges', 'Others',
   'Reyes Global Trading', 'PRJ-2026-001',
   8500, 1, 8500, 'PHP', 'flat_fee',
   true, 'VAT', 1020, 'unbilled', NULL)

ON CONFLICT (id) DO NOTHING;


-- ============================================================================
-- COLLECTIONS — cash receipts linked to invoices
-- ============================================================================

INSERT INTO collections (
  id, collection_number,
  booking_id, booking_ids,
  project_id, project_number,
  customer_id, customer_name,
  invoice_id,
  service_types,
  amount, currency, payment_method, reference_number,
  collection_date,
  status, posted, posted_at,
  linked_billings,
  notes, created_by
)
VALUES
  -- COL-2026-001: Full payment for INV-2026-001 (Metro Retail — Forwarding+Brokerage+Trucking)
  (
    'col-2026-001', 'COL-2026-001',
    'bk-fwd-003',
    ARRAY['bk-fwd-003','bk-brk-003','bk-trk-002'],
    'prj-2026-002', 'PRJ-2026-002',
    'cust-002', 'Metro Retail Group',
    'inv-2026-001',
    ARRAY['Forwarding','Brokerage','Trucking'],
    112500, 'PHP', 'Bank Transfer', 'MRBPI-2026-022518',
    '2026-02-25 09:00:00+08',
    'posted', true, '2026-02-26 08:00:00+08',
    jsonb_build_array(jsonb_build_object(
      'id',             'inv-2026-001',
      'invoice_number', 'INV-2026-001',
      'amount',         112500
    )),
    'Full payment received via bank transfer for INV-2026-001 — Metro Retail Busan–Cebu shipment',
    (SELECT id FROM users WHERE email = 'acct.manager@neuron.ph')
  ),

  -- COL-2026-002: Full payment for INV-2026-002 (Pacific Distribution — Marine Insurance)
  (
    'col-2026-002', 'COL-2026-002',
    'bk-mip-002',
    ARRAY['bk-mip-002'],
    'prj-2026-003', 'PRJ-2026-003',
    'cust-003', 'Pacific Distribution Co.',
    'inv-2026-002',
    ARRAY['Marine Insurance'],
    4200, 'PHP', 'Cash', 'CASH-PAC-2026-001',
    '2026-03-10 11:00:00+08',
    'posted', true, '2026-03-11 08:00:00+08',
    jsonb_build_array(jsonb_build_object(
      'id',             'inv-2026-002',
      'invoice_number', 'INV-2026-002',
      'amount',         4200
    )),
    'Cash payment received for marine insurance INV-2026-002 — Pacific Distribution',
    (SELECT id FROM users WHERE email = 'acct.manager@neuron.ph')
  )

ON CONFLICT (id) DO NOTHING;


-- ============================================================================
-- Update counters
-- ============================================================================
INSERT INTO counters (key, value)
VALUES
  ('invoice_counter',    '2'::jsonb),
  ('collection_counter', '2'::jsonb)
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
