"use client";

import { CustomDropdown } from "./bd/CustomDropdown";
import { ExecutionStatus } from "../types/operations";
import { getBookingStatusStyles } from "../utils/bookingStatus";
import { cn } from "./ui/utils";
import { ChevronDown } from "lucide-react";

interface StatusSelectorProps {
  status: ExecutionStatus;
  onUpdateStatus?: (newStatus: ExecutionStatus) => void;
  readOnly?: boolean;
  className?: string;
  showIcon?: boolean;
}

export function StatusSelector({ 
  status, 
  onUpdateStatus, 
  readOnly = false,
  className,
  showIcon = true
}: StatusSelectorProps) {
  const style = getBookingStatusStyles(status);
  const Icon = style.icon;

  // Valid transitions per status — only allowed next states are shown
  const BOOKING_STATUS_TRANSITIONS: Record<ExecutionStatus, ExecutionStatus[]> = {
    "Draft":       ["Confirmed", "Cancelled"],
    "Pending":     ["Confirmed", "Cancelled"],
    "Confirmed":   ["In Progress", "On Hold", "Cancelled"],
    "In Progress": ["Delivered", "On Hold", "Cancelled"],
    "Delivered":   ["Completed", "Closed"],
    "Completed":   ["Closed"],
    "On Hold":     ["Confirmed", "Cancelled"],
    "Cancelled":   [],
    "Closed":      [],
  };

  const availableStatuses: ExecutionStatus[] = BOOKING_STATUS_TRANSITIONS[status] ?? [];

  // Map to CustomDropdown options
  const options = availableStatuses.map(s => {
    const sStyle = getBookingStatusStyles(s);
    const SIcon = sStyle.icon;
    return {
      value: s,
      label: s,
      icon: SIcon ? <SIcon size={16} /> : undefined
    };
  });

  // Terminal statuses (no valid transitions) — force read-only
  const isTerminal = availableStatuses.length === 0;

  // Read-only view (just a badge)
  if (readOnly || isTerminal) {
    return (
      <button 
        type="button"
        disabled
        className={cn(
          "inline-flex items-center px-4 py-2.5 rounded-full text-[13px] font-medium gap-2 transition-all duration-200 outline-none cursor-default opacity-100",
          className
        )}
        style={{
          backgroundColor: style.bg,
          color: style.text,
          border: style.borderColor ? `1px solid ${style.borderColor}` : undefined
        }}
      >
        {showIcon && Icon && <Icon size={16} />}
        {status}
      </button>
    );
  }

  // Interactive view using CustomDropdown
  return (
    <CustomDropdown
      value={status}
      onChange={(val) => onUpdateStatus?.(val as ExecutionStatus)}
      options={options}
      size="md"
      buttonClassName={cn("rounded-full font-medium min-w-[160px]", className)}
      buttonStyle={{
        backgroundColor: style.bg,
        color: style.text,
        border: style.borderColor ? `1px solid ${style.borderColor}` : undefined
      }}
    />
  );
}
