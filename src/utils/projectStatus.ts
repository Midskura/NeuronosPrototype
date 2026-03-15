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
        bg: "#EFF6FF", 
        text: "#1D4ED8", 
        borderColor: "#DBEAFE",
        icon: Activity
      };

    case "Completed":
      return { 
        bg: "#ECFDF5", 
        text: "#059669", 
        borderColor: "#D1FAE5",
        icon: CheckCircle2
      };

    case "On Hold":
      return { 
        bg: "#FFFBEB", 
        text: "#D97706", 
        borderColor: "#FEF3C7",
        icon: AlertCircle
      };

    case "Cancelled":
      return { 
        bg: "#FEF2F2", 
        text: "#DC2626", 
        borderColor: "#FEE2E2",
        icon: XCircle
      };

    default:
      return { 
        bg: "#F3F4F6", 
        text: "#6B7280", 
        borderColor: "#E5E7EB",
        icon: FileText
      };
  }
}
