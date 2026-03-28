import { FileText, Clock, CheckCircle, XCircle, Ban } from "lucide-react";
import type { EVoucherStatus } from "../../../types/evoucher";

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
          bg: "var(--theme-bg-page)",
          color: "var(--theme-text-muted)",
          border: "var(--theme-border-default)",
          icon: FileText,
          label: "Draft"
        };
      case "pending":
        return {
          bg: "var(--theme-status-warning-bg)",
          color: "#F59E0B",
          border: "#FCD34D",
          icon: Clock,
          label: "Pending"
        };
      case "posted":
        return {
          bg: "var(--theme-bg-surface-tint)",
          color: "var(--theme-action-primary-bg)",
          border: "#99F6E4",
          icon: CheckCircle,
          label: "Posted"
        };
      case "rejected":
        return {
          bg: "#FEE2E2",
          color: "var(--theme-status-danger-fg)",
          border: "var(--theme-status-danger-border)",
          icon: XCircle,
          label: "Rejected"
        };
      case "cancelled":
        return {
          bg: "var(--theme-bg-surface-subtle)",
          color: "var(--theme-text-muted)",
          border: "var(--theme-border-default)",
          icon: Ban,
          label: "Cancelled"
        };
      // Legacy statuses
      case "submitted":
        return {
          bg: "var(--theme-status-warning-bg)",
          color: "#F59E0B",
          border: "#FCD34D",
          icon: Clock,
          label: "Submitted"
        };
      case "under review":
        return {
          bg: "var(--theme-status-warning-bg)",
          color: "#F59E0B",
          border: "#FCD34D",
          icon: Clock,
          label: "Under Review"
        };
      case "approved":
        return {
          bg: "var(--theme-status-success-bg)",
          color: "var(--theme-status-success-fg)",
          border: "var(--theme-status-success-border)",
          icon: CheckCircle,
          label: "Approved"
        };
      default:
        return {
          bg: "var(--theme-bg-page)",
          color: "var(--theme-text-muted)",
          border: "var(--theme-border-default)",
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
