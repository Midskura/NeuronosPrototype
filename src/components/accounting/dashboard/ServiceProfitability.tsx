/**
 * ServiceProfitability — Zone 4L of the Financial Dashboard
 *
 * Table showing Revenue, Costs, Margin (₱ and %) per service type.
 * Derives service type from billing item `service_type` (enriched from parent booking).
 * Highlights low-margin services with warning colors.
 */

import { useMemo } from "react";
import { formatCurrencyCompact } from "../aggregate/types";

interface ServiceProfitabilityProps {
  billingItems: any[];
  invoices: any[];
  expenses: any[];
}

// Canonical service types for PH freight forwarding
const SERVICE_TYPE_MAP: Record<string, string> = {
  forwarding: "Forwarding",
  "freight forwarding": "Forwarding",
  brokerage: "Brokerage",
  "customs brokerage": "Brokerage",
  trucking: "Trucking",
  "marine insurance": "Marine Insurance",
  marine: "Marine Insurance",
  insurance: "Marine Insurance",
  others: "Others",
};

function normalizeServiceType(raw: string): string {
  const lower = (raw || "").toLowerCase().trim();
  return SERVICE_TYPE_MAP[lower] || (lower ? raw.trim() : "Others");
}

interface ServiceRow {
  service: string;
  revenue: number;
  costs: number;
  margin: number;
  marginPct: number;
}

