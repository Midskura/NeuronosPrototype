/**
 * AttentionPanel — Zone 2 of the Financial Dashboard
 *
 * Action Items queue — each row is a clickable surface that navigates
 * to the relevant tab. No explicit buttons; hover reveals a subtle
 * navigation hint + chevron. Dismiss is a hover-only × icon.
 *
 * Collapsible: auto-expands if danger/warning items exist,
 * collapsed by default if all items are success/info.
 */

import { useState, useMemo } from "react";
import { AlertTriangle, ChevronRight, ChevronDown, ChevronUp, X } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface AttentionItem {
  severity: "danger" | "warning" | "success" | "info";
  icon: LucideIcon;
  label: string;
  detail: string;
  /** Second line — the single most actionable data point */
  detailLine?: string;
  /** Primary action CTA label (verb-based: "Follow Up", "Create Invoice") — shown as hover hint */
  actionLabel?: string;
  onAction?: () => void;
  /** Secondary action label (unused in new design, kept for API compat) */
  actionLabel2?: string;
  onAction2?: () => void;
  /** Unique key for dismiss tracking */
  dismissKey?: string;
}

interface AttentionPanelProps {
  items: AttentionItem[];
}

const SEVERITY_COLORS: Record<string, { dot: string; bg: string; border: string }> = {
  danger:  { dot: "#EF4444", bg: "var(--theme-status-danger-bg)", border: "#FECACA" },
  warning: { dot: "#F59E0B", bg: "var(--theme-status-warning-bg)", border: "#FDE68A" },
  success: { dot: "#16A34A", bg: "#F0FDF4", border: "#BBF7D0" },
  info:    { dot: "#6B7A76", bg: "#F8FAFC", border: "#E2E8F0" },
};

const SEVERITY_PRIORITY: Record<string, number> = {
  danger: 0,
  warning: 1,
  info: 2,
  success: 3,
};

