import type { ReactNode } from "react";

interface OthersFormData {
  serviceDescription?: string;
}

interface OthersServiceFormProps {
  data: OthersFormData;
  onChange: (data: OthersFormData) => void;
  viewMode?: boolean;
  contractMode?: boolean; // Accepted for prop compatibility; Others shows all fields regardless
  headerToolbar?: ReactNode; // Optional toolbar rendered right-aligned in header row
}

export function OthersServiceForm({ data, onChange, viewMode = false, contractMode = false, headerToolbar }: OthersServiceFormProps) {
  const updateField = (field: keyof OthersFormData, value: any) => {
    onChange({ ...data, [field]: value });
  };

  return (
    <div style={{
      backgroundColor: "white",
      border: "1px solid var(--neuron-ui-border)",
      borderRadius: "8px",
      padding: "24px",
      marginBottom: "24px"
    }}>
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "20px"
      }}>
        <h2 style={{
          fontSize: "16px",
          fontWeight: 600,
          color: "var(--neuron-brand-green)",
          margin: 0,
        }}>
          {contractMode ? "Other Services — Contract Scope" : "Other Services"}
        </h2>
        {headerToolbar}
      </div>

      <div style={{ display: "grid", gap: "20px" }}>
        {/* Service Description */}
        <div>
          <label style={{
            display: "block",
            fontSize: "13px",
            fontWeight: 500,
            color: "var(--neuron-ink-base)",
            marginBottom: "8px"
          }}>
            Service Description *
          </label>
          <textarea
            value={data.serviceDescription || ""}
            onChange={(e) => updateField("serviceDescription", e.target.value)}
            placeholder="Describe the service you need..."
            rows={6}
            style={{
              width: "100%",
              padding: "10px 12px",
              fontSize: "13px",
              color: "var(--neuron-ink-base)",
              backgroundColor: viewMode ? "#F9FAFB" : "white",
              border: "1px solid var(--neuron-ui-border)",
              borderRadius: "6px",
              outline: "none",
              resize: "vertical",
              fontFamily: "inherit",
              transition: "border-color 0.15s ease",
              cursor: viewMode ? "default" : "text"
            }}
            onFocus={(e) => {
              if (!viewMode) e.currentTarget.style.borderColor = "var(--neuron-brand-teal)";
            }}
            onBlur={(e) => {
              if (!viewMode) e.currentTarget.style.borderColor = "var(--neuron-ui-border)";
            }}
            disabled={viewMode}
          />
        </div>
      </div>
    </div>
  );
}