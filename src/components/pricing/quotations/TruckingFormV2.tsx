import { Truck, MapPin, PackageCheck } from "lucide-react";
import { CustomDropdown } from "../../bd/CustomDropdown";
import type { TruckingDetails, TruckType } from "../../../types/pricing";

interface TruckingFormV2Props {
  data: Partial<TruckingDetails>;
  onChange: (data: Partial<TruckingDetails>) => void;
}

export function TruckingFormV2({ data, onChange }: TruckingFormV2Props) {
  const updateField = (field: keyof TruckingDetails, value: any) => {
    onChange({ ...data, [field]: value });
  };

  return (
    <div>
      <div style={{
        fontSize: "12px",
        fontWeight: 600,
        color: "var(--neuron-ink-primary)",
        marginBottom: "12px",
        display: "flex",
        alignItems: "center",
        gap: "6px"
      }}>
        <Truck size={14} style={{ color: "#0F766E" }} />
        SERVICE DETAILS
      </div>

      <div style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: "12px"
      }}>
        {/* Pull Out Location */}
        <div>
          <label style={{ display: "block", fontSize: "11px", fontWeight: 500, color: "#667085", marginBottom: "4px" }}>
            Pull Out Location
          </label>
          <input
            type="text"
            value={data.pull_out || ""}
            onChange={(e) => updateField('pull_out', e.target.value)}
            placeholder="e.g., Manila South Harbor"
            style={{
              width: "100%",
              padding: "6px 10px",
              fontSize: "13px",
              border: "1px solid var(--neuron-ui-border)",
              borderRadius: "4px",
              backgroundColor: "white"
            }}
          />
        </div>

        {/* Truck Type */}
        <div>
          <label style={{ display: "block", fontSize: "11px", fontWeight: 500, color: "#667085", marginBottom: "4px" }}>
            Truck Type *
          </label>
          <CustomDropdown
            value={data.truck_type || ""}
            onChange={(value) => updateField('truck_type', value as TruckType)}
            options={[
              { value: "10W", label: "10W", icon: <Truck size={16} /> },
              { value: "Closed Van", label: "Closed Van", icon: <Truck size={16} /> },
              { value: "Open Truck", label: "Open Truck", icon: <Truck size={16} /> },
              { value: "Refrigerated", label: "Refrigerated", icon: <Truck size={16} /> },
              { value: "Flatbed", label: "Flatbed", icon: <Truck size={16} /> },
              { value: "Wing Van", label: "Wing Van", icon: <Truck size={16} /> },
              { value: "AW", label: "AW", icon: <Truck size={16} /> },
              { value: "DW", label: "DW", icon: <Truck size={16} /> },
              { value: "2W", label: "2W", icon: <Truck size={16} /> },
              { value: "3W", label: "3W", icon: <Truck size={16} /> },
              { value: "4Br", label: "4Br", icon: <Truck size={16} /> }
            ]}
            placeholder="Select truck type"
          />
        </div>

        {/* Delivery Address */}
        <div style={{ gridColumn: "1 / -1" }}>
          <label style={{ display: "block", fontSize: "11px", fontWeight: 500, color: "#667085", marginBottom: "4px" }}>
            Delivery Address *
          </label>
          <input
            type="text"
            value={data.delivery_address || ""}
            onChange={(e) => updateField('delivery_address', e.target.value)}
            placeholder="Full delivery address"
            style={{
              width: "100%",
              padding: "6px 10px",
              fontSize: "13px",
              border: "1px solid var(--neuron-ui-border)",
              borderRadius: "4px",
              backgroundColor: "white"
            }}
          />
        </div>

        {/* Delivery Instructions */}
        <div style={{ gridColumn: "1 / -1" }}>
          <label style={{ display: "block", fontSize: "11px", fontWeight: 500, color: "#667085", marginBottom: "4px" }}>
            Delivery Instructions
          </label>
          <textarea
            value={data.delivery_instructions || ""}
            onChange={(e) => updateField('delivery_instructions', e.target.value)}
            placeholder="Special instructions for delivery..."
            rows={3}
            style={{
              width: "100%",
              padding: "8px 10px",
              fontSize: "13px",
              border: "1px solid var(--neuron-ui-border)",
              borderRadius: "4px",
              backgroundColor: "white",
              resize: "vertical",
              fontFamily: "inherit"
            }}
          />
        </div>
      </div>
    </div>
  );
}