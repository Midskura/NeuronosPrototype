interface BookingProfitEntry {
  bookingNo: string;
  client: string;
  company: string;
  revenue: number;
  expenses: number;
  adminCost: number;
  profit: number;
  profitMargin: number;
}

interface BookingProfitabilityReportProps {
  entries: BookingProfitEntry[];
  period: string;
  generatedAt: string;
  companyName?: string;
}

export function BookingProfitabilityReport({ entries, period, generatedAt, companyName }: BookingProfitabilityReportProps) {
  const totals = entries.reduce(
    (acc, entry) => ({
      revenue: acc.revenue + entry.revenue,
      expenses: acc.expenses + entry.expenses,
      adminCost: acc.adminCost + entry.adminCost,
      profit: acc.profit + entry.profit,
    }),
    { revenue: 0, expenses: 0, adminCost: 0, profit: 0 }
  );

  const avgProfitMargin = entries.length > 0 
    ? (totals.profit / totals.revenue) * 100 
    : 0;

  return (
    <div className="bg-white rounded-lg border border-[#E5E7EB] overflow-hidden">
      <div style={{ fontFamily: "Arial, sans-serif", padding: "40px", backgroundColor: "#FFFFFF" }}>
        {/* Header */}
        <div className="text-center mb-6">
          <div className="uppercase mb-3" style={{ fontSize: "11px", fontWeight: "bold", color: "#000000", letterSpacing: "0.5px" }}>
            {companyName || "JJB CRATING PACKING AND FREIGHT FORWARDING"}
          </div>
          <div className="uppercase mb-2" style={{ fontSize: "14px", fontWeight: "bold", color: "#000000", letterSpacing: "1px" }}>
            BOOKING PROFITABILITY REPORT
          </div>
          <div className="uppercase" style={{ fontSize: "10px", fontWeight: "normal", color: "#000000", letterSpacing: "0.5px" }}>
            BY JOB / BOOKING NUMBER – {period.toUpperCase()}
          </div>
        </div>

        {/* Table */}
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "10px", border: "1px solid #000" }}>
          <thead>
            <tr style={{ backgroundColor: "#0F766E", color: "#FFFFFF", height: "32px" }}>
              <th style={{ border: "1px solid #000", padding: "6px 8px", fontWeight: 600, fontSize: "9px", textAlign: "left", color: "#FFFFFF" }}>
                BOOKING / JOB NO.
              </th>
              <th style={{ border: "1px solid #000", padding: "6px 8px", fontWeight: 600, fontSize: "9px", textAlign: "left", color: "#FFFFFF" }}>
                CLIENT
              </th>
              <th style={{ border: "1px solid #000", padding: "6px 8px", fontWeight: 600, fontSize: "9px", textAlign: "left", color: "#FFFFFF" }}>
                COMPANY
              </th>
              <th style={{ border: "1px solid #000", padding: "6px 8px", fontWeight: 600, fontSize: "9px", textAlign: "right", backgroundColor: "#E3F2F7", color: "#000000" }}>
                REVENUE (₱)
              </th>
              <th style={{ border: "1px solid #000", padding: "6px 8px", fontWeight: 600, fontSize: "9px", textAlign: "right", backgroundColor: "#FFE5E5", color: "#000000" }}>
                EXPENSES (₱)
              </th>
              <th style={{ border: "1px solid #000", padding: "6px 8px", fontWeight: 600, fontSize: "9px", textAlign: "right", backgroundColor: "#FFE5E5", color: "#000000" }}>
                ADMIN COST (₱)
              </th>
              <th style={{ border: "1px solid #000", padding: "6px 8px", fontWeight: 600, fontSize: "9px", textAlign: "right", backgroundColor: "#E8F5E9", color: "#000000" }}>
                PROFIT (₱)
              </th>
              <th style={{ border: "1px solid #000", padding: "6px 8px", fontWeight: 600, fontSize: "9px", textAlign: "right", color: "#FFFFFF" }}>
                PROFIT MARGIN (%)
              </th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry, index) => (
              <tr key={index} style={{ height: "26px" }}>
                <td style={{ 
                  border: "1px solid #000", 
                  padding: "4px 8px", 
                  fontSize: "9px",
                  color: "#0F5EFE",
                  cursor: "pointer",
                }}>
                  {entry.bookingNo}
                </td>
                <td style={{ border: "1px solid #000", padding: "4px 8px", fontSize: "9px", color: "#1F2937" }}>
                  {entry.client}
                </td>
                <td style={{ border: "1px solid #000", padding: "4px 8px", fontSize: "9px", color: "#1F2937" }}>
                  {entry.company}
                </td>
                <td style={{ border: "1px solid #000", padding: "4px 8px", fontSize: "9px", textAlign: "right", backgroundColor: "#E3F2F7", color: "#1F2937" }}>
                  ₱{entry.revenue.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </td>
                <td style={{ border: "1px solid #000", padding: "4px 8px", fontSize: "9px", textAlign: "right", backgroundColor: "#FFE5E5", color: "#2A2A2A" }}>
                  ₱{entry.expenses.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </td>
                <td style={{ border: "1px solid #000", padding: "4px 8px", fontSize: "9px", textAlign: "right", backgroundColor: "#FFE5E5", color: "#2A2A2A" }}>
                  ₱{entry.adminCost.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </td>
                <td style={{ 
                  border: "1px solid #000", 
                  padding: "4px 8px", 
                  fontSize: "9px", 
                  textAlign: "right",
                  backgroundColor: entry.profit >= 0 ? "#E8F5E9" : "#FFE5E5",
                  color: entry.profit >= 0 ? "#1F2937" : "#2A2A2A",
                  fontWeight: "bold"
                }}>
                  ₱{entry.profit.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </td>
                <td style={{ border: "1px solid #000", padding: "4px 8px", fontSize: "9px", textAlign: "right", color: "#1F2937" }}>
                  {entry.profitMargin.toFixed(2)}%
                </td>
              </tr>
            ))}
            
            {/* TOTAL ROW */}
            <tr style={{ height: "32px", backgroundColor: "#F3F4F6" }}>
              <td colSpan={3} style={{ border: "2px solid #000", padding: "6px 8px", fontSize: "10px", fontWeight: "bold", textAlign: "right", color: "#000000" }}>
                TOTAL BOOKINGS: {entries.length}
              </td>
              <td style={{ border: "2px solid #000", padding: "6px 8px", fontSize: "10px", fontWeight: "bold", textAlign: "right", backgroundColor: "#E3F2F7", color: "#000000" }}>
                ₱{totals.revenue.toLocaleString("en-US", { minimumFractionDigits: 2 })}
              </td>
              <td style={{ border: "2px solid #000", padding: "6px 8px", fontSize: "10px", fontWeight: "bold", textAlign: "right", backgroundColor: "#FFE5E5", color: "#000000" }}>
                ₱{totals.expenses.toLocaleString("en-US", { minimumFractionDigits: 2 })}
              </td>
              <td style={{ border: "2px solid #000", padding: "6px 8px", fontSize: "10px", fontWeight: "bold", textAlign: "right", backgroundColor: "#FFE5E5", color: "#000000" }}>
                ₱{totals.adminCost.toLocaleString("en-US", { minimumFractionDigits: 2 })}
              </td>
              <td style={{ border: "2px solid #000", padding: "6px 8px", fontSize: "10px", fontWeight: "bold", textAlign: "right", backgroundColor: "#E8F5E9", color: "#000000" }}>
                ₱{totals.profit.toLocaleString("en-US", { minimumFractionDigits: 2 })}
              </td>
              <td style={{ border: "2px solid #000", padding: "6px 8px", fontSize: "10px", fontWeight: "bold", textAlign: "right", color: "#000000" }}>
                {avgProfitMargin.toFixed(2)}%
              </td>
            </tr>
          </tbody>
        </table>

        {/* Footer */}
        <div className="mt-8 text-right" style={{ fontSize: "8px", color: "#9CA3AF" }}>
          Generated on {generatedAt}
        </div>
      </div>
    </div>
  );
}