import { X } from "lucide-react";
import { useState } from "react";
import type { Contact } from "../../types/contact";

interface ContactCreationModalProps {
  onClose: () => void;
  onSave: (contact: Partial<Contact>) => Promise<void>;
}

export function ContactCreationModal({ onClose, onSave }: ContactCreationModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    status: "Lead" as Contact["status"],
    notes: ""
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Invalid email format";
    }

    if (!formData.phone.trim()) {
      newErrors.phone = "Phone is required";
    }

    if (!formData.company.trim()) {
      newErrors.company = "Company is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    setIsSaving(true);
    try {
      await onSave(formData);
      onClose();
    } catch (error) {
      console.error("Error saving contact:", error);
      setErrors({ submit: "Failed to save contact. Please try again." });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        padding: "20px"
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: "white",
          borderRadius: "12px",
          width: "100%",
          maxWidth: "540px",
          maxHeight: "90vh",
          overflow: "auto",
          boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)"
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: "24px 32px",
            borderBottom: "1px solid var(--neuron-ui-border)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center"
          }}
        >
          <div>
            <h2 style={{ fontSize: "20px", fontWeight: 600, color: "var(--neuron-ink-primary)", margin: 0 }}>
              Create New Contact
            </h2>
            <p style={{ fontSize: "14px", color: "var(--neuron-ink-muted)", margin: "4px 0 0 0" }}>
              Add a new contact to your CRM
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: "8px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: "6px",
              transition: "background-color 0.2s"
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "#F3F4F6";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "transparent";
            }}
          >
            <X size={20} style={{ color: "var(--neuron-ink-muted)" }} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ padding: "32px" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            {/* Name */}
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "14px",
                  fontWeight: 500,
                  color: "var(--neuron-ink-secondary)",
                  marginBottom: "8px"
                }}
              >
                Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  border: `1px solid ${errors.name ? "#EF4444" : "var(--neuron-ui-border)"}`,
                  borderRadius: "8px",
                  fontSize: "14px",
                  outline: "none",
                  transition: "border-color 0.2s"
                }}
                onFocus={(e) => {
                  if (!errors.name) e.currentTarget.style.borderColor = "var(--neuron-brand-green)";
                }}
                onBlur={(e) => {
                  if (!errors.name) e.currentTarget.style.borderColor = "var(--neuron-ui-border)";
                }}
              />
              {errors.name && (
                <p style={{ color: "#EF4444", fontSize: "12px", marginTop: "4px" }}>{errors.name}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "14px",
                  fontWeight: 500,
                  color: "var(--neuron-ink-secondary)",
                  marginBottom: "8px"
                }}
              >
                Email *
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  border: `1px solid ${errors.email ? "#EF4444" : "var(--neuron-ui-border)"}`,
                  borderRadius: "8px",
                  fontSize: "14px",
                  outline: "none",
                  transition: "border-color 0.2s"
                }}
                onFocus={(e) => {
                  if (!errors.email) e.currentTarget.style.borderColor = "var(--neuron-brand-green)";
                }}
                onBlur={(e) => {
                  if (!errors.email) e.currentTarget.style.borderColor = "var(--neuron-ui-border)";
                }}
              />
              {errors.email && (
                <p style={{ color: "#EF4444", fontSize: "12px", marginTop: "4px" }}>{errors.email}</p>
              )}
            </div>

            {/* Phone */}
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "14px",
                  fontWeight: 500,
                  color: "var(--neuron-ink-secondary)",
                  marginBottom: "8px"
                }}
              >
                Phone *
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  border: `1px solid ${errors.phone ? "#EF4444" : "var(--neuron-ui-border)"}`,
                  borderRadius: "8px",
                  fontSize: "14px",
                  outline: "none",
                  transition: "border-color 0.2s"
                }}
                onFocus={(e) => {
                  if (!errors.phone) e.currentTarget.style.borderColor = "var(--neuron-brand-green)";
                }}
                onBlur={(e) => {
                  if (!errors.phone) e.currentTarget.style.borderColor = "var(--neuron-ui-border)";
                }}
              />
              {errors.phone && (
                <p style={{ color: "#EF4444", fontSize: "12px", marginTop: "4px" }}>{errors.phone}</p>
              )}
            </div>

            {/* Company */}
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "14px",
                  fontWeight: 500,
                  color: "var(--neuron-ink-secondary)",
                  marginBottom: "8px"
                }}
              >
                Company *
              </label>
              <input
                type="text"
                value={formData.company}
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  border: `1px solid ${errors.company ? "#EF4444" : "var(--neuron-ui-border)"}`,
                  borderRadius: "8px",
                  fontSize: "14px",
                  outline: "none",
                  transition: "border-color 0.2s"
                }}
                onFocus={(e) => {
                  if (!errors.company) e.currentTarget.style.borderColor = "var(--neuron-brand-green)";
                }}
                onBlur={(e) => {
                  if (!errors.company) e.currentTarget.style.borderColor = "var(--neuron-ui-border)";
                }}
              />
              {errors.company && (
                <p style={{ color: "#EF4444", fontSize: "12px", marginTop: "4px" }}>{errors.company}</p>
              )}
            </div>

            {/* Status */}
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "14px",
                  fontWeight: 500,
                  color: "var(--neuron-ink-secondary)",
                  marginBottom: "8px"
                }}
              >
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as Contact["status"] })}
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  border: "1px solid var(--neuron-ui-border)",
                  borderRadius: "8px",
                  fontSize: "14px",
                  outline: "none",
                  cursor: "pointer",
                  backgroundColor: "white"
                }}
              >
                <option value="Lead">Lead</option>
                <option value="Prospect">Prospect</option>
                <option value="MQL">MQL</option>
                <option value="Customer">Customer</option>
              </select>
            </div>

            {/* Notes */}
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "14px",
                  fontWeight: 500,
                  color: "var(--neuron-ink-secondary)",
                  marginBottom: "8px"
                }}
              >
                Notes (Optional)
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  border: "1px solid var(--neuron-ui-border)",
                  borderRadius: "8px",
                  fontSize: "14px",
                  outline: "none",
                  resize: "vertical",
                  fontFamily: "inherit"
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = "var(--neuron-brand-green)";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = "var(--neuron-ui-border)";
                }}
              />
            </div>

            {errors.submit && (
              <p style={{ color: "#EF4444", fontSize: "14px", margin: 0 }}>{errors.submit}</p>
            )}
          </div>

          {/* Footer Buttons */}
          <div
            style={{
              display: "flex",
              gap: "12px",
              justifyContent: "flex-end",
              marginTop: "32px",
              paddingTop: "24px",
              borderTop: "1px solid var(--neuron-ui-border)"
            }}
          >
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: "10px 20px",
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
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              style={{
                padding: "10px 20px",
                border: "none",
                borderRadius: "8px",
                fontSize: "14px",
                fontWeight: 600,
                color: "white",
                backgroundColor: isSaving ? "#9CA3AF" : "var(--neuron-brand-green)",
                cursor: isSaving ? "not-allowed" : "pointer",
                transition: "all 0.2s"
              }}
              onMouseEnter={(e) => {
                if (!isSaving) e.currentTarget.style.backgroundColor = "#0F544A";
              }}
              onMouseLeave={(e) => {
                if (!isSaving) e.currentTarget.style.backgroundColor = "var(--neuron-brand-green)";
              }}
            >
              {isSaving ? "Creating..." : "Create Contact"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
