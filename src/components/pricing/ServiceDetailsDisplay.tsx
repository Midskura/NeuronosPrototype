import React from "react";

// Helper component for displaying a single field
interface FieldDisplayProps {
  label: string;
  value: any;
  fullWidth?: boolean;
}

function FieldDisplay({ label, value, fullWidth = false }: FieldDisplayProps) {
  return (
    <div style={{ gridColumn: fullWidth ? "1 / -1" : "auto" }}>
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
        {value || "\u2014"}
      </div>
    </div>
  );
}

// Helper component for checkbox fields
function CheckboxDisplay({ label, checked }: { label: string; checked: boolean }) {
  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      gap: "8px",
      padding: "10px 14px",
      backgroundColor: "#F9FAFB",
      border: "1px solid var(--neuron-ui-border)",
      borderRadius: "6px"
    }}>
      <div style={{
        width: "18px",
        height: "18px",
        borderRadius: "4px",
        border: "2px solid var(--neuron-brand-green)",
        backgroundColor: checked ? "var(--neuron-brand-green)" : "white",
        display: "flex",
        alignItems: "center",
        justifyContent: "center"
      }}>
        {checked && (
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M2 6L5 9L10 3" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </div>
      <span style={{ fontSize: "14px", color: "var(--neuron-ink-primary)" }}>
        {label}
      </span>
    </div>
  );
}

// Helper to display containers array
function ContainersDisplay({ containers }: { containers: any[] }) {
  if (!containers || containers.length === 0) return null;
  
  const summary = containers
    .filter((c: any) => c.type && c.qty > 0)
    .map((c: any) => `${c.qty}x ${c.type}`)
    .join(", ");
  
  return (
    <div style={{ gridColumn: "1 / -1" }}>
      <label style={{
        display: "block",
        fontSize: "13px",
        fontWeight: 500,
        color: "var(--neuron-ink-base)",
        marginBottom: "8px"
      }}>
        Container Types & Quantities
      </label>
      <div style={{
        display: "flex",
        gap: "8px",
        flexWrap: "wrap"
      }}>
        {containers.filter((c: any) => c.type && c.qty > 0).map((c: any, idx: number) => (
          <div key={c.id || idx} style={{
            padding: "8px 14px",
            backgroundColor: "#F0FDFA",
            border: "1px solid #0F766E",
            borderRadius: "6px",
            fontSize: "14px",
            fontWeight: 500,
            color: "#0F766E"
          }}>
            {c.qty}x {c.type}
          </div>
        ))}
        {summary === "" && (
          <div style={{
            padding: "10px 14px",
            backgroundColor: "#F9FAFB",
            border: "1px solid var(--neuron-ui-border)",
            borderRadius: "6px",
            fontSize: "14px",
            color: "#9CA3AF"
          }}>
            {"\u2014"}
          </div>
        )}
      </div>
    </div>
  );
}

