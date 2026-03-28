import { useState } from "react";
import { Receipt } from "lucide-react";
import { useUser } from "../../hooks/useUser";
import { createWorkflowTicket, getOpenWorkflowTicket } from "../../utils/workflowTickets";
import { toast } from "sonner@2.0.3";

interface RequestBillingButtonProps {
  bookingId: string;
  bookingNumber: string;
  currentUser?: { name: string; email: string; department: string } | null;
}

export function RequestBillingButton({ bookingId, bookingNumber, currentUser }: RequestBillingButtonProps) {
  const { user } = useUser();
  const [isLoading, setIsLoading] = useState(false);
  const [requested, setRequested] = useState(false);

  const handleRequestBilling = async () => {
    const userId = user?.id;
    const userName = currentUser?.name || user?.name || "Operations";
    const userDept = currentUser?.department || user?.department || "Operations";

    if (!userId) {
      toast.error("User session not found");
      return;
    }

    setIsLoading(true);
    try {
      const existing = await getOpenWorkflowTicket("booking", bookingId);
      if (existing) {
        toast.info("A billing request is already open for this booking");
        setRequested(true);
        return;
      }

      const ticketId = await createWorkflowTicket({
        subject: `Create Billing: ${bookingNumber}`,
        body: `${userName} has requested billing for booking ${bookingNumber}. Please create the billing documents for this completed booking.`,
        type: "request",
        priority: "normal",
        recipientDept: "Accounting",
        linkedRecordType: "booking",
        linkedRecordId: bookingId,
        resolutionAction: "set_booking_billed",
        createdBy: userId,
        createdByName: userName,
        createdByDept: userDept,
      });

      if (ticketId) {
        toast.success("Billing request sent to Accounting");
        setRequested(true);
      } else {
        toast.error("Failed to send billing request");
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (requested) {
    return (
      <span
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          padding: "8px 14px",
          borderRadius: 8,
          border: "1px solid #C8E6E2",
          backgroundColor: "#F0F7F5",
          fontSize: 13,
          fontWeight: 500,
          color: "var(--theme-action-primary-bg)",
        }}
      >
        <Receipt size={14} />
        Billing Requested
      </span>
    );
  }

  return (
    <button
      onClick={handleRequestBilling}
      disabled={isLoading}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 6,
        padding: "8px 14px",
        borderRadius: 8,
        border: "1px solid var(--theme-border-default)",
        backgroundColor: isLoading ? "#F9FAFB" : "#FFFFFF",
        fontSize: 13,
        fontWeight: 500,
        color: isLoading ? "#9CA3AF" : "#374151",
        cursor: isLoading ? "not-allowed" : "pointer",
        transition: "all 150ms ease",
      }}
      onMouseEnter={(e) => {
        if (!isLoading) {
          e.currentTarget.style.backgroundColor = "#F0F7F5";
          e.currentTarget.style.borderColor = "#C8E6E2";
          e.currentTarget.style.color = "var(--theme-action-primary-bg)";
        }
      }}
      onMouseLeave={(e) => {
        if (!isLoading) {
          e.currentTarget.style.backgroundColor = "var(--theme-bg-surface)";
          e.currentTarget.style.borderColor = "var(--theme-border-default)";
          e.currentTarget.style.color = "var(--theme-text-secondary)";
        }
      }}
    >
      <Receipt size={14} />
      {isLoading ? "Requesting…" : "Request Billing"}
    </button>
  );
}
