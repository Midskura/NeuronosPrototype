"use client";

import { CustomDropdown } from "../bd/CustomDropdown";
import { ProjectStatus } from "../../types/pricing";
import { getProjectStatusStyles } from "../../utils/projectStatus";
import { cn } from "../ui/utils";
import { ChevronDown } from "lucide-react";

interface ProjectStatusSelectorProps {
  status: ProjectStatus;
  onUpdateStatus?: (newStatus: ProjectStatus) => void;
  readOnly?: boolean;
  className?: string;
  showIcon?: boolean;
}

export function ProjectStatusSelector({ 
  status, 
  onUpdateStatus, 
  readOnly = false,
  className,
  showIcon = true
}: ProjectStatusSelectorProps) {
  const style = getProjectStatusStyles(status);
  const Icon = style.icon;

  // Full list of selectable statuses
  const availableStatuses: ProjectStatus[] = [
    "Active",
    "Completed",
    "On Hold",
    "Cancelled"
  ];

  // Map to CustomDropdown options
  const options = availableStatuses.map(s => {
    const sStyle = getProjectStatusStyles(s);
    const SIcon = sStyle.icon;
    return {
      value: s,
      label: s,
      icon: SIcon ? <SIcon size={16} /> : undefined
    };
  });

  // Read-only view (just a badge)
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
          color: style.text,
          border: "1px solid var(--theme-border-default)",
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
      onChange={(val) => onUpdateStatus?.(val as ProjectStatus)}
      options={options}
      size="md"
      buttonClassName={cn("rounded-full font-medium min-w-[140px]", className)}
      buttonStyle={{
        backgroundColor: "var(--theme-bg-surface)",
        color: style.text,
        border: "1px solid var(--theme-border-default)",
      }}
    />
  );
}