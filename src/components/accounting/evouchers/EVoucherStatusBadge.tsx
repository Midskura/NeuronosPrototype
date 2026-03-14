import { FileText, Clock, CheckCircle, XCircle, Ban } from "lucide-react";
import type { EVoucherStatus } from "../../types/evoucher";

interface EVoucherStatusBadgeProps {
  status: EVoucherStatus;
  size?: "sm" | "md" | "lg";
}

export function EVoucherStatusBadge({ status, size = "md" }: EVoucherStatusBadgeProps) {
  const getStatusStyle = (status: EVoucherStatus) => {
    const normalized = status.toLowerCase();
    
    switch (normalized) {
      case "draft":
        return {
          bg: "#F9FAFB",
          color: "#6B7280",
          border: "#E5E7EB",
          icon: FileText,
          label: "Draft"
        };
      case "pending":
        return {
          bg: "#FEF3C7",
          color: "#F59E0B",
          border: "#FCD34D",
          icon: Clock,
          label: "Pending"
        };
      case "posted":
        return {
          bg: "#E8F5F3",
          color: "#0F766E",
          border: "#99F6E4",
          icon: CheckCircle,
          label: "Posted"
        };
      case "rejected":
        return {
          bg: "#FEE2E2",
          color: "#EF4444",
          border: "#FCA5A5",
          icon: XCircle,
          label: "Rejected"
        };
      case "cancelled":
        return {
          bg: "#F3F4F6",
          color: "#9CA3AF",
          border: "#D1D5DB",
          icon: Ban,
          label: "Cancelled"
        };
      // Legacy statuses
      case "submitted":
        return {
          bg: "#FEF3C7",
          color: "#F59E0B",
          border: "#FCD34D",
          icon: Clock,
          label: "Submitted"
        };
      case "under review":
        return {
          bg: "#FEF3C7",
          color: "#F59E0B",
          border: "#FCD34D",
          icon: Clock,
          label: "Under Review"
        };
      case "approved":
        return {
          bg: "#D1FAE5",
          color: "#059669",
          border: "#6EE7B7",
          icon: CheckCircle,
          label: "Approved"
        };
      default:
        return {
          bg: "#F9FAFB",
          color: "#6B7280",
          border: "#E5E7EB",
          icon: FileText,
          label: status
        };
    }
  };

  const sizes = {
    sm: {
      padding: "4px 8px",
      fontSize: "11px",
      iconSize: 12,
      gap: "4px"
    },
    md: {
      padding: "6px 12px",
      fontSize: "13px",
      iconSize: 14,
      gap: "6px"
    },
    lg: {
      padding: "8px 16px",
      fontSize: "14px",
      iconSize: 16,
      gap: "8px"
    }
  };

  const statusStyle = getStatusStyle(status);
  const sizeStyle = sizes[size];
  const StatusIcon = statusStyle.icon;

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: sizeStyle.gap,
        padding: sizeStyle.padding,
        borderRadius: "8px",
        backgroundColor: statusStyle.bg,
        color: statusStyle.color,
        border: `1px solid ${statusStyle.border}`,
        fontSize: sizeStyle.fontSize,
        fontWeight: 500,
        whiteSpace: "nowrap"
      }}
    >
      <StatusIcon size={sizeStyle.iconSize} />
      {statusStyle.label}
    </span>
  );
}
