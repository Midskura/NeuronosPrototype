import { useState, useRef } from "react";
import { Trash2 } from "lucide-react";
import type { QuotationLineItemNew } from "../../../types/pricing";
import { ChargeItemDropdown } from "./ChargeItemDropdown";

interface UnifiedLineItemRowProps {
  item: QuotationLineItemNew;
  categoryId: string;
  categoryName: string;
  onUpdate: (categoryId: string, itemId: string, lineItem: Omit<QuotationLineItemNew, "id" | "amount">) => void;
  onDelete: (categoryId: string, lineItemId: string) => void;
}

export function UnifiedLineItemRow({ 
  item, 
  categoryId, 
  categoryName,
  onUpdate, 
  onDelete 
}: UnifiedLineItemRowProps) {
  
  const descriptionRef = useRef<HTMLInputElement>(null);
  const priceRef = useRef<HTMLInputElement>(null);
  const qtyRef = useRef<HTMLInputElement>(null);
  const forexRef = useRef<HTMLInputElement>(null);
  const remarksRef = useRef<HTMLInputElement>(null);

  const handleFieldChange = (field: keyof Omit<QuotationLineItemNew, "id" | "amount">, value: any) => {
    const updatedItem = {
      description: item.description,
      price: item.price,
      charge_currency: item.charge_currency,
      quantity: item.quantity,
      forex_rate: item.forex_rate,
      taxed: item.taxed,
      remarks: item.remarks,
      [field]: value
    };
    onUpdate(categoryId, item.id, updatedItem);
  };

  const handleKeyDown = (e: React.KeyboardEvent, nextRef?: React.RefObject<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      nextRef?.current?.focus();
      nextRef?.current?.select();
    } else if (e.key === "Tab" && !e.shiftKey) {
      // Let tab work naturally to move to next field
    }
  };

  const calculatedAmount = item.price * item.quantity * item.forex_rate;

  return (
    <tr style={{ 
      borderBottom: "1px solid #F3F4F6",
      backgroundColor: "white"
    }}>
      {/* Description */}
      <td style={{ padding: "4px", overflow: "visible" }}>
        <ChargeItemDropdown
          categoryName={categoryName}
          value={item.description}
          onChange={(value) => handleFieldChange("description", value)}
          onKeyDown={(e) => handleKeyDown(e, priceRef)}
          hasStartedEditing={false}
          inputId={`item-desc-${item.id}`}
        />
      </td>

      {/* Price */}
      <td style={{ padding: "4px" }}>
        <input
          ref={priceRef}
          type="number"
          value={item.price}
          onChange={(e) => handleFieldChange("price", parseFloat(e.target.value) || 0)}
          onKeyDown={(e) => handleKeyDown(e, qtyRef)}
          step="0.01"
          style={{
            width: "100%",
            padding: "8px 10px",
            fontSize: "13px",
            border: "1px solid #E5E7EB",
            borderRadius: "4px",
            backgroundColor: "white",
            textAlign: "right",
            outline: "none",
            fontFamily: "inherit",
            color: "var(--neuron-ink-primary)",
            MozAppearance: "textfield"
          }}
          className="no-spinners"
        />
      </td>

      {/* Currency */}
      <td style={{ padding: "4px" }}>
        <select
          value={item.charge_currency}
          onChange={(e) => handleFieldChange("charge_currency", e.target.value)}
          style={{
            width: "100%",
            padding: "8px 10px",
            fontSize: "13px",
            border: "1px solid #E5E7EB",
            borderRadius: "4px",
            backgroundColor: "white",
            cursor: "pointer",
            outline: "none",
            fontFamily: "inherit",
            color: "var(--neuron-ink-primary)"
          }}
        >
          <option value="USD">USD</option>
          <option value="PHP">PHP</option>
          <option value="EUR">EUR</option>
          <option value="CNY">CNY</option>
        </select>
      </td>

      {/* Quantity */}
      <td style={{ padding: "4px" }}>
        <input
          ref={qtyRef}
          type="number"
          value={item.quantity}
          onChange={(e) => handleFieldChange("quantity", parseFloat(e.target.value) || 1)}
          onKeyDown={(e) => handleKeyDown(e, forexRef)}
          step="1"
          min="1"
          style={{
            width: "100%",
            padding: "8px 10px",
            fontSize: "13px",
            border: "1px solid #E5E7EB",
            borderRadius: "4px",
            backgroundColor: "white",
            textAlign: "right",
            outline: "none",
            fontFamily: "inherit",
            color: "var(--neuron-ink-primary)",
            MozAppearance: "textfield"
          }}
          className="no-spinners"
        />
      </td>

      {/* Forex Rate */}
      <td style={{ padding: "4px" }}>
        <input
          ref={forexRef}
          type="number"
          value={item.forex_rate}
          onChange={(e) => handleFieldChange("forex_rate", parseFloat(e.target.value) || 1)}
          onKeyDown={(e) => handleKeyDown(e, remarksRef)}
          step="0.0001"
          style={{
            width: "100%",
            padding: "8px 10px",
            fontSize: "13px",
            border: "1px solid #E5E7EB",
            borderRadius: "4px",
            backgroundColor: "white",
            textAlign: "right",
            outline: "none",
            fontFamily: "inherit",
            color: "var(--neuron-ink-primary)",
            MozAppearance: "textfield"
          }}
          className="no-spinners"
        />
      </td>

      {/* Taxed Checkbox */}
      <td style={{ padding: "4px", textAlign: "center" }}>
        <input
          type="checkbox"
          checked={item.taxed}
          onChange={(e) => handleFieldChange("taxed", e.target.checked)}
          style={{
            width: "16px",
            height: "16px",
            cursor: "pointer",
            accentColor: "var(--neuron-brand-green)",
            backgroundColor: "white"
          }}
        />
      </td>

      {/* Remarks */}
      <td style={{ padding: "4px" }}>
        <input
          ref={remarksRef}
          type="text"
          value={item.remarks}
          onChange={(e) => handleFieldChange("remarks", e.target.value)}
          onKeyDown={(e) => handleKeyDown(e)}
          placeholder="Remarks..."
          style={{
            width: "100%",
            padding: "8px 10px",
            fontSize: "13px",
            border: "1px solid #E5E7EB",
            borderRadius: "4px",
            backgroundColor: "white",
            outline: "none",
            fontFamily: "inherit",
            color: "var(--neuron-ink-primary)"
          }}
        />
      </td>

      {/* Calculated Amount */}
      <td style={{ padding: "4px", textAlign: "right" }}>
        <div style={{
          padding: "8px 10px",
          fontSize: "13px",
          fontWeight: 500,
          color: "var(--neuron-ink-primary)"
        }}>
          {calculatedAmount.toFixed(2)}
        </div>
      </td>

      {/* Delete Button */}
      <td style={{ padding: "4px", textAlign: "center" }}>
        <button
          onClick={() => onDelete(categoryId, item.id)}
          style={{
            padding: "4px",
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "#DC2626",
            display: "flex",
            alignItems: "center",
            margin: "0 auto"
          }}
        >
          <Trash2 size={14} />
        </button>
      </td>
    </tr>
  );
}