import { Clipboard } from "lucide-react";
import type { Project, InquiryService } from "../../types/pricing";
import { ForwardingSpecsDisplay } from "./service-displays/ForwardingSpecsDisplay";
import { BrokerageSpecsDisplay } from "./service-displays/BrokerageSpecsDisplay";
import { TruckingSpecsDisplay } from "./service-displays/TruckingSpecsDisplay";
import { MarineInsuranceSpecsDisplay } from "./service-displays/MarineInsuranceSpecsDisplay";
import { OthersSpecsDisplay } from "./service-displays/OthersSpecsDisplay";

interface ServiceSpecificationsTabProps {
  project: Project;
}

export function ServiceSpecificationsTab({ project }: ServiceSpecificationsTabProps) {
  const servicesMetadata = project.services_metadata || [];

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
        
        {/* Header Section */}
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
            marginBottom: "8px",
            display: "flex",
            alignItems: "center",
            gap: "8px"
          }}>
            <Clipboard size={18} />
            Service Specifications
          </h2>
          <p style={{ 
            fontSize: "13px", 
            color: "var(--neuron-ink-muted)",
            margin: 0
          }}>
            Detailed specifications inherited from Quotation {project.quotation_number}
          </p>
        </div>

        {servicesMetadata.length > 0 ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            {servicesMetadata.map((service, idx) => (
              <ServiceSpecCard key={idx} service={service} />
            ))}
          </div>
        ) : (
          <div style={{
            backgroundColor: "white",
            border: "1px solid var(--neuron-ui-border)",
            borderRadius: "8px",
            padding: "48px 24px",
            textAlign: "center"
          }}>
            <p style={{ 
              fontSize: "14px",
              color: "var(--neuron-ink-muted)",
              marginBottom: "8px"
            }}>
              No detailed service specifications available
            </p>
            <p style={{ 
              fontSize: "13px",
              color: "#9CA3AF",
              margin: 0
            }}>
              Service specifications are inherited from the quotation
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function ServiceSpecCard({ service }: { service: InquiryService }) {
  switch (service.service_type) {
    case "Forwarding":
      return <ForwardingSpecsDisplay details={service.service_details as any} />;
    case "Brokerage":
      return <BrokerageSpecsDisplay details={service.service_details as any} />;
    case "Trucking":
      return <TruckingSpecsDisplay details={service.service_details as any} />;
    case "Marine Insurance":
      return <MarineInsuranceSpecsDisplay details={service.service_details as any} />;
    case "Others":
      return <OthersSpecsDisplay details={service.service_details as any} />;
    default:
      return null;
  }
}