import { ProjectStatus } from "../types/pricing";
import { CheckCircle2, Clock, XCircle, AlertCircle, FileText, Activity } from "lucide-react";
import { LucideIcon } from "lucide-react";

interface StatusStyle {
  bg: string;
  text: string;
  borderColor?: string;
  icon?: LucideIcon;
}

export function getProjectStatusStyles(status: ProjectStatus | string): StatusStyle {
  // Normalize status string
  const normalizedStatus = status as ProjectStatus;

  switch (normalizedStatus) {
    case "Active":
      return {
        bg: "var(--neuron-semantic-info-bg)",
        text: "var(--neuron-semantic-info)",
        borderColor: "var(--neuron-semantic-info-bg)",
        icon: Activity
      };

    case "Completed":
      return {
        bg: "var(--theme-status-success-bg)",
        text: "#059669",
        borderColor: "var(--theme-status-success-bg)",
        icon: CheckCircle2
      };

    case "On Hold":
      return {
        bg: "var(--theme-status-warning-bg)",
        text: "var(--theme-status-warning-fg)",
        borderColor: "var(--theme-status-warning-bg)",
        icon: AlertCircle
      };

    case "Cancelled":
      return {
        bg: "var(--theme-status-danger-bg)",
        text: "var(--theme-status-danger-fg)",
        borderColor: "var(--theme-status-danger-bg)",
        icon: XCircle
      };

    default:
      return {
        bg: "var(--neuron-pill-inactive-bg)",
        text: "var(--theme-text-muted)",
        borderColor: "var(--theme-border-default)",
        icon: FileText
      };
  }
}
