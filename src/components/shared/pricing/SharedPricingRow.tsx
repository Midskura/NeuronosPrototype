import { useState, useEffect } from "react";
import { Check, Loader2, Trash2 } from "lucide-react";
import { UniversalPricingRow, PricingItemData } from "./UniversalPricingRow";

interface SharedPricingRowProps {
  // Config Props
  mode: "add" | "edit" | "view";
  showCost?: boolean;
  showMarkup?: boolean;
  priceEditable?: boolean;
  
  // Data Props (for Edit/View mode)
  initialData?: {
    description: string;
    quantity: number;
    currency: string;
    forex_rate: number;
    is_taxed: boolean;
    remarks: string;
    service_type: string;
    // Optional Cost/Markup fields
    base_cost?: number;
    markup_amount?: number;
    markup_percent?: number;
    price: number; // Final Unit Price
  };

  // Actions
  onSave: (data: PricingRowData) => Promise<void>;
  onCancel?: () => void;
  onDelete?: () => void;
}

export interface PricingRowData {
  description: string;
  quantity: number;
  currency: string;
  forex_rate: number;
  is_taxed: boolean;
  remarks: string;
  service_type: string;
  base_cost: number;
  markup_amount: number;
  markup_percent: number;
  price: number; // Unit Price
  total_amount: number; // Calculated Total
}

export function SharedPricingRow({
  mode,
  showCost = true,
  showMarkup = true,
  priceEditable = false,
  initialData,
  onSave,
  onCancel,
  onDelete
}: SharedPricingRowProps) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<PricingRowData>({
    description: initialData?.description || "",
    quantity: initialData?.quantity || 1,
    currency: initialData?.currency || "PHP",
    forex_rate: initialData?.forex_rate || 1,
    is_taxed: initialData?.is_taxed || false,
    remarks: initialData?.remarks || "",
    service_type: initialData?.service_type || "Forwarding",
    base_cost: initialData?.base_cost || 0,
    markup_amount: initialData?.markup_amount || 0,
    markup_percent: initialData?.markup_percent || 0,
    price: initialData?.price || 0,
    total_amount: 0
  });

  // Calculation Logic
  useEffect(() => {
    let newPrice = data.price;

    if (!priceEditable) {
      // Calculate Price from Cost + Markup
      newPrice = data.base_cost + data.markup_amount;
    }

    // Calculate Total: Price * Qty * Forex
    const newTotal = newPrice * data.quantity * data.forex_rate;

    // Only update state if values changed to avoid loop
    if (newPrice !== data.price || newTotal !== data.total_amount) {
      setData(prev => ({ ...prev, price: newPrice, total_amount: newTotal }));
    }
  }, [data.base_cost, data.markup_amount, data.quantity, data.forex_rate, priceEditable, data.price]);

  // Handlers
  const handleChange = (field: keyof PricingRowData, value: any) => {
    setData(prev => {
      const updates: any = { [field]: value };

      // Markup Logic (Sync Amount <-> Percent)
      if (field === "markup_amount" && prev.base_cost > 0) {
        updates.markup_percent = (value / prev.base_cost) * 100;
      } else if (field === "markup_percent") {
        updates.markup_amount = (prev.base_cost * value) / 100;
      } else if (field === "base_cost") {
        // If cost changes, keep markup_percent constant and update amount
        updates.markup_amount = (value * prev.markup_percent) / 100;
      }

      return { ...prev, ...updates };
    });
  };

  const handleSubmit = async () => {
    if (!data.description) return; // Simple validation
    setLoading(true);
    try {
      await onSave(data);
      // Reset if Add Mode? Usually handled by parent unmounting this component.
    } catch (error) {
      console.error("Failed to save", error);
    } finally {
      setLoading(false);
    }
  };

  // Convert to Universal Pricing Data Format
  const pricingItemData: PricingItemData = {
    id: "temp-shared-row",
    description: data.description,
    quantity: data.quantity,
    base_cost: data.base_cost,
    amount_added: data.markup_amount,
    percentage_added: data.markup_percent,
    currency: data.currency,
    forex_rate: data.forex_rate,
    is_taxed: data.is_taxed,
    final_price: data.price,
    remarks: data.remarks,
    service: data.service_type
  };

  return (
    <div style={{
      backgroundColor: "white",
      border: mode === "add" ? "1px solid #0F766E" : "1px solid #E5E9E8",
      borderRadius: "10px",
      overflow: "hidden",
      marginBottom: "12px",
      boxShadow: "none"
    }}>
      <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
        <UniversalPricingRow
          data={pricingItemData}
          mode={mode === "view" ? "view" : "edit"}
          config={{
            showCost: showCost,
            showMarkup: showMarkup,
            showTax: true,
            showForex: true,
            simpleMode: !showCost && !showMarkup, // Determine if simple mode based on hidden columns
            priceEditable: priceEditable
          }}
          handlers={{
            onFieldChange: (field, value) => {
              // Map generic fields
              const map: Record<string, keyof PricingRowData> = {
                'description': 'description',
                'quantity': 'quantity',
                'base_cost': 'base_cost',
                'currency': 'currency',
                'forex_rate': 'forex_rate',
                'is_taxed': 'is_taxed',
                'remarks': 'remarks',
                'service': 'service_type'
              };
              if (map[field]) handleChange(map[field], value);
            },
            onAmountChange: (val) => handleChange('markup_amount', val),
            onPercentageChange: (val) => handleChange('markup_percent', val),
            onPriceChange: (val) => handleChange('price', val),
            onRemove: mode === "edit" ? onDelete : undefined
          }}
          customActions={mode === "add" ? (
            <>
              <button
                onClick={onCancel}
                disabled={loading}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "6px 12px",
                  fontSize: "12px",
                  fontWeight: 500,
                  color: "#6B7280",
                  backgroundColor: "white",
                  border: "1px solid #D1D5DB",
                  borderRadius: "6px",
                  cursor: "pointer"
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "6px 12px",
                  fontSize: "12px",
                  fontWeight: 600,
                  color: "white",
                  backgroundColor: "var(--neuron-brand-green)",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                  opacity: loading ? 0.7 : 1
                }}
              >
                {loading ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                Add Item
              </button>
            </>
          ) : mode === "edit" ? (
             <button
               onClick={onDelete}
               style={{
                 padding: "4px",
                 background: "none",
                 border: "none",
                 cursor: "pointer",
                 color: "#DC2626",
                 display: "flex",
                 alignItems: "center"
               }}
             >
               <Trash2 size={16} />
             </button>
          ) : null}
        />
      </div>
    </div>
  );
}
