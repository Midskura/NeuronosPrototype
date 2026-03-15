// SalesReport — Report 1: Per-booking revenue breakdown.
// "How much money did we actually make from the things we did?"
//
// Grain: Per booking (one row per booking — the work unit).
// Source: Billing items grouped by booking_id.
//
// Smart Ledger Phase 1: Dense, information-rich financial document.
// "Quiet containers, loud data." — matches DataTable DNA.
// All data logic completely preserved.
//
// Smart Ledger Phase 2: Grouped inline subtotals + conditional row accents.
// All data logic completely preserved.

import React, { useState, useMemo, useRef, useEffect } from "react";
import {
  Search,
  DollarSign,
  Download,
  ChevronDown,
  Check,
  LayoutGrid,
  Printer,
  TrendingUp,
  Receipt,
  AlertTriangle,
  BarChart3,
} from "lucide-react";
import type { ReportsData } from "../../../hooks/useReportsData";
import {
  type DateScope,
  isInScope,
  formatCurrencyFull,
  formatCurrencyCompact,
} from "../aggregate/types";
import { ScopeBar } from "../aggregate/ScopeBar";

// ── Types ──

interface BookingRevenueRow {
  id: string;
  bookingId: string;
  serviceType: string;
  projectNumber: string;
  customerName: string;
  totalBilled: number;
  totalUnbilled: number;
  totalRevenue: number;
  chargeCount: number;
  billingDate: string;
}

type GroupByOption = "none" | "customer" | "service_type";

interface SalesReportProps {
  data: ReportsData;
  scope: DateScope;
  onScopeChange: (scope: DateScope) => void;
}

// ── Helpers ──

const formatDate = (dateStr: string) => {
  if (!dateStr) return "\u2014";
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });
};

const formatScopeLabel = (scope: DateScope): string => {
  const presetLabels: Record<string, string> = {
    "this-week": "This Week",
    "this-month": "This Month",
    "this-quarter": "This Quarter",
    ytd: "Year to Date",
    all: "All Time",
  };
  if (scope.preset !== "custom") return presetLabels[scope.preset] || scope.preset;
  const fmt = (d: Date) =>
    d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  return `${fmt(scope.from)} \u2013 ${fmt(scope.to)}`;
};

const SERVICE_TYPE_LABELS: Record<string, string> = {
  forwarding: "Forwarding",
  brokerage: "Brokerage",
  trucking: "Trucking",
  marine_insurance: "Marine Insurance",
  others: "Others",
};

const normalizeServiceType = (st: string | undefined): string => {
  if (!st) return "Others";
  const lower = st.toLowerCase().replace(/[\s-]+/g, "_");
  return SERVICE_TYPE_LABELS[lower] || st;
};

// ── Accounting Format Helpers ──

/** Standard: ₱X,XXX.XX or em-dash for zero */
const fmtAcct = (val: number): string =>
  val === 0 ? "\u2014" : formatCurrencyFull(val);

/** Parenthesized for "at risk" / deduction display: (₱X,XXX.XX) or em-dash */
const fmtAcctParens = (val: number): string =>
  val === 0 ? "\u2014" : `(${formatCurrencyFull(val)})`;

// ── Column Zone Tints ──
// Subtle background colors that persist through header, data, and totals rows.
// Creates vertical "scanning lanes" — the key visual that makes this a financial report.

const ZONE_TINT = {
  billed: "rgba(15, 118, 110, 0.04)",    // teal at 4%
  unbilled: "rgba(217, 119, 6, 0.04)",   // amber at 4%
  revenue: "rgba(22, 101, 52, 0.06)",    // green at 6%
} as const;

// ── Component ──

