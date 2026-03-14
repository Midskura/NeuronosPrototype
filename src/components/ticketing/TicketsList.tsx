import { TicketCard } from "./TicketCard";
import type { Ticket } from "../InboxPage";

interface TicketsListProps {
  tickets: Ticket[];
  isLoading: boolean;
  onTicketClick: (ticket: Ticket) => void;
  emptyMessage?: string;
}

export function TicketsList({ tickets, isLoading, onTicketClick, emptyMessage = "No tickets found" }: TicketsListProps) {
  if (isLoading) {
    return (
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "400px"
      }}>
        <div style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "16px"
        }}>
          <div style={{
            width: "40px",
            height: "40px",
            border: "3px solid #E5E9F0",
            borderTop: "3px solid #0F766E",
            borderRadius: "50%",
            animation: "spin 0.8s linear infinite"
          }} />
          <p style={{ color: "#667085", fontSize: "14px" }}>Loading tickets...</p>
        </div>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }
  
  if (tickets.length === 0) {
    return (
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "400px",
        background: "#F9FAFB",
        borderRadius: "16px",
        border: "1px solid #E5E9F0"
      }}>
        <div style={{
          textAlign: "center",
          color: "#667085",
          fontSize: "14px"
        }}>
          <p>{emptyMessage}</p>
        </div>
      </div>
    );
  }
  
  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      gap: "12px"
    }}>
      {tickets.map(ticket => (
        <TicketCard
          key={ticket.id}
          ticket={ticket}
          onClick={() => onTicketClick(ticket)}
        />
      ))}
    </div>
  );
}