export function AttentionPanel({ items }: AttentionPanelProps) {
  if (items.length === 0) return null;

  // Dismiss state (per session)
  const [dismissedKeys, setDismissedKeys] = useState<Set<string>>(new Set());
  const [showDismissed, setShowDismissed] = useState(false);

  // Determine if there are actionable (danger/warning) items
  const hasActionable = useMemo(
    () => items.some((i) => i.severity === "danger" || i.severity === "warning"),
    [items]
  );

  const [isExpanded, setIsExpanded] = useState(hasActionable);

  // Sort items: danger first, then warning, info, success
  const sortedItems = useMemo(
    () => [...items].sort((a, b) => (SEVERITY_PRIORITY[a.severity] ?? 9) - (SEVERITY_PRIORITY[b.severity] ?? 9)),
    [items]
  );

  // Split into active and dismissed
  const activeItems = useMemo(
    () => sortedItems.filter((item) => !item.dismissKey || !dismissedKeys.has(item.dismissKey)),
    [sortedItems, dismissedKeys]
  );
  const dismissedItems = useMemo(
    () => sortedItems.filter((item) => item.dismissKey && dismissedKeys.has(item.dismissKey)),
    [sortedItems, dismissedKeys]
  );

  // Count by severity for collapsed summary
  const dangerCount = activeItems.filter((i) => i.severity === "danger").length;
  const warningCount = activeItems.filter((i) => i.severity === "warning").length;
  const successCount = activeItems.filter((i) => i.severity === "success").length;

  // Header accent color based on worst active severity
  const worstSeverity = activeItems[0]?.severity || "info";
  const accentColor = SEVERITY_COLORS[worstSeverity]?.dot || "#6B7A76";

  const handleDismiss = (key: string) => {
    setDismissedKeys((prev) => new Set([...prev, key]));
  };

  return (
    <div
      className="rounded-xl overflow-hidden transition-all duration-200"
      style={{ border: "1px solid var(--theme-border-default)", background: "var(--theme-bg-surface)" }}
    >
      {/* Header — always visible, clickable to toggle */}
      <button
        className="w-full px-5 py-3 flex items-center gap-2.5 cursor-pointer transition-colors hover:bg-[var(--theme-bg-surface-subtle)]/50"
        style={{
          borderBottom: isExpanded ? "1px solid var(--theme-border-default)" : "none",
          background: isExpanded ? "#F8F9FB" : "white",
        }}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {/* Severity accent dot */}
        <div
          className="w-2 h-2 rounded-full flex-shrink-0"
          style={{ backgroundColor: accentColor }}
        />

        <AlertTriangle size={14} style={{ color: "var(--theme-text-muted)" }} />
        <span
          className="text-[12px] font-semibold uppercase tracking-wider"
          style={{ color: "var(--theme-text-muted)" }}
        >
          Action Items
        </span>

        {/* Active count badge */}
        {activeItems.length > 0 && (
          <span
            className="px-1.5 py-0.5 rounded text-[10px] font-semibold"
            style={{ backgroundColor: "var(--theme-bg-surface-subtle)", color: "var(--theme-text-muted)" }}
          >
            {activeItems.filter((i) => i.severity !== "success").length} pending
          </span>
        )}

        {/* Collapsed summary badges */}
        {!isExpanded && (
          <div className="flex items-center gap-1.5 ml-2">
            {dangerCount > 0 && (
              <span
                className="px-1.5 py-0.5 rounded text-[10px] font-semibold"
                style={{ backgroundColor: "var(--theme-status-danger-bg)", color: "var(--theme-status-danger-fg)" }}
              >
                {dangerCount} critical
              </span>
            )}
            {warningCount > 0 && (
              <span
                className="px-1.5 py-0.5 rounded text-[10px] font-semibold"
                style={{ backgroundColor: "var(--theme-status-warning-bg)", color: "var(--theme-status-warning-fg)" }}
              >
                {warningCount} warning{warningCount > 1 ? "s" : ""}
              </span>
            )}
            {dangerCount === 0 && warningCount === 0 && successCount > 0 && (
              <span
                className="px-1.5 py-0.5 rounded text-[10px] font-semibold"
                style={{ backgroundColor: "var(--theme-status-success-bg)", color: "#16A34A" }}
              >
                All clear
              </span>
            )}
          </div>
        )}

        <div className="flex-1" />

        {/* Expand/collapse icon */}
        {isExpanded ? (
          <ChevronUp size={14} style={{ color: "var(--theme-text-muted)" }} />
        ) : (
          <ChevronDown size={14} style={{ color: "var(--theme-text-muted)" }} />
        )}
      </button>

      {/* Alert rows — visible when expanded */}
      {isExpanded && (
        <div>
          {activeItems.map((item, idx) => {
            const Icon = item.icon;
            const colors = SEVERITY_COLORS[item.severity] || SEVERITY_COLORS.info;
            const isSuccess = item.severity === "success";
            const isClickable = !!item.onAction;

            return (
              <div
                key={item.dismissKey || idx}
                className={`group relative px-5 py-3 transition-all duration-150 ${
                  isClickable ? "cursor-pointer" : ""
                }`}
                style={{
                  borderBottom: idx < activeItems.length - 1 ? "1px solid var(--theme-border-subtle)" : "none",
                }}
                onClick={isClickable ? item.onAction : undefined}
                onMouseEnter={(e) => {
                  if (isClickable) {
                    e.currentTarget.style.backgroundColor = "#F8FAFB";
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "transparent";
                }}
              >
                {/* Line 1: Icon + Label + Amount badge + Chevron */}
                <div className="flex items-center gap-3">
                  {/* Severity dot */}
                  <div
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ backgroundColor: colors.dot }}
                  />

                  {/* Icon */}
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: colors.bg }}
                  >
                    <Icon size={14} style={{ color: colors.dot }} />
                  </div>

                  {/* Label */}
                  <span
                    className="text-[13px] font-medium flex-1"
                    style={{ color: "var(--theme-text-primary)" }}
                  >
                    {item.label}
                  </span>

                  {/* Detail (amount/count) */}
                  <span
                    className="text-[13px] font-semibold tabular-nums"
                    style={{ color: colors.dot }}
                  >
                    {item.detail}
                  </span>

                  {/* Chevron — visible on hover for clickable rows */}
                  {isClickable && (
                    <ChevronRight
                      size={14}
                      className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-150"
                      style={{ color: "var(--theme-text-muted)" }}
                    />
                  )}
                </div>

                {/* Line 2: Detail line + hover navigation hint */}
                {(item.detailLine || item.actionLabel) && !isSuccess && (
                  <div className="flex items-center gap-3 mt-1.5 ml-[46px]">
                    {/* Detail line */}
                    {item.detailLine && (
                      <span
                        className="text-[11px] flex-1"
                        style={{ color: "var(--theme-text-muted)" }}
                      >
                        {item.detailLine}
                      </span>
                    )}

                    {/* Hover navigation hint — replaces the old button */}
                    {/* Removed: the row click is the action, no text hint needed */}
                  </div>
                )}

                {/* Dismiss × — hover-only, top-right corner */}
                {item.dismissKey && !isSuccess && (
                  <button
                    className="absolute top-2.5 right-2 w-5 h-5 flex items-center justify-center rounded-full opacity-0 group-hover:opacity-100 transition-all duration-150 cursor-pointer hover:bg-[var(--theme-state-hover)]"
                    style={{ color: "#C4C9D4" }}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDismiss(item.dismissKey!);
                    }}
                    title="Dismiss for this session"
                  >
                    <X size={11} />
                  </button>
                )}
              </div>
            );
          })}

          {/* Dismissed section */}
          {dismissedItems.length > 0 && (
            <div style={{ borderTop: "1px solid var(--theme-border-subtle)" }}>
              <button
                className="w-full px-5 py-2 flex items-center gap-2 cursor-pointer hover:bg-[var(--theme-bg-surface-subtle)]/30 transition-colors"
                onClick={() => setShowDismissed(!showDismissed)}
              >
                <span className="text-[10px] font-medium" style={{ color: "#B4B9C4" }}>
                  Dismissed ({dismissedItems.length})
                </span>
                <ChevronRight
                  size={10}
                  className="transition-transform duration-200"
                  style={{
                    color: "var(--theme-border-default)",
                    transform: showDismissed ? "rotate(90deg)" : "rotate(0deg)",
                  }}
                />
              </button>

              {showDismissed && (
                <div>
                  {dismissedItems.map((item, idx) => {
                    const Icon = item.icon;
                    const colors = SEVERITY_COLORS[item.severity] || SEVERITY_COLORS.info;

                    return (
                      <div
                        key={item.dismissKey || idx}
                        className="px-5 py-2 flex items-center gap-3 opacity-50"
                        style={{
                          borderBottom: idx < dismissedItems.length - 1 ? "1px solid var(--theme-border-subtle)" : "none",
                        }}
                      >
                        <div
                          className="w-2 h-2 rounded-full flex-shrink-0"
                          style={{ backgroundColor: colors.dot }}
                        />
                        <div
                          className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0"
                          style={{ backgroundColor: colors.bg }}
                        >
                          <Icon size={12} style={{ color: colors.dot }} />
                        </div>
                        <span
                          className="text-[12px] font-medium flex-1 line-through"
                          style={{ color: "var(--theme-text-muted)" }}
                        >
                          {item.label}
                        </span>
                        <button
                          className="text-[10px] font-medium cursor-pointer hover:underline"
                          style={{ color: "var(--theme-text-muted)" }}
                          onClick={() => {
                            setDismissedKeys((prev) => {
                              const next = new Set(prev);
                              next.delete(item.dismissKey!);
                              return next;
                            });
                          }}
                        >
                          Restore
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}