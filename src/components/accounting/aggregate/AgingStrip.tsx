/**
 * AgingStrip — Clickable proportional aging bucket bar.
 * 
 * Shows 5 horizontal colored segments (Current, 1-30d, 31-60d, 61-90d, 90d+)
 * whose widths are proportional to their dollar amounts. Clicking a bucket
 * filters the data; clicking again deselects (shows all).
 */

import type { AgingBucket } from "./types";
import { formatCurrencyCompact } from "./types";

interface AgingStripProps {
  buckets: AgingBucket[];
  activeBucket: string | null; // label of active bucket, or null for "all"
  onBucketClick: (label: string | null) => void;
}

export function AgingStrip({ buckets, activeBucket, onBucketClick }: AgingStripProps) {
  const totalAmount = buckets.reduce((sum, b) => sum + b.amount, 0);
  const totalCount = buckets.reduce((sum, b) => sum + b.count, 0);

  if (totalAmount === 0) {
    return (
      <div
        className="rounded-xl px-5 py-3 text-[12px]"
        style={{
          border: "1px solid var(--neuron-ui-border)",
          color: "var(--neuron-ink-muted)",
          backgroundColor: "var(--neuron-bg-elevated)",
        }}
      >
        No aging data available for the current scope.
      </div>
    );
  }

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{ border: "1px solid var(--neuron-ui-border)", backgroundColor: "var(--neuron-bg-elevated)" }}
    >
      {/* Proportional bar */}
      <div className="flex h-8 overflow-hidden">
        {buckets.map((bucket) => {
          const widthPct = totalAmount > 0 ? (bucket.amount / totalAmount) * 100 : 0;
          if (widthPct < 0.5) return null; // Skip negligible segments

          const isActive = activeBucket === bucket.label;
          const isFiltered = activeBucket !== null && !isActive;

          return (
            <button
              key={bucket.label}
              onClick={() => onBucketClick(isActive ? null : bucket.label)}
              className="relative flex items-center justify-center transition-all cursor-pointer"
              style={{
                width: `${Math.max(widthPct, 3)}%`, // Min 3% so it's clickable
                backgroundColor: bucket.color,
                opacity: isFiltered ? 0.3 : 1,
                borderRight: "1px solid rgba(255,255,255,0.3)",
              }}
              title={`${bucket.label}: ${formatCurrencyCompact(bucket.amount)} (${bucket.count} items)`}
            >
              {widthPct > 12 && (
                <span className="text-[10px] font-semibold text-white truncate px-1">
                  {bucket.label}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Legend row */}
      <div className="flex items-center gap-4 px-4 py-2.5 flex-wrap">
        {buckets.map((bucket) => {
          const isActive = activeBucket === bucket.label;
          const isFiltered = activeBucket !== null && !isActive;

          return (
            <button
              key={bucket.label}
              onClick={() => onBucketClick(isActive ? null : bucket.label)}
              className="flex items-center gap-1.5 transition-opacity cursor-pointer"
              style={{ opacity: isFiltered ? 0.4 : 1 }}
            >
              <div
                className="w-2.5 h-2.5 rounded-sm shrink-0"
                style={{
                  backgroundColor: bucket.color,
                  boxShadow: isActive ? `0 0 0 2px ${bucket.color}40` : "none",
                }}
              />
              <span
                className="text-[11px] font-medium"
                style={{ color: isActive ? bucket.color : "var(--neuron-ink-secondary)" }}
              >
                {bucket.label}
              </span>
              <span className="text-[11px]" style={{ color: "var(--neuron-ink-muted)" }}>
                {formatCurrencyCompact(bucket.amount)}
              </span>
              <span
                className="text-[10px] px-1.5 py-0 rounded-full"
                style={{
                  backgroundColor: isActive ? `${bucket.color}15` : "var(--neuron-state-hover)",
                  color: isActive ? bucket.color : "var(--neuron-ink-muted)",
                }}
              >
                {bucket.count}
              </span>
            </button>
          );
        })}

        {/* Total */}
        <div className="ml-auto flex items-center gap-2">
          {activeBucket && (
            <button
              onClick={() => onBucketClick(null)}
              className="text-[11px] font-medium underline"
              style={{ color: "var(--neuron-brand-green)" }}
            >
              Clear filter
            </button>
          )}
          <span className="text-[11px]" style={{ color: "var(--neuron-ink-muted)" }}>
            Total: {formatCurrencyCompact(totalAmount)} ({totalCount})
          </span>
        </div>
      </div>
    </div>
  );
}
