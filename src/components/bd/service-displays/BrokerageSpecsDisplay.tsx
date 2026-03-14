import { FileText } from "lucide-react";
import type { BrokerageDetails } from "../../../types/pricing";

interface BrokerageSpecsDisplayProps {
  details: BrokerageDetails;
}

export function BrokerageSpecsDisplay({ details }: BrokerageSpecsDisplayProps) {
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
        <FileText size={18} />
        Brokerage Service
      </h3>

      <div style={{ display: "grid", gap: "20px" }}>
        {/* Row 1: Subtype, Shipment Type, Type of Entry */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "20px" }}>
          <SpecField label="Subtype" value={details.subtype} />
          <SpecField label="Shipment Type" value={details.shipment_type} />
          <SpecField label="Type of Entry" value={details.type_of_entry} />
        </div>

        {/* Row 2: POD, Mode, Cargo Type */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "20px" }}>
          <SpecField label="POD" value={details.pod} />
          <SpecField label="Mode" value={details.mode} />
          <SpecField label="Cargo Type" value={details.cargo_type} />
        </div>

        {/* Row 3: Commodity, Declared Value, Country of Origin */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "20px" }}>
          <SpecField label="Commodity" value={details.commodity} />
          <SpecField 
            label="Declared Value" 
            value={details.declared_value ? `PHP ${details.declared_value.toLocaleString()}` : undefined} 
          />
          <SpecField label="Country of Origin" value={details.country_of_origin} />
        </div>

        {/* Row 4: Preferential Treatment, PSIC, AEO */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "20px" }}>
          <SpecField label="Preferential Treatment" value={details.preferential_treatment} />
          <SpecField label="PSIC" value={details.psic} />
          <SpecField label="AEO" value={details.aeo} />
        </div>

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
