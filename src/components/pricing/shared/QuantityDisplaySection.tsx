/**
 * QuantityDisplaySection
 *
 * Shared section that renders detected/used quantities for rate calculation sheets.
 * Supports two modes:
 *   - "editable": number inputs + Reset button + source descriptions + source chips
 *     (used by RateCalculationSheet at the booking level)
 *   - "readonly": static value badges, no source detail
 *     (used by QuotationRateBreakdownSheet at the quotation level)
 *
 * @see /docs/blueprints/RATE_TABLE_DRY_BLUEPRINT.md
 */

import { Container, Ship, FileText, Stamp, RefreshCw, MapPin, Truck } from "lucide-react";
import type { BookingQuantities } from "../../../utils/contractRateEngine";
import type { TruckingLineItem } from "../../../types/pricing";

// ============================================
// TYPES
// ============================================

interface QuantityInput {
  label: string;
  key: keyof BookingQuantities;
  value: number;
  icon: React.ReactNode;
  /** Human-readable source description (editable mode only) */
  source?: string;
  /** Raw source entries for chip display (editable mode only) */
  sourceEntries?: string[];
}

interface QuantityDisplaySectionProps {
  mode: "editable" | "readonly";
  serviceType: string;
  quantities: BookingQuantities;
  resolvedMode: string;
  /** Only required in editable mode — the booking object for source inference */
  booking?: any;
  /** Only required in editable mode */
  onQuantityChange?: (key: keyof BookingQuantities, value: number) => void;
  /** Only required in editable mode */
  onReset?: () => void;
  /** Custom mode indicator text — overrides default */
  modeHintText?: string;
  /** Optional: selection context for trucking (destination + truck type display) */
  selectionContext?: {
    destination?: string;
    truckType?: string;
  };
  /** Optional: multi-line trucking line items for per-line display (@see MULTI_LINE_TRUCKING_BLUEPRINT.md) */
  truckingLineItems?: TruckingLineItem[];
}

// ============================================
// HELPERS
// ============================================

/** Describe where a quantity was derived from (editable mode) */
function describeSource(key: string, booking: any): string {
  if (!booking) return "Default";
  switch (key) {
    case "containers": {
      if (booking.containerNumbers) {
        const count = Array.isArray(booking.containerNumbers)
          ? booking.containerNumbers.length
          : booking.containerNumbers.split(/[,;\n]/).filter((s: string) => s.trim()).length;
        if (count > 0) return `Counted from Container Numbers field (${count} entries)`;
      }
      if (booking.containers?.length > 0) return "From containers array";
      if (booking.qty20ft || booking.qty40ft || booking.qty45ft) return "Sum of qty20ft + qty40ft + qty45ft";
      if (booking.vehicleReferenceNumber) return "Counted from Vehicle Reference Numbers";
      return "Default (1 for FCL)";
    }
    case "bls": {
      if (booking.mblMawb) {
        const count = booking.mblMawb.split(/[,;\n]/).filter((s: string) => s.trim()).length;
        if (count > 0) return `Counted from MBL/MAWB field (${count} entries)`;
      }
      return "Default (1)";
    }
    case "sets":
      return "Default (1)";
    case "shipments":
      return "Default (1 per booking)";
    default:
      return "Default";
  }
}

/** Parse raw booking field into chip entries */
function extractSourceEntries(key: string, booking: any): string[] {
  if (!booking) return [];
  const parseField = (field?: string | string[]): string[] => {
    if (!field) return [];
    if (Array.isArray(field)) return field.map((s) => s.trim()).filter(Boolean);
    return field.split(/[,;\n]/).map((s) => s.trim()).filter(Boolean);
  };
  switch (key) {
    case "containers":
      if (booking.containerNumbers) return parseField(booking.containerNumbers);
      if (booking.vehicleReferenceNumber) return parseField(booking.vehicleReferenceNumber);
      return [];
    case "bls":
      return parseField(booking.mblMawb);
    default:
      return [];
  }
}

/** Build the quantity input list based on service type */
function buildQuantityInputs(
  serviceType: string,
  quantities: BookingQuantities,
  booking?: any,
  includeSource: boolean = false
): QuantityInput[] {
  const type = serviceType.toLowerCase();
  const inputs: QuantityInput[] = [];

  if (type === "brokerage" || type === "forwarding") {
    inputs.push({
      label: "Containers",
      key: "containers",
      value: quantities.containers ?? 0,
      icon: <Container size={14} className="text-[#0F766E]" />,
      ...(includeSource && {
        source: describeSource("containers", booking),
        sourceEntries: extractSourceEntries("containers", booking),
      }),
    });
    inputs.push({
      label: "Bills of Lading",
      key: "bls",
      value: quantities.bls ?? 1,
      icon: <FileText size={14} className="text-[#0F766E]" />,
      ...(includeSource && {
        source: describeSource("bls", booking),
        sourceEntries: extractSourceEntries("bls", booking),
      }),
    });
    inputs.push({
      label: "Document Sets",
      key: "sets",
      value: quantities.sets ?? 1,
      icon: <Stamp size={14} className="text-[#0F766E]" />,
      ...(includeSource && { source: describeSource("sets", booking) }),
    });
  } else if (type === "trucking") {
    inputs.push({
      label: "Trucks / Containers",
      key: "containers",
      value: quantities.containers ?? 1,
      icon: <Container size={14} className="text-[#0F766E]" />,
      ...(includeSource && {
        source: describeSource("containers", booking),
        sourceEntries: extractSourceEntries("containers", booking),
      }),
    });
  } else {
    inputs.push({
      label: "Shipments",
      key: "shipments",
      value: quantities.shipments ?? 1,
      icon: <Ship size={14} className="text-[#0F766E]" />,
      ...(includeSource && { source: describeSource("shipments", booking) }),
    });
  }

  return inputs;
}

