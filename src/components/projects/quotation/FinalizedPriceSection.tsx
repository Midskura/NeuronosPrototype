import { ChevronRight, Package, DollarSign, Plus } from "lucide-react";
import { useState } from "react";
import type { SellingPriceCategory } from "../../../types/pricing";
import { CustomCheckbox } from "../../bd/CustomCheckbox";
import { CustomDropdown } from "../../bd/CustomDropdown";
import { PhilippinePeso } from "../../icons/PhilippinePeso";

interface FinalizedPriceSectionProps {
  categories: SellingPriceCategory[];
  currency: string;
}

export function FinalizedPriceSection({ 
  categories, 
  currency
}: FinalizedPriceSectionProps) {
  
  // Default all to expanded
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(categories.map(c => c.id))
  );

  const toggleCategory = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };
  
  // Calculate total from all categories
  const total = categories.reduce((sum, cat) => sum + cat.subtotal, 0);
  
  return (
    <div
      style={{
        backgroundColor: "white",
        border: "1px solid #E5E9E8",
        borderRadius: "12px",
        padding: "28px",
        marginBottom: "24px",
        boxShadow: "0 1px 3px rgba(18, 51, 43, 0.04)"
      }}
    >
      {/* Header */}
      <div style={{ 
        display: "flex", 
        alignItems: "center", 
        justifyContent: "space-between",
        marginBottom: "24px",
        paddingBottom: "20px",
        borderBottom: "2px solid #E8F5F3"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <PhilippinePeso size={18} style={{ color: "var(--neuron-brand-green)" }} />
          <h2 style={{
            fontSize: "17px",
            fontWeight: 600,
            color: "var(--neuron-brand-green)",
            margin: 0,
            letterSpacing: "-0.01em"
          }}>
            Charge Categories
          </h2>
        </div>

        {/* Action Buttons - Removed for read-only view, but keeping structure if needed */}
      </div>

      {/* Categories Display */}
      {categories.length === 0 ? (
        <div style={{
          padding: "48px 24px",
          textAlign: "center",
          backgroundColor: "#FFFFFF",
          border: "1px solid var(--neuron-ui-border)",
          borderRadius: "10px"
        }}>
          <DollarSign 
            size={48} 
            strokeWidth={1.2}
            style={{ 
              color: "var(--neuron-ink-muted)",
              margin: "0 auto 12px auto",
              display: "block",
              opacity: 0.75
            }} 
          />
          <h3 style={{ 
            color: "var(--neuron-ink-primary)",
            fontSize: "16px",
            fontWeight: 500,
            marginBottom: "4px"
          }}>
            No charges added
          </h3>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {categories.map((category) => {
            const isCategoryExpanded = expandedCategories.has(category.id);
            const itemCount = category.line_items.length;
            const itemLabel = itemCount === 1 ? "item" : "items";

            return (
              <div key={category.id} style={{
                border: "1px solid #E0E6E4",
                borderRadius: "10px",
                overflow: "hidden",
                backgroundColor: "white"
              }}>
                {/* Category Header (Inline Implementation matching CategoryHeader.tsx look) */}
                <div
                  style={{
                    backgroundColor: "#F8FBFB",
                    border: "none",
                    padding: "12px 16px",
                    cursor: "pointer",
                    transition: "all 0.2s ease"
                  }}
                  onClick={() => toggleCategory(category.id)}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "#EDF2F1";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "#F8FBFB";
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    {/* Chevron Icon */}
                    <ChevronRight
                      size={16}
                      style={{
                        color: "#6B7A76",
                        transform: isCategoryExpanded ? "rotate(90deg)" : "rotate(0deg)",
                        transition: "transform 0.2s ease",
                        flexShrink: 0
                      }}
                    />

                    {/* Package Icon */}
                    <Package size={16} style={{ color: "#6B7A76", flexShrink: 0 }} />

                    {/* Category Name */}
                    <div style={{ flex: 1, display: "flex", alignItems: "center", gap: "8px" }}>
                      <span
                        style={{
                          fontSize: "14px",
                          fontWeight: 600,
                          color: "#2C3E38",
                          letterSpacing: "0.01em"
                        }}
                      >
                        {category.category_name || category.name}
                      </span>
                      
                      {/* Item Count Badge */}
                      <span
                        style={{
                          fontSize: "11px",
                          fontWeight: 500,
                          color: "#6B7A76",
                          backgroundColor: "white",
                          padding: "2px 6px",
                          borderRadius: "4px"
                        }}
                      >
                        {itemCount} {itemLabel}
                      </span>
                    </div>

                    {/* Right Side - Subtotal instead of Actions */}
                     <div style={{
                      fontSize: "14px",
                      fontWeight: 700,
                      color: "var(--neuron-brand-green)",
                      fontFamily: "monospace"
                    }}>
                      {currency} {category.subtotal?.toFixed(2) || "0.00"}
                    </div>
                  </div>
                </div>

                {/* Line Items Table */}
                {isCategoryExpanded && (
                  <div style={{ padding: "12px", backgroundColor: "white" }}>
                    <div style={{
                      border: "1px solid #E5E9E8",
                      borderRadius: "10px",
                      overflow: "hidden",
                      backgroundColor: "white"
                    }}>
                      {/* Wrapper for horizontal scroll on mobile */}
                      <div style={{ 
                        overflowX: "auto",
                        WebkitOverflowScrolling: "touch"
                      }}>
                        {/* Table Header */}
                        <div style={{
                          display: "grid",
                          // Removed Cost, Markup P, Markup % columns
                          gridTemplateColumns: "minmax(250px, 4fr) minmax(60px, 0.8fr) minmax(70px, 0.8fr) minmax(70px, 0.8fr) 40px minmax(120px, 1.5fr)",
                          gap: "8px",
                          padding: "10px 16px",
                          backgroundColor: "#F8FBFB",
                          fontSize: "11px",
                          fontWeight: 600,
                          color: "#6B7A76",
                          letterSpacing: "0.02em",
                          borderBottom: "1px solid #EDF2F1"
                        }}>
                          <div>Item</div>
                          <div style={{ textAlign: "right" }}>Qty</div>
                          {/* Cost removed */}
                          {/* Markup P removed */}
                          {/* Markup % removed */}
                          <div style={{ textAlign: "center" }}>Curr</div>
                          <div style={{ textAlign: "right" }}>Forex</div>
                          <div style={{ textAlign: "center" }}>Tax</div>
                          <div style={{ textAlign: "right" }}>Price</div>
                        </div>

                        {/* Table Body */}
                        {category.line_items.map((item, idx) => (
                          <div key={item.id || idx}>
                            {/* Main Row - Pricing Data */}
                            <div
                              style={{
                                display: "grid",
                                // Matched header columns
                                gridTemplateColumns: "minmax(250px, 4fr) minmax(60px, 0.8fr) minmax(70px, 0.8fr) minmax(70px, 0.8fr) 40px minmax(120px, 1.5fr)",
                                gap: "8px",
                                padding: "12px 16px",
                                fontSize: "13px",
                                color: "#2C3E38",
                                backgroundColor: "white",
                                alignItems: "center"
                              }}
                            >
                              {/* Item - Disabled Input */}
                              <input
                                type="text"
                                value={item.description}
                                disabled
                                style={{
                                  width: "100%",
                                  padding: "6px 8px",
                                  fontSize: "13px",
                                  border: "1px solid #E0E6E4",
                                  borderRadius: "6px",
                                  backgroundColor: "#F9FAFB", // Slightly gray for disabled
                                  fontWeight: 500,
                                   color: "#2C3E38",
                                   overflow: "hidden",
                                   textOverflow: "ellipsis",
                                   whiteSpace: "nowrap"
                                }}
                              />
                              
                              {/* Qty */}
                              <div style={{ 
                                textAlign: "right", 
                                fontSize: "13px", 
                                color: "#6B7A76", 
                                fontWeight: 500 
                              }}>
                                {item.quantity?.toFixed(2)}
                              </div>
                              
                              {/* Cost removed */}
                              {/* Markup P removed */}
                              {/* Markup % removed */}
                              
                              {/* Currency - Disabled Dropdown (simulated with div) */}
                              <div style={{ fontSize: "12px" }}>
                                <div style={{
                                  padding: "6px 8px",
                                  border: "1px solid #E0E6E4",
                                  borderRadius: "6px",
                                  backgroundColor: "#F9FAFB",
                                  color: "#6B7A76",
                                  textAlign: "center"
                                }}>
                                  {item.currency || currency}
                                </div>
                              </div>
                              
                              {/* Forex - Disabled Input */}
                              <input
                                type="number"
                                value={item.forex_rate?.toFixed(2)}
                                disabled
                                style={{
                                  width: "100%",
                                  padding: "6px 8px",
                                  fontSize: "12px",
                                  textAlign: "right",
                                  border: "1px solid #E0E6E4",
                                  borderRadius: "6px",
                                  backgroundColor: "#F9FAFB",
                                  outline: "none"
                                }}
                              />
                              
                              {/* Tax Checkbox */}
                              <div style={{ display: "flex", justifyContent: "center" }}>
                                <div style={{ pointerEvents: "none", opacity: 0.7 }}>
                                  <CustomCheckbox
                                    checked={item.is_taxed || false}
                                    onChange={() => {}}
                                  />
                                </div>
                              </div>
                              
                              {/* Final Selling Price (Unit Price) */}
                              <div style={{ 
                                textAlign: "right", 
                                fontWeight: 700, 
                                color: "var(--neuron-brand-green)",
                                fontSize: "14px"
                              }}>
                                {item.currency} {item.final_price?.toFixed(2) || item.price?.toFixed(2)}
                              </div>
                            </div>

                            {/* Metadata Row - Remarks, Service Tag */}
                            <div style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "14px",
                              padding: "10px 16px 12px 28px",
                              backgroundColor: "#F8FBFB",
                              borderTop: "1px solid #EDF2F1",
                              fontSize: "12px",
                              color: "#6B7A76",
                              borderBottom: idx < category.line_items.length - 1 ? "1px solid #EDF2F1" : "none"
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
                                  value={item.remarks || ""}
                                  disabled
                                  placeholder=""
                                  style={{
                                    flex: 1,
                                    padding: "5px 8px",
                                    fontSize: "12px",
                                    border: "1px solid #E0E6E4",
                                    borderRadius: "6px",
                                    backgroundColor: "#FFFFFF", // Keep white or slightly gray? Original input is white.
                                    color: "#2C3E38",
                                    outline: "none"
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
                                  <div style={{
                                    padding: "5px 8px",
                                    border: "1px solid #E0E6E4",
                                    borderRadius: "6px",
                                    backgroundColor: "#FFFFFF",
                                    color: "#2C3E38",
                                    whiteSpace: "nowrap",
                                    overflow: "hidden",
                                    textOverflow: "ellipsis"
                                  }}>
                                    {item.service || item.service_tag || "General"}
                                  </div>
                                </div>
                              </div>
                              
                              {/* Remove Button removed */}
                            </div>
                          </div>
                        ))}

                        {/* Category Subtotal */}
                        <div style={{
                          display: "grid",
                          // Matched columns
                          gridTemplateColumns: "minmax(250px, 4fr) minmax(60px, 0.8fr) minmax(70px, 0.8fr) minmax(70px, 0.8fr) 40px minmax(120px, 1.5fr)",
                          gap: "8px",
                          padding: "12px 16px",
                          backgroundColor: "#E8F5F3",
                          borderTop: "2px solid var(--neuron-brand-teal)",
                          fontSize: "13px",
                          fontWeight: 600
                        }}>
                          {/* Empty cells for Item, Qty, Cur, Forex, Tax */}
                          <div></div>
                          <div></div>
                          <div></div>
                          <div></div>
                          <div style={{ textAlign: "right", color: "#6B7A76", fontSize: "12px" }}>
                            Subtotal:
                          </div>
                          <div style={{ 
                            textAlign: "right", 
                            color: "var(--neuron-brand-teal)",
                            fontWeight: 700
                          }}>
                            {currency} {category.subtotal?.toFixed(2)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {/* Grand Total */}
          <div style={{
            display: "flex",
            justifyContent: "flex-end",
            padding: "20px 24px",
            backgroundColor: "#E8F5F3",
            borderRadius: "10px",
            border: "2px solid #B8E5DD"
          }}>
            <div style={{
              display: "grid",
              gridTemplateColumns: "auto auto",
              gap: "20px",
              alignItems: "center"
            }}>
              <div style={{
                fontSize: "15px",
                fontWeight: 600,
                color: "#2C3E38",
                letterSpacing: "-0.01em"
              }}>
                Total Selling Price:
              </div>
              <div style={{
                fontSize: "22px",
                fontWeight: 700,
                color: "var(--neuron-brand-teal)",
                textAlign: "right",
                letterSpacing: "-0.02em"
              }}>
                {currency} {total.toFixed(2)}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}