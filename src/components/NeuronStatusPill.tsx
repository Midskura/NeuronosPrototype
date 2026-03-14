import { ReactNode } from "react";

type StatusVariant = "success" | "warning" | "danger" | "neutral" | "info";

interface NeuronStatusPillProps {
  children?: ReactNode;
  status?: string; // For auto-mapping from status strings
  variant?: StatusVariant;
  size?: "sm" | "md";
}

export function NeuronStatusPill({ children, status, variant, size = "md" }: NeuronStatusPillProps) {
  // Auto-map status strings to variants
  const getVariantFromStatus = (statusStr: string): StatusVariant => {
    const statusLower = statusStr.toLowerCase();
    
    // Quotation statuses
    if (statusLower.includes("approved") || statusLower.includes("accepted") || statusLower === "priced") {
      return "success";
    }
    if (statusLower.includes("pending") || statusLower === "sent to client") {
      return "warning";
    }
    if (statusLower.includes("rejected") || statusLower.includes("disapproved") || statusLower === "cancelled") {
      return "danger";
    }
    if (statusLower === "needs revision") {
      return "warning";
    }
    if (statusLower === "converted to project") {
      return "info";
    }
    if (statusLower === "draft") {
      return "neutral";
    }
    
    // Project statuses
    if (statusLower === "active" || statusLower === "in progress") {
      return "info"; // Blue/Teal
    }
    if (statusLower === "completed" || statusLower === "handed over") {
      return "success";
    }
    if (statusLower === "on hold" || statusLower === "pending handover") {
      return "warning";
    }
    if (statusLower === "cancelled") {
      return "danger";
    }
    
    // Contract statuses
    if (statusLower === "expiring") {
      return "warning";
    }
    if (statusLower === "expired") {
      return "danger";
    }
    if (statusLower === "renewed") {
      return "success";
    }
    if (statusLower === "converted to contract") {
      return "info";
    }

    return "neutral";
  };
  
  const effectiveVariant = status ? getVariantFromStatus(status) : (variant || "neutral");
  const displayText = status || children;

  const variantStyles = {
    success: {
      background: "var(--neuron-brand-green-100)",
      color: "var(--neuron-semantic-success)",
    },
    warning: {
      background: "#FFF4E6",
      color: "var(--neuron-semantic-warn)",
    },
    danger: {
      background: "#FFEBE9",
      color: "var(--neuron-semantic-danger)",
    },
    neutral: {
      background: "var(--neuron-state-selected)",
      color: "var(--neuron-ink-secondary)",
    },
    info: {
      background: "#E8F4F8",
      color: "#0F766E",
    },
  };

  const sizeStyles = {
    sm: {
      height: "24px",
      padding: "0 8px",
      fontSize: "12px",
      lineHeight: "16px",
    },
    md: {
      height: "32px",
      padding: "0 12px",
      fontSize: "14px",
      lineHeight: "20px",
    },
  };

  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: "var(--neuron-radius-l)",
        fontWeight: 500,
        whiteSpace: "nowrap",
        ...sizeStyles[size],
        ...variantStyles[effectiveVariant],
      }}
    >
      {displayText}
    </div>
  );
}