import { useState, useEffect } from "react";
import { X, Upload } from "lucide-react";
import type { PaymentMethod } from "../../types/evoucher";

interface CreateEVoucherModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  budgetRequestData?: {
    id: string;
    number: string;
    amount: number;
    purpose: string;
    customer_id?: string;
    customer_name?: string;
  };
  invoiceData?: {
    invoice_number: string;
    amount_due: number;
    customer_id: string;
    customer_name: string;
    project_number: string;
  };
  context?: "bd" | "accounting"; // Context for UI labels
}

export function CreateEVoucherModal({ open, onClose, onSubmit, budgetRequestData, invoiceData, context = "accounting" }: CreateEVoucherModalProps) {
  const [formData, setFormData] = useState({
    transaction_type: "expense",
    amount: 0,
    purpose: "",
    description: "",
    vendor_name: "",
    vendor_contact: "",
    project_number: "",
    customer_id: "",
    customer_name: "",
    invoice_number: "",
    credit_terms: "",
    due_date: "",
    payment_method: "" as PaymentMethod | "",
  });

  // Initialize form data when props change
  useEffect(() => {
    if (open) {
      if (budgetRequestData) {
        setFormData(prev => ({
          ...prev,
          transaction_type: "budget_request",
          amount: budgetRequestData.amount,
          purpose: budgetRequestData.purpose,
          customer_id: budgetRequestData.customer_id || "",
          customer_name: budgetRequestData.customer_name || "",
        }));
      } else if (invoiceData) {
        setFormData(prev => ({
          ...prev,
          transaction_type: "collection",
          amount: invoiceData.amount_due,
          purpose: `Payment for Invoice ${invoiceData.invoice_number}`,
          project_number: invoiceData.project_number,
          customer_id: invoiceData.customer_id,
          customer_name: invoiceData.customer_name,
          invoice_number: invoiceData.invoice_number,
        }));
      } else {
        // Reset to default
        setFormData({
          transaction_type: "expense",
          amount: 0,
          purpose: "",
          description: "",
          vendor_name: "",
          vendor_contact: "",
          project_number: "",
          customer_id: "",
          customer_name: "",
          invoice_number: "",
          credit_terms: "",
          due_date: "",
          payment_method: "" as PaymentMethod | "",
        });
      }
    }
  }, [open, budgetRequestData, invoiceData]);

  if (!open) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      budget_request_id: budgetRequestData?.id,
      budget_request_number: budgetRequestData?.number,
      // If collection, we pass the invoice number as reference
      linked_billings: invoiceData ? [{ id: invoiceData.invoice_number, amount: formData.amount }] : undefined
    });
    onClose();
  };

  const isCollection = formData.transaction_type === "collection";

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
        padding: "20px",
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: "#FFFFFF",
          borderRadius: "16px",
          width: "100%",
          maxWidth: "720px",
          maxHeight: "90vh",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: "24px 32px",
            borderBottom: "1px solid var(--neuron-ui-border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div>
            <h2 style={{ fontSize: "24px", fontWeight: 600, color: "#12332B", marginBottom: "4px" }}>
              {isCollection ? "Record Collection" : context === "bd" ? "New Budget Request" : "Create New E-Voucher"}
            </h2>
            <p style={{ fontSize: "14px", color: "#667085" }}>
              {isCollection 
                ? "Record payment received for an invoice" 
                : "Fill in the details for approval and payment"}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              width: "32px",
              height: "32px",
              borderRadius: "8px",
              border: "none",
              backgroundColor: "transparent",
              color: "#667085",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "#F3F4F6";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "transparent";
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit} style={{ flex: 1, overflow: "auto" }}>
          <div style={{ padding: "32px" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
              
              {/* Type Selection (Hidden if context is fixed) */}
              {!invoiceData && !budgetRequestData && (
                 <div>
                    <label style={{ display: "block", fontSize: "14px", fontWeight: 500, color: "#374151", marginBottom: "6px" }}>
                      Transaction Type
                    </label>
                    <select
                      value={formData.transaction_type}
                      onChange={(e) => setFormData({ ...formData, transaction_type: e.target.value })}
                      style={{
                        width: "100%",
                        padding: "10px 12px",
                        border: "1px solid var(--neuron-ui-border)",
                        borderRadius: "8px",
                        fontSize: "14px",
                        outline: "none",
                      }}
                    >
                      <option value="expense">Expense</option>
                      <option value="collection">Collection</option>
                      <option value="budget_request">Budget Request</option>
                    </select>
                 </div>
              )}

              {/* Amount & Purpose */}
              <div>
                <h3 style={{ fontSize: "16px", fontWeight: 600, color: "#12332B", marginBottom: "16px" }}>
                  {isCollection ? "Payment Details" : "Transaction Details"}
                </h3>
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  {/* Amount */}
                  <div>
                    <label style={{ display: "block", fontSize: "14px", fontWeight: 500, color: "#374151", marginBottom: "6px" }}>
                      Amount (PHP) *
                    </label>
                    <input
                      type="number"
                      required
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                      placeholder="0.00"
                      style={{
                        width: "100%",
                        padding: "10px 12px",
                        border: "1px solid var(--neuron-ui-border)",
                        borderRadius: "8px",
                        fontSize: "14px",
                        outline: "none",
                        color: "var(--neuron-ink-primary)",
                      }}
                    />
                  </div>

                  {/* Purpose */}
                  <div>
                    <label style={{ display: "block", fontSize: "14px", fontWeight: 500, color: "#374151", marginBottom: "6px" }}>
                      Purpose *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.purpose}
                      onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                      placeholder="Brief description"
                      style={{
                        width: "100%",
                        padding: "10px 12px",
                        border: "1px solid var(--neuron-ui-border)",
                        borderRadius: "8px",
                        fontSize: "14px",
                        outline: "none",
                        color: "var(--neuron-ink-primary)",
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Vendor/Payer Information Section */}
              {!isCollection && (
              <div>
                <h3 style={{ fontSize: "16px", fontWeight: 600, color: "#12332B", marginBottom: "16px" }}>
                  Vendor/Payee Information
                </h3>
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  {/* Vendor Name */}
                  <div>
                    <label style={{ display: "block", fontSize: "14px", fontWeight: 500, color: "#374151", marginBottom: "6px" }}>
                      Vendor/Payee Name *
                    </label>
                    <input
                      type="text"
                      required={!isCollection}
                      value={formData.vendor_name}
                      onChange={(e) => setFormData({ ...formData, vendor_name: e.target.value })}
                      placeholder="Enter vendor name"
                      style={{
                        width: "100%",
                        padding: "10px 12px",
                        border: "1px solid var(--neuron-ui-border)",
                        borderRadius: "8px",
                        fontSize: "14px",
                        outline: "none",
                        color: "var(--neuron-ink-primary)",
                      }}
                    />
                  </div>
                </div>
              </div>
              )}

              {/* Linking & Payment Terms Section */}
              <div>
                <h3 style={{ fontSize: "16px", fontWeight: 600, color: "#12332B", marginBottom: "16px" }}>
                  Linking & Payment Terms
                </h3>
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  
                  {/* Project Number */}
                  <div>
                    <label style={{ display: "block", fontSize: "14px", fontWeight: 500, color: "#374151", marginBottom: "6px" }}>
                      Project/Booking Number
                    </label>
                    <input
                      type="text"
                      value={formData.project_number}
                      onChange={(e) => setFormData({ ...formData, project_number: e.target.value })}
                      placeholder="e.g., BK-2024-1234"
                      disabled={!!invoiceData}
                      style={{
                        width: "100%",
                        padding: "10px 12px",
                        border: "1px solid var(--neuron-ui-border)",
                        borderRadius: "8px",
                        fontSize: "14px",
                        outline: "none",
                        color: "var(--neuron-ink-primary)",
                        backgroundColor: invoiceData ? "#F3F4F6" : "white"
                      }}
                    />
                  </div>

                  {/* Customer Name */}
                  <div>
                    <label style={{ display: "block", fontSize: "14px", fontWeight: 500, color: "#374151", marginBottom: "6px" }}>
                      Related Customer
                    </label>
                    <input
                      type="text"
                      value={formData.customer_name}
                      onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                      placeholder="Customer name"
                      disabled={!!budgetRequestData || !!invoiceData}
                      style={{
                        width: "100%",
                        padding: "10px 12px",
                        border: "1px solid var(--neuron-ui-border)",
                        borderRadius: "8px",
                        fontSize: "14px",
                        outline: "none",
                        color: "var(--neuron-ink-primary)",
                        backgroundColor: (budgetRequestData || invoiceData) ? "#F3F4F6" : "white"
                      }}
                    />
                  </div>

                  {/* Invoice Number (If Collection) */}
                  {isCollection && (
                      <div>
                        <label style={{ display: "block", fontSize: "14px", fontWeight: 500, color: "#374151", marginBottom: "6px" }}>
                          Invoice Number
                        </label>
                        <input
                          type="text"
                          value={formData.invoice_number}
                          readOnly
                          style={{
                            width: "100%",
                            padding: "10px 12px",
                            border: "1px solid var(--neuron-ui-border)",
                            borderRadius: "8px",
                            fontSize: "14px",
                            outline: "none",
                            color: "var(--neuron-ink-primary)",
                            backgroundColor: "#F3F4F6"
                          }}
                        />
                      </div>
                  )}

                  {/* Payment Method */}
                  <div>
                    <label style={{ display: "block", fontSize: "14px", fontWeight: 500, color: "#374151", marginBottom: "6px" }}>
                      Payment Method
                    </label>
                    <select
                      value={formData.payment_method}
                      onChange={(e) => setFormData({ ...formData, payment_method: e.target.value as PaymentMethod })}
                      style={{
                        width: "100%",
                        padding: "10px 12px",
                        border: "1px solid var(--neuron-ui-border)",
                        borderRadius: "8px",
                        fontSize: "14px",
                        outline: "none",
                        color: "var(--neuron-ink-primary)",
                      }}
                    >
                      <option value="">Select payment method</option>
                      <option value="Cash">Cash</option>
                      <option value="Bank Transfer">Bank Transfer</option>
                      <option value="Check">Check</option>
                      <option value="Credit Card">Credit Card</option>
                      <option value="Online Payment">Online Payment</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Attachments Section */}
              <div>
                <h3 style={{ fontSize: "16px", fontWeight: 600, color: "#12332B", marginBottom: "16px" }}>
                  Supporting Documents
                </h3>
                <div
                  style={{
                    border: "2px dashed var(--neuron-ui-border)",
                    borderRadius: "8px",
                    padding: "24px",
                    textAlign: "center",
                    cursor: "pointer",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "#0F766E";
                    e.currentTarget.style.backgroundColor = "#F9FAFB";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "var(--neuron-ui-border)";
                    e.currentTarget.style.backgroundColor = "transparent";
                  }}
                >
                  <Upload size={32} style={{ color: "#667085", margin: "0 auto 8px" }} />
                  <p style={{ fontSize: "14px", color: "#374151", fontWeight: 500, marginBottom: "4px" }}>
                    Click to upload or drag and drop
                  </p>
                  <p style={{ fontSize: "12px", color: "#667085" }}>
                    Invoices, receipts, or supporting documents (PDF, PNG, JPG)
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div
            style={{
              padding: "20px 32px",
              borderTop: "1px solid var(--neuron-ui-border)",
              display: "flex",
              justifyContent: "flex-end",
              gap: "12px",
              backgroundColor: "#FAFAFA",
            }}
          >
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: "10px 20px",
                borderRadius: "8px",
                border: "1px solid var(--neuron-ui-border)",
                backgroundColor: "#FFFFFF",
                color: "#374151",
                fontSize: "14px",
                fontWeight: 500,
                cursor: "pointer",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "#F3F4F6";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "#FFFFFF";
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              style={{
                padding: "10px 20px",
                borderRadius: "8px",
                border: "none",
                backgroundColor: "#0F766E",
                color: "#FFFFFF",
                fontSize: "14px",
                fontWeight: 500,
                cursor: "pointer",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "#0D6560";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "#0F766E";
              }}
            >
              Submit for Approval
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}