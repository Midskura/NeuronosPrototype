interface ClientProfitEntry {
  clientName: string;
  company: string;
  numBookings: number;
  totalRevenue: number;
  totalExpenses: number;
  profit: number;
  profitMargin: number;
  avgRevenuePerBooking: number;
}

interface ClientProfitabilityReportProps {
  entries: ClientProfitEntry[];
  period: string;
  generatedAt: string;
  companyName?: string;
}

export function ClientProfitabilityReport({ entries, period, generatedAt, companyName = "" }: ClientProfitabilityReportProps) {
  const totals = entries.reduce(
    (acc, entry) => ({
      numBookings: acc.numBookings + entry.numBookings,
      totalRevenue: acc.totalRevenue + entry.totalRevenue,
      totalExpenses: acc.totalExpenses + entry.totalExpenses,
      profit: acc.profit + entry.profit,
    }),
    { numBookings: 0, totalRevenue: 0, totalExpenses: 0, profit: 0 }
  );

  const avgProfitMargin = totals.totalRevenue > 0 ? (totals.profit / totals.totalRevenue) * 100 : 0;
  const avgRevenuePerBooking = totals.numBookings > 0 ? totals.totalRevenue / totals.numBookings : 0;

  return (
    <div className="bg-white rounded-lg border border-[#E5E7EB] overflow-hidden">
      <div style={{ fontFamily: "Arial, sans-serif", padding: "40px", backgroundColor: "#FFFFFF" }}>
        {/* Header */}
        <div className="text-center mb-6">
          <div className="uppercase mb-3" style={{ fontSize: "11px", fontWeight: "bold", color: "#000000", letterSpacing: "0.5px" }}>
            {companyName || "JJB CRATING PACKING AND FREIGHT FORWARDING"}
          </div>
          <div className="uppercase mb-2" style={{ fontSize: "14px", fontWeight: "bold", color: "#000000", letterSpacing: "1px" }}>
            CLIENT PROFITABILITY REPORT
          </div>
          <div className="uppercase" style={{ fontSize: "10px", fontWeight: "normal", color: "#000000", letterSpacing: "0.5px" }}>
            BY CUSTOMER – {period.toUpperCase()}
          </div>
        </div>

        {/* Table */}
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "10px", border: "1px solid #000" }}>
          <thead>
            <tr style={{ backgroundColor: "#0F766E", color: "#FFFFFF", height: "32px" }}>
              <th style={{ border: "1px solid #000", padding: "6px 8px", fontWeight: "bold", fontSize: "9px", textAlign: "left", color: "#FFFFFF" }}>
                CLIENT NAME
              </th>
              <th style={{ border: "1px solid #000", padding: "6px 8px", fontWeight: "bold", fontSize: "9px", textAlign: "left", color: "#FFFFFF" }}>
                COMPANY
              </th>
              <th style={{ border: "1px solid #000", padding: "6px 8px", fontWeight: "bold", fontSize: "9px", textAlign: "center", color: "#FFFFFF" }}>
                NO. OF BOOKINGS
              </th>
              <th style={{ border: "1px solid #000", padding: "6px 8px", fontWeight: "bold", fontSize: "9px", textAlign: "right", backgroundColor: "#DAEEF3", color: "#000000" }}>
                TOTAL REVENUE (₱)
              </th>
              <th style={{ border: "1px solid #000", padding: "6px 8px", fontWeight: "bold", fontSize: "9px", textAlign: "right", backgroundColor: "#FCE5E5", color: "#000000" }}>
                TOTAL EXPENSES (₱)
              </th>
              <th style={{ border: "1px solid #000", padding: "6px 8px", fontWeight: "bold", fontSize: "9px", textAlign: "right", backgroundColor: "#D4EDDA", color: "#000000" }}>
                PROFIT (₱)
              </th>
              <th style={{ border: "1px solid #000", padding: "6px 8px", fontWeight: "bold", fontSize: "9px", textAlign: "right", color: "#FFFFFF" }}>
                PROFIT MARGIN (%)
              </th>
              <th style={{ border: "1px solid #000", padding: "6px 8px", fontWeight: "bold", fontSize: "9px", textAlign: "right", color: "#FFFFFF" }}>
                AVG REVENUE PER BOOKING (₱)
              </th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry, index) => (
              <tr key={index} style={{ height: "26px" }}>
                <td style={{ border: "1px solid #000", padding: "4px 8px", fontSize: "9px" }}>
                  {entry.clientName}
                </td>
                <td style={{ border: "1px solid #000", padding: "4px 8px", fontSize: "9px" }}>
                  {entry.company}
                </td>
                <td style={{ border: "1px solid #000", padding: "4px 8px", fontSize: "9px", textAlign: "center" }}>
                  {entry.numBookings}
                </td>
                <td style={{ border: "1px solid #000", padding: "4px 8px", fontSize: "9px", textAlign: "right", backgroundColor: "#DAEEF3" }}>
                  ₱{entry.totalRevenue.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </td>
                <td style={{ border: "1px solid #000", padding: "4px 8px", fontSize: "9px", textAlign: "right", backgroundColor: "#FCE5E5" }}>
                  ₱{entry.totalExpenses.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </td>
                <td style={{ 
                  border: "1px solid #000", 
                  padding: "4px 8px", 
                  fontSize: "9px", 
                  textAlign: "right",
                  backgroundColor: entry.profit >= 0 ? "#D4EDDA" : "#FCE5E5",
                  fontWeight: "bold"
                }}>
                  ₱{entry.profit.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </td>
                <td style={{ border: "1px solid #000", padding: "4px 8px", fontSize: "9px", textAlign: "right" }}>
                  {entry.profitMargin.toFixed(2)}%
                </td>
                <td style={{ border: "1px solid #000", padding: "4px 8px", fontSize: "9px", textAlign: "right" }}>
                  ₱{entry.avgRevenuePerBooking.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </td>
              </tr>
            ))}
            
            {/* TOTAL ROW */}
            <tr style={{ height: "32px", backgroundColor: "#F3F4F6" }}>
              <td colSpan={2} style={{ border: "2px solid #000", padding: "6px 8px", fontSize: "10px", fontWeight: "bold", textAlign: "right", color: "#000000" }}>
                TOTAL
              </td>
              <td style={{ border: "2px solid #000", padding: "6px 8px", fontSize: "10px", fontWeight: "bold", textAlign: "center", color: "#000000" }}>
                {totals.numBookings}
              </td>
              <td style={{ border: "2px solid #000", padding: "6px 8px", fontSize: "10px", fontWeight: "bold", textAlign: "right", backgroundColor: "#DAEEF3", color: "#000000" }}>
                ₱{totals.totalRevenue.toLocaleString("en-US", { minimumFractionDigits: 2 })}
              </td>
              <td style={{ border: "2px solid #000", padding: "6px 8px", fontSize: "10px", fontWeight: "bold", textAlign: "right", backgroundColor: "#FCE5E5", color: "#000000" }}>
                ₱{totals.totalExpenses.toLocaleString("en-US", { minimumFractionDigits: 2 })}
              </td>
              <td style={{ border: "2px solid #000", padding: "6px 8px", fontSize: "10px", fontWeight: "bold", textAlign: "right", backgroundColor: "#D4EDDA", color: "#000000" }}>
                ₱{totals.profit.toLocaleString("en-US", { minimumFractionDigits: 2 })}
              </td>
              <td style={{ border: "2px solid #000", padding: "6px 8px", fontSize: "10px", fontWeight: "bold", textAlign: "right", color: "#000000" }}>
                {avgProfitMargin.toFixed(2)}%
              </td>
              <td style={{ border: "2px solid #000", padding: "6px 8px", fontSize: "10px", fontWeight: "bold", textAlign: "right", color: "#000000" }}>
                ₱{avgRevenuePerBooking.toLocaleString("en-US", { minimumFractionDigits: 2 })}
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