import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { Zap } from "lucide-react";
import { supabase } from "../../utils/supabase/client";

interface LinkedTicketBadgeProps {
  recordType: string;
  recordId: string;
}

interface LinkedTicket {
  id: string;
  subject: string;
  status: string;
  priority: string;
  type: string;
}

const STATUS_LABEL: Record<string, string> = {
  open: "Open",
  acknowledged: "Acknowledged",
  in_progress: "In Progress",
  returned: "Returned",
};

const STATUS_COLOR: Record<string, { color: string; bg: string }> = {
  open:         { color: "#1D4ED8", bg: "#EFF6FF" },
  acknowledged: { color: "var(--theme-action-primary-bg)", bg: "#F0F7F5" },
  in_progress:  { color: "#D97706", bg: "#FEF3C7" },
  returned:     { color: "#DC2626", bg: "#FEE2E2" },
};

export function LinkedTicketBadge({ recordType, recordId }: LinkedTicketBadgeProps) {
  const navigate = useNavigate();
  const [ticket, setTicket] = useState<LinkedTicket | null>(null);

  useEffect(() => {
    if (!recordId) return;
    supabase
      .from("tickets")
      .select("id, subject, status, priority, type")
      .eq("linked_record_type", recordType)
      .eq("linked_record_id", recordId)
      .not("status", "in", '("done","archived")')
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()
      .then(({ data }) => setTicket(data ?? null));
  }, [recordType, recordId]);

  if (!ticket) return null;

  const style = STATUS_COLOR[ticket.status] ?? { color: "var(--theme-text-muted)", bg: "#F3F4F6" };

  return (
    <button
      onClick={() => navigate("/inbox")}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "4px 10px",
        borderRadius: 6,
        border: `1px solid ${style.color}33`,
        backgroundColor: style.bg,
        cursor: "pointer",
        fontSize: 12,
        fontWeight: 500,
        color: style.color,
        transition: "opacity 0.15s",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.8")}
      onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
      title="View workflow ticket in Inbox"
    >
      <Zap size={11} style={{ flexShrink: 0 }} />
      <span style={{ fontWeight: 600 }}>
        {ticket.priority === "urgent" ? "⚡ Urgent · " : ""}
        {STATUS_LABEL[ticket.status] ?? ticket.status}
      </span>
      <span style={{ color: "var(--theme-text-muted)", fontWeight: 400 }}>
        · {ticket.subject}
      </span>
    </button>
  );
}
