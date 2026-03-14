import { Trash2 } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { CustomCheckbox } from "../../bd/CustomCheckbox";
import { CustomDropdown } from "../../bd/CustomDropdown";
import { FormattedNumberInput } from "./FormattedNumberInput";
import { CatalogItemCombobox } from "./CatalogItemCombobox";

export interface PricingItemData {
  id: string;
  description: string;
  quantity: number;
  base_cost: number;
  amount_added: number;
  percentage_added: number;
  currency: string;
  forex_rate: number;
  is_taxed: boolean;
  final_price: number;
  amount?: number; // Calculated PHP Total
  remarks?: string;
  service?: string;
  service_tag?: string; // For compatibility
  status?: string; // For Billing (unbilled/billed/paid)
  created_at?: string; // For Billing
  catalog_item_id?: string; // Catalog linkage (Item Master reference)
}

export interface UniversalPricingRowProps {
  data: PricingItemData;
  mode?: "edit" | "view";
  config?: {
    showCost?: boolean;
    showMarkup?: boolean;
    showTax?: boolean;
    showForex?: boolean;
    simpleMode?: boolean; // For Billing (hides extra columns)
    priceEditable?: boolean; // Allow direct editing of final price
    showPHPConversion?: boolean; // ✨ NEW: Force display of PHP converted amount (for Selling Price)
  };
  handlers?: {
    onFieldChange: (field: string, value: any) => void;
    onAmountChange?: (value: number) => void;
    onPercentageChange?: (value: number) => void;
    onPriceChange?: (value: number) => void; // Direct price edit
    onRemove?: () => void;
  };
  customActions?: React.ReactNode;
  serviceType?: string; // For CatalogItemCombobox service-type-aware sorting
  itemType?: "expense" | "charge" | "both"; // For CatalogItemCombobox auto-type on create
}

