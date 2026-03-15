import { ArrowLeft, Mail, Phone, Building2, Calendar, FileText, Edit2, Save, X, Plus } from "lucide-react";
import { useState } from "react";
import type { Contact } from "../../types/contact";

interface ContactDetailViewProps {
  contact: Contact;
  onBack: () => void;
  onUpdate: (id: string, updates: Partial<Contact>) => Promise<void>;
  onViewQuotation?: (quotationId: string) => void;
  onCreateInquiry?: () => void;
}

export function ContactDetailView({ contact, onBack, onUpdate, onViewQuotation, onCreateInquiry }: ContactDetailViewProps) {
  const [activeTab, setActiveTab] = useState<"activities" | "tasks" | "inquiries" | "attachments" | "comments">("inquiries");
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: contact.name,
    email: contact.email,
    phone: contact.phone,
    company: contact.company,
    status: contact.status,
    notes: contact.notes || ""
  });

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onUpdate(contact.id, formData);
      setIsEditing(false);
    } catch (error) {
      console.error("Error updating contact:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      name: contact.name,
      email: contact.email,
      phone: contact.phone,
      company: contact.company,
      status: contact.status,
      notes: contact.notes || ""
    });
    setIsEditing(false);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Customer": return { bg: "#D1FAE5", text: "#10B981" };
      case "MQL": return { bg: "#DBEAFE", text: "#3B82F6" };
      case "Prospect": return { bg: "#FEF3C7", text: "#F59E0B" };
      case "Lead": return { bg: "#F3F4F6", text: "#6B7280" };
      default: return { bg: "#F3F4F6", text: "#6B7280" };
    }
  };

  const statusColors = getStatusColor(isEditing ? formData.status : contact.status);

  const tabs = [
    { id: "activities" as const, label: "Activities" },
    { id: "tasks" as const, label: "Tasks" },
    { id: "inquiries" as const, label: "Inquiries" },
    { id: "attachments" as const, label: "Attachments" },
    { id: "comments" as const, label: "Comments" }
  ];

  return (
    <div style={{ 
      display: "flex", 
      flexDirection: "column", 
      height: "100%",
      backgroundColor: "white"
    }}>
      {/* Header */}
      <div style={{ 
        padding: "32px 48px 0",
        borderBottom: "1px solid var(--neuron-ui-border)"
      }}>
        <button
          onClick={onBack}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            background: "none",
            border: "none",
            cursor: "pointer",
            fontSize: "14px",
            fontWeight: 500,
            color: "var(--neuron-ink-secondary)",
            marginBottom: "24px",
            padding: "4px 0"
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = "var(--neuron-brand-green)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = "var(--neuron-ink-secondary)";
          }}
        >
          <ArrowLeft size={16} />
          Back to Contacts
        </button>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "32px" }}>
          <div style={{ flex: 1 }}>
            {isEditing ? (
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                style={{
                  fontSize: "28px",
                  fontWeight: 600,
                  color: "var(--neuron-ink-primary)",
                  border: "1px solid var(--neuron-ui-border)",
                  borderRadius: "8px",
                  padding: "8px 12px",
                  width: "100%",
                  maxWidth: "500px",
                  outline: "none"
                }}
              />
            ) : (
              <h1 style={{ 
                fontSize: "28px",
                fontWeight: 600,
                color: "var(--neuron-ink-primary)",
                marginBottom: "4px"
              }}>
                {contact.name}
              </h1>
            )}
            
            <div style={{ display: "flex", gap: "8px", marginBottom: "4px" }}>
              {isEditing ? (
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as Contact["status"] })}
                  style={{
                    padding: "4px 10px",
                    borderRadius: "6px",
                    backgroundColor: statusColors.bg,
                    color: statusColors.text,
                    border: "none",
                    fontSize: "12px",
                    fontWeight: 600,
                    cursor: "pointer",
                    outline: "none",
                    textTransform: "uppercase"
                  }}
                >
                  <option value="Lead">Lead</option>
                  <option value="Prospect">Prospect</option>
                  <option value="MQL">MQL</option>
                  <option value="Customer">Customer</option>
                </select>
              ) : (
                <span
                  style={{
                    padding: "4px 10px",
                    borderRadius: "6px",
                    backgroundColor: statusColors.bg,
                    color: statusColors.text,
                    fontSize: "12px",
                    fontWeight: 600,
                    textTransform: "uppercase"
                  }}
                >
                  {contact.status}
                </span>
              )}
            </div>

            {isEditing ? (
              <input
                type="text"
                value={formData.company}
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                style={{
                  fontSize: "14px",
                  color: "var(--neuron-ink-secondary)",
                  border: "1px solid var(--neuron-ui-border)",
                  borderRadius: "6px",
                  padding: "4px 8px",
                  outline: "none",
                  marginBottom: "8px"
                }}
              />
            ) : (
              <p style={{ fontSize: "14px", color: "var(--neuron-ink-secondary)", margin: "0 0 8px 0" }}>
                {contact.company}
              </p>
            )}
          </div>

          <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
            {isEditing ? (
              <>
                <button
                  onClick={handleCancel}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "8px 16px",
                    border: "1px solid var(--neuron-ui-border)",
                    borderRadius: "8px",
                    fontSize: "14px",
                    fontWeight: 500,
                    color: "var(--neuron-ink-secondary)",
                    backgroundColor: "white",
                    cursor: "pointer"
                  }}
                >
                  <X size={16} />
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "8px 16px",
                    border: "none",
                    borderRadius: "8px",
                    fontSize: "14px",
                    fontWeight: 600,
                    color: "white",
                    backgroundColor: isSaving ? "#9CA3AF" : "var(--neuron-brand-green)",
                    cursor: isSaving ? "not-allowed" : "pointer"
                  }}
                >
                  <Save size={16} />
                  {isSaving ? "Saving..." : "Save"}
                </button>
              </>
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "8px 16px",
                  border: "1px solid var(--neuron-ui-border)",
                  borderRadius: "8px",
                  fontSize: "14px",
                  fontWeight: 500,
                  color: "var(--neuron-ink-secondary)",
                  backgroundColor: "white",
                  cursor: "pointer",
                  transition: "all 0.2s"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "#F9FAFB";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "white";
                }}
              >
                <Edit2 size={16} />
                Update Details
              </button>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: "32px", borderBottom: "1px solid var(--neuron-ui-border)" }}>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: "12px 0",
                background: "none",
                border: "none",
                borderBottom: activeTab === tab.id ? "2px solid var(--neuron-brand-teal)" : "2px solid transparent",
                fontSize: "14px",
                fontWeight: 500,
                color: activeTab === tab.id ? "var(--neuron-brand-teal)" : "var(--neuron-ink-muted)",
                cursor: "pointer",
                transition: "all 0.2s",
                marginBottom: "-1px"
              }}
              onMouseEnter={(e) => {
                if (activeTab !== tab.id) {
                  e.currentTarget.style.color = "var(--neuron-ink-secondary)";
                }
              }}
              onMouseLeave={(e) => {
                if (activeTab !== tab.id) {
                  e.currentTarget.style.color = "var(--neuron-ink-muted)";
                }
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div style={{ flex: 1, overflow: "auto" }}>
        <div style={{ padding: "32px 48px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "32px" }}>
            {/* Left Column - Tab Content */}
            <div>
              {activeTab === "inquiries" && (
                <>
                  <div style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "24px"
                  }}>
                    <h2 style={{ 
                      fontSize: "18px",
                      fontWeight: 600,
                      color: "var(--neuron-ink-primary)",
                      margin: 0
                    }}>
                      Inquiries
                    </h2>
                    
                    {onCreateInquiry && (
                      <button
                        onClick={onCreateInquiry}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                          padding: "8px 16px",
                          border: "none",
                          borderRadius: "8px",
                          fontSize: "13px",
                          fontWeight: 600,
                          color: "white",
                          backgroundColor: "var(--neuron-brand-green)",
                          cursor: "pointer",
                          transition: "all 0.2s"
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = "var(--neuron-brand-teal)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = "var(--neuron-brand-green)";
                        }}
                      >
                        <Plus size={16} />
                        Create Inquiry
                      </button>
                    )}
                  </div>

                  {contact.quotations && contact.quotations.length > 0 ? (
                    <div style={{ border: "1px solid var(--neuron-ui-border)", borderRadius: "8px", overflow: "hidden" }}>
                      {/* Table Header */}
                      <div style={{
                        display: "grid",
                        gridTemplateColumns: "1.5fr 1.5fr 1fr 1.5fr 1fr",
                        gap: "16px",
                        padding: "12px 16px",
                        backgroundColor: "#F9FAFB",
                        borderBottom: "1px solid var(--neuron-ui-border)"
                      }}>
                        <div style={{ fontSize: "12px", fontWeight: 600, color: "var(--neuron-ink-muted)", textTransform: "uppercase" }}>
                          INQUIRY #
                        </div>
                        <div style={{ fontSize: "12px", fontWeight: 600, color: "var(--neuron-ink-muted)", textTransform: "uppercase" }}>
                          SERVICES
                        </div>
                        <div style={{ fontSize: "12px", fontWeight: 600, color: "var(--neuron-ink-muted)", textTransform: "uppercase" }}>
                          MOVEMENT
                        </div>
                        <div style={{ fontSize: "12px", fontWeight: 600, color: "var(--neuron-ink-muted)", textTransform: "uppercase" }}>
                          ROUTE
                        </div>
                        <div style={{ fontSize: "12px", fontWeight: 600, color: "var(--neuron-ink-muted)", textTransform: "uppercase" }}>
                          CREATED
                        </div>
                      </div>

                      {/* Table Rows */}
                      {contact.quotations.map((quotation: any) => (
                        <div
                          key={quotation.id}
                          onClick={() => onViewQuotation?.(quotation.id)}
                          style={{
                            display: "grid",
                            gridTemplateColumns: "1.5fr 1.5fr 1fr 1.5fr 1fr",
                            gap: "16px",
                            padding: "16px",
                            borderBottom: "1px solid var(--neuron-ui-border)",
                            cursor: "pointer",
                            transition: "all 0.2s"
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = "#F9FAFB";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = "white";
                          }}
                        >
                          <div style={{ fontSize: "13px", fontWeight: 500, color: "var(--neuron-brand-teal)" }}>
                            {quotation.quote_number}
                          </div>
                          <div style={{ fontSize: "13px", color: "var(--neuron-ink-primary)" }}>
                            {quotation.services?.join(", ") || "—"}
                          </div>
                          <div style={{ fontSize: "13px", color: "var(--neuron-ink-primary)" }}>
                            {quotation.movement || "—"}
                          </div>
                          <div style={{ fontSize: "13px", color: "var(--neuron-ink-primary)" }}>
                            {quotation.origin && quotation.destination 
                              ? `${quotation.origin} → ${quotation.destination}` 
                              : "—"}
                          </div>
                          <div style={{ fontSize: "13px", color: "var(--neuron-ink-secondary)" }}>
                            {formatDate(quotation.created_date)}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{
                      padding: "64px 24px",
                      textAlign: "center",
                      border: "1px dashed var(--neuron-ui-border)",
                      borderRadius: "8px",
                      color: "var(--neuron-ink-muted)"
                    }}>
                      <FileText size={48} style={{ opacity: 0.2, marginBottom: "16px" }} />
                      <p style={{ fontSize: "14px", margin: "0 0 4px 0", color: "var(--neuron-ink-primary)" }}>
                        No inquiries yet
                      </p>
                      <p style={{ fontSize: "13px", margin: 0 }}>
                        Inquiries from E-Quotation system will appear here
                      </p>
                    </div>
                  )}
                </>
              )}

              {activeTab === "activities" && (
                <div style={{
                  padding: "64px 24px",
                  textAlign: "center",
                  border: "1px dashed var(--neuron-ui-border)",
                  borderRadius: "8px",
                  color: "var(--neuron-ink-muted)"
                }}>
                  <p style={{ fontSize: "14px", margin: 0 }}>Activities coming soon</p>
                </div>
              )}

              {activeTab === "tasks" && (
                <div style={{
                  padding: "64px 24px",
                  textAlign: "center",
                  border: "1px dashed var(--neuron-ui-border)",
                  borderRadius: "8px",
                  color: "var(--neuron-ink-muted)"
                }}>
                  <p style={{ fontSize: "14px", margin: 0 }}>Tasks coming soon</p>
                </div>
              )}

              {activeTab === "attachments" && (
                <div style={{
                  padding: "64px 24px",
                  textAlign: "center",
                  border: "1px dashed var(--neuron-ui-border)",
                  borderRadius: "8px",
                  color: "var(--neuron-ink-muted)"
                }}>
                  <p style={{ fontSize: "14px", margin: 0 }}>Attachments coming soon</p>
                </div>
              )}

              {activeTab === "comments" && (
                <div style={{
                  padding: "64px 24px",
                  textAlign: "center",
                  border: "1px dashed var(--neuron-ui-border)",
                  borderRadius: "8px",
                  color: "var(--neuron-ink-muted)"
                }}>
                  <p style={{ fontSize: "14px", margin: 0 }}>Comments coming soon</p>
                </div>
              )}
            </div>

            {/* Right Column - Contact Details */}
            <div>
              <h2 style={{ 
                fontSize: "18px",
                fontWeight: 600,
                color: "var(--neuron-ink-primary)",
                marginBottom: "16px"
              }}>
                Contact Details
              </h2>

              <div style={{
                border: "1px solid var(--neuron-ui-border)",
                borderRadius: "8px",
                padding: "20px"
              }}>
                <div style={{ marginBottom: "20px" }}>
                  <label style={{ 
                    fontSize: "12px", 
                    color: "var(--neuron-ink-muted)", 
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                    display: "block",
                    marginBottom: "6px"
                  }}>
                    First Name
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={formData.name.split(" ")[0] || ""}
                      onChange={(e) => {
                        const lastName = formData.name.split(" ").slice(1).join(" ");
                        setFormData({ ...formData, name: `${e.target.value} ${lastName}`.trim() });
                      }}
                      style={{
                        width: "100%",
                        padding: "8px 12px",
                        border: "1px solid var(--neuron-ui-border)",
                        borderRadius: "6px",
                        fontSize: "14px",
                        outline: "none"
                      }}
                    />
                  ) : (
                    <p style={{ fontSize: "14px", color: "var(--neuron-ink-primary)", margin: 0 }}>
                      {contact.name.split(" ")[0] || "—"}
                    </p>
                  )}
                </div>

                <div style={{ marginBottom: "20px" }}>
                  <label style={{ 
                    fontSize: "12px", 
                    color: "var(--neuron-ink-muted)", 
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                    display: "block",
                    marginBottom: "6px"
                  }}>
                    Last Name
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={formData.name.split(" ").slice(1).join(" ") || ""}
                      onChange={(e) => {
                        const firstName = formData.name.split(" ")[0];
                        setFormData({ ...formData, name: `${firstName} ${e.target.value}`.trim() });
                      }}
                      style={{
                        width: "100%",
                        padding: "8px 12px",
                        border: "1px solid var(--neuron-ui-border)",
                        borderRadius: "6px",
                        fontSize: "14px",
                        outline: "none"
                      }}
                    />
                  ) : (
                    <p style={{ fontSize: "14px", color: "var(--neuron-ink-primary)", margin: 0 }}>
                      {contact.name.split(" ").slice(1).join(" ") || "—"}
                    </p>
                  )}
                </div>

                <div style={{ marginBottom: "20px" }}>
                  <label style={{ 
                    fontSize: "12px", 
                    color: "var(--neuron-ink-muted)", 
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    marginBottom: "6px"
                  }}>
                    <Mail size={14} />
                    Email
                  </label>
                  {isEditing ? (
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      style={{
                        width: "100%",
                        padding: "8px 12px",
                        border: "1px solid var(--neuron-ui-border)",
                        borderRadius: "6px",
                        fontSize: "14px",
                        outline: "none"
                      }}
                    />
                  ) : (
                    <p style={{ fontSize: "14px", color: "var(--neuron-ink-primary)", margin: 0 }}>
                      {contact.email}
                    </p>
                  )}
                </div>

                <div style={{ marginBottom: "20px" }}>
                  <label style={{ 
                    fontSize: "12px", 
                    color: "var(--neuron-ink-muted)", 
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    marginBottom: "6px"
                  }}>
                    <Phone size={14} />
                    Mobile Number
                  </label>
                  {isEditing ? (
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      style={{
                        width: "100%",
                        padding: "8px 12px",
                        border: "1px solid var(--neuron-ui-border)",
                        borderRadius: "6px",
                        fontSize: "14px",
                        outline: "none"
                      }}
                    />
                  ) : (
                    <p style={{ fontSize: "14px", color: "var(--neuron-ink-primary)", margin: 0 }}>
                      {contact.phone}
                    </p>
                  )}
                </div>

                <div style={{ marginBottom: "20px" }}>
                  <label style={{ 
                    fontSize: "12px", 
                    color: "var(--neuron-ink-muted)", 
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    marginBottom: "6px"
                  }}>
                    <Building2 size={14} />
                    Company
                  </label>
                  <p style={{ fontSize: "14px", color: "var(--neuron-ink-primary)", margin: 0 }}>
                    {contact.company}
                  </p>
                </div>

                <div style={{ marginBottom: "20px" }}>
                  <label style={{ 
                    fontSize: "12px", 
                    color: "var(--neuron-ink-muted)", 
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                    display: "block",
                    marginBottom: "6px"
                  }}>
                    Lifecycle Stage
                  </label>
                  <p style={{ fontSize: "14px", color: "var(--neuron-ink-primary)", margin: 0 }}>
                    {contact.status}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
