/**
 * ContractStatusSelector
 *
 * Interactive status dropdown for contracts. Mirrors ProjectStatusSelector
 * pattern — uses CustomDropdown, contract-specific statuses & colors.
 *
 * Statuses: Draft, Active, Expiring, Expired, Renewed
 *
 * @see /docs/blueprints/CONTRACT_PARITY_BLUEPRINT.md - Phase 5, Task 5.4
 */

import { CustomDropdown } from "../bd/CustomDropdown";
import { cn } from "../ui/utils";
import { FileText, CheckCircle, AlertTriangle, Clock, RefreshCw } from "lucide-react";

type ContractStatus = "Draft" | "Active" | "Expiring" | "Expired" | "Renewed";

interface ContractStatusSelectorProps {
  status: ContractStatus;
  onUpdateStatus?: (newStatus: ContractStatus) => void;
  readOnly?: boolean;
  className?: string;
  showIcon?: boolean;
}

const STATUS_CONFIG: Record<ContractStatus, { color: string; icon: any }> = {
  Draft:    { color: "var(--theme-text-muted)", icon: FileText },
  Active:   { color: "var(--theme-status-success-fg)", icon: CheckCircle },
  Expiring: { color: "var(--theme-status-warning-fg)", icon: AlertTriangle },
  Expired:  { color: "var(--theme-text-muted)", icon: Clock },
  Renewed:  { color: "#7C3AED", icon: RefreshCw },
};

export function ContractStatusSelector({
  status,
  onUpdateStatus,
  readOnly = false,
  className,
  showIcon = true,
}: ContractStatusSelectorProps) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.Draft;
  const Icon = config.icon;

  const availableStatuses: ContractStatus[] = [
    "Draft", "Active", "Expiring", "Expired", "Renewed"
  ];

  const options = availableStatuses.map(s => {
    const sConfig = STATUS_CONFIG[s];
    const SIcon = sConfig.icon;
    return {
      value: s,
      label: s,
      icon: SIcon ? <SIcon size={16} /> : undefined,
    };
  });

  if (readOnly) {
    return (
      <button
        type="button"
        disabled
        className={cn(
          "inline-flex items-center px-4 py-2.5 rounded-full text-[13px] font-medium gap-2 transition-all duration-200 outline-none cursor-default opacity-100",
          className
        )}
        style={{
          backgroundColor: "var(--theme-bg-surface)",
          color: config.color,
          border: "1px solid var(--theme-border-default)",
        }}
      >
        {showIcon && Icon && <Icon size={16} />}
        {status}
      </button>
    );
  }

  return (
    <CustomDropdown
      value={status}
      onChange={(val) => onUpdateStatus?.(val as ContractStatus)}
      options={options}
      size="md"
      buttonClassName={cn("rounded-full font-medium min-w-[140px]", className)}
      buttonStyle={{
        backgroundColor: "var(--theme-bg-surface)",
        color: config.color,
        border: "1px solid var(--theme-border-default)",
      }}
    />
  );
}