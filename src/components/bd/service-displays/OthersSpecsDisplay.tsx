import { Package } from "lucide-react";
import type { OthersDetails } from "../../../types/pricing";

interface OthersSpecsDisplayProps {
  details: OthersDetails;
}

export function OthersSpecsDisplay({ details }: OthersSpecsDisplayProps) {
  return (
    <div style={{
      backgroundColor: "white",
      border: "1px solid var(--neuron-ui-border)",
      borderRadius: "8px",
      padding: "24px"
    }}>
      <h3 style={{
        fontSize: "16px",
        fontWeight: 600,
        color: "var(--neuron-brand-green)",
        marginBottom: "20px",
        display: "flex",
        alignItems: "center",
        gap: "8px"
      }}>
        <Package size={18} />
        Other Service
      </h3>

      <div>
        <label style={{
          display: "block",
          fontSize: "13px",
          fontWeight: 500,
          color: "var(--neuron-ink-base)",
          marginBottom: "8px"
        }}>
          Service Description
        </label>
        <div style={{
          padding: "10px 14px",
          backgroundColor: "#F9FAFB",
          border: "1px solid var(--neuron-ui-border)",
          borderRadius: "6px",
          fontSize: "14px",
          color: details.service_description ? "var(--neuron-ink-primary)" : "#9CA3AF",
          minHeight: "60px"
        }}>
          {details.service_description || "—"}
        </div>
      </div>
    </div>
  );
}
