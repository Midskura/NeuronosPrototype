import { MoreHorizontal } from "lucide-react";
import type { OthersDetails } from "../../../types/pricing";

interface OthersFormV2Props {
  data: Partial<OthersDetails>;
  onChange: (data: Partial<OthersDetails>) => void;
}

export function OthersFormV2({ data, onChange }: OthersFormV2Props) {
  const updateField = (field: keyof OthersDetails, value: any) => {
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
        <MoreHorizontal size={14} style={{ color: "#0F766E" }} />
        SERVICE DETAILS
      </div>

      <div>
        {/* Service Description */}
        <div>
          <label style={{ display: "block", fontSize: "11px", fontWeight: 500, color: "#667085", marginBottom: "4px" }}>
            Service Description *
          </label>
          <textarea
            value={data.service_description || ""}
            onChange={(e) => updateField('service_description', e.target.value)}
            placeholder="Describe the service in detail..."
            rows={4}
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
