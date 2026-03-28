/**
 * NeuronKPICard — Shared KPI metric card used across Contacts, Customers, and Financials.
 *
 * Visual pattern (matching Contacts/Customers design):
 *   Top row: icon pill (left) + trend arrow+% (right)
 *   Label text (small, muted)
 *   Value (large) + optional suffix (e.g. "/ 25" for quota)
 *   Optional progress bar
 */

import { ArrowUp, ArrowDown } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface NeuronKPICardProps {
  /** Lucide icon to display in the teal pill. If omitted, no icon pill renders. */
  icon?: LucideIcon;
  /** Label text below the icon row */
  label: string;
  /** Primary display value (string or number — numbers are formatted with toLocaleString) */
  value: string | number;
  /** Optional suffix shown after the value in smaller text (e.g. "/ 25" for quota, "items", etc.) */
  suffix?: string;
  /** Optional detail text shown in the top-right corner (e.g. "5 items", "across 3") — same position as trend */
  detail?: string;
  /** Trend percentage — positive = green up arrow, negative = red down arrow, 0/undefined = hidden */
  trend?: number;
  /** Progress bar value 0-100. Omit to hide the bar. */
  progress?: number;
  /** Severity overrides the icon pill colors (normal=teal, warning=amber, danger=red) */
  severity?: "normal" | "warning" | "danger";
}

const SEVERITY_COLORS: Record<string, { iconBg: string; iconColor: string }> = {
  normal:  { iconBg: "var(--theme-status-success-bg)", iconColor: "var(--theme-action-primary-bg)" },
  warning: { iconBg: "var(--theme-status-warning-bg)", iconColor: "var(--theme-status-warning-fg)" },
  danger:  { iconBg: "var(--theme-status-danger-bg)",  iconColor: "var(--theme-status-danger-fg)" },
};

function getProgressColor(pct: number): string {
  if (pct >= 80) return "var(--theme-action-primary-bg)";
  if (pct >= 60) return "var(--theme-status-warning-fg)";
  return "var(--theme-status-danger-fg)";
}

function getProgressBgColor(pct: number): string {
  if (pct >= 80) return "var(--theme-status-success-bg)";
  if (pct >= 60) return "var(--theme-status-warning-bg)";
  return "var(--theme-status-danger-bg)";
}

export function NeuronKPICard({
  icon: Icon,
  label,
  value,
  suffix,
  detail,
  trend,
  progress,
  severity = "normal",
}: NeuronKPICardProps) {
  const colors = SEVERITY_COLORS[severity];
  const hasTrend = trend !== undefined && trend !== 0;
  const trendUp = (trend ?? 0) > 0;
  const displayValue = typeof value === "number" ? value.toLocaleString() : value;

  return (
    <div
      className="p-5 rounded-xl transition-shadow hover:shadow-sm"
      style={{
        border: "1.5px solid var(--neuron-ui-border)",
        backgroundColor: "var(--theme-bg-surface)",
      }}
    >
      {/* Top row: icon pill + trend/detail */}
      <div className="flex items-start justify-between mb-3">
        {Icon ? (
          <div
            className="p-2 rounded-lg"
            style={{ backgroundColor: colors.iconBg }}
          >
            <Icon size={18} style={{ color: colors.iconColor }} />
          </div>
        ) : (
          <div />
        )}
        <div className="flex items-center gap-2">
          {hasTrend && (
            <div className="flex items-center gap-1">
              {trendUp ? (
                <ArrowUp size={14} style={{ color: "var(--theme-status-success-fg)" }} />
              ) : (
                <ArrowDown size={14} style={{ color: "var(--theme-status-danger-fg)" }} />
              )}
              <span
                className="text-xs font-medium"
                style={{ color: trendUp ? "var(--theme-status-success-fg)" : "var(--theme-status-danger-fg)" }}
              >
                {Math.abs(trend!)}%
              </span>
            </div>
          )}
          {detail && (
            <span
              className="text-[11px] font-medium"
              style={{ color: "var(--neuron-ink-muted)" }}
            >
              {detail}
            </span>
          )}
        </div>
      </div>

      {/* Label + Value */}
      <div className="space-y-2">
        <p className="text-xs" style={{ color: "var(--neuron-ink-muted)" }}>
          {label}
        </p>
        <div className="flex items-end gap-1">
          <span
            className="text-2xl font-bold"
            style={{ color: "var(--neuron-ink-primary)" }}
          >
            {displayValue}
          </span>
          {suffix && (
            <span
              className="text-xs mb-1"
              style={{ color: "var(--neuron-ink-muted)" }}
            >
              {suffix}
            </span>
          )}
        </div>

        {/* Progress bar (optional) */}
        {progress !== undefined && (
          <div
            className="w-full h-1.5 rounded-full overflow-hidden"
            style={{ backgroundColor: getProgressBgColor(progress) }}
          >
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${Math.min(progress, 100)}%`,
                backgroundColor: getProgressColor(progress),
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}