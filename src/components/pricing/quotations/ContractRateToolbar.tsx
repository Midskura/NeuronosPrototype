/**
 * ContractRateToolbar — Compact inline toolbar for contract rate status
 *
 * Designed to sit right-aligned in each service form's header row.
 * Two modes:
 *   - "available": muted text + Apply ghost button
 *   - "applied": teal checkmark + mode/units/total + View Breakdown link
 *
 * @see /docs/blueprints/CONTRACT_BANNER_REDESIGN_BLUEPRINT.md — Phase 2
 */

interface RateBridgeInfo {
  resolvedMode: string | null;
  totalContainers: number;
  estimatedTotal: number;
}

interface ContractRateToolbarProps {
  status: "available" | "applied";
  onApply: () => void;
  onViewBreakdown: () => void;
  loading?: boolean;
  rateBridgeInfo?: RateBridgeInfo;
  /** Optional note shown below the toolbar (e.g., brokerage type mismatch) */
  note?: string;
}

export function ContractRateToolbar({
  status,
  onApply,
  onViewBreakdown,
  loading = false,
  rateBridgeInfo,
  note,
}: ContractRateToolbarProps) {
  if (status === "applied" && rateBridgeInfo) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "2px" }}>
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          fontSize: "11px",
        }}>
          {/* Teal checkmark */}
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 6L9 17l-5-5" />
          </svg>
          <span style={{ color: "#059669", fontWeight: 500 }}>
            {rateBridgeInfo.resolvedMode
              ? `${rateBridgeInfo.resolvedMode} rates applied`
              : "Rates applied"
            }
          </span>
          {rateBridgeInfo.totalContainers > 0 && (
            <span style={{ color: "#6B7280" }}>
              · <strong style={{ color: "#12332B" }}>{rateBridgeInfo.totalContainers}</strong> unit{rateBridgeInfo.totalContainers !== 1 ? "s" : ""}
            </span>
          )}
          {rateBridgeInfo.estimatedTotal > 0 && (
            <span style={{ fontWeight: 600, color: "#0F766E", fontSize: "11px" }}>
              PHP {rateBridgeInfo.estimatedTotal.toLocaleString("en-PH", { minimumFractionDigits: 2 })}
            </span>
          )}
          <button
            onClick={onViewBreakdown}
            style={{
              padding: "2px 8px",
              borderRadius: "4px",
              border: "none",
              backgroundColor: "transparent",
              color: "#0F766E",
              fontSize: "10px",
              fontWeight: 500,
              cursor: "pointer",
              textDecoration: "underline",
              textUnderlineOffset: "2px",
              whiteSpace: "nowrap",
            }}
          >
            View Breakdown
          </button>
        </div>
        {note && (
          <span style={{ fontSize: "10px", fontStyle: "italic", color: "#D97706" }}>
            {note}
          </span>
        )}
      </div>
    );
  }

  // "available" status
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "2px" }}>
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: "8px",
        fontSize: "11px",
      }}>
        <span style={{ color: "#6B7280" }}>
          Contract rates available
        </span>
        <button
          onClick={onApply}
          disabled={loading}
          style={{
            padding: "3px 10px",
            borderRadius: "4px",
            border: "1px solid #0F766E",
            backgroundColor: "white",
            color: "#0F766E",
            fontSize: "10px",
            fontWeight: 600,
            cursor: loading ? "not-allowed" : "pointer",
            opacity: loading ? 0.6 : 1,
            whiteSpace: "nowrap",
          }}
        >
          {loading ? "Applying..." : "Apply"}
        </button>
      </div>
      {note && (
        <span style={{ fontSize: "10px", fontStyle: "italic", color: "#D97706" }}>
          {note}
        </span>
      )}
    </div>
  );
}
