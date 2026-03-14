import { Truck } from "lucide-react";
import type { TruckingDetails } from "../../../types/pricing";

interface TruckingSpecsDisplayProps {
  details: TruckingDetails;
}

export function TruckingSpecsDisplay({ details }: TruckingSpecsDisplayProps) {
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
        <Truck size={18} />
        Trucking Service
      </h3>

      <div style={{ display: "grid", gap: "20px" }}>
        {/* Row 1: Truck Type and Pull Out Location */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
          <SpecField label="Truck Type" value={details.truck_type} />
          <SpecField label="Pull Out Location" value={details.pull_out} />
        </div>

        {/* Row 2: Delivery Address (Full Width) */}
        {details.delivery_address && (
          <SpecField label="Delivery Address" value={details.delivery_address} />
        )}

        {/* Row 3: Delivery Instructions (Full Width) */}
        {details.delivery_instructions && (
          <SpecField label="Delivery Instructions" value={details.delivery_instructions} />
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
