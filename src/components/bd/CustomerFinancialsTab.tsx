import type { Customer } from "../../types/bd";
import { supabase } from "../../utils/supabase/client";
import { TrendingUp, CreditCard, DollarSign, Activity, FileText } from "lucide-react";
import { ResponsiveContainer, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Bar, Cell } from "recharts";
import { useQuery } from "@tanstack/react-query";

interface CustomerFinancialsTabProps {
  customer: Customer;
}

export function CustomerFinancialsTab({ customer }: CustomerFinancialsTabProps) {
  const { data: billings = [], isLoading: billingsLoading } = useQuery({
    queryKey: ["customer_billings", customer.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('billing_line_items')
        .select('*')
        .eq('customer_id', customer.id);
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 30_000,
  });

  const { data: collections = [], isLoading: collectionsLoading } = useQuery({
    queryKey: ["customer_collections", customer.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('collections')
        .select('*')
        .eq('customer_id', customer.id);
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 30_000,
  });

  const isLoading = billingsLoading || collectionsLoading;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Calculations
  const totalBilled = billings.reduce((sum, item) => sum + (Number(item.total_amount || item.amount) || 0), 0);
  const totalCollected = collections.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  const outstandingBalance = totalBilled - totalCollected;
  
  // Calculate collection rate
  const collectionRate = totalBilled > 0 ? (totalCollected / totalBilled) * 100 : 0;

  // Chart Data (Last 6 months logic could be added, simpler for MVP)
  const chartData = [
    { name: "Total Billed", amount: totalBilled, fill: "#0F766E" },
    { name: "Collected", amount: totalCollected, fill: "#059669" },
    { name: "Outstanding", amount: outstandingBalance, fill: "#C05621" }
  ];

  return (
    <div style={{ padding: "24px 0" }}>
      <div style={{ marginBottom: "24px" }}>
        <h3 style={{ fontSize: "16px", fontWeight: 600, color: "var(--theme-text-primary)", margin: 0 }}>Financial Overview</h3>
        <p style={{ fontSize: "13px", color: "var(--theme-text-muted)", marginTop: "4px" }}>Billing and collection history for {customer.name || customer.company_name}</p>
      </div>

      {isLoading ? (
        <div style={{ textAlign: "center", padding: "48px", color: "var(--theme-text-muted)" }}>
          Loading financial data...
        </div>
      ) : (
        <>
          {/* KPI Cards */}
          <div style={{ 
            display: "grid", 
            gridTemplateColumns: "repeat(4, 1fr)", 
            gap: "16px", 
            marginBottom: "32px" 
          }}>
            <div style={{ 
              backgroundColor: "var(--theme-bg-surface)", 
              padding: "20px", 
              borderRadius: "12px", 
              border: "1px solid var(--theme-border-default)",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
                <div style={{ padding: "6px", borderRadius: "6px", backgroundColor: "var(--theme-bg-surface-tint)", color: "var(--theme-action-primary-bg)" }}>
                  <FileText size={16} />
                </div>
                <span style={{ fontSize: "13px", fontWeight: 500, color: "var(--theme-text-muted)" }}>Total Billed</span>
              </div>
              <div style={{ fontSize: "24px", fontWeight: 700, color: "var(--theme-text-primary)" }}>{formatCurrency(totalBilled)}</div>
            </div>

            <div style={{ 
              backgroundColor: "var(--theme-bg-surface)", 
              padding: "20px", 
              borderRadius: "12px", 
              border: "1px solid var(--theme-border-default)",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
                <div style={{ padding: "6px", borderRadius: "6px", backgroundColor: "#F0FDF4", color: "#15803D" }}>
                  <CreditCard size={16} />
                </div>
                <span style={{ fontSize: "13px", fontWeight: 500, color: "var(--theme-text-muted)" }}>Total Collected</span>
              </div>
              <div style={{ fontSize: "24px", fontWeight: 700, color: "#15803D" }}>{formatCurrency(totalCollected)}</div>
            </div>

            <div style={{ 
              backgroundColor: "var(--theme-bg-surface)", 
              padding: "20px", 
              borderRadius: "12px", 
              border: "1px solid var(--theme-border-default)",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
                <div style={{ padding: "6px", borderRadius: "6px", backgroundColor: "#FFF7ED", color: "#C05621" }}>
                  <DollarSign size={16} />
                </div>
                <span style={{ fontSize: "13px", fontWeight: 500, color: "var(--theme-text-muted)" }}>Outstanding</span>
              </div>
              <div style={{ fontSize: "24px", fontWeight: 700, color: "#C05621" }}>{formatCurrency(outstandingBalance)}</div>
            </div>

            <div style={{ 
              backgroundColor: "var(--theme-bg-surface)", 
              padding: "20px", 
              borderRadius: "12px", 
              border: "1px solid var(--theme-border-default)",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
                <div style={{ padding: "6px", borderRadius: "6px", backgroundColor: "#EFF6FF", color: "#1D4ED8" }}>
                  <Activity size={16} />
                </div>
                <span style={{ fontSize: "13px", fontWeight: 500, color: "var(--theme-text-muted)" }}>Collection Rate</span>
              </div>
              <div style={{ fontSize: "24px", fontWeight: 700, color: "#1D4ED8" }}>{collectionRate.toFixed(1)}%</div>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "24px" }}>
            {/* Transaction Ledger */}
            <div style={{ 
              backgroundColor: "var(--theme-bg-surface)", 
              borderRadius: "12px", 
              border: "1px solid var(--theme-border-default)",
              padding: "24px",
            }}>
              <h3 style={{ fontSize: "15px", fontWeight: 600, color: "var(--theme-text-primary)", marginBottom: "16px" }}>Transaction History</h3>
              
              <div style={{ maxHeight: "400px", overflowY: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead style={{ position: "sticky", top: 0, backgroundColor: "var(--theme-bg-surface)", zIndex: 1 }}>
                    <tr style={{ borderBottom: "1px solid var(--theme-border-default)" }}>
                      <th style={{ textAlign: "left", padding: "12px 8px", fontSize: "11px", color: "var(--theme-text-muted)", textTransform: "uppercase" }}>Date</th>
                      <th style={{ textAlign: "left", padding: "12px 8px", fontSize: "11px", color: "var(--theme-text-muted)", textTransform: "uppercase" }}>Ref #</th>
                      <th style={{ textAlign: "left", padding: "12px 8px", fontSize: "11px", color: "var(--theme-text-muted)", textTransform: "uppercase" }}>Description</th>
                      <th style={{ textAlign: "right", padding: "12px 8px", fontSize: "11px", color: "var(--theme-text-muted)", textTransform: "uppercase" }}>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* Combine and sort items */}
                    {[
                      ...billings.map(b => ({ 
                        ...b, 
                        type: "Invoice", 
                        date: b.invoice_date || b.created_at,
                        ref: b.invoice_number || b.evoucher_number,
                        amount: Number(b.total_amount || b.amount)
                      })),
                      ...collections.map(c => ({ 
                        ...c, 
                        type: "Payment", 
                        date: c.collection_date || c.created_at,
                        ref: c.reference_number || c.evoucher_number,
                        amount: Number(c.amount)
                      }))
                    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                     .map((item, idx) => (
                      <tr key={idx} style={{ borderBottom: "1px solid var(--theme-border-subtle)" }}>
                        <td style={{ padding: "12px 8px", fontSize: "13px", color: "var(--theme-text-secondary)" }}>
                          {formatDate(item.date)}
                        </td>
                        <td style={{ padding: "12px 8px" }}>
                          <span style={{ 
                            fontSize: "12px", 
                            fontWeight: 500, 
                            color: item.type === "Invoice" ? "#0F766E" : "#059669"
                          }}>
                            {item.ref}
                          </span>
                        </td>
                        <td style={{ padding: "12px 8px", fontSize: "13px", color: "var(--theme-text-muted)" }}>
                           {item.description || item.type}
                        </td>
                        <td style={{ padding: "12px 8px", textAlign: "right", fontWeight: 600 }}>
                          <span style={{ color: item.type === "Invoice" ? "#374151" : "#059669" }}>
                            {item.type === "Payment" ? "-" : ""}{formatCurrency(item.amount)}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {[...billings, ...collections].length === 0 && (
                       <tr>
                         <td colSpan={4} style={{ textAlign: "center", padding: "32px", color: "var(--theme-text-muted)" }}>No transactions found</td>
                       </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Chart */}
            <div style={{ 
              backgroundColor: "var(--theme-bg-surface)", 
              borderRadius: "12px", 
              border: "1px solid var(--theme-border-default)",
              padding: "24px",
              display: "flex",
              flexDirection: "column"
            }}>
              <h3 style={{ fontSize: "15px", fontWeight: 600, color: "var(--theme-text-primary)", marginBottom: "16px" }}>Balance Summary</h3>
              <div style={{ flex: 1, minHeight: "250px" }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                    <YAxis axisLine={false} tickLine={false} tickFormatter={(val: number) => `₱${val/1000}k`} tick={{ fontSize: 12 }} />
                    <Tooltip 
                      formatter={(value: number) => formatCurrency(value)}
                      cursor={{ fill: 'transparent' }}
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                    />
                    <Bar dataKey="amount" radius={[4, 4, 0, 0]} barSize={40}>
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}