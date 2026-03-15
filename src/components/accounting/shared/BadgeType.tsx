import { Badge } from "../../ui/badge";

export type EntryType = "revenue" | "expense" | "transfer";

interface BadgeTypeProps {
  type: EntryType;
  className?: string;
}

export function BadgeType({ type, className = "" }: BadgeTypeProps) {
  const variants = {
    revenue: {
      className: "bg-green-100 text-green-800 border-green-200",
      label: "Revenue",
    },
    expense: {
      className: "bg-red-100 text-red-800 border-red-200",
      label: "Expense",
    },
    transfer: {
      className: "bg-gray-100 text-gray-800 border-gray-200",
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
