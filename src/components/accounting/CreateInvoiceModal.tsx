import { useState } from "react";
import { X, Calendar, FileText } from "lucide-react";

interface CreateInvoiceModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  selectedItems: any[];
  customerName: string;
}

export function CreateInvoiceModal({ open, onClose, onSubmit, selectedItems, customerName }: CreateInvoiceModalProps) {
  const [formData, setFormData] = useState({
    invoice_date: new Date().toISOString().split('T')[0],
    due_date: "",
    notes: ""
  });

  if (!open) return null;

  const totalAmount = selectedItems.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
    onClose();
  };

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
          backgroundColor: "var(--theme-bg-surface)",
          borderRadius: "16px",
          width: "100%",
          maxWidth: "600px",
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
            borderBottom: "1px solid var(--theme-border-default)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div>
            <h2 style={{ fontSize: "20px", fontWeight: 600, color: "var(--theme-text-primary)", marginBottom: "4px" }}>
              Generate Invoice
            </h2>
            <p style={{ fontSize: "14px", color: "var(--theme-text-muted)" }}>
              Creating invoice for {selectedItems.length} items to {customerName}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-[var(--theme-bg-surface-subtle)] text-[var(--theme-text-muted)] transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit} style={{ flex: 1, overflow: "auto" }}>
          <div style={{ padding: "32px", display: "flex", flexDirection: "column", gap: "24px" }}>
            
            {/* Selected Items Summary */}
            <div className="bg-[var(--theme-bg-page)] p-4 rounded-lg border border-[var(--theme-border-default)]">
                <h3 className="text-xs font-semibold text-[var(--theme-text-muted)] uppercase tracking-wider mb-3">Selected Items</h3>
                <div className="space-y-2 max-h-[150px] overflow-y-auto pr-2">
                    {selectedItems.map((item, idx) => (
                        <div key={idx} className="flex justify-between items-start text-sm">
                            <span className="text-[var(--theme-text-secondary)] flex-1">{item.description}</span>
                            <span className="text-[var(--theme-text-primary)] font-medium">
                                {new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" }).format(item.amount)}
                            </span>
                        </div>
                    ))}
                </div>
                <div className="mt-4 pt-3 border-t border-[var(--theme-border-default)] flex justify-between items-center">
                    <span className="font-semibold text-[var(--theme-text-primary)]">Total Invoice Amount</span>
                    <span className="font-bold text-[var(--theme-action-primary-bg)] text-lg">
                        {new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" }).format(totalAmount)}
                    </span>
                </div>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-[var(--theme-text-secondary)] mb-1">Invoice Date</label>
                    <div className="relative">
                        <input
                            type="date"
                            required
                            value={formData.invoice_date}
                            onChange={(e) => setFormData({ ...formData, invoice_date: e.target.value })}
                            className="w-full px-3 py-2 border border-[var(--theme-border-default)] rounded-lg focus:outline-none focus:border-[var(--theme-action-primary-bg)] focus:ring-1 focus:ring-[#0F766E]"
                        />
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-medium text-[var(--theme-text-secondary)] mb-1">Due Date (Optional)</label>
                    <div className="relative">
                        <input
                            type="date"
                            value={formData.due_date}
                            onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                            className="w-full px-3 py-2 border border-[var(--theme-border-default)] rounded-lg focus:outline-none focus:border-[var(--theme-action-primary-bg)] focus:ring-1 focus:ring-[#0F766E]"
                            placeholder="Defaults to Net 30"
                        />
                    </div>
                </div>
            </div>

            {/* Notes */}
            <div>
                <label className="block text-sm font-medium text-[var(--theme-text-secondary)] mb-1">Notes / Terms</label>
                <textarea
                    rows={3}
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full px-3 py-2 border border-[var(--theme-border-default)] rounded-lg focus:outline-none focus:border-[var(--theme-action-primary-bg)] focus:ring-1 focus:ring-[#0F766E]"
                    placeholder="Add payment instructions or notes..."
                />
            </div>

          </div>

          {/* Footer Actions */}
          <div
            style={{
              padding: "20px 32px",
              borderTop: "1px solid var(--theme-border-default)",
              display: "flex",
              justifyContent: "flex-end",
              gap: "12px",
              backgroundColor: "#FAFAFA",
              borderBottomLeftRadius: "16px",
              borderBottomRightRadius: "16px"
            }}
          >
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-[var(--theme-border-default)] rounded-lg text-[var(--theme-text-secondary)] font-medium hover:bg-[var(--theme-bg-surface-subtle)] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-[var(--theme-action-primary-bg)] border border-transparent rounded-lg text-white font-medium hover:bg-[var(--theme-action-primary-border)] transition-colors flex items-center gap-2"
            >
              <FileText size={18} />
              Create Invoice
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