export function UniversalPricingRow({
  data,
  mode = "view",
  config = {
    showCost: true,
    showMarkup: true,
    showTax: true,
    showForex: true,
    simpleMode: false,
    priceEditable: false
  },
  handlers,
  customActions,
  serviceType,
  itemType
}: UniversalPricingRowProps) {
  const { simpleMode, showCost, showMarkup, showTax, showForex, priceEditable, showPHPConversion } = config;
  const isViewMode = mode === "view";

  // Effective Visibility Logic (Matches PricingTableHeader)
  const showC = !simpleMode && showCost;
  const showM = !simpleMode && showMarkup;
  const showF = showForex; // Always respect flag
  const showT = showTax;   // Always respect flag

  // Define Grid Columns based on visibility
  const getGridTemplate = () => {
    const parts = [
      "minmax(140px, 3fr)", // Item
      "minmax(50px, 0.8fr)" // Qty
    ];

    if (showC) parts.push("minmax(80px, 1.2fr)"); // Cost
    if (showM) {
      parts.push("minmax(70px, 1fr)"); // Markup $
      parts.push("minmax(65px, 1fr)"); // Markup %
    }

    parts.push("minmax(58px, 0.7fr)"); // Curr

    if (showF) parts.push("minmax(55px, 0.8fr)"); // Forex
    if (showT) parts.push("40px"); // Tax

    parts.push("minmax(90px, 1.5fr)"); // Price

    return parts.join(" ");
  };

  const handleFieldChange = (field: string, value: any) => {
    if (handlers?.onFieldChange) {
      handlers.onFieldChange(field, value);
    }
  };

  return (
    <div>
      {/* Main Row - Pricing Data */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: getGridTemplate(),
          gap: "8px",
          padding: "12px 16px",
          fontSize: "13px",
          color: "#2C3E38",
          backgroundColor: "white",
          alignItems: "center"
        }}
      >
        {/* Item — CatalogItemCombobox in edit mode, plain text in view mode */}
        <div style={{ display: "flex", flexDirection: "column" }}>
          {isViewMode ? (
            <div
              title={data.description}
              style={{
                width: "100%",
                padding: "6px 8px",
                fontSize: "13px",
                border: "1px solid #E0E6E4",
                borderRadius: "6px",
                backgroundColor: "#F9FAFB",
                fontWeight: 500,
                color: "#2C3E38",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                cursor: "default",
              }}
            >
              {data.description || "\u00A0"}
            </div>
          ) : (
            <CatalogItemCombobox
              value={data.description}
              catalogItemId={data.catalog_item_id}
              serviceType={serviceType}
              itemType={itemType}
              onChange={(description, catalogItemId, defaults) => {
                handleFieldChange('description', description);
                if (catalogItemId !== undefined) {
                  handleFieldChange('catalog_item_id', catalogItemId);
                }
                // Apply defaults from catalog when selecting an item
                if (defaults) {
                  if (defaults.currency) handleFieldChange('currency', defaults.currency);
                  if (defaults.is_taxable !== undefined) handleFieldChange('is_taxed', defaults.is_taxable);
                }
              }}
              placeholder="Item description"
            />
          )}
          {/* Date Subtitle for Billing Mode */}
          {simpleMode && data.created_at && (
             <span style={{ fontSize: "11px", color: "#9CA3AF", marginTop: "4px", paddingLeft: "4px" }}>
               {new Date(data.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
             </span>
          )}
        </div>
        
        {/* Qty */}
        {isViewMode ? (
          <div style={{ 
            textAlign: "right", 
            fontSize: "13px", 
            color: "#6B7A76",
            fontWeight: 500
          }}>
            {data.quantity.toFixed(2)}
          </div>
        ) : (
          <input
            type="text"
            inputMode="decimal"
            value={data.quantity}
            onChange={(e) => {
              const val = e.target.value;
              if (val === '' || /^\d*\.?\d*$/.test(val)) {
                handleFieldChange('quantity', val === '' ? 0 : parseFloat(val) || 0);
              }
            }}
            style={{
              width: "100%",
              padding: "6px 8px",
              fontSize: "13px",
              textAlign: "right",
              border: "1px solid #E0E6E4",
              borderRadius: "6px",
              backgroundColor: "white",
              color: "#2C3E38",
              fontWeight: 500,
              outline: "none",
              transition: "all 0.15s ease",
              MozAppearance: "textfield",
              WebkitAppearance: "none"
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = "var(--neuron-brand-teal)";
              e.currentTarget.style.boxShadow = "0 0 0 3px rgba(15, 118, 110, 0.08)";
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = "#E0E6E4";
              e.currentTarget.style.boxShadow = "none";
            }}
          />
        )}
        
        {/* Cost (Base Cost) */}
        {showC && (
          isViewMode ? (
            <div style={{ 
              textAlign: "right", 
              fontSize: "13px", 
              color: "#6B7A76",
              fontWeight: 500
            }}>
              {data.currency} {data.base_cost.toFixed(2)}
            </div>
          ) : (
            <input
              type="text"
              inputMode="decimal"
              value={data.base_cost}
              onChange={(e) => {
                const val = e.target.value;
                if (val === '' || /^\d*\.?\d*$/.test(val)) {
                  handleFieldChange('base_cost', val === '' ? 0 : parseFloat(val) || 0);
                }
              }}
              style={{
                width: "100%",
                padding: "6px 8px",
                fontSize: "13px",
                textAlign: "right",
                border: "1px solid #E0E6E4",
                borderRadius: "6px",
                backgroundColor: "white",
                color: "#2C3E38",
                fontWeight: 500,
                outline: "none",
                transition: "all 0.15s ease",
                MozAppearance: "textfield",
                WebkitAppearance: "none"
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = "var(--neuron-brand-teal)";
                e.currentTarget.style.boxShadow = "0 0 0 3px rgba(15, 118, 110, 0.08)";
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = "#E0E6E4";
                e.currentTarget.style.boxShadow = "none";
              }}
            />
          )
        )}
        
        {/* Markup Amount Input */}
        {showM && (
          <input
            type="text"
            inputMode="decimal"
            value={isViewMode ? data.amount_added.toFixed(2) : data.amount_added}
            onChange={(e) => {
              const val = e.target.value;
              if (val === '' || /^-?\d*\.?\d*$/.test(val)) {
                handlers?.onAmountChange && handlers.onAmountChange(val === '' ? 0 : parseFloat(val) || 0);
              }
            }}
            disabled={isViewMode}
            style={{
              width: "100%",
              padding: "6px 8px",
              fontSize: "13px",
              textAlign: "right",
              border: isViewMode ? "1px solid #E0E6E4" : "1px solid #FBBF88",
              borderRadius: "6px",
              backgroundColor: isViewMode ? "#F9FAFB" : "#FFFBF5",
              color: isViewMode ? "#6B7A76" : "var(--neuron-brand-teal)",
              fontWeight: 600,
              outline: "none",
              transition: "all 0.15s ease",
              cursor: isViewMode ? "default" : "text"
            }}
            onFocus={(e) => {
              if (isViewMode) return;
              e.currentTarget.style.borderColor = "#F59E0B";
              e.currentTarget.style.boxShadow = "0 0 0 3px rgba(245, 158, 11, 0.1)";
            }}
            onBlur={(e) => {
              if (isViewMode) return;
              e.currentTarget.style.borderColor = "#FBBF88";
              e.currentTarget.style.boxShadow = "none";
            }}
          />
        )}
        
        {/* Markup Percentage Input */}
        {showM && (
          <input
            type="text"
            inputMode="decimal"
            value={isViewMode ? data.percentage_added.toFixed(1) : data.percentage_added}
            onChange={(e) => {
              const val = e.target.value;
              if (val === '' || /^-?\d*\.?\d*$/.test(val)) {
                handlers?.onPercentageChange && handlers.onPercentageChange(val === '' ? 0 : parseFloat(val) || 0);
              }
            }}
            disabled={isViewMode}
            style={{
              width: "100%",
              padding: "6px 8px",
              fontSize: "13px",
              textAlign: "right",
              border: isViewMode ? "1px solid #E0E6E4" : "1px solid #FBBF88",
              borderRadius: "6px",
              backgroundColor: isViewMode ? "#F9FAFB" : "#FFFBF5",
              color: isViewMode ? "#6B7A76" : "var(--neuron-brand-teal)",
              fontWeight: 600,
              outline: "none",
              transition: "all 0.15s ease",
              cursor: isViewMode ? "default" : "text"
            }}
            onFocus={(e) => {
              if (isViewMode) return;
              e.currentTarget.style.borderColor = "#F59E0B";
              e.currentTarget.style.boxShadow = "0 0 0 3px rgba(245, 158, 11, 0.1)";
            }}
            onBlur={(e) => {
              if (isViewMode) return;
              e.currentTarget.style.borderColor = "#FBBF88";
              e.currentTarget.style.boxShadow = "none";
            }}
          />
        )}
        
        {/* Currency */}
        <div style={{ fontSize: "12px", textAlign: "center" }}>
          {isViewMode && simpleMode ? (
             // Simple text for Billing View Mode
             <span style={{ fontWeight: 600, color: "#6B7A76" }}>{data.currency}</span>
          ) : (
            <CustomDropdown
              value={data.currency || "USD"}
              onChange={(value) => handleFieldChange('currency', value)}
              options={[
                { value: "USD", label: "USD" },
                { value: "PHP", label: "PHP" },
                { value: "EUR", label: "EUR" },
                { value: "CNY", label: "CNY" }
              ]}
              placeholder="USD"
              size="sm"
              disabled={isViewMode}
            />
          )}
        </div>
        
        {/* Forex */}
        {showF && (
          <FormattedNumberInput
            value={data.forex_rate}
            onChange={(val) => handleFieldChange('forex_rate', val)}
            decimals={2}
            disabled={isViewMode}
            style={{
              width: "100%",
              padding: "6px 8px",
              fontSize: "12px",
              textAlign: "right",
              border: "1px solid #E0E6E4",
              borderRadius: "6px",
              backgroundColor: isViewMode ? "#F9FAFB" : "#F8FBFB",
              outline: "none",
              cursor: isViewMode ? "default" : "text"
            }}
          />
        )}
        
        {/* Tax Checkbox */}
        {showT && (
          <div style={{ display: "flex", justifyContent: "center" }}>
            <CustomCheckbox
              checked={data.is_taxed}
              onChange={(checked) => handleFieldChange('is_taxed', checked)}
              disabled={isViewMode}
            />
          </div>
        )}
        
        {/* Final Selling Price */}
        <div style={{ 
          textAlign: "right", 
          fontWeight: 700, 
          color: "var(--neuron-brand-green)",
          fontSize: "14px",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-end",
          justifyContent: "center"
        }}>
          {priceEditable && !isViewMode ? (
             <input
             type="number"
             value={data.final_price}
             onChange={(e) => handlers?.onPriceChange && handlers.onPriceChange(parseFloat(e.target.value) || 0)}
             step="0.01"
             placeholder="Price"
             style={{
               width: "100%",
               padding: "6px 8px",
               fontSize: "14px",
               textAlign: "right",
               border: "1px solid #E0E6E4",
               borderRadius: "6px",
               color: "var(--neuron-brand-green)",
               fontWeight: 700,
               outline: "none"
             }}
           />
          ) : simpleMode && isViewMode ? (
            // Just the amount for billing view
            <span>{new Intl.NumberFormat('en-PH', { style: 'currency', currency: data.currency }).format(data.amount_added > 0 ? data.final_price : (data.final_price || 0))}</span>
          ) : showPHPConversion ? (
            // ✨ PHP-First Mode (Selling Price): Show PHP Total primarily, Original Currency secondary
            <>
              {/* Primary: PHP Total */}
              <span>
                ₱ {((data.amount !== undefined ? data.amount : (data.final_price * data.quantity * data.forex_rate)) || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              
              {/* Secondary: Original Currency (if not PHP/Forex 1) */}
              {(data.currency !== 'PHP' && data.forex_rate !== 1) && (
                <span style={{ 
                  fontSize: "11px", 
                  color: "#6B7A76", 
                  fontWeight: 500,
                  marginTop: "2px"
                }}>
                  ({data.currency} {(data.final_price * data.quantity).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })})
                </span>
              )}
            </>
          ) : (
            // Standard Mode (Buying Price): Show Unit Price in Original Currency
            <span>{data.currency} {data.final_price.toFixed(2)}</span>
          )}
        </div>
      </div>

      {/* Metadata Row - Remarks, Service Tag, Remove */}
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: "14px",
        padding: "10px 16px 12px 28px",
        backgroundColor: "#F8FBFB",
        borderTop: "1px solid #EDF2F1",
        fontSize: "12px",
        color: "#6B7A76",
        borderBottom: "1px solid #EDF2F1" // Always border bottom for safety
      }}>
        {/* Remarks */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px", flex: "1 1 300px" }}>
          <label style={{ 
            fontWeight: 500, 
            whiteSpace: "nowrap",
            color: "#6B7A76",
            fontSize: "12px"
          }}>
            Remarks:
          </label>
          <input
            type="text"
            value={data.remarks || ""}
            onChange={(e) => handleFieldChange('remarks', e.target.value)}
            placeholder="Add optional notes..."
            disabled={isViewMode}
            style={{
              flex: 1,
              padding: "5px 8px",
              fontSize: "12px",
              border: "1px solid #E0E6E4",
              borderRadius: "6px",
              backgroundColor: isViewMode ? "#F9FAFB" : "white",
              color: "#2C3E38",
              outline: "none",
              transition: "all 0.15s ease",
              cursor: isViewMode ? "default" : "text"
            }}
            onFocus={(e) => {
              if (isViewMode) return;
              e.currentTarget.style.borderColor = "#0F766E";
              e.currentTarget.style.boxShadow = "0 0 0 3px rgba(15, 118, 110, 0.06)";
            }}
            onBlur={(e) => {
              if (isViewMode) return;
              e.currentTarget.style.borderColor = "#E0E6E4";
              e.currentTarget.style.boxShadow = "none";
            }}
          />
        </div>

        {/* Service Tag */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px", flex: "0 1 200px" }}>
          <label style={{ 
            fontWeight: 500, 
            whiteSpace: "nowrap",
            color: "#6B7A76",
            fontSize: "12px"
          }}>
            Service:
          </label>
          <div style={{ flex: 1, fontSize: "12px" }}>
            <CustomDropdown
              value={data.service || data.service_tag || ""}
              onChange={(value) => handleFieldChange('service', value)}
              options={[
                { value: "", label: "General" },
                { value: "Forwarding", label: "Forwarding" },
                { value: "Brokerage", label: "Brokerage" },
                { value: "Trucking", label: "Trucking" },
                { value: "Marine Insurance", label: "Marine Insurance" },
                { value: "Others", label: "Others" }
              ]}
              placeholder="General"
              size="sm"
              disabled={isViewMode}
            />
          </div>
        </div>

        {/* Action Area: Status Badge (View Mode) OR Remove Button (Edit Mode) */}
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "8px" }}>
          {/* Status Badge (Only show in view mode if in billing simple mode, OR if editing but user wants to see status)
              Actually, per request "remove button... copy exact design".
              In Selling Price design, there is NO status badge, just Remove button.
              So in Edit Mode (!isViewMode), we prioritize Remove Button.
              In View Mode, we show Status Badge.
          */}
          
          {simpleMode && data.status && isViewMode && (
             <span className={`inline-flex px-2 py-0.5 rounded text-[11px] font-medium border
               ${data.status === 'paid' ? "bg-[#ECFDF5] text-[#059669] border-[#A7F3D0]" : 
                 (data.status === 'billed' || data.status === 'invoiced') ? "bg-[#EFF6FF] text-[#1D4ED8] border-[#BFDBFE]" : 
                 "bg-[#F3F4F6] text-[#6B7280] border-[#E5E7EB]"}`}>
               {data.status === 'paid' ? "Paid" : (data.status === 'billed' || data.status === 'invoiced') ? "Invoiced" : "Unbilled"}
             </span>
          )}

          {/* Custom Actions (Save/Cancel buttons) */}
          {customActions && customActions}

          {/* Remove Button - Hidden in viewMode */}
          {!isViewMode && handlers?.onRemove && !customActions && (
          <button
            onClick={handlers.onRemove}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "5px",
              padding: "5px 10px",
              fontSize: "12px",
              border: "1px solid #FCD4D1",
              borderRadius: "6px",
              backgroundColor: "white",
              color: "#DC2626",
              cursor: "pointer",
              fontWeight: 500,
              transition: "all 0.2s ease"
            }}
            title="Remove Item"
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "#FEF2F2";
              e.currentTarget.style.borderColor = "#DC2626";
              e.currentTarget.style.transform = "translateY(-1px)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "white";
              e.currentTarget.style.borderColor = "#FCD4D1";
              e.currentTarget.style.transform = "translateY(0)";
            }}
          >
            <Trash2 size={13} />
            <span>Remove</span>
          </button>
          )}
        </div>
      </div>
    </div>
  );
}