/**
 * VitalSignsStrip — Zone 1 of the Financial Dashboard
 *
 * Asymmetric 2+3 layout:
 * - Top row: 2 hero cards (Net Revenue white, Net Profit dark green hero)
 * - Bottom row: 3 compact cards (Cash Collected, Outstanding AR, Pending Expenses)
 *
 * Each card shows: value, delta vs previous period (▲/▼), subtext.
 */

import { useState } from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface VitalSign {
  label: string;
  value: string;
  rawValue: number;
  previousValue: number;
  subtext: string;
  icon: LucideIcon;
  /** "positive" means higher is better (revenue), "negative" means lower is better (expenses) */
  polarity: "positive" | "negative";
  /** Optional suffix like "%" or "d" for DSO */
  suffix?: string;
  /** Mark first 2 signs as hero for large treatment */
  hero?: boolean;
  /** Dark hero card (inverted colors — dark green bg, white text) */
  darkHero?: boolean;
  /** Click handler — makes the card a clickable launchpad */
  onCardClick?: () => void;
  /** Hover hint text shown on clickable cards (e.g. "View billings →") */
  clickHint?: string;
}

interface VitalSignsStripProps {
  signs: VitalSign[];
  isLoading?: boolean;
}

function formatDelta(current: number, previous: number, polarity: "positive" | "negative"): {
  label: string;
  trend: "up" | "down" | "flat";
  isGood: boolean;
} {
  if (previous === 0 && current === 0) return { label: "—", trend: "flat", isGood: true };
  if (previous === 0) {
    // "New" — but direction depends on whether the value is positive or negative
    const trend = current > 0 ? "up" as const : "down" as const;
    const isGood = polarity === "positive" ? current > 0 : current < 0;
    return { label: "New", trend, isGood };
  }

  const pctChange = ((current - previous) / Math.abs(previous)) * 100;
  const absChange = Math.abs(pctChange);

  if (absChange < 0.5) return { label: "0%", trend: "flat", isGood: true };

  const trend = pctChange > 0 ? "up" as const : "down" as const;
  const isGood = polarity === "positive" ? pctChange > 0 : pctChange < 0;
  const label = `${absChange >= 100 ? Math.round(absChange) : absChange.toFixed(1)}%`;

  return { label, trend, isGood };
}

// ── Hero Card (large, top row) ──

