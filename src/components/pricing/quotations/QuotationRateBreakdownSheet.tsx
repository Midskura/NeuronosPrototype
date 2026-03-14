/**
 * QuotationRateBreakdownSheet
 *
 * Read-only slide-over that shows the transparent rate calculation breakdown
 * for a specific service in the quotation builder. Opens when the user clicks
 * "View Breakdown" next to an "Applied" service in the contract rate bridge banner.
 *
 * Reuses the same rate engine (`calculateContractBilling`) as the booking-level
 * RateCalculationSheet, but without the "Apply to Billings" footer — rates are
 * already applied to selling prices in the quotation.
 *
 * @see /docs/blueprints/QUOTATION_RATE_BRIDGE_GENERALIZATION_BLUEPRINT.md
 * @see /docs/blueprints/RATE_TABLE_DRY_BLUEPRINT.md
 */

import { useMemo } from "react";
import { SidePanel } from "../../common/SidePanel";
import { Info } from "lucide-react";
import { calculateContractBilling, calculateMultiLineTruckingBilling, type BookingQuantities } from "../../../utils/contractRateEngine";
import type { ContractRateMatrix, AppliedRate } from "../../../types/pricing";
import { RateBreakdownTable, formatCurrency } from "../shared/RateBreakdownTable";
import { QuantityDisplaySection } from "../shared/QuantityDisplaySection";
import type { TruckingLineItem } from "../../../types/pricing";
import { extractMultiLineSelectionsAndQuantities } from "../../../utils/contractQuantityExtractor";

// ============================================
// TYPES
// ============================================

interface QuotationRateBreakdownSheetProps {
  isOpen: boolean;
  onClose: () => void;
  serviceType: string;
  rateMatrices: ContractRateMatrix[];
  resolvedMode: string | null;
  quantities: BookingQuantities;
  selections?: Record<string, string>;  // ✨ Selection group: alternative row selections
  /** Optional: human-readable truck type from the form (e.g., "40ft") for display */
  truckTypeLabel?: string;
  /** Optional: multi-line trucking line items for grouped display (@see MULTI_LINE_TRUCKING_BLUEPRINT.md) */
  truckingLineItems?: TruckingLineItem[];
  currency: string;
  contractNumber: string;
}

// ============================================
// COMPONENT
// ============================================