// ============================================
// COMPONENT
// ============================================

export function QuantityDisplaySection({
  mode,
  serviceType,
  quantities,
  resolvedMode,
  booking,
  onQuantityChange,
  onReset,
  modeHintText,
  selectionContext,
  truckingLineItems,
}: QuantityDisplaySectionProps) {
  const isEditable = mode === "editable";
  const inputs = buildQuantityInputs(serviceType, quantities, booking, isEditable);

  const defaultHint = isEditable
    ? "Adjust quantities above to recalculate instantly"
    : "These values were derived from the quotation form";

  return (
    <div className="px-8 py-6 border-b border-[#E5E9F0]">
      {/* Heading row */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[13px] font-semibold text-[#12332B] uppercase tracking-wide">
          {isEditable ? "Detected Quantities" : "Quantities Used"}
        </h3>
        {isEditable && onReset && (
          <button
            onClick={onReset}
            className="flex items-center gap-1.5 text-[11px] text-[#667085] hover:text-[#0F766E] transition-colors"
            title="Reset to auto-detected values"
          >
            <RefreshCw size={12} />
            Reset
          </button>
        )}
      </div>

      {/* Quantity rows */}
      <div className="space-y-3">
        {inputs.map((input) => (
          <div key={input.key}>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-md bg-[#F0FDF9] flex items-center justify-center shrink-0">
                {input.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[13px] font-medium text-[#12332B]">{input.label}</div>
                {isEditable && input.source && (
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] text-[#667085] truncate">{input.source}</span>
                  </div>
                )}
              </div>

              {/* Value display */}
              {isEditable ? (
                <input
                  type="number"
                  min={0}
                  value={input.value}
                  onChange={(e) =>
                    onQuantityChange?.(input.key, parseInt(e.target.value) || 0)
                  }
                  className="w-16 h-8 text-center text-[13px] font-medium text-[#12332B] border border-[#D1D5DB] rounded-[4px] bg-white focus:border-[#0F766E] focus:ring-1 focus:ring-[#0F766E] outline-none"
                />
              ) : (
                <div className="w-16 h-8 flex items-center justify-center text-[13px] font-medium text-[#12332B] border border-[#E5E9F0] rounded-[4px] bg-[#F8FAFC]">
                  {input.value}
                </div>
              )}
            </div>

            {/* Source entry chips (editable mode only) */}
            {isEditable && input.sourceEntries && input.sourceEntries.length > 0 && (
              <div className="ml-11 mt-1.5 px-3 py-2.5 rounded-[6px] bg-[#F8FAFC] border border-[#E5E9F0]">
                <div className="flex flex-wrap gap-1.5">
                  {input.sourceEntries.map((entry, idx) => (
                    <span
                      key={idx}
                      className="inline-block px-2.5 py-1 rounded-[4px] bg-white border border-[#E5E9F0] text-[11px] text-[#12332B]"
                      style={{ fontFamily: "'Inter', sans-serif" }}
                    >
                      {entry}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}

        {/* ✨ Multi-line trucking dispatch lines — replaces selectionContext when >1 line item */}
        {serviceType.toLowerCase() === "trucking" && truckingLineItems && truckingLineItems.length > 1 && (
          <div className="mt-1">
            <div className="text-[11px] font-semibold text-[#667085] uppercase tracking-wide mb-2 ml-11">
              Destinations ({truckingLineItems.length})
            </div>
            {truckingLineItems.map((li) => (
              <div key={li.id} className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-md bg-[#F0FDF9] flex items-center justify-center shrink-0">
                  <Truck size={14} className="text-[#0F766E]" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-medium text-[#12332B]">
                    {li.destination || "—"}
                  </div>
                </div>
                <div className="h-8 flex items-center justify-center px-3 text-[12px] font-medium text-[#12332B] border border-[#E5E9F0] rounded-[4px] bg-[#F8FAFC] whitespace-nowrap">
                  {li.truckType || "—"} × {li.quantity}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Single-line trucking: legacy selectionContext (only when NOT showing multi-line) */}
        {serviceType.toLowerCase() === "trucking" && selectionContext
          && (!truckingLineItems || truckingLineItems.length <= 1) && (
          <>
            {selectionContext.truckType && (
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-md bg-[#F0FDF9] flex items-center justify-center shrink-0">
                  <Truck size={14} className="text-[#0F766E]" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-medium text-[#12332B]">Truck Type</div>
                </div>
                <div className="h-8 flex items-center justify-center px-3 text-[13px] font-medium text-[#12332B] border border-[#E5E9F0] rounded-[4px] bg-[#F8FAFC]">
                  {selectionContext.truckType}
                </div>
              </div>
            )}
            {selectionContext.destination && (
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-md bg-[#F0FDF9] flex items-center justify-center shrink-0">
                  <MapPin size={14} className="text-[#0F766E]" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-medium text-[#12332B]">Destination</div>
                </div>
                <div className="h-8 flex items-center justify-center px-3 text-[13px] font-medium text-[#12332B] border border-[#E5E9F0] rounded-[4px] bg-[#F8FAFC]">
                  {selectionContext.destination}
                </div>
              </div>
            )}
          </>
        )}
      </div>

    </div>
  );
}