export function ServiceProfitability({ billingItems, invoices, expenses }: ServiceProfitabilityProps) {
  const rows: ServiceRow[] = useMemo(() => {
    const revenueMap: Record<string, number> = {};
    const costMap: Record<string, number> = {};

    // Revenue from invoices + billing items
    for (const item of [...invoices, ...billingItems]) {
      const svc = normalizeServiceType(item.service_type || "");
      const amount = Number(item.total_amount) || Number(item.amount) || 0;
      revenueMap[svc] = (revenueMap[svc] || 0) + amount;
    }

    // Costs from expenses
    for (const exp of expenses) {
      const svc = normalizeServiceType(exp.service_type || "");
      const amount = Number(exp.amount) || 0;
      costMap[svc] = (costMap[svc] || 0) + amount;
    }

    // Merge into unique service set
    const allServices = new Set([...Object.keys(revenueMap), ...Object.keys(costMap)]);
    const result: ServiceRow[] = [];

    for (const svc of allServices) {
      const revenue = revenueMap[svc] || 0;
      const costs = costMap[svc] || 0;
      const margin = revenue - costs;
      const marginPct = revenue > 0 ? (margin / revenue) * 100 : costs > 0 ? -100 : 0;
      result.push({ service: svc, revenue, costs, margin, marginPct });
    }

    // Sort by revenue descending
    result.sort((a, b) => b.revenue - a.revenue);
    return result;
  }, [billingItems, invoices, expenses]);

  const totalRevenue = rows.reduce((s, r) => s + r.revenue, 0);
  const totalCosts = rows.reduce((s, r) => s + r.costs, 0);
  const totalMargin = totalRevenue - totalCosts;
  const totalMarginPct = totalRevenue > 0 ? (totalMargin / totalRevenue) * 100 : 0;

  return (
    <div
      className="rounded-xl overflow-hidden flex flex-col"
      style={{ border: "1px solid var(--theme-border-default)", background: "var(--theme-bg-surface)" }}
    >
      {/* Header */}
      <div
        className="px-5 py-3 flex items-center justify-between"
        style={{ borderBottom: "1px solid var(--theme-border-default)", background: "var(--neuron-pill-inactive-bg)" }}
      >
        <h3
          className="text-[12px] font-semibold uppercase tracking-wider"
          style={{ color: "var(--theme-text-muted)" }}
        >
          Profitability by Service
        </h3>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        <table className="w-full">
          <thead>
            <tr style={{ borderBottom: "1px solid var(--theme-border-default)", background: "var(--neuron-pill-inactive-bg)" }}>
              <th className="px-4 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--theme-text-muted)" }}>
                Service
              </th>
              <th className="px-4 py-2.5 text-right text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--theme-text-muted)" }}>
                Revenue
              </th>
              <th className="px-4 py-2.5 text-right text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--theme-text-muted)" }}>
                Costs
              </th>
              <th className="px-4 py-2.5 text-right text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--theme-text-muted)" }}>
                Margin
              </th>
              <th className="px-4 py-2.5 text-right text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--theme-text-muted)" }}>
                %
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-[13px]" style={{ color: "var(--theme-text-muted)" }}>
                  No data available
                </td>
              </tr>
            ) : (
              rows.map((row) => {
                const isLowMargin = row.marginPct < 15 && row.marginPct >= 0;
                const isNegative = row.marginPct < 0;
                return (
                  <tr
                    key={row.service}
                    style={{ borderBottom: "1px solid var(--theme-border-subtle)" }}
                    className="hover:bg-[var(--theme-bg-surface-subtle)]/50"
                  >
                    <td className="px-4 py-2.5 text-[13px] font-medium" style={{ color: "var(--theme-text-primary)" }}>
                      {row.service}
                    </td>
                    <td className="px-4 py-2.5 text-[13px] text-right tabular-nums" style={{ color: "var(--theme-action-primary-bg)" }}>
                      {formatCurrencyCompact(row.revenue)}
                    </td>
                    <td className="px-4 py-2.5 text-[13px] text-right tabular-nums" style={{ color: "#C05621" }}>
                      {formatCurrencyCompact(row.costs)}
                    </td>
                    <td
                      className="px-4 py-2.5 text-[13px] text-right font-semibold tabular-nums"
                      style={{ color: isNegative ? "var(--theme-status-danger-fg)" : "var(--theme-text-primary)" }}
                    >
                      {formatCurrencyCompact(row.margin)}
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <span
                        className="inline-block px-1.5 py-0.5 rounded text-[11px] font-semibold tabular-nums"
                        style={{
                          backgroundColor: isNegative
                            ? "var(--theme-status-danger-bg)"
                            : isLowMargin
                            ? "var(--theme-status-warning-bg)"
                            : "var(--theme-status-success-bg)",
                          color: isNegative
                            ? "var(--theme-status-danger-fg)"
                            : isLowMargin
                            ? "var(--theme-status-warning-fg)"
                            : "var(--theme-status-success-fg)",
                        }}
                      >
                        {row.marginPct.toFixed(0)}%
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
          {rows.length > 0 && (
            <tfoot>
              <tr style={{ borderTop: "2px solid var(--theme-border-default)", background: "var(--neuron-pill-inactive-bg)" }}>
                <td className="px-4 py-2.5 text-[12px] font-bold" style={{ color: "var(--theme-text-primary)" }}>
                  Total
                </td>
                <td className="px-4 py-2.5 text-[12px] text-right font-bold tabular-nums" style={{ color: "var(--theme-action-primary-bg)" }}>
                  {formatCurrencyCompact(totalRevenue)}
                </td>
                <td className="px-4 py-2.5 text-[12px] text-right font-bold tabular-nums" style={{ color: "#C05621" }}>
                  {formatCurrencyCompact(totalCosts)}
                </td>
                <td
                  className="px-4 py-2.5 text-[12px] text-right font-bold tabular-nums"
                  style={{ color: totalMargin < 0 ? "var(--theme-status-danger-fg)" : "var(--theme-text-primary)" }}
                >
                  {formatCurrencyCompact(totalMargin)}
                </td>
                <td className="px-4 py-2.5 text-right">
                  <span
                    className="inline-block px-1.5 py-0.5 rounded text-[11px] font-bold tabular-nums"
                    style={{
                      backgroundColor: totalMarginPct < 0 ? "var(--theme-status-danger-bg)" : "var(--theme-status-success-bg)",
                      color: totalMarginPct < 0 ? "var(--theme-status-danger-fg)" : "var(--theme-status-success-fg)",
                    }}
                  >
                    {totalMarginPct.toFixed(0)}%
                  </span>
                </td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
}
