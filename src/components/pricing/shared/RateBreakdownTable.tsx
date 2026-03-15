/**
 * RateBreakdownTable
 *
 * Shared HTML <table> component used by both RateCalculationSheet (booking-level)
 * and QuotationRateBreakdownSheet (quotation-level) to render the rate engine output.
 *
 * Standardized column widths prevent currency clipping:
 *   Particular (auto) | Unit Rate (110px) | Qty (56px) | Subtotal (120px)
 *
 * @see /docs/blueprints/RATE_TABLE_DRY_BLUEPRINT.md
 */

import type { AppliedRate } from "../../../types/pricing";

// ============================================
// FORMAT HELPER (en-PH locale, peso-aware)
// ============================================

export const formatCurrency = (amount: number, currency: string = "PHP") =>
  new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(amount);

// ============================================
// TYPES
// ============================================

interface RateBreakdownTableProps {
  appliedRates: AppliedRate[];
  total: number;
  currency: string;
  /** Optional heading override — defaults to "Rate Breakdown" */
  heading?: string;
  /** When true, suppress the heading and total footer row (used inside grouped multi-line display) */
  hideTotal?: boolean;
}

// ============================================
// COMPONENT
// ============================================

export function RateBreakdownTable({
  appliedRates,
  total,
  currency,
  heading = "Rate Breakdown",
  hideTotal = false,
}: RateBreakdownTableProps) {
  return (
    <div>
      {!hideTotal && (
        <h3 className="text-[13px] font-semibold text-[#12332B] uppercase tracking-wide mb-4">
          {heading}
        </h3>
      )}

      {appliedRates.length === 0 ? (
        <div className="py-8 text-center text-[13px] text-[#667085]">
          No applicable rates found for this mode and quantities.
        </div>
      ) : (
        <div className="border border-[#E5E9F0] rounded-lg overflow-hidden">
          <table
            className="w-full border-collapse text-[13px]"
            style={{ tableLayout: "fixed" }}
          >
            <colgroup>
              <col style={{ width: "auto" }} />
              <col style={{ width: "110px" }} />
              <col style={{ width: "56px" }} />
              <col style={{ width: "120px" }} />
            </colgroup>

            {/* Header */}
            <thead>
              <tr className="text-[11px] font-semibold text-[#667085] uppercase tracking-wide bg-[#F8FAFC] border-b border-[#E5E9F0]">
                <th className="text-left px-4 py-2.5 font-semibold">Particular</th>
                <th className="text-right px-4 py-2.5 font-semibold">Unit Rate</th>
                <th className="text-center px-2 py-2.5 font-semibold">Qty</th>
                <th className="text-right px-4 py-2.5 font-semibold">Subtotal</th>
              </tr>
            </thead>

            {/* Body */}
            <tbody>
              {appliedRates.flatMap((rate: AppliedRate, idx: number) => {
                const rows = [
                  <tr
                    key={`rate-${rate.particular}-${idx}`}
                    className="border-b border-[#E5E9F0] hover:bg-[#FAFBFC] transition-colors"
                  >
                    <td className="px-4 py-3 font-medium text-[#12332B] truncate">
                      {rate.particular}
                    </td>
                    <td className="px-4 py-3 text-right text-[#667085] whitespace-nowrap">
                      {formatCurrency(rate.rate, currency)}
                    </td>
                    <td className="px-2 py-3 text-center text-[#12332B] font-medium">
                      {rate.quantity}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-[#12332B] whitespace-nowrap">
                      {formatCurrency(rate.subtotal, currency)}
                    </td>
                  </tr>,
                ];

                if (rate.rule_applied && rate.quantity > 1) {
                  rows.push(
                    <tr
                      key={`rule-${rate.particular}-${idx}`}
                      className="border-b border-[#E5E9F0]"
                    >
                      <td colSpan={4} className="px-4 pt-1 pb-1">
                        <div className="text-[11px] text-[#0F766E] bg-[#F0FDF9] inline-block px-2 py-0.5 rounded">
                          {rate.rule_applied}
                        </div>
                      </td>
                    </tr>
                  );
                }

                return rows;
              })}
            </tbody>

            {/* Footer — total */}
            {!hideTotal && (
            <tfoot>
              <tr className="bg-[#F8FAFC] border-t border-[#E5E9F0]">
                <td className="px-4 py-3 font-semibold text-[#12332B]">Total</td>
                <td />
                <td />
                <td className="px-4 py-3 text-right text-[15px] font-bold text-[#0F766E] whitespace-nowrap">
                  {formatCurrency(total, currency)}
                </td>
              </tr>
            </tfoot>
            )}
          </table>
        </div>
      )}
    </div>
  );
}