function HeroCard({ sign }: { sign: VitalSign }) {
  const [isHovered, setIsHovered] = useState(false);
  const delta = formatDelta(sign.rawValue, sign.previousValue, sign.polarity);
  const TrendIcon = delta.trend === "up" ? TrendingUp : delta.trend === "down" ? TrendingDown : Minus;

  const isDark = sign.darkHero;
  const isClickable = !!sign.onCardClick;
  const isLoss = isDark && sign.rawValue < 0;

  // Top-right icon: swap to TrendingDown when in loss state
  const Icon = isLoss ? TrendingDown : sign.icon;

  // Colors for dark vs light hero — with loss (red) variant
  const bgColor = isLoss ? "#9F2323" : isDark ? "#0F766E" : "white";
  const borderColor = isLoss ? "#9F2323" : isDark ? "#0F766E" : "#E5E9F0";
  const labelColor = isDark ? "rgba(255,255,255,0.6)" : "#667085";
  const valueColor = isDark ? "#FFFFFF" : "#12332B";
  const subtextColor = isDark ? "rgba(255,255,255,0.5)" : "#9CA3AF";
  const iconBg = isDark ? "rgba(255,255,255,0.12)" : "#F0FDF4";
  const iconColor = isLoss ? "#FCA5A5" : isDark ? "#5EEAD4" : "#0F766E";

  // Delta badge colors — adapted for dark bg
  const deltaColor = delta.trend === "flat"
    ? (isDark ? "rgba(255,255,255,0.5)" : "#9CA3AF")
    : delta.isGood
      ? (isDark ? "#86EFAC" : "#16A34A")
      : (isLoss ? "#FECACA" : isDark ? "#FCA5A5" : "#EF4444");
  const deltaBg = delta.trend === "flat"
    ? (isDark ? "rgba(255,255,255,0.08)" : "#F3F4F6")
    : delta.isGood
      ? (isDark ? "rgba(134,239,172,0.15)" : "#DCFCE7")
      : (isLoss ? "rgba(254,202,202,0.15)" : isDark ? "rgba(252,165,165,0.15)" : "#FEE2E2");

  return (
    <div
      className="rounded-xl p-6 flex flex-col justify-between transition-all duration-200"
      style={{
        border: `1px solid ${borderColor}`,
        background: bgColor,
        minHeight: "148px",
        cursor: isClickable ? "pointer" : "default",
        transform: isClickable && isHovered ? "translateY(-1px)" : "none",
        boxShadow: isClickable && isHovered ? "0 2px 8px rgba(0,0,0,0.08)" : "none",
      }}
      onClick={sign.onCardClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      role={isClickable ? "button" : undefined}
      tabIndex={isClickable ? 0 : undefined}
      onKeyDown={isClickable ? (e) => e.key === "Enter" && sign.onCardClick?.() : undefined}
    >
      {/* Header row: label + icon */}
      <div className="flex items-center justify-between mb-3">
        <span
          className="text-[12px] font-semibold uppercase tracking-wider"
          style={{ color: labelColor }}
        >
          {sign.label}
        </span>
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: iconBg }}
        >
          <Icon size={16} style={{ color: iconColor }} />
        </div>
      </div>

      {/* Value — large */}
      <div
        className="text-[36px] font-bold leading-none"
        style={{ color: valueColor, letterSpacing: "-1px" }}
      >
        {sign.value}
      </div>

      {/* Delta badge + subtext */}
      <div className="flex items-center gap-2.5 mt-3">
        {delta.label !== "—" && (
          <span
            className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-semibold"
            style={{ backgroundColor: deltaBg, color: deltaColor }}
          >
            <TrendIcon size={12} />
            {delta.label}
          </span>
        )}
        <span className="text-[12px]" style={{ color: subtextColor }}>
          {sign.subtext}
        </span>
        {/* Click hint — appears on hover */}
        {isClickable && sign.clickHint && (
          <span
            className="text-[11px] font-medium ml-auto transition-opacity duration-200"
            style={{
              color: isDark ? "rgba(255,255,255,0.7)" : "#0F766E",
              opacity: isHovered ? 1 : 0,
            }}
          >
            {sign.clickHint}
          </span>
        )}
      </div>
    </div>
  );
}

// ── Compact Card (smaller, bottom row) ──

