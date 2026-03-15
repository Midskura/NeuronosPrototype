interface PnLEntry {
  type: "Revenue" | "Expense";
  category: string;
  description: string;
  amount: number;
}

interface CompanyPnLReportProps {
  entries: PnLEntry[];
  period: string;
  generatedAt: string;
  companyName?: string;
}

export function CompanyPnLReport({ entries, period, generatedAt, companyName = "" }: CompanyPnLReportProps) {
  const revenues = entries.filter(e => e.type === "Revenue");
  const expenses = entries.filter(e => e.type === "Expense");

  const totalRevenue = revenues.reduce((sum, e) => sum + e.amount, 0);
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const grossProfit = totalRevenue - totalExpenses;
  const commissions = grossProfit * 0.13; // 3% admin + 10% staff
  const netProfit = grossProfit - commissions;

  return (
    <div className="bg-white rounded-lg border border-[#E5E7EB] overflow-hidden">
      <div style={{ fontFamily: "Arial, sans-serif", padding: "40px", backgroundColor: "#FFFFFF" }}>
        {/* Header */}
        <div className="text-center mb-6">
          {companyName && (
            <div className="uppercase mb-3" style={{ fontSize: "11px", fontWeight: "bold", color: "#000000", letterSpacing: "0.5px" }}>
              {companyName}
            </div>
          )}
          <div className="uppercase mb-2" style={{ fontSize: "14px", fontWeight: "bold", color: "#000000", letterSpacing: "1px" }}>
            PROFIT AND LOSS STATEMENT
          </div>
          <div className="uppercase" style={{ fontSize: "10px", fontWeight: "normal", color: "#000000", letterSpacing: "0.5px" }}>
            FOR THE PERIOD OF {period.toUpperCase()}
          </div>
        </div>

        {/* P&L Table */}
        <div className="max-w-4xl mx-auto">
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "10px", border: "1px solid #000" }}>
            <thead>
              <tr style={{ backgroundColor: "#0F766E", color: "#FFFFFF", height: "32px" }}>
                <th style={{ border: "1px solid #000", padding: "6px 8px", fontWeight: 600, fontSize: "9px", textAlign: "left", width: "15%", color: "#FFFFFF" }}>TYPE</th>
                <th style={{ border: "1px solid #000", padding: "6px 8px", fontWeight: 600, fontSize: "9px", textAlign: "left", width: "25%", color: "#FFFFFF" }}>CATEGORY</th>
                <th style={{ border: "1px solid #000", padding: "6px 8px", fontWeight: 600, fontSize: "9px", textAlign: "left", width: "40%", color: "#FFFFFF" }}>DESCRIPTION</th>
                <th style={{ border: "1px solid #000", padding: "6px 8px", fontWeight: 600, fontSize: "9px", textAlign: "right", width: "20%", color: "#FFFFFF" }}>AMOUNT (₱)</th>
              </tr>
            </thead>
            <tbody>
              {/* Revenue Section */}
              <tr style={{ height: "28px", backgroundColor: "#F3F4F6" }}>
                <td colSpan={4} style={{ border: "1px solid #000", padding: "6px 8px", fontSize: "10px", fontWeight: "bold", color: "#000000" }}>
                  REVENUE
                </td>
              </tr>
              {revenues.map((entry, index) => (
                <tr key={`rev-${index}`} style={{ height: "24px" }}>
                  <td style={{ border: "1px solid #000", padding: "4px 8px", fontSize: "9px", color: "#1F2937" }}>Revenue</td>
                  <td style={{ border: "1px solid #000", padding: "4px 8px", fontSize: "9px", color: "#1F2937" }}>{entry.category}</td>
                  <td style={{ border: "1px solid #000", padding: "4px 8px", fontSize: "9px", color: "#1F2937" }}>{entry.description}</td>
                  <td style={{ border: "1px solid #000", padding: "4px 8px", fontSize: "9px", textAlign: "right", color: "#1F2937" }}>
                    ₱{entry.amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              ))}
              {/* Total Revenue */}
              <tr style={{ height: "28px", backgroundColor: "#E3F2F7" }}>
                <td colSpan={3} style={{ border: "1px solid #000", padding: "6px 8px", fontSize: "10px", fontWeight: "bold", textAlign: "right", color: "#000000" }}>
                  TOTAL REVENUE
                </td>
                <td style={{ border: "1px solid #000", padding: "6px 8px", fontSize: "10px", fontWeight: "bold", textAlign: "right", color: "#000000" }}>
                  ₱{totalRevenue.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </td>
              </tr>

              {/* Expense Section */}
              <tr style={{ height: "28px", backgroundColor: "#F3F4F6" }}>
                <td colSpan={4} style={{ border: "1px solid #000", padding: "6px 8px", fontSize: "10px", fontWeight: "bold", color: "#000000" }}>
                  EXPENSES
                </td>
              </tr>
              {expenses.map((entry, index) => (
                <tr key={`exp-${index}`} style={{ height: "24px" }}>
                  <td style={{ border: "1px solid #000", padding: "4px 8px", fontSize: "9px", color: "#1F2937" }}>Expense</td>
                  <td style={{ border: "1px solid #000", padding: "4px 8px", fontSize: "9px", color: "#1F2937" }}>{entry.category}</td>
                  <td style={{ border: "1px solid #000", padding: "4px 8px", fontSize: "9px", color: "#1F2937" }}>{entry.description}</td>
                  <td style={{ border: "1px solid #000", padding: "4px 8px", fontSize: "9px", textAlign: "right", color: "#1F2937" }}>
                    ₱{entry.amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              ))}
              {/* Total Expenses */}
              <tr style={{ height: "28px", backgroundColor: "#FFE5E5" }}>
                <td colSpan={3} style={{ border: "1px solid #000", padding: "6px 8px", fontSize: "10px", fontWeight: "bold", textAlign: "right", color: "#000000" }}>
                  TOTAL EXPENSES
                </td>
                <td style={{ border: "1px solid #000", padding: "6px 8px", fontSize: "10px", fontWeight: "bold", textAlign: "right", color: "#000000" }}>
                  ₱{totalExpenses.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </td>
              </tr>

              {/* Gross Profit */}
              <tr style={{ height: "32px", backgroundColor: "#E8F5E9" }}>
                <td colSpan={3} style={{ border: "2px solid #000", padding: "8px", fontSize: "11px", fontWeight: "bold", textAlign: "right", color: "#000000" }}>
                  GROSS PROFIT
                </td>
                <td style={{ border: "2px solid #000", padding: "8px", fontSize: "11px", fontWeight: "bold", textAlign: "right", color: "#000000" }}>
                  ₱{grossProfit.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </td>
              </tr>

              {/* Commissions */}
              <tr style={{ height: "24px" }}>
                <td colSpan={3} style={{ border: "1px solid #000", padding: "4px 8px", fontSize: "9px", textAlign: "right" }}>
                  LESS: Admin & Commissions (13%)
                </td>
                <td style={{ border: "1px solid #000", padding: "4px 8px", fontSize: "9px", textAlign: "right" }}>
                  ₱{commissions.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </td>
              </tr>

              {/* Net Profit */}
              <tr style={{ height: "32px", backgroundColor: "#FFF3CD" }}>
                <td colSpan={3} style={{ border: "2px solid #000", padding: "8px", fontSize: "11px", fontWeight: "bold", textAlign: "right", color: "#000000" }}>
                  NET PROFIT
                </td>
                <td style={{ border: "2px solid #000", padding: "8px", fontSize: "11px", fontWeight: "bold", textAlign: "right", color: "#000000" }}>
                  ₱{netProfit.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Signatory Section */}
        <div className="mt-12 max-w-4xl mx-auto">
          <div className="grid grid-cols-3 gap-8" style={{ fontSize: "9px" }}>
            <div>
              <div style={{ marginBottom: "4px", fontWeight: "bold", color: "#000000" }}>Prepared By:</div>
              <div style={{ borderBottom: "1px solid #000", minHeight: "20px", marginBottom: "2px" }}>
                <span style={{ fontSize: "8px" }}>Accounting Staff</span>
              </div>
              <div style={{ fontSize: "7px", color: "#666", textAlign: "center" }}>Name / Signature</div>
            </div>
            <div>
              <div style={{ marginBottom: "4px", fontWeight: "bold", color: "#000000" }}>Reviewed By:</div>
              <div style={{ borderBottom: "1px solid #000", minHeight: "20px", marginBottom: "2px" }}></div>
              <div style={{ fontSize: "7px", color: "#666", textAlign: "center" }}>Name / Signature</div>
            </div>
            <div>
              <div style={{ marginBottom: "4px", fontWeight: "bold", color: "#000000" }}>Approved By:</div>
              <div style={{ borderBottom: "1px solid #000", minHeight: "20px", marginBottom: "2px" }}></div>
              <div style={{ fontSize: "7px", color: "#666", textAlign: "center" }}>Name / Signature</div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-right" style={{ fontSize: "8px", color: "#9CA3AF" }}>
          Generated on {generatedAt}
        </div>
      </div>
    </div>
  );
}