// Comprehensive Brokerage Service Display
export function BrokerageServiceDisplay({ details }: { details: any }) {
  // Mode determines FCL/LCL/AIR display (matches form values: "FCL", "LCL", "AIR")
  const showFCL = details.mode === "FCL";
  const showLCL = details.mode === "LCL";
  const showAir = details.mode === "AIR";
  const isAllInclusive = details.subtype === "All-Inclusive";

  return (
    <div style={{
      backgroundColor: "white",
      border: "1px solid var(--neuron-ui-border)",
      borderRadius: "8px",
      padding: "24px",
      marginBottom: "24px"
    }}>
      <h2 style={{
        fontSize: "16px",
        fontWeight: 600,
        color: "var(--neuron-brand-green)",
        marginBottom: "20px"
      }}>
        Brokerage Service Details
      </h2>

      <div style={{ display: "grid", gap: "20px" }}>
        {/* Brokerage Type */}
        <FieldDisplay label="Brokerage Type" value={details.subtype} fullWidth />

        {/* Type of Entry checkboxes (for Standard & Non-Regular) */}
        {details.subtype !== "All-Inclusive" && (
          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
            <CheckboxDisplay label="Consumption" checked={details.consumption || false} />
            <CheckboxDisplay label="Warehousing" checked={details.warehousing || false} />
            <CheckboxDisplay label="PEZA" checked={details.peza || false} />
          </div>
        )}

        {/* 2-column grid for common fields */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
          <FieldDisplay label="POD" value={details.pod} />
          <FieldDisplay label="Mode" value={details.mode} />
          <FieldDisplay label="Cargo Type" value={details.cargo_type} />
        </div>

        {/* FCL Container Details — new containers array */}
        {showFCL && details.containers && details.containers.length > 0 && (
          <ContainersDisplay containers={details.containers} />
        )}
        {/* FCL legacy fallback */}
        {showFCL && (!details.containers || details.containers.length === 0) && (details.fcl_container_type || details.fcl_qty) && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
            <FieldDisplay label="FCL Container Type" value={details.fcl_container_type} />
            <FieldDisplay label="FCL Quantity" value={details.fcl_qty} />
          </div>
        )}

        {/* LCL Details */}
        {showLCL && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
            <FieldDisplay label="LCL GWT" value={details.lcl_gwt} />
            <FieldDisplay label="LCL Dimensions" value={details.lcl_dims} />
          </div>
        )}

        {/* Air Details */}
        {showAir && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
            <FieldDisplay label="Air GWT" value={details.air_gwt} />
            <FieldDisplay label="Air CWT" value={details.air_cwt} />
          </div>
        )}

        {/* Full-width fields */}
        <FieldDisplay label="Commodity Description" value={details.commodity} fullWidth />
        <FieldDisplay label="Delivery Address" value={details.delivery_address} fullWidth />

        {/* All-Inclusive specific fields */}
        {isAllInclusive && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
            <FieldDisplay label="Country of Origin" value={details.country_of_origin} />
            <FieldDisplay label="Preferential Treatment" value={details.preferential_treatment} />
          </div>
        )}
      </div>
    </div>
  );
}

// Comprehensive Forwarding Service Display
export function ForwardingServiceDisplay({ details }: { details: any }) {
  // Mode values from the form are "FCL", "LCL", "AIR", "Multi-modal"
  const showFCL = details.mode === "FCL";
  const showLCL = details.mode === "LCL";
  const showAir = details.mode === "AIR";
  const showInctermDetails = ["EXW", "FOB", "FCA"].includes(details.incoterms);
  const showCollectionAddress = details.incoterms === "EXW";
  
  // Reconstruct compound fields for display
  const aolPol = details.aolPol || (details.aol && details.pol ? `${details.aol} \u2192 ${details.pol}` : (details.aol || details.pol || ""));
  const aodPod = details.aodPod || (details.aod && details.pod ? `${details.aod} \u2192 ${details.pod}` : (details.aod || details.pod || ""));

  return (
    <div style={{
      backgroundColor: "white",
      border: "1px solid var(--neuron-ui-border)",
      borderRadius: "8px",
      padding: "24px",
      marginBottom: "24px"
    }}>
      <h2 style={{
        fontSize: "16px",
        fontWeight: 600,
        color: "var(--neuron-brand-green)",
        marginBottom: "20px"
      }}>
        Forwarding Service Details
      </h2>

      <div style={{ display: "grid", gap: "20px" }}>
        {/* Main details in 2-column grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
          <FieldDisplay label="Incoterms" value={details.incoterms} />
          <FieldDisplay label="Mode" value={details.mode} />
          <FieldDisplay label="AOL / POL" value={aolPol} />
          <FieldDisplay label="AOD / POD" value={aodPod} />
          <FieldDisplay label="Cargo Type" value={details.cargo_type} />
          <FieldDisplay label="Cargo Nature" value={details.cargo_nature} />
        </div>

        {/* FCL Container Details — new containers array */}
        {showFCL && details.containers && details.containers.length > 0 && (
          <ContainersDisplay containers={details.containers} />
        )}
        {/* FCL legacy fallback */}
        {showFCL && (!details.containers || details.containers.length === 0) && (details.fcl_container_type || details.fcl_qty) && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
            <FieldDisplay label="FCL Container Type" value={details.fcl_container_type} />
            <FieldDisplay label="FCL Quantity" value={details.fcl_qty} />
          </div>
        )}

        {/* LCL Details */}
        {showLCL && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
            <FieldDisplay label="LCL GWT" value={details.lcl_gwt} />
            <FieldDisplay label="LCL Dimensions" value={details.lcl_dims} />
          </div>
        )}

        {/* Air Details */}
        {showAir && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
            <FieldDisplay label="Air GWT" value={details.air_gwt} />
            <FieldDisplay label="Air CWT" value={details.air_cwt} />
          </div>
        )}

        {/* Full-width fields */}
        <FieldDisplay label="Commodity Description" value={details.commodity} fullWidth />
        <FieldDisplay label="Delivery Address" value={details.delivery_address} fullWidth />

        {/* Collection Address (EXW only) */}
        {showCollectionAddress && (
          <FieldDisplay label="Collection Address" value={details.collection_address} fullWidth />
        )}

        {/* Incoterm-specific details (EXW/FOB/FCA) */}
        {showInctermDetails && (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
              <FieldDisplay label="Carrier / Airline" value={details.carrier_airline} />
              <FieldDisplay label="Transit Time" value={details.transit_time} />
            </div>
            <FieldDisplay label="Route" value={details.route} fullWidth />
            <FieldDisplay label="Stackable" value={details.stackable ? "Yes" : details.stackable === false ? "No" : undefined} fullWidth />
          </>
        )}
      </div>
    </div>
  );
}

