import type { ReactNode } from "react";

interface MarineInsuranceFormData {
  commodityDescription?: string;
  hsCode?: string;
  aolPol?: string;
  aodPod?: string;
  invoiceValue?: number;
}

interface MarineInsuranceServiceFormProps {
  data: MarineInsuranceFormData;
  onChange: (data: MarineInsuranceFormData) => void;
  viewMode?: boolean;
  contractMode?: boolean; // When true, show only scope fields (aolPol, aodPod), hide shipment-specific
  headerToolbar?: ReactNode; // Optional toolbar rendered right-aligned in header row
}

export function MarineInsuranceServiceForm({ data, onChange, viewMode = false, contractMode = false, headerToolbar }: MarineInsuranceServiceFormProps) {
  const updateField = (field: keyof MarineInsuranceFormData, value: any) => {
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
          {contractMode ? "Marine Insurance — Contract Scope" : "Marine Insurance Service"}
        </h2>
        {headerToolbar}
      </div>

      <div style={{ display: "grid", gap: "20px" }}>
        {/* Commodity Description */}
        {!contractMode && (
          <div>
            <label style={{
              display: "block",
              fontSize: "13px",
              fontWeight: 500,
              color: "var(--neuron-ink-base)",
              marginBottom: "8px"
            }}>
              Commodity Description *
            </label>
            <input
              type="text"
              value={data.commodityDescription || ""}
              onChange={(e) => updateField("commodityDescription", e.target.value)}
              placeholder="Enter commodity description"
              disabled={viewMode}
              style={{
                width: "100%",
                padding: "10px 12px",
                fontSize: "13px",
                color: "var(--neuron-ink-base)",
                backgroundColor: viewMode ? "#F9FAFB" : "white",
                border: "1px solid var(--neuron-ui-border)",
                borderRadius: "6px",
                outline: "none",
                transition: "border-color 0.15s ease",
                cursor: viewMode ? "default" : "text"
              }}
              onFocus={(e) => {
                if (!viewMode) e.currentTarget.style.borderColor = "var(--neuron-brand-teal)";
              }}
              onBlur={(e) => {
                if (!viewMode) e.currentTarget.style.borderColor = "var(--neuron-ui-border)";
              }}
            />
          </div>
        )}

        {/* HS Code */}
        {!contractMode && (
          <div>
            <label style={{
              display: "block",
              fontSize: "13px",
              fontWeight: 500,
              color: "var(--neuron-ink-base)",
              marginBottom: "8px"
            }}>
              HS Code
            </label>
            <input
              type="text"
              value={data.hsCode || ""}
              onChange={(e) => updateField("hsCode", e.target.value)}
              placeholder="Enter HS Code"
              disabled={viewMode}
              style={{
                width: "100%",
                padding: "10px 12px",
                fontSize: "13px",
                color: "var(--neuron-ink-base)",
                backgroundColor: viewMode ? "#F9FAFB" : "white",
                border: "1px solid var(--neuron-ui-border)",
                borderRadius: "6px",
                outline: "none",
                transition: "border-color 0.15s ease",
                cursor: viewMode ? "default" : "text"
              }}
              onFocus={(e) => {
                if (!viewMode) e.currentTarget.style.borderColor = "var(--neuron-brand-teal)";
              }}
              onBlur={(e) => {
                if (!viewMode) e.currentTarget.style.borderColor = "var(--neuron-ui-border)";
              }}
            />
          </div>
        )}

        {/* AOL/POL & AOD/POD */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
          <div>
            <label style={{
              display: "block",
              fontSize: "13px",
              fontWeight: 500,
              color: "var(--neuron-ink-base)",
              marginBottom: "8px"
            }}>
              AOL/POL *
            </label>
            <input
              type="text"
              value={data.aolPol || ""}
              onChange={(e) => updateField("aolPol", e.target.value)}
              placeholder="Airport/Port of Loading"
              disabled={viewMode}
              style={{
                width: "100%",
                padding: "10px 12px",
                fontSize: "13px",
                color: "var(--neuron-ink-base)",
                backgroundColor: viewMode ? "#F9FAFB" : "white",
                border: "1px solid var(--neuron-ui-border)",
                borderRadius: "6px",
                outline: "none",
                transition: "border-color 0.15s ease",
                cursor: viewMode ? "default" : "text"
              }}
              onFocus={(e) => {
                if (!viewMode) e.currentTarget.style.borderColor = "var(--neuron-brand-teal)";
              }}
              onBlur={(e) => {
                if (!viewMode) e.currentTarget.style.borderColor = "var(--neuron-ui-border)";
              }}
            />
          </div>
          <div>
            <label style={{
              display: "block",
              fontSize: "13px",
              fontWeight: 500,
              color: "var(--neuron-ink-base)",
              marginBottom: "8px"
            }}>
              AOD/POD *
            </label>
            <input
              type="text"
              value={data.aodPod || ""}
              onChange={(e) => updateField("aodPod", e.target.value)}
              placeholder="Airport/Port of Discharge"
              disabled={viewMode}
              style={{
                width: "100%",
                padding: "10px 12px",
                fontSize: "13px",
                color: "var(--neuron-ink-base)",
                backgroundColor: viewMode ? "#F9FAFB" : "white",
                border: "1px solid var(--neuron-ui-border)",
                borderRadius: "6px",
                outline: "none",
                transition: "border-color 0.15s ease",
                cursor: viewMode ? "default" : "text"
              }}
              onFocus={(e) => {
                if (!viewMode) e.currentTarget.style.borderColor = "var(--neuron-brand-teal)";
              }}
              onBlur={(e) => {
                if (!viewMode) e.currentTarget.style.borderColor = "var(--neuron-ui-border)";
              }}
            />
          </div>
        </div>

        {/* Invoice Value */}
        {!contractMode && (
          <div>
            <label style={{
              display: "block",
              fontSize: "13px",
              fontWeight: 500,
              color: "var(--neuron-ink-base)",
              marginBottom: "8px"
            }}>
              Invoice Value *
            </label>
            <div style={{ position: "relative" }}>
              <span style={{
                position: "absolute",
                left: "12px",
                top: "50%",
                transform: "translateY(-50%)",
                fontSize: "13px",
                color: "var(--neuron-ink-muted)"
              }}>
                $
              </span>
              <input
                type="number"
                value={data.invoiceValue || ""}
                onChange={(e) => updateField("invoiceValue", parseFloat(e.target.value) || 0)}
                placeholder="0.00"
                min="0"
                step="0.01"
                disabled={viewMode}
                style={{
                  width: "100%",
                  padding: "10px 12px 10px 32px",
                  fontSize: "13px",
                  color: "var(--neuron-ink-base)",
                  backgroundColor: viewMode ? "#F9FAFB" : "white",
                  border: "1px solid var(--neuron-ui-border)",
                  borderRadius: "6px",
                  outline: "none",
                  transition: "border-color 0.15s ease",
                  cursor: viewMode ? "default" : "text"
                }}
                onFocus={(e) => {
                  if (!viewMode) e.currentTarget.style.borderColor = "var(--neuron-brand-teal)";
                }}
                onBlur={(e) => {
                  if (!viewMode) e.currentTarget.style.borderColor = "var(--neuron-ui-border)";
                }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}