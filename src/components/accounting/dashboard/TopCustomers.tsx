/**
 * TopCustomers — Zone 4R of the Financial Dashboard
 *
 * Top 5 customers by revenue with horizontal proportional bars.
 * Shows customer name, amount, % of total revenue.
 * Highlights concentration risk if any customer > 40%.
 */

import { useMemo } from "react";
import { AlertTriangle } from "lucide-react";
import { formatCurrencyCompact } from "../aggregate/types";

interface TopCustomersProps {
  billingItems: any[];
  invoices: any[];
}

interface CustomerRow {
  name: string;
  revenue: number;
  pct: number;
}

export function TopCustomers({ billingItems, invoices }: TopCustomersProps) {
  const { rows, totalRevenue, hasConcentrationRisk } = useMemo(() => {
    const customerMap: Record<string, number> = {};

    // Aggregate revenue by customer name
    for (const item of [...invoices, ...billingItems]) {
      const name = (item.customer_name || item.customerName || "").trim() || "Unknown Customer";
      const amount = Number(item.total_amount) || Number(item.amount) || 0;
      customerMap[name] = (customerMap[name] || 0) + amount;
    }

    const total = Object.values(customerMap).reduce((s, v) => s + v, 0);

    // Sort and take top 5
    const sorted = Object.entries(customerMap)
      .map(([name, revenue]) => ({
        name,
        revenue,
        pct: total > 0 ? (revenue / total) * 100 : 0,
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    const risk = sorted.some((r) => r.pct > 40);

    return { rows: sorted, totalRevenue: total, hasConcentrationRisk: risk };
  }, [billingItems, invoices]);

  const maxRevenue = rows.length > 0 ? rows[0].revenue : 1;

  return (
    <div
      className="rounded-xl overflow-hidden flex flex-col"
      style={{ border: "1px solid var(--theme-border-default)", background: "var(--theme-bg-surface)" }}
    >
      {/* Header */}
      <div
        className="px-5 py-3 flex items-center justify-between"
        style={{ borderBottom: "1px solid var(--theme-border-default)", background: "#F8F9FB" }}
      >
        <h3
          className="text-[12px] font-semibold uppercase tracking-wider"
          style={{ color: "var(--theme-text-muted)" }}
        >
          Top Customers
        </h3>
        {hasConcentrationRisk && (
          <span
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold"
            style={{ backgroundColor: "#FFFBEB", color: "#D97706" }}
          >
            <AlertTriangle size={10} />
            Concentration Risk
          </span>
        )}
      </div>

      {/* Customer bars */}
      <div className="px-5 py-3 flex-1 flex flex-col gap-3">
        {rows.length === 0 ? (
          <p className="text-[13px] py-4 text-center" style={{ color: "var(--theme-text-muted)" }}>
            No customer data available
          </p>
        ) : (
          rows.map((row, idx) => {
            const barWidth = maxRevenue > 0 ? (row.revenue / maxRevenue) * 100 : 0;
            const isRisky = row.pct > 40;
            return (
              <div key={row.name} className="flex flex-col gap-1">
                {/* Name + amount row */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className="text-[11px] font-semibold w-4 text-center flex-shrink-0"
                      style={{ color: "var(--theme-text-muted)" }}
                    >
                      {idx + 1}
                    </span>
                    <span
                      className="text-[13px] font-medium truncate"
                      style={{ color: "var(--theme-text-primary)" }}
                    >
                      {row.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                    <span
                      className="text-[13px] font-semibold tabular-nums"
                      style={{ color: "var(--theme-text-primary)" }}
                    >
                      {formatCurrencyCompact(row.revenue)}
                    </span>
                    <span
                      className="text-[11px] font-medium px-1.5 py-0.5 rounded tabular-nums"
                      style={{
                        backgroundColor: isRisky ? "#FFFBEB" : "#F3F4F6",
                        color: isRisky ? "#D97706" : "#667085",
                      }}
                    >
                      {row.pct.toFixed(0)}%
                    </span>
                  </div>
                </div>

                {/* Bar */}
                <div className="flex items-center gap-2 pl-6">
                  <div
                    className="h-2 rounded-full overflow-hidden flex-1"
                    style={{ backgroundColor: "var(--theme-bg-surface-subtle)" }}
                  >
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${barWidth}%`,
                        backgroundColor: isRisky ? "#D97706" : "#0F766E",
                      }}
                    />
                  </div>
                </div>
              </div>
            );
          })
        )}

        {/* "Others" summary if there are more than 5 */}
        {rows.length === 5 && totalRevenue > 0 && (
          <div
            className="pt-2 mt-1 flex items-center justify-between"
            style={{ borderTop: "1px dashed #E5E9F0" }}
          >
            <span className="text-[11px] pl-6" style={{ color: "var(--theme-text-muted)" }}>
              Others
            </span>
            <span className="text-[11px] tabular-nums" style={{ color: "var(--theme-text-muted)" }}>
              {formatCurrencyCompact(
                totalRevenue - rows.reduce((s, r) => s + r.revenue, 0)
              )}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
