interface ExpenseCategoryEntry {
  category: string;
  company: string;
  totalAmount: number;
  percentOfTotal: number;
}

interface ExpenseBreakdownReportProps {
  entries: ExpenseCategoryEntry[];
  period: string;
  generatedAt: string;
  companyName?: string;
}

export function ExpenseBreakdownReport({ entries, period, generatedAt, companyName = "" }: ExpenseBreakdownReportProps) {
  const totalExpenses = entries.reduce((sum, e) => sum + e.totalAmount, 0);

  return (
    <div className="bg-white rounded-lg border border-[#E5E7EB] overflow-hidden">
      <div style={{ fontFamily: "Arial, sans-serif", padding: "40px", backgroundColor: "#FFFFFF" }}>
        {/* Header */}
        <div className="text-center mb-6">
          <div className="uppercase mb-3" style={{ fontSize: "11px", fontWeight: "bold", color: "#0A1D4D", letterSpacing: "0.5px" }}>
            {companyName || "JJB CRATING PACKING AND FREIGHT FORWARDING"}
          </div>
          <div className="uppercase mb-2" style={{ fontSize: "14px", fontWeight: "bold", color: "#0A1D4D", letterSpacing: "1px" }}>
            EXPENSE CATEGORY SUMMARY
          </div>
          <div className="uppercase" style={{ fontSize: "10px", fontWeight: "normal", color: "#6B7280", letterSpacing: "0.5px" }}>
            {period.toUpperCase()}
          </div>
        </div>

        {/* Table */}
        <div className="max-w-3xl mx-auto">
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "10px", border: "1px solid #000" }}>
            <thead>
              <tr style={{ backgroundColor: "#4472C4", color: "#FFFFFF", height: "32px" }}>
                <th style={{ border: "1px solid #000", padding: "6px 8px", fontWeight: "bold", fontSize: "9px", textAlign: "left", width: "35%" }}>
                  CATEGORY
                </th>
                <th style={{ border: "1px solid #000", padding: "6px 8px", fontWeight: "bold", fontSize: "9px", textAlign: "left", width: "20%" }}>
                  COMPANY
                </th>
                <th style={{ border: "1px solid #000", padding: "6px 8px", fontWeight: "bold", fontSize: "9px", textAlign: "right", width: "25%" }}>
                  TOTAL AMOUNT (₱)
                </th>
                <th style={{ border: "1px solid #000", padding: "6px 8px", fontWeight: "bold", fontSize: "9px", textAlign: "right", width: "20%" }}>
                  % OF TOTAL EXPENSES
                </th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry, index) => {
                // Color gradient based on percentage
                const bgColor = entry.percentOfTotal > 20 
                  ? "#FCE5E5" 
                  : entry.percentOfTotal > 10 
                  ? "#FFF3E0" 
                  : "#FFFFFF";

                return (
                  <tr key={index} style={{ height: "26px", backgroundColor: bgColor }}>
                    <td style={{ border: "1px solid #000", padding: "4px 8px", fontSize: "9px" }}>
                      {entry.category}
                    </td>
                    <td style={{ border: "1px solid #000", padding: "4px 8px", fontSize: "9px" }}>
                      {entry.company}
                    </td>
                    <td style={{ border: "1px solid #000", padding: "4px 8px", fontSize: "9px", textAlign: "right" }}>
                      ₱{entry.totalAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </td>
                    <td style={{ border: "1px solid #000", padding: "4px 8px", fontSize: "9px", textAlign: "right", fontWeight: "bold" }}>
                      {entry.percentOfTotal.toFixed(2)}%
                    </td>
                  </tr>
                );
              })}
              
              {/* TOTAL ROW */}
              <tr style={{ height: "32px", backgroundColor: "#F3F4F6" }}>
                <td colSpan={2} style={{ border: "2px solid #000", padding: "6px 8px", fontSize: "11px", fontWeight: "bold", textAlign: "right" }}>
                  TOTAL
                </td>
                <td style={{ border: "2px solid #000", padding: "6px 8px", fontSize: "11px", fontWeight: "bold", textAlign: "right" }}>
                  ₱{totalExpenses.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </td>
                <td style={{ border: "2px solid #000", padding: "6px 8px", fontSize: "11px", fontWeight: "bold", textAlign: "right" }}>
                  100.00%
                </td>
              </tr>
            </tbody>
          </table>

          {/* Legend */}
          <div className="mt-6" style={{ fontSize: "8px" }}>
            <div style={{ fontWeight: "bold", marginBottom: "6px", fontSize: "9px" }}>COLOR LEGEND:</div>
            <div className="flex gap-4">
              <div className="flex items-center gap-2">
                <div style={{ width: "20px", height: "12px", backgroundColor: "#FCE5E5", border: "1px solid #999" }}></div>
                <span>High Cost (&gt; 20%)</span>
              </div>
              <div className="flex items-center gap-2">
                <div style={{ width: "20px", height: "12px", backgroundColor: "#FFF3E0", border: "1px solid #999" }}></div>
                <span>Medium Cost (10-20%)</span>
              </div>
              <div className="flex items-center gap-2">
                <div style={{ width: "20px", height: "12px", backgroundColor: "#FFFFFF", border: "1px solid #999" }}></div>
                <span>Low Cost (&lt; 10%)</span>
              </div>
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
