import { Ship } from "lucide-react";
import type { ForwardingDetails } from "../../../types/pricing";

interface ForwardingSpecsDisplayProps {
  details: ForwardingDetails;
}

export function ForwardingSpecsDisplay({ details }: ForwardingSpecsDisplayProps) {
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
        <Ship size={18} />
        Forwarding Service
      </h3>

      <div style={{ display: "grid", gap: "20px" }}>
        {/* Row 1: Mode, Incoterms, Cargo Type */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "20px" }}>
          <SpecField label="Mode" value={details.mode} />
          <SpecField label="Incoterms" value={details.incoterms} />
          <SpecField label="Cargo Type" value={details.cargo_type} />
        </div>

        {/* Row 2: Commodity */}
        <SpecField label="Commodity" value={details.commodity} />

        {/* Row 3: POL and POD */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
          <SpecField label="POL (Port of Loading)" value={details.pol} />
          <SpecField label="POD (Port of Discharge)" value={details.pod} />
        </div>

        {/* Row 4: AOL and AOD (if present) */}
        {(details.aol || details.aod) && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
            {details.aol && <SpecField label="AOL (Airport of Loading)" value={details.aol} />}
            {details.aod && <SpecField label="AOD (Airport of Discharge)" value={details.aod} />}
          </div>
        )}

        {/* Row 5: Delivery Address (Full Width) */}
        {details.delivery_address && (
          <SpecField label="Delivery Address" value={details.delivery_address} />
        )}
      </div>
    </div>
  );
}

function SpecField({ 
  label, 
  value
}: { 
  label: string; 
  value?: string;
}) {
  return (
    <div>
      <label style={{
        display: "block",
        fontSize: "13px",
        fontWeight: 500,
        color: "var(--neuron-ink-base)",
        marginBottom: "8px"
      }}>
        {label}
      </label>
      <div style={{
        padding: "10px 14px",
        backgroundColor: "#F9FAFB",
        border: "1px solid var(--neuron-ui-border)",
        borderRadius: "6px",
        fontSize: "14px",
        color: value ? "var(--neuron-ink-primary)" : "#9CA3AF"
      }}>
        {value || "—"}
      </div>
    </div>
  );
}