export function SalesReport({ data, scope, onScopeChange }: SalesReportProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [groupBy, setGroupBy] = useState<GroupByOption>("none");
  const [groupDropdownOpen, setGroupDropdownOpen] = useState(false);
  const groupRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (groupRef.current && !groupRef.current.contains(e.target as Node)) {
        setGroupDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ── Compute rows from billing items (UNCHANGED) ──
  const rows = useMemo(() => {
    const { billingItems } = data;
    const scopedItems = billingItems.filter((item) =>
      isInScope(item.created_at, scope)
    );
    const byBooking = new Map<string, any[]>();
    for (const item of scopedItems) {
      const bid = item.booking_id || "UNLINKED";
      if (!byBooking.has(bid)) byBooking.set(bid, []);
      byBooking.get(bid)!.push(item);
    }
    const result: BookingRevenueRow[] = [];
    byBooking.forEach((items, bookingId) => {
      let totalBilled = 0;
      let totalUnbilled = 0;
      let earliestDate = "";
      for (const item of items) {
        const amount = Number(item.amount) || 0;
        const status = (item.status || "").toLowerCase();
        if (status === "unbilled") {
          totalUnbilled += amount;
        } else {
          totalBilled += amount;
        }
        const d = item.created_at || "";
        if (d && (!earliestDate || d < earliestDate)) {
          earliestDate = d;
        }
      }
      result.push({
        id: bookingId,
        bookingId,
        serviceType: normalizeServiceType(items[0]?.service_type),
        projectNumber: items[0]?.project_number || "\u2014",
        customerName: items[0]?.customer_name || "\u2014",
        totalBilled,
        totalUnbilled,
        totalRevenue: totalBilled + totalUnbilled,
        chargeCount: items.length,
        billingDate: earliestDate,
      });
    });
    result.sort((a, b) => b.totalRevenue - a.totalRevenue);
    return result;
  }, [data.billingItems, scope]);

  // ── Search filter (UNCHANGED) ──
  const filteredRows = useMemo(() => {
    if (!searchQuery) return rows;
    const q = searchQuery.toLowerCase();
    return rows.filter(
      (r) =>
        r.bookingId.toLowerCase().includes(q) ||
        r.customerName.toLowerCase().includes(q) ||
        r.projectNumber.toLowerCase().includes(q) ||
        r.serviceType.toLowerCase().includes(q)
    );
  }, [rows, searchQuery]);

  // ── Grouping (UNCHANGED) ──
  const groupedData = useMemo(() => {
    if (groupBy === "none") return null;
    const groups = new Map<string, BookingRevenueRow[]>();
    for (const row of filteredRows) {
      const key = groupBy === "customer" ? row.customerName : row.serviceType;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(row);
    }
    return Array.from(groups.entries())
      .map(([label, items]) => ({
        label,
        items,
        subtotal: items.reduce((s, r) => s + r.totalRevenue, 0),
      }))
      .sort((a, b) => b.subtotal - a.subtotal);
  }, [filteredRows, groupBy]);

  // ── Summary KPIs (UNCHANGED) ──
  const kpis = useMemo(() => {
    const totalRevenue = filteredRows.reduce((s, r) => s + r.totalRevenue, 0);
    const totalBilled = filteredRows.reduce((s, r) => s + r.totalBilled, 0);
    const totalUnbilled = filteredRows.reduce((s, r) => s + r.totalUnbilled, 0);
    const avgPerBooking =
      filteredRows.length > 0 ? totalRevenue / filteredRows.length : 0;
    return { totalRevenue, totalBilled, totalUnbilled, avgPerBooking };
  }, [filteredRows]);

  // ── CSV export (UNCHANGED) ──
  const handleExport = () => {
    const headers = [
      "Booking ID", "Service Type", "Project #", "Customer",
      "Total Billed", "Total Unbilled", "Total Revenue", "# Charges", "Billing Date",
    ];
    const csvRows = filteredRows.map((r) => [
      r.bookingId, r.serviceType, r.projectNumber, r.customerName,
      r.totalBilled.toFixed(2), r.totalUnbilled.toFixed(2), r.totalRevenue.toFixed(2),
      String(r.chargeCount),
      r.billingDate ? new Date(r.billingDate).toISOString().split("T")[0] : "",
    ]);
    csvRows.push([
      "TOTALS", "", "", "",
      kpis.totalBilled.toFixed(2), kpis.totalUnbilled.toFixed(2), kpis.totalRevenue.toFixed(2),
      String(filteredRows.reduce((s, r) => s + r.chargeCount, 0)), "",
    ]);
    const csv = [
      headers.join(","),
      ...csvRows.map((r) => r.map((c) => `"${c}"`).join(",")),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const scopeLabel =
      scope.preset === "all"
        ? "all-time"
        : `${scope.from.toISOString().split("T")[0]}_${scope.to.toISOString().split("T")[0]}`;
    a.download = `sales-report-${scopeLabel}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ── Group by options ──
  const GROUP_OPTIONS: { value: GroupByOption; label: string }[] = [
    { value: "none", label: "No Grouping" },
    { value: "customer", label: "By Customer" },
    { value: "service_type", label: "By Service Type" },
  ];
  const activeGroupLabel =
    GROUP_OPTIONS.find((o) => o.value === groupBy)?.label || "No Grouping";

  // ── Derived labels ──
  const periodLabel = formatScopeLabel(scope);
  const totalCharges = filteredRows.reduce((s, r) => s + r.chargeCount, 0);
  const billedPct = kpis.totalRevenue > 0 ? Math.round((kpis.totalBilled / kpis.totalRevenue) * 100) : 0;
  const unbilledPct = kpis.totalRevenue > 0 ? Math.round((kpis.totalUnbilled / kpis.totalRevenue) * 100) : 0;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* ── Report Masthead ── */}
      <div
        className="px-10 pt-4 pb-3"
        style={{ borderBottom: "1px solid var(--neuron-ui-divider)" }}
      >
        {/* Row 1: Title + Controls */}
        <div className="flex items-start justify-between mb-3">
          {/* Left: Title block with green accent */}
          <div className="flex items-stretch gap-3">
            <div style={{ width: 3, backgroundColor: "var(--neuron-brand-green)", borderRadius: 2, flexShrink: 0 }} />
            <div>
              <h1
                className="text-[16px] font-semibold"
                style={{ color: "var(--neuron-ink-primary)", lineHeight: "1.3" }}
              >
                Sales Report
              </h1>
              <p className="text-[11px] mt-0.5" style={{ color: "var(--neuron-ink-muted)" }}>
                Per-booking revenue breakdown · {periodLabel}
              </p>
            </div>
          </div>

          {/* Right: Controls */}
          <div className="flex items-center gap-2">
            {/* Search */}
            <div className="relative" style={{ width: 180 }}>
              <Search
                className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5"
                style={{ color: "var(--neuron-ink-muted)" }}
              />
              <input
                type="text"
                placeholder="Search bookings..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 rounded-md focus:outline-none focus:ring-1 text-[11px]"
                style={{
                  border: "1px solid var(--neuron-ui-border)",
                  backgroundColor: "var(--neuron-bg-elevated)",
                  color: "var(--neuron-ink-primary)",
                }}
              />
            </div>

            {/* Group By */}
            <div className="relative" ref={groupRef}>
              <button
                onClick={() => setGroupDropdownOpen(!groupDropdownOpen)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[11px] font-medium transition-colors hover:bg-[var(--neuron-state-hover)]"
                style={{
                  border: "1px solid var(--neuron-ui-border)",
                  color: "var(--neuron-ink-secondary)",
                }}
              >
                <LayoutGrid size={12} style={{ color: "var(--neuron-ink-muted)" }} />
                {activeGroupLabel}
                <ChevronDown
                  size={11}
                  className={`transition-transform ${groupDropdownOpen ? "rotate-180" : ""}`}
                  style={{ color: "var(--neuron-ink-muted)" }}
                />
              </button>
              {groupDropdownOpen && (
                <div
                  className="absolute right-0 top-full mt-1.5 z-50 rounded-lg py-1 min-w-[160px]"
                  style={{
                    border: "1px solid var(--neuron-ui-border)",
                    backgroundColor: "var(--neuron-bg-elevated)",
                    boxShadow: "var(--elevation-2)",
                  }}
                >
                  {GROUP_OPTIONS.map((opt) => {
                    const isActive = groupBy === opt.value;
                    return (
                      <button
                        key={opt.value}
                        onClick={() => {
                          setGroupBy(opt.value);
                          setGroupDropdownOpen(false);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-1.5 text-[11px] transition-colors hover:bg-[var(--neuron-state-hover)]"
                        style={{
                          color: isActive ? "var(--neuron-brand-green)" : "var(--neuron-ink-primary)",
                          fontWeight: isActive ? 600 : 400,
                        }}
                      >
                        {isActive ? (
                          <Check size={11} style={{ color: "var(--neuron-brand-green)" }} />
                        ) : (
                          <span className="w-[11px]" />
                        )}
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Print */}
            <button
              onClick={() => window.print()}
              className="flex items-center justify-center p-1.5 rounded-md transition-colors hover:bg-[var(--neuron-state-hover)]"
              style={{
                border: "1px solid var(--neuron-ui-border)",
                color: "var(--neuron-ink-secondary)",
              }}
              title="Print"
            >
              <Printer size={14} />
            </button>

            {/* Export CSV */}
            <button
              onClick={handleExport}
              disabled={filteredRows.length === 0}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium text-[11px] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                backgroundColor: "var(--neuron-brand-green)",
                color: "#FFFFFF",
              }}
            >
              <Download size={12} />
              Export
            </button>
          </div>
        </div>

        {/* Row 2: KPI Summary Cards + ScopeBar */}
        <div className="flex items-center gap-3">
          {/* KPI Cards */}
          <div className="flex items-stretch gap-2 flex-1">
            <KpiCard
              icon={<TrendingUp size={13} />}
              label="Total Revenue"
              value={formatCurrencyFull(kpis.totalRevenue)}
              accentColor="var(--neuron-brand-green)"
              subtitle={`${filteredRows.length} booking${filteredRows.length !== 1 ? "s" : ""}`}
            />
            <KpiCard
              icon={<Receipt size={13} />}
              label="Billed"
              value={formatCurrencyFull(kpis.totalBilled)}
              accentColor="#0F766E"
              subtitle={`${billedPct}% collected`}
            />
            <KpiCard
              icon={<AlertTriangle size={13} />}
              label="Unbilled"
              value={fmtAcct(kpis.totalUnbilled)}
              accentColor="#D97706"
              subtitle={unbilledPct > 0 ? `${unbilledPct}% at risk` : "Fully billed"}
            />
            <KpiCard
              icon={<BarChart3 size={13} />}
              label="Avg / Booking"
              value={formatCurrencyFull(kpis.avgPerBooking)}
              accentColor="var(--neuron-ink-muted)"
              subtitle={`${totalCharges} charge${totalCharges !== 1 ? "s" : ""}`}
            />
          </div>

          {/* ScopeBar */}
          <ScopeBar scope={scope} onScopeChange={onScopeChange} standalone />
        </div>
      </div>

      {/* ── Ledger Table ── */}
      <div className="flex-1 overflow-auto px-10 pt-4 pb-8">
        {data.isLoading ? (
          <LedgerSkeleton />
        ) : filteredRows.length === 0 ? (
          <div
            className="rounded-[10px] overflow-hidden"
            style={{
              border: "1px solid var(--neuron-ui-border)",
              backgroundColor: "var(--neuron-bg-elevated)",
            }}
          >
            <div className="flex flex-col items-center justify-center py-16">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center mb-3"
                style={{ backgroundColor: "var(--neuron-state-hover)" }}
              >
                <DollarSign size={20} style={{ color: "var(--neuron-ink-muted)" }} />
              </div>
              <p className="text-[13px] font-medium" style={{ color: "var(--neuron-ink-primary)" }}>
                No booking revenue found
              </p>
              <p className="text-[12px] mt-1" style={{ color: "var(--neuron-ink-muted)" }}>
                {searchQuery
                  ? "Try adjusting your search or date range."
                  : "Create billing items against bookings to see revenue data here."}
              </p>
            </div>
          </div>
        ) : groupBy === "none" || !groupedData ? (
          <>
            <LedgerTable rows={filteredRows} kpis={kpis} totalCharges={totalCharges} />
            <ReportSummary kpis={kpis} bookingCount={filteredRows.length} billedPct={billedPct} unbilledPct={unbilledPct} />
            <ReportFooter periodLabel={periodLabel} bookingCount={filteredRows.length} />
          </>
        ) : (
          <>
            <GroupedLedgerTable groups={groupedData} kpis={kpis} totalCharges={totalCharges} />
            <ReportSummary kpis={kpis} bookingCount={filteredRows.length} billedPct={billedPct} unbilledPct={unbilledPct} />
            <ReportFooter periodLabel={periodLabel} bookingCount={filteredRows.length} />
          </>
        )}
      </div>
    </div>
  );
}

// ── Ledger Table ──
// Financial report table with column zone tinting and accounting typography.
// Two-line composite cells: Booking (ID + date), Client (name + project).
// 7 columns: Booking | Service | Client ║ Billed | Unbilled | Revenue | # Charges

function LedgerTable({
  rows,
  kpis,
  totalCharges,
}: {
  rows: BookingRevenueRow[];
  kpis: { totalRevenue: number; totalBilled: number; totalUnbilled: number; avgPerBooking: number };
  totalCharges: number;
}) {
  return (
    <div
      className="rounded-[10px] overflow-hidden"
      style={{
        border: "1px solid #E5E9F0",
        backgroundColor: "#FFFFFF",
      }}
    >
      <div className="overflow-x-auto">
        <table className="w-full" style={{ borderCollapse: "collapse" }}>
          {/* ── Header ── */}
          <thead>
            {/* Single-row header with colored top-accent bars as zone signals */}
            <tr
              style={{
                backgroundColor: "#F7FAF8",
                borderBottom: "1px solid #E5E9F0",
              }}
            >
              <th className="px-4 py-2 text-left text-[11px] font-semibold uppercase" style={{ color: "#667085", letterSpacing: "0.002em", width: "170px", borderTop: "2px solid var(--neuron-brand-green)" }}>Booking</th>
              <th className="px-4 py-2 text-left text-[11px] font-semibold uppercase" style={{ color: "#667085", letterSpacing: "0.002em", width: "110px", borderTop: "2px solid var(--neuron-brand-green)" }}>Service</th>
              <th className="px-4 py-2 text-left text-[11px] font-semibold uppercase" style={{ color: "#667085", letterSpacing: "0.002em", width: "200px", borderTop: "2px solid var(--neuron-brand-green)", borderRight: "2px solid #E5E9F0" }}>Client</th>
              <th className="px-4 py-2 text-right text-[11px] font-semibold uppercase" style={{ color: "#667085", letterSpacing: "0.002em", width: "120px", borderTop: "2px solid #0F766E", backgroundColor: ZONE_TINT.billed }}>Billed</th>
              <th className="px-4 py-2 text-right text-[11px] font-semibold uppercase" style={{ color: "#667085", letterSpacing: "0.002em", width: "120px", borderTop: "2px solid #0F766E", backgroundColor: ZONE_TINT.unbilled }}>Unbilled</th>
              <th className="px-4 py-2 text-right text-[11px] font-semibold uppercase" style={{ color: "#667085", letterSpacing: "0.002em", width: "130px", borderTop: "2px solid #0F766E", backgroundColor: ZONE_TINT.revenue }}>Revenue</th>
              <th className="px-4 py-2 text-center text-[11px] font-semibold uppercase" style={{ color: "#667085", letterSpacing: "0.002em", width: "80px", borderTop: "2px solid #CBD5E1" }}># Charges</th>
            </tr>
          </thead>

          {/* ── Body ── */}
          <tbody>
            {rows.map((row, idx) => (
              <tr
                key={row.id}
                className="transition-colors"
                style={{
                  borderBottom: "1px solid #E5E9F0",
                  borderLeft: row.totalUnbilled > row.totalBilled
                    ? "3px solid #D97706"
                    : "3px solid var(--neuron-brand-green)",
                  backgroundColor: idx % 2 === 1 ? "rgba(0, 0, 0, 0.015)" : undefined,
                }}
              >
                {/* Composite: Booking ID + Date */}
                <td className="px-4 py-1.5" style={{ verticalAlign: "center" }}>
                  <div className="text-[12px] font-semibold" style={{ color: "#101828", lineHeight: "1.3" }}>{row.bookingId}</div>
                  <div className="text-[10px]" style={{ color: "#667085", lineHeight: "1.3" }}>{formatDate(row.billingDate)}</div>
                </td>
                <td className="px-4 py-1.5 text-[11px] font-medium" style={{ color: "#667085" }}>
                  {row.serviceType}
                </td>
                {/* Composite: Customer + Project */}
                <td className="px-4 py-1.5" style={{ borderRight: "2px solid #E5E9F0", maxWidth: "200px" }}>
                  <div className="text-[12px] font-medium truncate" style={{ color: "#101828", lineHeight: "1.3" }}>{row.customerName}</div>
                  <div className="text-[10px]" style={{ color: "#667085", lineHeight: "1.3" }}>{row.projectNumber}</div>
                </td>
                {/* Financial cells with zone tinting */}
                <td
                  className="px-4 py-1.5 text-right text-[12px] font-medium tabular-nums"
                  style={{ color: "#0F766E", backgroundColor: ZONE_TINT.billed }}
                >
                  {fmtAcct(row.totalBilled)}
                </td>
                <td
                  className="px-4 py-1.5 text-right text-[12px] font-medium tabular-nums"
                  style={{ color: row.totalUnbilled > 0 ? "#D97706" : "#667085", backgroundColor: ZONE_TINT.unbilled }}
                >
                  {fmtAcct(row.totalUnbilled)}
                </td>
                <td
                  className="px-4 py-1.5 text-right text-[12px] font-semibold tabular-nums"
                  style={{ color: "#101828", backgroundColor: ZONE_TINT.revenue }}
                >
                  {formatCurrencyFull(row.totalRevenue)}
                </td>
                <td className="px-4 py-1.5 text-center text-[11px] tabular-nums" style={{ color: "#667085" }}>
                  {row.chargeCount}
                </td>
              </tr>
            ))}
          </tbody>

          {/* ── Totals Row — double-rule top border (accounting convention) ── */}
          <tfoot>
            <tr
              style={{
                backgroundColor: "#EEF2EF",
                borderTop: "3px double var(--neuron-brand-green)",
                borderLeft: "3px solid var(--neuron-brand-green)",
              }}
            >
              <td
                className="px-4 py-3 text-[12px] font-bold uppercase"
                colSpan={3}
                style={{ color: "var(--neuron-ink-primary)", borderRight: "2px solid #E5E9F0", letterSpacing: "0.02em" }}
              >
                Totals
              </td>
              <td
                className="px-4 py-3 text-right text-[13px] font-bold tabular-nums"
                style={{ color: "#0F766E", backgroundColor: ZONE_TINT.billed }}
              >
                {fmtAcct(kpis.totalBilled)}
              </td>
              <td
                className="px-4 py-3 text-right text-[13px] font-bold tabular-nums"
                style={{ color: kpis.totalUnbilled > 0 ? "#D97706" : "#667085", backgroundColor: ZONE_TINT.unbilled }}
              >
                {fmtAcctParens(kpis.totalUnbilled)}
              </td>
              <td
                className="px-4 py-3 text-right text-[13px] font-bold tabular-nums"
                style={{ color: "#101828", backgroundColor: ZONE_TINT.revenue }}
              >
                {formatCurrencyFull(kpis.totalRevenue)}
              </td>
              <td
                className="px-4 py-3 text-center text-[12px] font-bold tabular-nums"
                style={{ color: "#667085" }}
              >
                {totalCharges}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}

// ── Grouped Ledger Table ──

function GroupedLedgerTable({
  groups,
  kpis,
  totalCharges,
}: {
  groups: { label: string; items: BookingRevenueRow[]; subtotal: number }[];
  kpis: { totalRevenue: number; totalBilled: number; totalUnbilled: number; avgPerBooking: number };
  totalCharges: number;
}) {
  return (
    <div
      className="rounded-[10px] overflow-hidden"
      style={{
        border: "1px solid #E5E9F0",
        backgroundColor: "#FFFFFF",
      }}
    >
      <div className="overflow-x-auto">
        <table className="w-full" style={{ borderCollapse: "collapse" }}>
          {/* ── Header ── */}
          <thead>
            {/* Single-row header with colored top-accent bars as zone signals */}
            <tr
              style={{
                backgroundColor: "#F7FAF8",
                borderBottom: "1px solid #E5E9F0",
              }}
            >
              <th className="px-4 py-2 text-left text-[11px] font-semibold uppercase" style={{ color: "#667085", letterSpacing: "0.002em", width: "170px", borderTop: "2px solid var(--neuron-brand-green)" }}>Booking</th>
              <th className="px-4 py-2 text-left text-[11px] font-semibold uppercase" style={{ color: "#667085", letterSpacing: "0.002em", width: "110px", borderTop: "2px solid var(--neuron-brand-green)" }}>Service</th>
              <th className="px-4 py-2 text-left text-[11px] font-semibold uppercase" style={{ color: "#667085", letterSpacing: "0.002em", width: "200px", borderTop: "2px solid var(--neuron-brand-green)", borderRight: "2px solid #E5E9F0" }}>Client</th>
              <th className="px-4 py-2 text-right text-[11px] font-semibold uppercase" style={{ color: "#667085", letterSpacing: "0.002em", width: "120px", borderTop: "2px solid #0F766E", backgroundColor: ZONE_TINT.billed }}>Billed</th>
              <th className="px-4 py-2 text-right text-[11px] font-semibold uppercase" style={{ color: "#667085", letterSpacing: "0.002em", width: "120px", borderTop: "2px solid #0F766E", backgroundColor: ZONE_TINT.unbilled }}>Unbilled</th>
              <th className="px-4 py-2 text-right text-[11px] font-semibold uppercase" style={{ color: "#667085", letterSpacing: "0.002em", width: "130px", borderTop: "2px solid #0F766E", backgroundColor: ZONE_TINT.revenue }}>Revenue</th>
              <th className="px-4 py-2 text-center text-[11px] font-semibold uppercase" style={{ color: "#667085", letterSpacing: "0.002em", width: "80px", borderTop: "2px solid #CBD5E1" }}># Charges</th>
            </tr>
          </thead>

          {/* ── Grouped Body ── */}
          <tbody>
            {groups.map((group, groupIdx) => {
              const groupBilled = group.items.reduce((s, r) => s + r.totalBilled, 0);
              const groupUnbilled = group.items.reduce((s, r) => s + r.totalUnbilled, 0);
              const groupCharges = group.items.reduce((s, r) => s + r.chargeCount, 0);

              return (
                <React.Fragment key={group.label}>
                  {/* Group header row */}
                  <tr
                    style={{
                      backgroundColor: "var(--neuron-state-selected)",
                      borderBottom: "1px solid #E5E9F0",
                      borderTop: groupIdx > 0 ? "2px solid #E5E9F0" : undefined,
                    }}
                  >
                    <td colSpan={3} className="px-4 py-2" style={{ borderRight: "2px solid #E5E9F0" }}>
                      <div className="flex items-center gap-2">
                        <span className="text-[12px] font-semibold" style={{ color: "var(--neuron-ink-primary)" }}>
                          {group.label}
                        </span>
                        <span
                          className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
                          style={{ backgroundColor: "var(--neuron-ui-divider)", color: "var(--neuron-ink-muted)" }}
                        >
                          {group.items.length}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-2 text-right text-[11px] font-semibold tabular-nums" style={{ color: "#0F766E", backgroundColor: ZONE_TINT.billed }}>
                      {fmtAcct(groupBilled)}
                    </td>
                    <td className="px-4 py-2 text-right text-[11px] font-semibold tabular-nums" style={{ color: groupUnbilled > 0 ? "#D97706" : "#667085", backgroundColor: ZONE_TINT.unbilled }}>
                      {fmtAcct(groupUnbilled)}
                    </td>
                    <td className="px-4 py-2 text-right text-[12px] font-bold tabular-nums" style={{ color: "var(--neuron-brand-green)", backgroundColor: ZONE_TINT.revenue }}>
                      {formatCurrencyFull(group.subtotal)}
                    </td>
                    <td className="px-4 py-2 text-center text-[11px] font-semibold tabular-nums" style={{ color: "#667085" }}>
                      {groupCharges}
                    </td>
                  </tr>

                  {/* Data rows */}
                  {group.items.map((row, rowIdx) => (
                    <tr
                      key={row.id}
                      className="transition-colors"
                      style={{
                        borderBottom: "1px solid #E5E9F0",
                        borderLeft: row.totalUnbilled > row.totalBilled
                          ? "3px solid #D97706"
                          : "3px solid var(--neuron-brand-green)",
                        backgroundColor: rowIdx % 2 === 1 ? "rgba(0, 0, 0, 0.015)" : undefined,
                      }}
                    >
                      <td className="px-4 py-1.5" style={{ verticalAlign: "center" }}>
                        <div className="text-[12px] font-semibold" style={{ color: "#101828", lineHeight: "1.3" }}>{row.bookingId}</div>
                        <div className="text-[10px]" style={{ color: "#667085", lineHeight: "1.3" }}>{formatDate(row.billingDate)}</div>
                      </td>
                      <td className="px-4 py-1.5 text-[11px] font-medium" style={{ color: "#667085" }}>{row.serviceType}</td>
                      <td className="px-4 py-1.5" style={{ borderRight: "2px solid #E5E9F0", maxWidth: "200px" }}>
                        <div className="text-[12px] font-medium truncate" style={{ color: "#101828", lineHeight: "1.3" }}>{row.customerName}</div>
                        <div className="text-[10px]" style={{ color: "#667085", lineHeight: "1.3" }}>{row.projectNumber}</div>
                      </td>
                      <td className="px-4 py-1.5 text-right text-[12px] font-medium tabular-nums" style={{ color: "#0F766E", backgroundColor: ZONE_TINT.billed }}>{fmtAcct(row.totalBilled)}</td>
                      <td className="px-4 py-1.5 text-right text-[12px] font-medium tabular-nums" style={{ color: row.totalUnbilled > 0 ? "#D97706" : "#667085", backgroundColor: ZONE_TINT.unbilled }}>{fmtAcct(row.totalUnbilled)}</td>
                      <td className="px-4 py-1.5 text-right text-[12px] font-semibold tabular-nums" style={{ color: "#101828", backgroundColor: ZONE_TINT.revenue }}>{formatCurrencyFull(row.totalRevenue)}</td>
                      <td className="px-4 py-1.5 text-center text-[11px] tabular-nums" style={{ color: "#667085" }}>{row.chargeCount}</td>
                    </tr>
                  ))}
                </React.Fragment>
              );
            })}
          </tbody>

          {/* ── Grand Totals Row — double-rule top border ── */}
          <tfoot>
            <tr
              style={{
                backgroundColor: "#EEF2EF",
                borderTop: "3px double var(--neuron-brand-green)",
                borderLeft: "3px solid var(--neuron-brand-green)",
              }}
            >
              <td className="px-4 py-3 text-[12px] font-bold uppercase" colSpan={3} style={{ color: "var(--neuron-ink-primary)", borderRight: "2px solid #E5E9F0", letterSpacing: "0.02em" }}>
                Grand Totals
              </td>
              <td className="px-4 py-3 text-right text-[13px] font-bold tabular-nums" style={{ color: "#0F766E", backgroundColor: ZONE_TINT.billed }}>{fmtAcct(kpis.totalBilled)}</td>
              <td className="px-4 py-3 text-right text-[13px] font-bold tabular-nums" style={{ color: kpis.totalUnbilled > 0 ? "#D97706" : "#667085", backgroundColor: ZONE_TINT.unbilled }}>{fmtAcctParens(kpis.totalUnbilled)}</td>
              <td className="px-4 py-3 text-right text-[13px] font-bold tabular-nums" style={{ color: "#101828", backgroundColor: ZONE_TINT.revenue }}>{formatCurrencyFull(kpis.totalRevenue)}</td>
              <td className="px-4 py-3 text-center text-[12px] font-bold tabular-nums" style={{ color: "#667085" }}>{totalCharges}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}

// ── Report Summary — Stepped Deduction Computation Block ──

function ReportSummary({
  kpis,
  bookingCount,
  billedPct,
  unbilledPct,
}: {
  kpis: { totalRevenue: number; totalBilled: number; totalUnbilled: number; avgPerBooking: number };
  bookingCount: number;
  billedPct: number;
  unbilledPct: number;
}) {
  return (
    <div
      className="mt-4 rounded-[10px] overflow-hidden"
      style={{
        border: "1px solid #E5E9F0",
        backgroundColor: "#FFFFFF",
      }}
    >
      <div className="px-6 py-4">
        <p
          className="text-[10px] font-semibold uppercase mb-4"
          style={{ color: "var(--neuron-ink-muted)", letterSpacing: "0.04em" }}
        >
          Summary Computation
        </p>

        {/* Stepped deduction ledger */}
        <div style={{ maxWidth: 420 }}>
          {/* Total Revenue */}
          <div className="flex items-baseline justify-between mb-1">
            <span className="text-[12px] font-semibold uppercase" style={{ color: "var(--neuron-ink-primary)", letterSpacing: "0.01em" }}>
              Total Revenue
            </span>
            <span className="text-[13px] font-bold tabular-nums" style={{ color: "var(--neuron-ink-primary)" }}>
              {formatCurrencyFull(kpis.totalRevenue)}
            </span>
          </div>

          {/* Indented breakdown */}
          <div className="ml-4 space-y-0.5 mb-1">
            <div className="flex items-baseline justify-between">
              <span className="text-[11px]" style={{ color: "var(--neuron-ink-muted)" }}>Billed Revenue</span>
              <span className="text-[11px] font-medium tabular-nums" style={{ color: "#0F766E" }}>{fmtAcct(kpis.totalBilled)}</span>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-[11px]" style={{ color: "var(--neuron-ink-muted)" }}>Unbilled Revenue</span>
              <span className="text-[11px] font-medium tabular-nums" style={{ color: kpis.totalUnbilled > 0 ? "#D97706" : "#667085" }}>{fmtAcctParens(kpis.totalUnbilled)}</span>
            </div>
          </div>

          {/* Divider */}
          <div className="flex justify-end">
            <div style={{ width: 140, borderTop: "1px solid #E5E9F0", marginTop: 4, marginBottom: 6 }} />
          </div>

          {/* LESS: Unbilled at risk */}
          <div className="flex items-baseline justify-between mb-1">
            <span className="text-[11px] font-medium" style={{ color: "var(--neuron-ink-secondary)" }}>
              LESS: Unbilled at Risk
            </span>
            <span className="text-[11px] font-medium tabular-nums" style={{ color: kpis.totalUnbilled > 0 ? "#D97706" : "#667085" }}>
              {fmtAcctParens(kpis.totalUnbilled)}
            </span>
          </div>

          {/* Divider */}
          <div className="flex justify-end">
            <div style={{ width: 140, borderTop: "1px solid #E5E9F0", marginTop: 4, marginBottom: 6 }} />
          </div>

          {/* Net Billed Revenue — double-underline */}
          <div className="flex items-baseline justify-between">
            <span className="text-[12px] font-bold uppercase" style={{ color: "var(--neuron-ink-primary)", letterSpacing: "0.01em" }}>
              Net Billed Revenue
            </span>
            <span className="text-[14px] font-bold tabular-nums" style={{ color: "var(--neuron-brand-green)" }}>
              {formatCurrencyFull(kpis.totalBilled)}
            </span>
          </div>
          <div className="flex justify-end mt-1">
            <div style={{ width: 140, borderTop: "3px double var(--neuron-brand-green)" }} />
          </div>

          {/* Secondary metrics */}
          <div className="mt-4 pt-3 space-y-1" style={{ borderTop: "1px solid #E5E9F0" }}>
            <div className="flex items-baseline justify-between">
              <span className="text-[11px]" style={{ color: "var(--neuron-ink-muted)" }}>Billing Rate</span>
              <span className="text-[11px] font-semibold tabular-nums" style={{ color: "var(--neuron-ink-secondary)" }}>{billedPct}%</span>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-[11px]" style={{ color: "var(--neuron-ink-muted)" }}>Avg per Booking</span>
              <span className="text-[11px] font-semibold tabular-nums" style={{ color: "var(--neuron-ink-secondary)" }}>{formatCurrencyFull(kpis.avgPerBooking)}</span>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-[11px]" style={{ color: "var(--neuron-ink-muted)" }}>Total Bookings</span>
              <span className="text-[11px] font-semibold tabular-nums" style={{ color: "var(--neuron-ink-secondary)" }}>{bookingCount}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Report Footer ──

function ReportFooter({
  periodLabel,
  bookingCount,
}: {
  periodLabel: string;
  bookingCount: number;
}) {
  return (
    <>
      {/* On-screen footer */}
      <div
        className="flex items-center justify-between px-4 py-2.5 mt-3 rounded-md"
        style={{
          backgroundColor: "var(--neuron-bg-page)",
          border: "1px solid var(--neuron-ui-divider)",
        }}
      >
        <p className="text-[11px]" style={{ color: "var(--neuron-ink-muted)" }}>
          {periodLabel} · {bookingCount} booking{bookingCount !== 1 ? "s" : ""}
        </p>
        <p className="text-[10px]" style={{ color: "var(--neuron-ink-muted)" }}>
          FWD = Forwarding · BRK = Brokerage · TRK = Trucking · MI = Marine Insurance
        </p>
      </div>

      {/* Print-only signature block */}
      <div className="hidden print:block mt-10">
        <div className="flex justify-between gap-8 px-4">
          {["Prepared By", "Reviewed By", "Approved By"].map((label) => (
            <div key={label} className="flex-1 text-center">
              <div style={{ borderBottom: "1px solid #101828", marginBottom: 6, height: 40 }} />
              <p className="text-[11px] font-medium" style={{ color: "var(--neuron-ink-secondary)" }}>{label}:</p>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

// ── Loading Skeleton ──

function LedgerSkeleton() {
  return (
    <div
      className="rounded-[10px] overflow-hidden"
      style={{ border: "1px solid #E5E9F0", backgroundColor: "#FFFFFF" }}
    >
      {/* Header skeleton */}
      <div
        className="h-[38px]"
        style={{
          backgroundColor: "#F7FAF8",
          borderBottom: "1px solid #E5E9F0",
          borderTop: "2px solid var(--neuron-brand-green)",
        }}
      />
      {/* Row skeletons */}
      {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
        <div
          key={i}
          className="h-[34px] animate-pulse"
          style={{
            backgroundColor: i % 2 === 0 ? "#FFFFFF" : "#FAFCFB",
            borderBottom: "1px solid #E5E9F0",
          }}
        />
      ))}
      {/* Totals skeleton */}
      <div
        className="h-[38px] animate-pulse"
        style={{
          backgroundColor: "#F7FAF8",
          borderTop: "2px solid var(--neuron-brand-green)",
        }}
      />
    </div>
  );
}

// ── KPI Card ──

function KpiCard({
  icon,
  label,
  value,
  accentColor,
  subtitle,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  accentColor: string;
  subtitle?: string;
}) {
  return (
    <div
      className="flex-1 min-w-0 rounded-lg px-3 py-2.5"
      style={{
        backgroundColor: "#F7FAF8",
        borderLeft: `3px solid ${accentColor}`,
      }}
    >
      <div className="flex items-center gap-1.5 mb-0.5">
        <span style={{ color: accentColor, display: "flex", alignItems: "center" }}>{icon}</span>
        <p
          className="text-[10px] font-semibold uppercase"
          style={{ color: "var(--neuron-ink-muted)", letterSpacing: "0.03em" }}
        >
          {label}
        </p>
      </div>
      <p
        className="text-[15px] font-bold tabular-nums"
        style={{ color: "var(--neuron-ink-primary)" }}
      >
        {value}
      </p>
      {subtitle && (
        <p className="text-[10px]" style={{ color: "var(--neuron-ink-muted)" }}>
          {subtitle}
        </p>
      )}
    </div>
  );
}