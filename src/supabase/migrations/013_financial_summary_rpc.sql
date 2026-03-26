-- 013_financial_summary_rpc.sql
-- Server-side financial health summary using pre-aggregated CTEs.
-- Replaces the 5-table full scan in useFinancialHealthReport with a single RPC call.
--
-- IMPORTANT: Uses CTEs to aggregate each child table BEFORE joining,
-- avoiding the cartesian product bug that SUM(DISTINCT) across multiple
-- one-to-many joins produces.

CREATE OR REPLACE FUNCTION get_financial_health_summary(p_month text DEFAULT NULL)
RETURNS TABLE (
  project_number   text,
  project_date     timestamptz,
  customer_name    text,
  invoice_numbers  text[],
  billing_total    numeric,
  expenses_total   numeric,
  collected_amount numeric,
  gross_profit     numeric
)
LANGUAGE plpgsql STABLE SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
  WITH
    -- Pre-aggregate billing totals per project (exclude voided items)
    billing_agg AS (
      SELECT
        bli.project_number AS pn,
        COALESCE(SUM(bli.amount), 0) AS total
      FROM billing_line_items bli
      WHERE bli.project_number IS NOT NULL
        AND bli.status NOT IN ('voided', 'void', 'cancelled')
      GROUP BY bli.project_number
    ),

    -- Pre-aggregate expense totals per project (only approved/posted/paid evouchers)
    expense_agg AS (
      SELECT
        ev.project_number AS pn,
        COALESCE(SUM(ev.amount), 0) AS total
      FROM evouchers ev
      WHERE ev.project_number IS NOT NULL
        AND ev.transaction_type IN ('expense', 'budget_request')
        AND ev.status IN ('approved', 'posted', 'paid', 'partial')
      GROUP BY ev.project_number
    ),

    -- Pre-aggregate invoice numbers per project (exclude reversed/draft invoices)
    invoice_agg AS (
      SELECT
        i.project_number AS pn,
        array_agg(DISTINCT i.invoice_number) FILTER (WHERE i.invoice_number IS NOT NULL) AS numbers,
        array_agg(DISTINCT i.id) FILTER (WHERE i.id IS NOT NULL) AS ids
      FROM invoices i
      WHERE i.project_number IS NOT NULL
        AND i.status NOT IN ('reversed', 'reversal_draft', 'reversal_posted', 'draft')
      GROUP BY i.project_number
    ),

    -- Pre-aggregate collections per project (via invoice linkage, exclude non-applied)
    collection_agg AS (
      SELECT
        i.project_number AS pn,
        COALESCE(SUM(col.amount), 0) AS total
      FROM collections col
      INNER JOIN invoices i ON i.id = col.invoice_id
      WHERE i.project_number IS NOT NULL
        AND col.status NOT IN ('draft', 'cancelled', 'voided', 'void', 'credited', 'refunded')
      GROUP BY i.project_number
    )

  SELECT
    p.project_number,
    COALESCE(p.created_at, now()) AS project_date,
    COALESCE(c.name, p.customer_name, '—') AS customer_name,
    COALESCE(ia.numbers, ARRAY[]::text[]) AS invoice_numbers,
    COALESCE(ba.total, 0) AS billing_total,
    COALESCE(ea.total, 0) AS expenses_total,
    COALESCE(ca.total, 0) AS collected_amount,
    COALESCE(ba.total, 0) - COALESCE(ea.total, 0) AS gross_profit
  FROM projects p
  LEFT JOIN customers c ON c.id = p.customer_id
  LEFT JOIN billing_agg ba ON ba.pn = p.project_number
  LEFT JOIN expense_agg ea ON ea.pn = p.project_number
  LEFT JOIN invoice_agg ia ON ia.pn = p.project_number
  LEFT JOIN collection_agg ca ON ca.pn = p.project_number
  WHERE
    -- Optional month filter on project creation date
    (p_month IS NULL OR to_char(p.created_at, 'YYYY-MM') = p_month)
    -- Only include projects with financial activity
    AND (
      COALESCE(ba.total, 0) > 0
      OR COALESCE(ea.total, 0) > 0
      OR COALESCE(ca.total, 0) > 0
    )
  ORDER BY p.created_at DESC;
END $$;
