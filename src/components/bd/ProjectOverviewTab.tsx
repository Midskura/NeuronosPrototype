import { Building2, Ship, Package, Calendar, FileText, MapPin, TrendingUp } from "lucide-react";
import type { Project } from "../../types/pricing";

interface ProjectOverviewTabProps {
  project: Project;
  onUpdate: () => void;
}

export function ProjectOverviewTab({ project }: ProjectOverviewTabProps) {
  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return undefined;
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "2-digit",
      year: "numeric",
    });
  };

  return (
    <div style={{ 
      flex: 1,
      overflow: "auto"
    }}>
      {/* Main Content Area */}
      <div style={{ 
        padding: "32px 48px",
        maxWidth: "1400px",
        margin: "0 auto"
      }}>
        
        {/* General Information Section */}
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
            marginBottom: "20px",
            display: "flex",
            alignItems: "center",
            gap: "8px"
          }}>
            <Building2 size={18} />
            General Information
          </h2>

          <div style={{ display: "grid", gap: "20px" }}>
            {/* Row 1: Customer and Contact Person */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
              <Field label="Customer Name" value={project.customer_name} />
              <Field label="Contact Person" value={project.contact_person_name} />
            </div>

            {/* Row 2: BD Owner and Ops Assigned */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
              <Field label="BD Owner" value={project.bd_owner_user_name} />
              <Field label="Operations Assigned" value={project.ops_assigned_user_name} />
            </div>

            {/* Row 3: Project Number and Quotation Reference */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
              <Field label="Project Number" value={project.project_number} />
              <Field label="Quotation Reference" value={project.quotation_number} />
            </div>

            {/* Row 4: Dates */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
              <Field label="Created Date" value={formatDate(project.created_at)} icon={<Calendar size={16} />} />
              <Field label="Last Updated" value={formatDate(project.updated_at)} icon={<Calendar size={16} />} />
            </div>
          </div>
        </div>

        {/* Shipment Details Section */}
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
            marginBottom: "20px",
            display: "flex",
            alignItems: "center",
            gap: "8px"
          }}>
            <Ship size={18} />
            Shipment Details
          </h2>

          <div style={{ display: "grid", gap: "20px" }}>
            {/* Row 1: Movement, Category, Shipment Type */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "20px" }}>
              <Field label="Movement" value={project.movement} />
              <Field label="Category" value={project.category} />
              <Field label="Shipment Type" value={project.shipment_type} />
            </div>

            {/* Row 2: POL/AOL and POD/AOD */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
              <Field label="POL/AOL" value={project.pol_aol} icon={<MapPin size={16} />} />
              <Field label="POD/AOD" value={project.pod_aod} icon={<MapPin size={16} />} />
            </div>

            {/* Row 3: Carrier, Transit Days, Incoterm */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "20px" }}>
              <Field label="Carrier" value={project.carrier} />
              <Field label="Transit Days" value={project.transit_days} />
              <Field label="Incoterm" value={project.incoterm} />
            </div>

            {/* Row 4: Services */}
            <div>
              <label style={{
                display: "block",
                fontSize: "13px",
                fontWeight: 500,
                color: "var(--neuron-ink-base)",
                marginBottom: "8px"
              }}>
                Service/s
              </label>
              <div style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "8px"
              }}>
                {project.services && project.services.length > 0 ? (
                  project.services.map((service, idx) => (
                    <span
                      key={idx}
                      style={{
                        padding: "8px 16px",
                        backgroundColor: "#0F766E",
                        border: "1px solid #0F766E",
                        borderRadius: "6px",
                        fontSize: "14px",
                        fontWeight: 500,
                        color: "white",
                        cursor: "default"
                      }}
                    >
                      {service}
                    </span>
                  ))
                ) : (
                  <div style={{
                    padding: "10px 14px",
                    backgroundColor: "#F9FAFB",
                    border: "1px solid var(--neuron-ui-border)",
                    borderRadius: "6px",
                    fontSize: "14px",
                    color: "#9CA3AF",
                    width: "100%"
                  }}>
                    No services selected
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Cargo Details Section */}
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
            marginBottom: "20px",
            display: "flex",
            alignItems: "center",
            gap: "8px"
          }}>
            <Package size={18} />
            Cargo Details
          </h2>

          <div style={{ display: "grid", gap: "20px" }}>
            {/* Row 1: Commodity, Cargo Type, Stackability */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "20px" }}>
              <Field label="Commodity" value={project.commodity} />
              <Field label="Cargo Type" value={project.cargo_type} />
              <Field label="Stackability" value={project.stackability} />
            </div>

            {/* Row 2: Volume Metrics */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "20px" }}>
              <Field label="Volume (CBM)" value={project.volume_cbm} icon={<TrendingUp size={16} />} />
              <Field label="Volume (Containers)" value={project.volume_containers} />
              <Field label="Volume (Packages)" value={project.volume_packages} />
            </div>

            {/* Row 3: Weight and Dimensions */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "20px" }}>
              <Field label="Gross Weight" value={project.gross_weight} unit="kg" />
              <Field label="Chargeable Weight" value={project.chargeable_weight} unit="kg" />
              <Field label="Dimensions" value={project.dimensions} />
            </div>
          </div>
        </div>

        {/* Project Timeline Section */}
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
            marginBottom: "20px",
            display: "flex",
            alignItems: "center",
            gap: "8px"
          }}>
            <Calendar size={18} />
            Project Timeline
          </h2>

          <div style={{ display: "grid", gap: "20px" }}>
            {/* Row 1: Client PO Number and PO Date */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
              <Field label="Client PO Number" value={project.client_po_number} />
              <Field label="PO Date" value={formatDate(project.client_po_date)} icon={<Calendar size={16} />} />
            </div>

            {/* Row 2: Shipment Ready Date and Requested ETD */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
              <Field label="Shipment Ready Date" value={formatDate(project.shipment_ready_date)} icon={<Calendar size={16} />} />
              <Field label="Requested ETD" value={formatDate(project.requested_etd)} icon={<Calendar size={16} />} />
            </div>

            {/* Row 3: Actual ETD and ETA */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
              <Field label="Actual ETD" value={formatDate(project.actual_etd)} icon={<Calendar size={16} />} />
              <Field label="ETA" value={formatDate(project.eta)} icon={<Calendar size={16} />} />
            </div>

            {/* Row 4: Actual Delivery Date */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
              <Field label="Actual Delivery Date" value={formatDate(project.actual_delivery_date)} icon={<Calendar size={16} />} />
              <div /> {/* Empty cell for grid alignment */}
            </div>

            {/* Row 5: Collection Address (Full Width) */}
            <Field label="Collection Address" value={project.collection_address} icon={<MapPin size={16} />} />
          </div>
        </div>

        {/* Special Instructions Section */}
        {project.special_instructions && (
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
              marginBottom: "20px",
              display: "flex",
              alignItems: "center",
              gap: "8px"
            }}>
              <FileText size={18} />
              Special Instructions
            </h2>
            <div style={{
              padding: "16px",
              backgroundColor: "#F9FAFB",
              border: "1px solid var(--neuron-ui-border)",
              borderRadius: "6px",
              fontSize: "14px",
              color: "var(--neuron-ink-primary)",
              lineHeight: "1.6",
              whiteSpace: "pre-wrap"
            }}>
              {project.special_instructions}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Helper Component for Fields
function Field({ 
  label, 
  value, 
  unit,
  icon
}: { 
  label: string; 
  value?: string | number | null; 
  unit?: string;
  icon?: React.ReactNode;
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
        color: value ? "var(--neuron-ink-primary)" : "#9CA3AF",
        display: "flex",
        alignItems: "center",
        gap: "8px"
      }}>
        {icon && <span style={{ color: "var(--neuron-ink-muted)", flexShrink: 0 }}>{icon}</span>}
        <span>
          {value || "—"}
          {value && unit && ` ${unit}`}
        </span>
      </div>
    </div>
  );
}
