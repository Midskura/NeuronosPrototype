interface ReceivableEntry {
  companyName: string;
  clientName: string;
  bookingNo: string;
  amount: number;
  checkNoOrRef: string;
  invoiceAmount: number;
  collectedDate: string;
  status: "PAID" | "UNPAID";
}

interface ReceivablesReportProps {
  entries: ReceivableEntry[];
  period: string;
  generatedAt: string;
  companyName?: string;
}

export function ReceivablesReport({ entries, period, generatedAt, companyName = "" }: ReceivablesReportProps) {
  // Sort: UNPAID first, then PAID
  const sortedEntries = [...entries].sort((a, b) => {
    if (a.status === "UNPAID" && b.status === "PAID") return -1;
    if (a.status === "PAID" && b.status === "UNPAID") return 1;
    return 0;
  });

  const unpaidEntries = entries.filter(e => e.status === "UNPAID");
  const paidEntries = entries.filter(e => e.status === "PAID");

  const totalUnpaid = unpaidEntries.reduce((sum, e) => sum + e.amount, 0);
  const totalPaid = paidEntries.reduce((sum, e) => sum + e.amount, 0);
  const totalAmount = totalUnpaid + totalPaid;

  return (
    <div className="bg-white rounded-lg border border-[#E5E7EB] overflow-hidden">
      <div style={{ fontFamily: "Arial, sans-serif", padding: "40px", backgroundColor: "#FFFFFF" }}>
        {/* Header */}
        <div className="text-center mb-6">
          <div className="uppercase mb-3" style={{ fontSize: "11px", fontWeight: "bold", color: "#0A1D4D", letterSpacing: "0.5px" }}>
            {companyName || "JJB CRATING PACKING AND FREIGHT FORWARDING"}
          </div>
          <div className="uppercase mb-2" style={{ fontSize: "14px", fontWeight: "bold", color: "#0A1D4D", letterSpacing: "1px" }}>
            RECEIVABLES REPORT
          </div>
          <div className="uppercase" style={{ fontSize: "10px", fontWeight: "normal", color: "#6B7280", letterSpacing: "0.5px" }}>
            FOR THE MONTH / PERIOD OF {period.toUpperCase()}
          </div>
        </div>

        {/* Table */}
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "10px", border: "1px solid #000" }}>
          <thead>
            <tr style={{ backgroundColor: "#0F766E", color: "#FFFFFF", height: "32px" }}>
              <th style={{ border: "1px solid #000", padding: "6px 8px", fontWeight: "bold", fontSize: "9px", textAlign: "left" }}>
                COMPANY NAME
              </th>
              <th style={{ border: "1px solid #000", padding: "6px 8px", fontWeight: "bold", fontSize: "9px", textAlign: "left" }}>
                CLIENT NAME
              </th>
              <th style={{ border: "1px solid #000", padding: "6px 8px", fontWeight: "bold", fontSize: "9px", textAlign: "left" }}>
                BOOKING / JOB NO.
              </th>
              <th style={{ border: "1px solid #000", padding: "6px 8px", fontWeight: "bold", fontSize: "9px", textAlign: "right" }}>
                AMOUNT (₱)
              </th>
              <th style={{ border: "1px solid #000", padding: "6px 8px", fontWeight: "bold", fontSize: "9px", textAlign: "left" }}>
                CHECK NO. / CASH REF
              </th>
              <th style={{ border: "1px solid #000", padding: "6px 8px", fontWeight: "bold", fontSize: "9px", textAlign: "right" }}>
                INVOICE AMOUNT (₱)
              </th>
              <th style={{ border: "1px solid #000", padding: "6px 8px", fontWeight: "bold", fontSize: "9px", textAlign: "center" }}>
                COLLECTED DATE
              </th>
              <th style={{ border: "1px solid #000", padding: "6px 8px", fontWeight: "bold", fontSize: "9px", textAlign: "center" }}>
                STATUS
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedEntries.map((entry, index) => (
              <tr key={index} style={{ height: "26px" }}>
                <td style={{ border: "1px solid #000", padding: "4px 8px", fontSize: "9px" }}>
                  {entry.companyName}
                </td>
                <td style={{ border: "1px solid #000", padding: "4px 8px", fontSize: "9px" }}>
                  {entry.clientName}
                </td>
                <td style={{ border: "1px solid #000", padding: "4px 8px", fontSize: "9px" }}>
                  {entry.bookingNo}
                </td>
                <td style={{ border: "1px solid #000", padding: "4px 8px", fontSize: "9px", textAlign: "right" }}>
                  ₱{entry.amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </td>
                <td style={{ border: "1px solid #000", padding: "4px 8px", fontSize: "9px" }}>
                  {entry.checkNoOrRef}
                </td>
                <td style={{ border: "1px solid #000", padding: "4px 8px", fontSize: "9px", textAlign: "right" }}>
                  ₱{entry.invoiceAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </td>
                <td style={{ border: "1px solid #000", padding: "4px 8px", fontSize: "9px", textAlign: "center" }}>
                  {entry.collectedDate}
                </td>
                <td style={{ 
                  border: "1px solid #000", 
                  padding: "4px 8px", 
                  fontSize: "9px", 
                  textAlign: "center",
                  backgroundColor: entry.status === "PAID" ? "#D4EDDA" : "#FCE5E5",
                  fontWeight: "bold"
                }}>
                  {entry.status}
                </td>
              </tr>
            ))}
            
            {/* Summary Rows */}
            <tr style={{ height: "28px", backgroundColor: "#FCE5E5" }}>
              <td colSpan={3} style={{ border: "1px solid #000", padding: "6px 8px", fontSize: "10px", fontWeight: "bold", textAlign: "right" }}>
                TOTAL UNPAID
              </td>
              <td style={{ border: "1px solid #000", padding: "6px 8px", fontSize: "10px", fontWeight: "bold", textAlign: "right" }}>
                ₱{totalUnpaid.toLocaleString("en-US", { minimumFractionDigits: 2 })}
              </td>
              <td colSpan={4} style={{ border: "1px solid #000", padding: "6px 8px", fontSize: "9px", color: "#666" }}>
                {unpaidEntries.length} unpaid transaction(s)
              </td>
            </tr>
            
            <tr style={{ height: "28px", backgroundColor: "#D4EDDA" }}>
              <td colSpan={3} style={{ border: "1px solid #000", padding: "6px 8px", fontSize: "10px", fontWeight: "bold", textAlign: "right" }}>
                TOTAL PAID
              </td>
              <td style={{ border: "1px solid #000", padding: "6px 8px", fontSize: "10px", fontWeight: "bold", textAlign: "right" }}>
                ₱{totalPaid.toLocaleString("en-US", { minimumFractionDigits: 2 })}
              </td>
              <td colSpan={4} style={{ border: "1px solid #000", padding: "6px 8px", fontSize: "9px", color: "#666" }}>
                {paidEntries.length} paid transaction(s)
              </td>
            </tr>

            <tr style={{ height: "32px", backgroundColor: "#F3F4F6" }}>
              <td colSpan={3} style={{ border: "2px solid #000", padding: "6px 8px", fontSize: "11px", fontWeight: "bold", textAlign: "right" }}>
                GRAND TOTAL
              </td>
              <td style={{ border: "2px solid #000", padding: "6px 8px", fontSize: "11px", fontWeight: "bold", textAlign: "right" }}>
                ₱{totalAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
              </td>
              <td colSpan={4} style={{ border: "2px solid #000", padding: "6px 8px", fontSize: "9px", color: "#666" }}>
                {entries.length} total transaction(s)
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