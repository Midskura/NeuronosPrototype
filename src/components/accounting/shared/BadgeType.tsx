import { Badge } from "../../ui/badge";

export type EntryType = "revenue" | "expense" | "transfer";

interface BadgeTypeProps {
  type: EntryType;
  className?: string;
}

export function BadgeType({ type, className = "" }: BadgeTypeProps) {
  const variants = {
    revenue: {
      className: "bg-[var(--theme-status-success-bg)] text-green-800 border-[var(--theme-status-success-border)]",
      label: "Revenue",
    },
    expense: {
      className: "bg-[var(--theme-status-danger-bg)] text-red-800 border-[var(--theme-status-danger-border)]",
      label: "Expense",
    },
    transfer: {
      className: "bg-[var(--theme-bg-surface-subtle)] text-[var(--theme-text-primary)] border-[var(--theme-border-default)]",
      label: "Transfer",
    },
  };

  const variant = variants[type];

  return (
    <Badge
      className={`${variant.className} border text-xs px-2 py-0.5 ${className}`}
      style={{ borderRadius: 'var(--radius-xs)' }}
    >
      {variant.label}
    </Badge>
  );
}
