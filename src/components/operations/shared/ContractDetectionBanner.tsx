/**
 * ContractDetectionBanner
 *
 * Detects active contracts for a given customer name and displays
 * a subtle teal-accented info banner in booking creation panels.
 * Auto-links the booking to the detected contract via onContractDetected callback.
 *
 * Refactored in Phase 1 of CONTRACT_FLOWCHART_INTEGRATION_BLUEPRINT to use
 * shared contractLookup utility (DRY: fetch logic extracted).
 *
 * @see /docs/blueprints/CONTRACT_FLOWCHART_INTEGRATION_BLUEPRINT.md - Phase 1, Task 1.3
 */

import { useState, useEffect, useRef } from "react";
import { FileText, CheckCircle, Link2 } from "lucide-react";
import type { ContractSummary } from "../../../types/pricing";
import { fetchActiveContractsForCustomer } from "../../../utils/contractLookup";

// ============================================
// TYPES
// ============================================

interface ContractDetectionBannerProps {
  /** Customer name to check against -- triggers detection when changed */
  customerName: string;
  /** Service type of the booking being created (e.g., "Brokerage", "Forwarding") */
  serviceType?: string;
  /** Callback when a contract is detected/cleared -- parent should store the contract_id */
  onContractDetected: (contractId: string | null) => void;
}

// ============================================
// HELPERS
// ============================================

const formatDate = (dateStr?: string) => {
  if (!dateStr) return "--";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" });
};

// ============================================
// COMPONENT
// ============================================

export function ContractDetectionBanner({
  customerName,
  serviceType,
  onContractDetected,
}: ContractDetectionBannerProps) {
  const [contracts, setContracts] = useState<ContractSummary[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedContractId, setSelectedContractId] = useState<string | null>(null);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastCheckedName = useRef("");

  // Debounced contract detection when customerName changes
  useEffect(() => {
    // Clear if customer name is too short
    if (!customerName || customerName.trim().length < 3) {
      setContracts([]);
      setSelectedContractId(null);
      onContractDetected(null);
      lastCheckedName.current = "";
      return;
    }

    const trimmed = customerName.trim();

    // Skip if we already checked this exact name
    if (trimmed === lastCheckedName.current) return;

    // Debounce: wait 600ms after user stops typing
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      checkForContracts(trimmed);
    }, 600);

    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [customerName]);

  const checkForContracts = async (name: string) => {
    setIsLoading(true);
    lastCheckedName.current = name;

    try {
      const found = await fetchActiveContractsForCustomer(name);

      setContracts(found);

      if (found.length > 0) {
        const matching = serviceType
          ? found.find((c) => c.services.includes(serviceType))
          : null;
        const autoSelected = matching || found[0];
        setSelectedContractId(autoSelected.id);
        onContractDetected(autoSelected.id);
      } else {
        setSelectedContractId(null);
        onContractDetected(null);
      }
    } catch (err) {
      console.error("Contract detection error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Nothing to render if no contracts detected and not loading
  if (!isLoading && contracts.length === 0) return null;

  // Loading state — subtle inline shimmer
  if (isLoading) {
    return (
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: "6px",
        marginTop: "6px",
        paddingLeft: "2px",
      }}>
        <div style={{
          width: "12px",
          height: "12px",
          border: "1.5px solid #E5E7EB",
          borderTopColor: "#0F766E",
          borderRadius: "50%",
          animation: "spin 0.8s linear infinite",
        }} />
        <span style={{ fontSize: "12px", color: "#9CA3AF" }}>
          Checking contracts...
        </span>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // Contract detected — subtle single-line inline hint
  const selected = contracts.find(c => c.id === selectedContractId) || contracts[0];
  if (!selected) return null;

  // For multiple contracts, show a subtle selector
  if (contracts.length > 1) {
    return (
      <div style={{ marginTop: "6px", paddingLeft: "2px" }}>
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "5px",
        }}>
          <Link2 size={12} style={{ color: "#0F766E", flexShrink: 0 }} />
          <span style={{ fontSize: "12px", color: "#667085" }}>
            Linked to{" "}
            <span style={{ fontWeight: 600, color: "#12332B" }}>
              {selected.quote_number}
            </span>
            {selected.quotation_name && (
              <span style={{ color: "#9CA3AF" }}> — {selected.quotation_name}</span>
            )}
          </span>
          <span style={{
            fontSize: "10px",
            color: "#9CA3AF",
            marginLeft: "4px",
            cursor: "default",
          }}>
            ({contracts.length} contracts)
          </span>
        </div>
        {/* Expandable list for multiple contracts */}
        <div style={{ marginTop: "4px", paddingLeft: "17px" }}>
          {contracts.map(contract => {
            const isActive = contract.id === selectedContractId;
            return (
              <button
                key={contract.id}
                type="button"
                onClick={() => {
                  setSelectedContractId(contract.id);
                  onContractDetected(contract.id);
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "2px 0",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  fontSize: "11px",
                  color: isActive ? "#0F766E" : "#9CA3AF",
                  fontWeight: isActive ? 600 : 400,
                  width: "100%",
                  textAlign: "left",
                }}
              >
                <div style={{
                  width: "6px",
                  height: "6px",
                  borderRadius: "50%",
                  backgroundColor: isActive ? "#0F766E" : "#D1D5DB",
                  flexShrink: 0,
                }} />
                {contract.quote_number}
                {contract.quotation_name && (
                  <span style={{ fontWeight: 400, color: "#9CA3AF" }}>
                    — {contract.quotation_name}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // Single contract — one-line hint
  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      gap: "5px",
      marginTop: "6px",
      paddingLeft: "2px",
    }}>
      <Link2 size={12} style={{ color: "#0F766E", flexShrink: 0 }} />
      <span style={{ fontSize: "12px", color: "#667085" }}>
        Linked to{" "}
        <span style={{ fontWeight: 600, color: "#12332B" }}>
          {selected.quote_number}
        </span>
        {selected.quotation_name && (
          <span style={{ color: "#9CA3AF" }}> — {selected.quotation_name}</span>
        )}
      </span>
    </div>
  );
}