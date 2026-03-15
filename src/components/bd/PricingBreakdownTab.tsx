import { Receipt, Calculator } from "lucide-react";
import type { Project, QuotationChargeCategory } from "../../types/pricing";

interface PricingBreakdownTabProps {
  project: Project;
}

export function PricingBreakdownTab({ project }: PricingBreakdownTabProps) {
  const chargeCategories = project.charge_categories || [];
  const currency = project.currency || "PHP";
  const total = project.total || 0;

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
            <Receipt size={18} />
            Pricing Breakdown
          </h2>
          <p style={{ 
            fontSize: "13px", 
            color: "var(--neuron-ink-muted)",
            margin: 0
          }}>
            Pricing details from Quotation {project.quotation_number}
          </p>
        </div>

        {chargeCategories.length > 0 ? (
          <>
            {/* Charge Categories */}
            <div style={{ display: "flex", flexDirection: "column", gap: "24px", marginBottom: "24px" }}>
              {chargeCategories.map((category, idx) => (
                <ChargeCategoryCard 
                  key={idx} 
                  category={category} 
                  currency={currency} 
                />
              ))}
            </div>

            {/* Financial Summary */}
            <div style={{
              backgroundColor: "white",
              border: "1px solid var(--neuron-ui-border)",
              borderRadius: "8px",
              padding: "24px"
            }}>
              <h3 style={{
                fontSize: "16px",
                fontWeight: 600,
                color: "var(--neuron-brand-green)",
                marginBottom: "20px",
                display: "flex",
                alignItems: "center",
                gap: "8px"
              }}>
                <Calculator size={18} />
                Financial Summary
              </h3>
              <div style={{
                padding: "16px 20px",
                backgroundColor: "#F9FAFB",
                border: "1px solid var(--neuron-ui-border)",
                borderRadius: "6px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center"
              }}>
                <span style={{
                  fontSize: "16px",
                  fontWeight: 600,
                  color: "var(--neuron-ink-primary)"
                }}>
                  Grand Total
                </span>
                <span style={{
                  fontSize: "20px",
                  fontWeight: 600,
                  color: "var(--neuron-brand-green)"
                }}>
                  {currency} {total.toLocaleString()}
                </span>
              </div>
            </div>
          </>
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
              No pricing breakdown available
            </p>
            <p style={{ 
              fontSize: "13px",
              color: "#9CA3AF",
              margin: 0
            }}>
              Pricing details are inherited from the quotation
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function ChargeCategoryCard({ 
  category, 
  currency 
}: { 
  category: QuotationChargeCategory; 
  currency: string 
}) {
  return (
    <div style={{
      backgroundColor: "white",
      border: "1px solid var(--neuron-ui-border)",
      borderRadius: "8px",
      padding: "24px"
    }}>
      <h3 style={{
        fontSize: "16px",
        fontWeight: 600,
        color: "var(--neuron-brand-green)",
        marginBottom: "20px"
      }}>
        {category.category_name || category.name}
      </h3>

      {/* Table */}
      <div style={{ 
        border: "1px solid var(--neuron-ui-border)",
        borderRadius: "6px",
        overflow: "hidden"
      }}>
        <table style={{ 
          width: "100%",
          borderCollapse: "collapse"
        }}>
          <thead>
            <tr style={{ backgroundColor: "#F9FAFB" }}>
              <th style={{
                padding: "12px 16px",
                textAlign: "left",
                fontSize: "13px",
                fontWeight: 600,
                color: "var(--neuron-ink-base)",
                borderBottom: "1px solid var(--neuron-ui-border)"
              }}>
                Description
              </th>
              <th style={{
                padding: "12px 16px",
                textAlign: "right",
                fontSize: "13px",
                fontWeight: 600,
                color: "var(--neuron-ink-base)",
                borderBottom: "1px solid var(--neuron-ui-border)"
              }}>
                Qty
              </th>
              <th style={{
                padding: "12px 16px",
                textAlign: "right",
                fontSize: "13px",
                fontWeight: 600,
                color: "var(--neuron-ink-base)",
                borderBottom: "1px solid var(--neuron-ui-border)"
              }}>
                Unit Price
              </th>
              <th style={{
                padding: "12px 16px",
                textAlign: "right",
                fontSize: "13px",
                fontWeight: 600,
                color: "var(--neuron-ink-base)",
                borderBottom: "1px solid var(--neuron-ui-border)"
              }}>
                Amount
              </th>
            </tr>
          </thead>
          <tbody>
            {category.line_items?.map((item, idx) => (
              <tr key={idx}>
                <td style={{
                  padding: "12px 16px",
                  fontSize: "14px",
                  color: "var(--neuron-ink-primary)",
                  borderBottom: idx < (category.line_items?.length || 0) - 1 ? "1px solid #F3F4F6" : "none"
                }}>
                  {item.description}
                </td>
                <td style={{
                  padding: "12px 16px",
                  textAlign: "right",
                  fontSize: "14px",
                  color: "var(--neuron-ink-primary)",
                  borderBottom: idx < (category.line_items?.length || 0) - 1 ? "1px solid #F3F4F6" : "none"
                }}>
                  {item.quantity} {item.unit}
                </td>
                <td style={{
                  padding: "12px 16px",
                  textAlign: "right",
                  fontSize: "14px",
                  color: "var(--neuron-ink-primary)",
                  borderBottom: idx < (category.line_items?.length || 0) - 1 ? "1px solid #F3F4F6" : "none"
                }}>
                  {item.currency} {(item.price || 0).toLocaleString()}
                </td>
                <td style={{
                  padding: "12px 16px",
                  textAlign: "right",
                  fontSize: "14px",
                  color: "var(--neuron-ink-primary)",
                  borderBottom: idx < (category.line_items?.length || 0) - 1 ? "1px solid #F3F4F6" : "none"
                }}>
                  {currency} {(item.amount || 0).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr style={{ backgroundColor: "#F9FAFB" }}>
              <td colSpan={3} style={{
                padding: "12px 16px",
                textAlign: "right",
                fontSize: "14px",
                fontWeight: 600,
                color: "var(--neuron-ink-primary)",
                borderTop: "1px solid var(--neuron-ui-border)"
              }}>
                Subtotal:
              </td>
              <td style={{
                padding: "12px 16px",
                textAlign: "right",
                fontSize: "14px",
                fontWeight: 600,
                color: "var(--neuron-ink-primary)",
                borderTop: "1px solid var(--neuron-ui-border)"
              }}>
                {currency} {(category.subtotal || 0).toLocaleString()}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}