function CompactCard({ sign }: { sign: VitalSign }) {
  const [isHovered, setIsHovered] = useState(false);
  const Icon = sign.icon;
  const delta = formatDelta(sign.rawValue, sign.previousValue, sign.polarity);
  const TrendIcon = delta.trend === "up" ? TrendingUp : delta.trend === "down" ? TrendingDown : Minus;

  const isClickable = !!sign.onCardClick;

  const deltaColor = delta.trend === "flat"
    ? "#9CA3AF"
    : delta.isGood ? "#16A34A" : "#EF4444";
  const deltaBg = delta.trend === "flat"
    ? "#F3F4F6"
    : delta.isGood ? "#DCFCE7" : "#FEE2E2";

  return (
    <div
      className="rounded-xl p-5 flex flex-col justify-between transition-all duration-200"
      style={{
        border: "1px solid var(--theme-border-default)",
        background: "var(--theme-bg-surface)",
        minHeight: "112px",
        cursor: isClickable ? "pointer" : "default",
        transform: isClickable && isHovered ? "translateY(-1px)" : "none",
        boxShadow: isClickable && isHovered ? "0 2px 8px rgba(0,0,0,0.08)" : "none",
      }}
      onClick={sign.onCardClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      role={isClickable ? "button" : undefined}
      tabIndex={isClickable ? 0 : undefined}
      onKeyDown={isClickable ? (e) => e.key === "Enter" && sign.onCardClick?.() : undefined}
    >
      {/* Header row: label + icon */}
      <div className="flex items-center justify-between mb-1.5">
        <span
          className="text-[11px] font-semibold uppercase tracking-wider"
          style={{ color: "var(--theme-text-muted)" }}
        >
          {sign.label}
        </span>
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: "#F0FDF4" }}
        >
          <Icon size={14} style={{ color: "var(--theme-action-primary-bg)" }} />
        </div>
      </div>

      {/* Value — medium */}
      <div
        className="text-[22px] font-bold leading-tight"
        style={{ color: "var(--theme-text-primary)", letterSpacing: "-0.5px" }}
      >
        {sign.value}
      </div>

      {/* Delta badge + subtext */}
      <div className="flex items-center gap-2 mt-1.5">
        {delta.label !== "—" && (
          <span
            className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[10px] font-semibold"
            style={{ backgroundColor: deltaBg, color: deltaColor }}
          >
            <TrendIcon size={10} />
            {delta.label}
          </span>
        )}
        <span className="text-[11px]" style={{ color: "var(--theme-text-muted)" }}>
          {sign.subtext}
        </span>
        {/* Click hint — appears on hover */}
        {isClickable && sign.clickHint && (
          <span
            className="text-[10px] font-medium ml-auto transition-opacity duration-200"
            style={{
              color: "var(--theme-action-primary-bg)",
              opacity: isHovered ? 1 : 0,
            }}
          >
            {sign.clickHint}
          </span>
        )}
      </div>
    </div>
  );
}

// ── Main Component ──

export function VitalSignsStrip({ signs, isLoading }: VitalSignsStripProps) {
  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        {/* Hero skeleton row */}
        <div className="grid grid-cols-2 gap-4">
          {[0, 1].map((i) => (
            <div
              key={i}
              className="rounded-xl p-6 animate-pulse"
              style={{
                border: "1px solid var(--theme-border-default)",
                background: i === 1 ? "var(--theme-action-primary-bg)" : "var(--theme-bg-surface)",
                minHeight: "148px",
              }}
            >
              <div className={`h-3 w-24 rounded mb-4 ${i === 1 ? "bg-white/20" : "bg-[var(--theme-bg-surface-tint)]"}`} />
              <div className={`h-9 w-36 rounded mb-3 ${i === 1 ? "bg-white/15" : "bg-[var(--theme-bg-surface-tint)]"}`} />
              <div className={`h-3 w-28 rounded ${i === 1 ? "bg-white/10" : "bg-[var(--theme-bg-surface-subtle)]"}`} />
            </div>
          ))}
        </div>
        {/* Compact skeleton row */}
        <div className="grid grid-cols-3 gap-4">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="rounded-xl p-5 animate-pulse"
              style={{ border: "1px solid var(--theme-border-default)", background: "var(--theme-bg-surface)", minHeight: "112px" }}
            >
              <div className="h-3 w-20 bg-[var(--theme-bg-surface-tint)] rounded mb-3" />
              <div className="h-6 w-28 bg-[var(--theme-bg-surface-tint)] rounded mb-2" />
              <div className="h-3 w-24 bg-[var(--theme-bg-surface-subtle)] rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Split into hero (first 2) and compact (rest)
  const heroSigns = signs.slice(0, 2);
  const compactSigns = signs.slice(2);

  return (
    <div className="flex flex-col gap-4">
      {/* Top row: 2 hero cards */}
      <div className="grid grid-cols-2 gap-4">
        {heroSigns.map((sign) => (
          <HeroCard key={sign.label} sign={sign} />
        ))}
      </div>

      {/* Bottom row: 3 compact cards */}
      {compactSigns.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          {compactSigns.map((sign) => (
            <CompactCard key={sign.label} sign={sign} />
          ))}
        </div>
      )}
    </div>
  );
}