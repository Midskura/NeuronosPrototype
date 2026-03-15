import { Clock, User, AlertCircle } from "lucide-react";
import type { Ticket, TicketPriority } from "../InboxPage";

interface TicketCardProps {
  ticket: Ticket;
  onClick: () => void;
}

export function TicketCard({ ticket, onClick }: TicketCardProps) {
  const getPriorityColor = (priority: TicketPriority) => {
    switch (priority) {
      case "Urgent":
        return { bg: "#FEE2E2", text: "#DC2626", dot: "#EF4444" };
      case "High":
        return { bg: "#FEF3C7", text: "#D97706", dot: "#F59E0B" };
      case "Normal":
      default:
        return { bg: "#E0F2FE", text: "#0369A1", dot: "#0EA5E9" };
    }
  };
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case "Open":
        return { bg: "#DBEAFE", text: "#1E40AF" };
      case "Assigned":
        return { bg: "#E0E7FF", text: "#5B21B6" };
      case "In Progress":
        return { bg: "#FEF3C7", text: "#D97706" };
      case "Waiting on Requester":
        return { bg: "#FFEDD5", text: "#C2410C" };
      case "Resolved":
        return { bg: "#D1FAE5", text: "#047857" };
      case "Closed":
        return { bg: "#F3F4F6", text: "#4B5563" };
      default:
        return { bg: "#F3F4F6", text: "#6B7280" };
    }
  };
  
  const priorityColors = getPriorityColor(ticket.priority);
  const statusColors = getStatusColor(ticket.status);
  
  // Calculate time until due
  const getDueTimeDisplay = () => {
    const now = new Date();
    const due = new Date(ticket.due_date);
    const diffMs = due.getTime() - now.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffMs < 0) {
      return { text: "Overdue", color: "#DC2626", isUrgent: true };
    } else if (diffHours < 4) {
      return { text: `Due in ${diffHours}h`, color: "#DC2626", isUrgent: true };
    } else if (diffHours < 24) {
      return { text: `Due in ${diffHours}h`, color: "#D97706", isUrgent: false };
    } else if (diffDays === 1) {
      return { text: "Due tomorrow", color: "#667085", isUrgent: false };
    } else {
      return { text: `Due in ${diffDays}d`, color: "#667085", isUrgent: false };
    }
  };
  
  const dueTime = getDueTimeDisplay();
  
  return (
    <button
      onClick={onClick}
      style={{
        width: "100%",
        padding: "20px 24px",
        background: "#FFFFFF",
        border: "1px solid #E5E9F0",
        borderRadius: "8px",
        cursor: "pointer",
        transition: "all 150ms ease",
        textAlign: "left"
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = "#0F766E";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "#E5E9F0";
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", gap: "16px" }}>
        {/* Priority Indicator */}
        <div style={{
          width: "8px",
          height: "8px",
          borderRadius: "50%",
          background: priorityColors.dot,
          marginTop: "6px",
          flexShrink: 0
        }} />
        
        {/* Content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Header Row */}
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
            <span style={{
              fontSize: "13px",
              fontWeight: 600,
              color: "#667085",
              fontFamily: "monospace"
            }}>
              {ticket.id}
            </span>
            
            <span style={{
              display: "inline-flex",
              alignItems: "center",
              padding: "2px 8px",
              borderRadius: "6px",
              fontSize: "11px",
              fontWeight: 600,
              background: priorityColors.bg,
              color: priorityColors.text
            }}>
              {ticket.priority}
            </span>
            
            <span style={{
              display: "inline-flex",
              alignItems: "center",
              padding: "2px 8px",
              borderRadius: "6px",
              fontSize: "11px",
              fontWeight: 500,
              background: statusColors.bg,
              color: statusColors.text
            }}>
              {ticket.status}
            </span>
          </div>
          
          {/* Subject */}
          <h3 style={{
            fontSize: "16px",
            fontWeight: 600,
            color: "#12332B",
            marginBottom: "8px",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap"
          }}>
            {ticket.subject}
          </h3>
          
          {/* Description Preview */}
          {ticket.description && (
            <p style={{
              fontSize: "14px",
              color: "#667085",
              marginBottom: "12px",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap"
            }}>
              {ticket.description}
            </p>
          )}
          
          {/* Meta Info */}
          <div style={{ display: "flex", alignItems: "center", gap: "20px", flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <User size={14} style={{ color: "#667085" }} />
              <span style={{ fontSize: "13px", color: "#667085" }}>
                From: {ticket.created_by_name} ({ticket.from_department})
              </span>
            </div>
            
            {ticket.assigned_to_name && (
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <User size={14} style={{ color: "#0F766E" }} />
                <span style={{ fontSize: "13px", color: "#0F766E", fontWeight: 500 }}>
                  Assigned: {ticket.assigned_to_name}
                </span>
              </div>
            )}
            
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              {dueTime.isUrgent && <AlertCircle size={14} style={{ color: dueTime.color }} />}
              <Clock size={14} style={{ color: dueTime.color }} />
              <span style={{
                fontSize: "13px",
                color: dueTime.color,
                fontWeight: dueTime.isUrgent ? 600 : 400
              }}>
                {dueTime.text}
              </span>
            </div>
          </div>
        </div>
      </div>
    </button>
  );
}