export function QuotationRateBreakdownSheet({
  isOpen,
  onClose,
  serviceType,
  rateMatrices,
  resolvedMode,
  quantities,
  selections,
  truckTypeLabel,
  truckingLineItems,
  currency,
  contractNumber,
}: QuotationRateBreakdownSheetProps) {
  // ✨ Multi-line trucking: compute per-line-item breakdowns
  const isMultiLine = serviceType.toLowerCase() === "trucking"
    && truckingLineItems && truckingLineItems.length > 1;

  const multiLineResults = useMemo(() => {
    if (!isOpen || !isMultiLine) return null;
    const extractions = extractMultiLineSelectionsAndQuantities(truckingLineItems!, rateMatrices);
    return calculateMultiLineTruckingBilling(rateMatrices, resolvedMode || "FCL", extractions);
  }, [isOpen, isMultiLine, rateMatrices, resolvedMode, JSON.stringify(truckingLineItems)]);

  // Single-line calculation (existing behavior — used when NOT multi-line)
  const calculation = useMemo(() => {
    if (!isOpen || rateMatrices.length === 0 || isMultiLine) {
      return { appliedRates: [] as AppliedRate[], total: 0 };
    }
    return calculateContractBilling(
      rateMatrices,
      serviceType,
      resolvedMode || "FCL",
      quantities,
      selections
    );
  }, [isOpen, rateMatrices, serviceType, resolvedMode, quantities, selections, isMultiLine]);

  // Grand total for footer
  const grandTotal = isMultiLine && multiLineResults
    ? multiLineResults.grandTotal
    : calculation.total;

  const totalItems = isMultiLine && multiLineResults
    ? multiLineResults.lineResults.reduce((sum: number, lr: any) => sum + lr.appliedRates.length, 0)
    : calculation.appliedRates.length;

  const panelTitle = (
    <div className="flex flex-col gap-0.5">
      <h2 className="text-[18px] font-semibold text-[#12332B]">Rate Breakdown</h2>
      <p className="text-[12px] text-[#667085] font-normal">
        {contractNumber} &middot; {serviceType}
        {resolvedMode ? ` \u00b7 ${resolvedMode}` : ""}
        {isMultiLine ? ` \u00b7 ${truckingLineItems!.length} destinations` : ""}
      </p>
    </div>
  );

  const panelFooter = (
    <div className="px-8 py-4 border-t border-[#E5E9F0] bg-[#FAFBFC] flex items-center justify-between">
      <div className="text-[13px] text-[#667085]">
        {totalItems} item{totalItems !== 1 ? "s" : ""} &middot;{" "}
        <span className="font-semibold text-[#12332B]">{formatCurrency(grandTotal, currency)}</span>
      </div>
      <button
        onClick={onClose}
        className="px-5 py-2 rounded-lg text-[13px] font-medium text-[#667085] hover:text-[#12332B] border border-[#D1D5DB] hover:border-[#9CA3AF] transition-colors"
      >
        Close
      </button>
    </div>
  );

  return (
    <SidePanel
      isOpen={isOpen}
      onClose={onClose}
      title={panelTitle}
      footer={panelFooter}
      size="md"
    >
      <div className="h-full overflow-y-auto">
        {/* Section 1: Quantities Used (read-only) */}
        <QuantityDisplaySection
          mode="readonly"
          serviceType={serviceType}
          quantities={quantities}
          resolvedMode={resolvedMode || ""}
          truckingLineItems={truckingLineItems}
          selectionContext={
            serviceType.toLowerCase() === "trucking" && selections
              && (!truckingLineItems || truckingLineItems.length <= 1)
              ? {
                  truckType: truckTypeLabel || "—",
                  destination: Object.keys(selections).length === 1
                    ? Object.keys(selections)[0]
                    : Object.keys(selections).length > 1
                      ? `All (${Object.keys(selections).length} destinations)`
                      : "—",
                }
              : undefined
          }
        />

        {/* Section 2: Rate Breakdown — single or grouped */}
        {isMultiLine && multiLineResults ? (
          // ✨ Multi-line: one section per dispatch line
          <div className="px-8 py-6">
            {multiLineResults.lineResults.map((lr: any, idx: number) => (
              <div key={lr.lineItem.id} className={idx > 0 ? "mt-6 pt-6 border-t border-[#E5E9F0]" : ""}>
                {/* Line item header */}
                <div className="flex items-center justify-between mb-3">
                  <div className="text-[13px] font-semibold text-[#12332B]">
                    {lr.lineItem.destination || "All Destinations"} — {lr.lineItem.truckType || "—"} × {lr.lineItem.quantity}
                  </div>
                  <div className="text-[12px] font-medium text-[#0F766E]">
                    {formatCurrency(lr.subtotal, currency)}
                  </div>
                </div>
                <RateBreakdownTable
                  appliedRates={lr.appliedRates}
                  total={lr.subtotal}
                  currency={currency}
                  hideTotal={true}
                />
              </div>
            ))}

            {/* Grand total row */}
            <div className="mt-6 pt-4 border-t-2 border-[#12332B] flex items-center justify-between">
              <span className="text-[14px] font-semibold text-[#12332B]">Grand Total</span>
              <span className="text-[14px] font-bold text-[#12332B]">
                {formatCurrency(multiLineResults.grandTotal, currency)}
              </span>
            </div>
          </div>
        ) : (
          // Single-line: existing flat table
          <div className="px-8 py-6">
            <RateBreakdownTable
              appliedRates={calculation.appliedRates}
              total={calculation.total}
              currency={currency}
            />
          </div>
        )}

        {/* Read-only notice */}
        <div className="px-8 pb-6">
          <div className="flex items-center gap-2 px-3 py-2.5 rounded-md bg-[#FFFBEB] border border-[#FDE68A]">
            <Info size={13} className="text-[#D97706] shrink-0" />
            <span className="text-[11px] text-[#92400E]">
              These rates have been applied to your selling prices. Edit them directly in the Selling Price section below.
            </span>
          </div>
        </div>
      </div>
    </SidePanel>
  );
}