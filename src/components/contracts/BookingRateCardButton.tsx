/**
 * BookingRateCardButton (now renders as a contextual banner)
 *
 * Renders inline within the billings tab as contextual awareness — not a header button.
 * When no rate card items exist: shows a full-width banner prompting the user to review rates.
 * When rate card items exist: shows a subtle single-line confirmation note.
 * When not a contract booking: renders nothing.
 *
 * Self-contained: uses `useBookingRateCard` internally to fetch contract data.
 *
 * REFACTORED (Phase 1.5): Button → contextual banner positioned between filters and table.
 *
 * @see /docs/blueprints/RATE_CALCULATION_SHEET_BLUEPRINT.md
 */

import { useState } from "react";
import { FileSpreadsheet, Check, ChevronRight } from "lucide-react";
import { useBookingRateCard } from "../../hooks/useBookingRateCard";
import { hasExistingRateCardBilling } from "../../utils/rateCardToBilling";
import { deriveQuantitiesFromBooking, extractTruckingSelections, normalizeTruckingLineItems, extractMultiLineSelectionsAndQuantities } from "../../utils/contractQuantityExtractor";
import { RateCalculationSheet } from "./RateCalculationSheet";
import type { BillingItem } from "../shared/billings/UnifiedBillingsTab";
import type { TruckingLineItem } from "../../types/pricing";

interface BookingRateCardButtonProps {
  /** The booking object — needs bookingId, mode, containerNumbers, etc. */
  booking: any;
  /** Service type of the booking (e.g., "Brokerage", "Forwarding", "Trucking") */
  serviceType: string;
  /** Current billing items for this booking (for duplicate detection) */
  existingBillingItems: BillingItem[];
  /** Called after items are saved to refresh the billing items list */
  onRefresh: () => void;
}

const formatCurrency = (amount: number, currency: string = "PHP") =>
  new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(amount);

export function BookingRateCardButton({
  booking,
  serviceType,
  existingBillingItems,
  onRefresh,
}: BookingRateCardButtonProps) {
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const contractId = booking.contract_id || booking.contractId;
  const rateCard = useBookingRateCard(contractId);

  // Don't render if not a contract booking or no rate matrices
  if (!rateCard.isContractBooking || rateCard.isLoading) return null;
  if (rateCard.rateMatrices.length === 0) return null;

  const bookingId = booking.bookingId || booking.id;
  const mode = booking.mode || "FCL";
  const alreadyGenerated = hasExistingRateCardBilling(existingBillingItems, bookingId);

  // Derive quantities for the sheet's initial state
  const initialQuantities = deriveQuantitiesFromBooking(booking, serviceType);

  // ✨ Selection group / Multi-line: derive selections for trucking alternative row filtering
  const truckingLineItems = serviceType.toLowerCase() === "trucking"
    ? normalizeTruckingLineItems(booking)
    : undefined;
  const isMultiLine = truckingLineItems && truckingLineItems.length > 1;

  const selections = serviceType.toLowerCase() === "trucking"
    ? (isMultiLine
        ? (() => {
            // Merge all line items' selections
            const extractions = extractMultiLineSelectionsAndQuantities(truckingLineItems!, rateCard.rateMatrices);
            const merged: Record<string, string> = {};
            for (const ext of extractions) {
              if (ext.selections) Object.assign(merged, ext.selections);
            }
            return Object.keys(merged).length > 0 ? merged : undefined;
          })()
        : extractTruckingSelections(
            { truckType: booking.truckType, deliveryAddress: booking.deliveryAddress },
            rateCard.rateMatrices
          )
      )
    : undefined;

  // Count existing rate card items and their total
  const rateCardItems = existingBillingItems.filter(
    (item) => item.source_type === "rate_card" && item.booking_id === bookingId
  );
  const rateCardTotal = rateCardItems.reduce((sum, item) => sum + (item.amount || 0), 0);

  // ── Already applied: subtle single-line note ──
  if (alreadyGenerated) {
    return (
      <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#F0FDF9] border border-[#D1FAE5]">
        <Check size={14} className="text-[#059669] shrink-0" />
        <span className="text-[12px] text-[#059669] font-medium">
          Rates applied from {rateCard.contractNumber}
        </span>
        <span className="text-[12px] text-[#667085]">
          &middot; {rateCardItems.length} item{rateCardItems.length !== 1 ? "s" : ""}
          {rateCardTotal > 0 && ` · ${formatCurrency(rateCardTotal, rateCard.currency)}`}
        </span>
      </div>
    );
  }

  // ── Not yet applied: contextual banner ──
  return (
    <>
      <div
        onClick={() => setIsSheetOpen(true)}
        className="flex items-center gap-3 px-4 py-3.5 rounded-lg border border-[#D1D5DB] bg-[#FAFBFC] hover:bg-[#F0FDF9] hover:border-[#99F6E4] transition-all cursor-pointer group"
      >
        <div className="w-9 h-9 rounded-lg bg-[#F0FDF9] flex items-center justify-center shrink-0 group-hover:bg-[#CCFBF1] transition-colors">
          <FileSpreadsheet size={18} className="text-[#0F766E]" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[13px] font-medium text-[#12332B]">
            Contract Rate Card Available
          </div>
          <div className="text-[12px] text-[#667085]">
            Review and apply charges from {rateCard.contractNumber}
          </div>
        </div>
        <ChevronRight size={16} className="text-[#667085] group-hover:text-[#0F766E] transition-colors shrink-0" />
      </div>

      <RateCalculationSheet
        isOpen={isSheetOpen}
        onClose={() => setIsSheetOpen(false)}
        booking={booking}
        serviceType={serviceType}
        rateMatrices={rateCard.rateMatrices}
        contractId={rateCard.contractId}
        contractNumber={rateCard.contractNumber}
        customerName={rateCard.customerName}
        currency={rateCard.currency}
        initialQuantities={initialQuantities}
        bookingMode={mode}
        selections={selections}
        truckingLineItems={truckingLineItems}
        onRefresh={onRefresh}
      />
    </>
  );
}