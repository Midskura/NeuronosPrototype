import { Clock, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import type { QuotationStatus } from "../types/pricing";
import { normalizeQuotationStatus } from "./quotationStatus";

// Display statuses - what users see in the UI (client's 4-status system)
export type DisplayStatus = 
  | "Ongoing"              // Pricing and Negotiations phase
  | "Waiting Approval"     // Waiting on Client Approval
  | "Approved"             // Accepted by Client
  | "Disapproved"          // Disapproved by Management or Client
  | "Cancelled";           // Cancelled

// Map internal technical status to display status
export function getDisplayStatus(internalStatus: QuotationStatus | string): DisplayStatus {
  const normalizedStatus = normalizeQuotationStatus(internalStatus);

  switch (normalizedStatus) {
    case "Draft":
    case "Pending Pricing":
    case "Priced":
    case "Needs Revision":
      return "Ongoing";
    
    case "Sent to Client":
      return "Waiting Approval";
    
    case "Accepted by Client":
    case "Converted to Project":
    case "Converted to Contract":
      return "Approved";
    
    case "Rejected by Client":
    case "Disapproved":
      return "Disapproved";
    
    case "Cancelled":
      return "Cancelled";
  }
}

// Get visual styling for display status
export function getStatusStyle(displayStatus: DisplayStatus) {
  switch (displayStatus) {
    case "Ongoing":
      return {
        icon: Clock,
        color: "var(--theme-status-warning-fg)",
        bgColor: "var(--theme-status-warning-bg)",
        borderColor: "var(--theme-status-warning-border)"
      };
    case "Waiting Approval":
      return {
        icon: AlertCircle,
        color: "#C88A2B",
        bgColor: "var(--theme-status-warning-bg)",
        borderColor: "var(--theme-status-warning-border)"
      };
    case "Approved":
      return {
        icon: CheckCircle,
        color: "var(--theme-action-primary-bg)",
        bgColor: "var(--theme-bg-surface-tint)",
        borderColor: "#99E6DC"
      };
    case "Disapproved":
      return {
        icon: XCircle,
        color: "var(--theme-status-danger-fg)",
        bgColor: "var(--theme-status-danger-bg)",
        borderColor: "#FECACA"
      };
    case "Cancelled":
      return {
        icon: XCircle,
        color: "var(--theme-text-muted)",
        bgColor: "var(--neuron-pill-inactive-bg)",
        borderColor: "var(--neuron-ui-muted)"
      };
  }
}

// Get detailed internal status label for tooltips/debugging
export function getInternalStatusLabel(status: QuotationStatus | string): string {
  const normalizedStatus = normalizeQuotationStatus(status);

  switch (normalizedStatus) {
    case "Draft":
      return "Draft (BD editing)";
    case "Pending Pricing":
      return "Pending Pricing (Submitted to PD)";
    case "Priced":
      return "Priced (Ready to send)";
    case "Sent to Client":
      return "Sent to Client";
    case "Accepted by Client":
      return "Accepted by Client";
    case "Rejected by Client":
      return "Rejected by Client";
    case "Needs Revision":
      return "Needs Revision";
    case "Converted to Project":
      return "Converted to Project";
    case "Converted to Contract":
      return "Converted to Contract";
    case "Disapproved":
      return "Disapproved";
    case "Cancelled":
      return "Cancelled";
  }
}
