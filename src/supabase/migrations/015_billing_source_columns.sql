-- ============================================================================
-- Migration 015 — billing_line_items: source tracking columns
-- ============================================================================
-- These four columns track the origin of each billing item and are required by
-- several core systems that have been writing/reading them against the DB:
--
--   useBillingMerge.ts          deduplicates virtual quotation items against
--                               real billing items via source_quotation_item_id.
--                               Without this column the dedup map is always
--                               empty → quotation lines and their real billing
--                               item counterparts appear as duplicates.
--
--   UnifiedExpensesTab.tsx      handleConvert inserts source_type = 'billable_expense'
--                               and source_id = evoucher.id when converting a
--                               billable expense to an unbilled billing item.
--
--   rateCardToBilling.ts        inserts source_type = 'contract_rate' and source_id
--                               when applying a contract rate card to a booking.
--
--   BudgetRequestDetailPanel.tsx inserts source_type = 'billable_expense' and
--                               source_id = budget_request.id.
--
--   AddChargeModal.tsx /        insert source_type = 'manual' for manual charges.
--   BillingCategorySection.tsx
--
--   BookingRateCardButton.tsx   filters items by source_type = 'rate_card'.
--
-- None of these columns existed in the DB prior to this migration, causing all
-- of the above INSERT paths to fail silently at the PostgREST layer.
-- ============================================================================

ALTER TABLE billing_line_items
  ADD COLUMN IF NOT EXISTS source_id                TEXT,
  ADD COLUMN IF NOT EXISTS source_type              TEXT,
  ADD COLUMN IF NOT EXISTS source_quotation_item_id TEXT,
  ADD COLUMN IF NOT EXISTS quotation_category       TEXT;

-- Reverse-lookup indexes:
--   "has this expense / quotation item already been converted to a billing item?"
-- Used by UnifiedExpensesTab.tsx to build the billedSourceIds Set and by
-- useBillingMerge.ts to build realItemIndices.
CREATE INDEX IF NOT EXISTS idx_bli_source_id
  ON billing_line_items (source_id)
  WHERE source_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_bli_source_type
  ON billing_line_items (source_type)
  WHERE source_type IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_bli_source_qitem
  ON billing_line_items (source_quotation_item_id)
  WHERE source_quotation_item_id IS NOT NULL;
