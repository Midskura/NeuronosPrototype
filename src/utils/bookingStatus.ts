import { ExecutionStatus } from "../types/operations";
import { CheckCircle2, Truck, XCircle, AlertCircle, FileText } from "lucide-react";

interface StatusStyle {
  bg: string;
  text: string;
  borderColor?: string;
  icon?: any;
  label?: string;
}

export function getBookingStatusStyles(status: ExecutionStatus): StatusStyle {
  switch (status) {
    case "Draft":
      return {
        bg: "#F3F4F6",
        text: "#6B7280",
        icon: FileText,
        borderColor: "#E5E7EB"
      };

    case "Confirmed":
      return {
        bg: "#EFF6FF",
        text: "#1D4ED8",
        icon: CheckCircle2,
        borderColor: "#DBEAFE"
      };

    case "In Progress":
      return {
        bg: "#FFF7ED",
        text: "#F25C05",
        icon: Truck,
        borderColor: "#FFEDD5"
      };

    case "Delivered":
    case "Completed":
      return {
        bg: "#ECFDF5",
        text: "#059669",
        icon: CheckCircle2,
        borderColor: "#D1FAE5"
      };

    case "On Hold":
      return {
        bg: "#FFFBEB",
        text: "#D97706",
        icon: AlertCircle,
        borderColor: "#FEF3C7"
      };

    case "Cancelled":
      return {
        bg: "#FEF2F2",
        text: "#DC2626",
        icon: XCircle,
        borderColor: "#FEE2E2"
      };

    case "Closed":
      return {
        bg: "#F9FAFB",
        text: "#4B5563",
        icon: FileText,
        borderColor: "#E5E7EB"
      };

    default:
      return {
        bg: "#F3F4F6",
        text: "#6B7280",
        icon: FileText,
        borderColor: "#E5E7EB"
      };
  }
}