// Trucking Service Display
export function TruckingServiceDisplay({ details }: { details: any }) {
  return (
    <div style={{
      backgroundColor: "white",
      border: "1px solid var(--neuron-ui-border)",
      borderRadius: "8px",
      padding: "24px",
      marginBottom: "24px"
    }}>
      <h2 style={{
        fontSize: "16px",
        fontWeight: 600,
        color: "var(--neuron-brand-green)",
        marginBottom: "20px"
      }}>
        Trucking Service Details
      </h2>

      <div style={{ display: "grid", gap: "20px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
          <FieldDisplay label="Truck Type" value={details.truck_type} />
          <FieldDisplay label="Quantity" value={details.qty} />
          <FieldDisplay label="Pull Out" value={details.pull_out} />
          {(details.aol_pol || details.aolPol) && (
            <FieldDisplay label="AOL/POL" value={details.aol_pol || details.aolPol} />
          )}
        </div>
        <FieldDisplay label="Delivery Address" value={details.delivery_address} fullWidth />
        <FieldDisplay label="Delivery Instructions" value={details.delivery_instructions} fullWidth />
      </div>
    </div>
  );
}

// Marine Insurance Service Display
export function MarineInsuranceServiceDisplay({ details }: { details: any }) {
  // Reconstruct compound fields for display
  const aolPol = details.aol && details.pol ? `${details.aol} \u2192 ${details.pol}` : "";
  const aodPod = details.aod && details.pod ? `${details.aod} \u2192 ${details.pod}` : "";

  return (
    <div style={{
      backgroundColor: "white",
      border: "1px solid var(--neuron-ui-border)",
      borderRadius: "8px",
      padding: "24px",
      marginBottom: "24px"
    }}>
      <h2 style={{
        fontSize: "16px",
        fontWeight: 600,
        color: "var(--neuron-brand-green)",
        marginBottom: "20px"
      }}>
        Marine Insurance Service Details
      </h2>

      <div style={{ display: "grid", gap: "20px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
          <FieldDisplay label="HS Code" value={details.hs_code} />
          <FieldDisplay label="Invoice Value" value={details.invoice_value} />
          <FieldDisplay label="AOL / POL" value={aolPol} />
          <FieldDisplay label="AOD / POD" value={aodPod} />
        </div>
        <FieldDisplay label="Commodity Description" value={details.commodity_description} fullWidth />
      </div>
    </div>
  );
}

// Others Service Display
export function OthersServiceDisplay({ details }: { details: any }) {
  return (
    <div style={{
      backgroundColor: "white",
      border: "1px solid var(--neuron-ui-border)",
      borderRadius: "8px",
      padding: "24px",
      marginBottom: "24px"
    }}>
      <h2 style={{
        fontSize: "16px",
        fontWeight: 600,
        color: "var(--neuron-brand-green)",
        marginBottom: "20px"
      }}>
        Other Service Details
      </h2>

      <div style={{ display: "grid", gap: "20px" }}>
        <FieldDisplay label="Service Description" value={details.service_description} fullWidth />
      </div>
    </div>
  );
}
