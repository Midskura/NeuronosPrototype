import { useState } from "react";
import { Plus, FileText, CheckCircle } from "lucide-react";
import { AddInquiryPanel } from "./AddInquiryPanel";

/**
 * AddInquiryDemo
 * 
 * Demo component to showcase the new BD Inquiry creation workflow
 * with detailed service specifications that auto-populate pricing templates.
 * 
 * This demonstrates Phase 4 of the Template Auto-Population implementation.
 */
export function AddInquiryDemo() {
  const [showPanel, setShowPanel] = useState(false);
  const [createdInquiries, setCreatedInquiries] = useState<any[]>([]);

  const handleSaveInquiry = (inquiryData: any) => {
    console.log("✅ Inquiry created:", inquiryData);
    setCreatedInquiries([inquiryData, ...createdInquiries]);
    setShowPanel(false);
  };

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column", backgroundColor: "#F9FAFB" }}>
      {/* Header */}
      <div style={{ padding: "24px 48px", borderBottom: "1px solid var(--neuron-ui-border)", backgroundColor: "white" }}>
        <h1 style={{ fontSize: "24px", fontWeight: 600, color: "#12332B", marginBottom: "4px" }}>
          Add Inquiry Panel - Demo
        </h1>
        <p style={{ fontSize: "13px", color: "#667085", margin: 0 }}>
          Test the new BD inquiry creation workflow with detailed service specifications
        </p>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflow: "auto", padding: "32px 48px" }}>
        <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
          
          {/* Instructions */}
          <div style={{ 
            marginBottom: "24px",
            padding: "20px 24px",
            backgroundColor: "#F0FDF9",
            border: "1px solid #0F766E",
            borderRadius: "8px",
          }}>
            <h2 style={{ fontSize: "16px", fontWeight: 600, color: "#0F766E", marginBottom: "12px" }}>
              📋 How It Works
            </h2>
            <ol style={{ fontSize: "13px", color: "#667085", margin: 0, paddingLeft: "20px", lineHeight: "1.8" }}>
              <li>Click the <strong>"Create New Inquiry"</strong> button below</li>
              <li>Fill in customer and shipment details</li>
              <li>Select services (Brokerage, Forwarding, Trucking, etc.)</li>
              <li><strong>Fill in complete service details</strong> for each service (subtype, shipment type, POD, mode, etc.)</li>
              <li>Save the inquiry</li>
              <li>When PD converts this inquiry to a quotation, line items will <strong>auto-populate</strong> based on the service details!</li>
            </ol>
          </div>

          {/* Demo Section */}
          <section style={{ marginBottom: "32px" }}>
            <h2 style={{ fontSize: "18px", fontWeight: 600, color: "#12332B", marginBottom: "16px" }}>
              Create Inquiry with Service Details
            </h2>
            <p style={{ fontSize: "13px", color: "#667085", marginBottom: "16px" }}>
              This simulates the BD workflow where complete service specifications are captured upfront,
              enabling automatic charge template population when Pricing creates the quotation.
            </p>

            <button
              onClick={() => setShowPanel(true)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "12px 24px",
                fontSize: "14px",
                fontWeight: 600,
                color: "white",
                backgroundColor: "var(--neuron-brand-green)",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
                transition: "all 0.15s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "#0F766E";
                e.currentTarget.style.transform = "translateY(-1px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "var(--neuron-brand-green)";
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              <Plus size={18} />
              Create New Inquiry
            </button>
          </section>

          {/* Created Inquiries */}
          {createdInquiries.length > 0 && (
            <section style={{ marginBottom: "32px" }}>
              <h2 style={{ fontSize: "18px", fontWeight: 600, color: "#12332B", marginBottom: "16px" }}>
                Recently Created Inquiries ({createdInquiries.length})
              </h2>

              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {createdInquiries.map((inquiry, index) => (
                  <div
                    key={inquiry.id || index}
                    style={{
                      padding: "20px 24px",
                      backgroundColor: "white",
                      border: "1px solid var(--neuron-ui-border)",
                      borderRadius: "8px",
                      transition: "all 0.15s",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                          <FileText size={16} style={{ color: "#0F766E" }} />
                          <span style={{ fontSize: "15px", fontWeight: 600, color: "var(--neuron-ink-primary)" }}>
                            {inquiry.inquiry_number}
                          </span>
                        </div>
                        <div style={{ fontSize: "14px", color: "var(--neuron-ink-primary)", marginBottom: "4px" }}>
                          {inquiry.customer_name}
                        </div>
                        <div style={{ fontSize: "12px", color: "var(--neuron-ink-muted)" }}>
                          {inquiry.origin} → {inquiry.destination}
                        </div>
                      </div>

                      <div style={{
                        padding: "4px 10px",
                        backgroundColor: "#FEF3C7",
                        color: "#92400E",
                        fontSize: "11px",
                        fontWeight: 600,
                        borderRadius: "4px",
                      }}>
                        {inquiry.status}
                      </div>
                    </div>

                    {/* Services */}
                    <div style={{ marginBottom: "12px" }}>
                      <div style={{ fontSize: "12px", fontWeight: 600, color: "var(--neuron-ink-muted)", marginBottom: "6px" }}>
                        SERVICES:
                      </div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                        {inquiry.services.map((service: any, idx: number) => {
                          const serviceType = typeof service === 'string' ? service : service.service_type;
                          const hasDetails = typeof service === 'object' && service.service_details;
                          
                          return (
                            <div
                              key={idx}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "4px",
                                padding: "4px 10px",
                                backgroundColor: hasDetails ? "#E8F5F3" : "#F3F4F6",
                                border: hasDetails ? "1px solid #0F766E" : "1px solid #D1D5DB",
                                borderRadius: "4px",
                                fontSize: "12px",
                                fontWeight: 500,
                                color: hasDetails ? "#0F766E" : "#6B7280",
                              }}
                            >
                              {serviceType}
                              {hasDetails && <CheckCircle size={12} style={{ color: "#0F766E" }} />}
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Service Details Preview */}
                    {inquiry.services.some((s: any) => typeof s === 'object' && s.service_details) && (
                      <div style={{
                        padding: "12px",
                        backgroundColor: "#F8FBFB",
                        borderRadius: "6px",
                        fontSize: "12px",
                        color: "var(--neuron-ink-muted)",
                      }}>
                        <div style={{ fontWeight: 600, color: "#0F766E", marginBottom: "6px" }}>
                          ✅ Service Details Captured:
                        </div>
                        {inquiry.services.map((service: any, idx: number) => {
                          if (typeof service === 'string' || !service.service_details) return null;
                          
                          const details = service.service_details;
                          const detailKeys = Object.keys(details).slice(0, 4); // Show first 4 fields
                          
                          return (
                            <div key={idx} style={{ marginBottom: "4px" }}>
                              <span style={{ fontWeight: 600 }}>{service.service_type}:</span>{' '}
                              {detailKeys.map((key, i) => (
                                <span key={key}>
                                  {key}: <strong>{String(details[key])}</strong>
                                  {i < detailKeys.length - 1 && ', '}
                                </span>
                              ))}
                              {Object.keys(details).length > 4 && `, +${Object.keys(details).length - 4} more`}
                            </div>
                          );
                        })}
                        <div style={{ marginTop: "8px", fontStyle: "italic", color: "#0F766E" }}>
                          → When converted to quotation, charges will auto-populate based on these details!
                        </div>
                      </div>
                    )}

                    {/* Cargo Description */}
                    <div style={{ marginTop: "12px", fontSize: "12px", color: "var(--neuron-ink-muted)" }}>
                      <span style={{ fontWeight: 500 }}>Cargo:</span> {inquiry.cargo_description}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Template Info */}
          <section style={{ marginBottom: "32px" }}>
            <h2 style={{ fontSize: "18px", fontWeight: 600, color: "#12332B", marginBottom: "16px" }}>
              Auto-Population Templates
            </h2>
            
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              {/* Brokerage */}
              <div style={{
                padding: "16px",
                backgroundColor: "white",
                border: "1px solid var(--neuron-ui-border)",
                borderRadius: "8px",
              }}>
                <div style={{ fontSize: "14px", fontWeight: 600, color: "var(--neuron-ink-primary)", marginBottom: "8px" }}>
                  📄 Brokerage
                </div>
                <div style={{ fontSize: "12px", color: "var(--neuron-ink-muted)", lineHeight: "1.6" }}>
                  <strong>If BD fills:</strong>
                  <ul style={{ margin: "4px 0", paddingLeft: "20px" }}>
                    <li>Subtype: Import Ocean</li>
                    <li>Shipment Type: FCL</li>
                  </ul>
                  <strong style={{ color: "#0F766E" }}>→ 15 charges auto-generated!</strong>
                </div>
              </div>

              {/* Forwarding */}
              <div style={{
                padding: "16px",
                backgroundColor: "white",
                border: "1px solid var(--neuron-ui-border)",
                borderRadius: "8px",
              }}>
                <div style={{ fontSize: "14px", fontWeight: 600, color: "var(--neuron-ink-primary)", marginBottom: "8px" }}>
                  🚢 Forwarding
                </div>
                <div style={{ fontSize: "12px", color: "var(--neuron-ink-muted)", lineHeight: "1.6" }}>
                  <strong>If BD fills:</strong>
                  <ul style={{ margin: "4px 0", paddingLeft: "20px" }}>
                    <li>Mode: Ocean</li>
                  </ul>
                  <strong style={{ color: "#0F766E" }}>→ 14 charges auto-generated!</strong>
                </div>
              </div>

              {/* Trucking */}
              <div style={{
                padding: "16px",
                backgroundColor: "white",
                border: "1px solid var(--neuron-ui-border)",
                borderRadius: "8px",
              }}>
                <div style={{ fontSize: "14px", fontWeight: 600, color: "var(--neuron-ink-primary)", marginBottom: "8px" }}>
                  🚚 Trucking
                </div>
                <div style={{ fontSize: "12px", color: "var(--neuron-ink-muted)", lineHeight: "1.6" }}>
                  <strong>Always works:</strong>
                  <ul style={{ margin: "4px 0", paddingLeft: "20px" }}>
                    <li>No conditions needed</li>
                  </ul>
                  <strong style={{ color: "#0F766E" }}>→ 5 charges auto-generated!</strong>
                </div>
              </div>

              {/* Marine Insurance */}
              <div style={{
                padding: "16px",
                backgroundColor: "white",
                border: "1px solid var(--neuron-ui-border)",
                borderRadius: "8px",
              }}>
                <div style={{ fontSize: "14px", fontWeight: 600, color: "var(--neuron-ink-primary)", marginBottom: "8px" }}>
                  🛡️ Marine Insurance
                </div>
                <div style={{ fontSize: "12px", color: "var(--neuron-ink-muted)", lineHeight: "1.6" }}>
                  <strong>Always works:</strong>
                  <ul style={{ margin: "4px 0", paddingLeft: "20px" }}>
                    <li>No conditions needed</li>
                  </ul>
                  <strong style={{ color: "#0F766E" }}>→ 1 charge auto-generated!</strong>
                </div>
              </div>
            </div>
          </section>

        </div>
      </div>

      {/* Add Inquiry Panel (slides in from right) */}
      {showPanel && (
        <AddInquiryPanel
          onClose={() => setShowPanel(false)}
          onSave={handleSaveInquiry}
        />
      )}
    </div>
  );
}
