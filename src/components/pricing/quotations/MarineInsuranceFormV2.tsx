import { Shield, Package } from "lucide-react";
import type { MarineInsuranceDetails } from "../../../types/pricing";

interface MarineInsuranceFormV2Props {
  data: Partial<MarineInsuranceDetails>;
  onChange: (data: Partial<MarineInsuranceDetails>) => void;
}

export function MarineInsuranceFormV2({ data, onChange }: MarineInsuranceFormV2Props) {
  const updateField = (field: keyof MarineInsuranceDetails, value: any) => {
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
        <Shield size={14} style={{ color: "#0F766E" }} />
        SERVICE DETAILS
      </div>

      <div style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr 1fr",
        gap: "12px"
      }}>
        {/* Commodity Description */}
        <div style={{ gridColumn: "1 / -1" }}>
          <label style={{ display: "block", fontSize: "11px", fontWeight: 500, color: "#667085", marginBottom: "4px" }}>
            Commodity Description *
          </label>
          <input
            type="text"
            value={data.commodity_description || ""}
            onChange={(e) => updateField('commodity_description', e.target.value)}
            placeholder="e.g., Electronic components, Pharmaceutical products"
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

        {/* HS Code */}
        <div>
          <label style={{ display: "block", fontSize: "11px", fontWeight: 500, color: "#667085", marginBottom: "4px" }}>
            HS Code
          </label>
          <input
            type="text"
            value={data.hs_code || ""}
            onChange={(e) => updateField('hs_code', e.target.value)}
            placeholder="e.g., 8517.12.00"
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

        {/* Invoice Value */}
        <div style={{ gridColumn: "2 / -1" }}>
          <label style={{ display: "block", fontSize: "11px", fontWeight: 500, color: "#667085", marginBottom: "4px" }}>
            Invoice Value (₱) *
          </label>
          <input
            type="number"
            value={data.invoice_value || ""}
            onChange={(e) => updateField('invoice_value', Number(e.target.value) || 0)}
            placeholder="0.00"
            min="0"
            step="0.01"
            style={{
              width: "100%",
              padding: "6px 10px",
              fontSize: "13px",
              border: "1px solid var(--neuron-ui-border)",
              borderRadius: "4px",
              backgroundColor: "white",
              textAlign: "right"
            }}
          />
        </div>

        {/* AOL (Airport of Loading) */}
        <div>
          <label style={{ display: "block", fontSize: "11px", fontWeight: 500, color: "#667085", marginBottom: "4px" }}>
            AOL (Airport of Loading)
          </label>
          <input
            type="text"
            value={data.aol || ""}
            onChange={(e) => updateField('aol', e.target.value)}
            placeholder="e.g., PVG"
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

        {/* POL (Port of Loading) */}
        <div>
          <label style={{ display: "block", fontSize: "11px", fontWeight: 500, color: "#667085", marginBottom: "4px" }}>
            POL (Port of Loading) *
          </label>
          <input
            type="text"
            value={data.pol || ""}
            onChange={(e) => updateField('pol', e.target.value)}
            placeholder="e.g., Shanghai Port"
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

        {/* AOD (Airport of Discharge) */}
        <div>
          <label style={{ display: "block", fontSize: "11px", fontWeight: 500, color: "#667085", marginBottom: "4px" }}>
            AOD (Airport of Discharge)
          </label>
          <input
            type="text"
            value={data.aod || ""}
            onChange={(e) => updateField('aod', e.target.value)}
            placeholder="e.g., MNL"
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

        {/* POD (Port of Discharge) */}
        <div>
          <label style={{ display: "block", fontSize: "11px", fontWeight: 500, color: "#667085", marginBottom: "4px" }}>
            POD (Port of Discharge) *
          </label>
          <input
            type="text"
            value={data.pod || ""}
            onChange={(e) => updateField('pod', e.target.value)}
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
      </div>
    </div>
  );
}