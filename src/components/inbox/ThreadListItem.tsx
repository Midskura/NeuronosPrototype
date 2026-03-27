import { Paperclip, Zap } from "lucide-react";
import type { ThreadSummary } from "../../hooks/useInbox";
import { TICKET_PRIORITY_TONES, TICKET_STATUS_TONES, TICKET_TYPE_TONES, ticketBadgeStyle } from "./ticketingTheme";

interface ThreadListItemProps {
  thread: ThreadSummary;
  isSelected: boolean;
  onClick: () => void;
}

const RECORD_TYPE_LABEL: Record<string, string> = {
  quotation:      "Quotation",
  booking:        "Booking",
  project:        "Project",
  invoice:        "Invoice",
  collection:     "Collection",
  expense:        "Expense",
  budget_request: "Budget Request",
};

function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m`;
  if (diffHours < 24) return `${diffHours}h`;
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return date.toLocaleDateString("en-PH", { weekday: "short" });
  return date.toLocaleDateString("en-PH", { month: "short", day: "numeric" });
}

function getSenderName(thread: ThreadSummary): string {
  const sender = (thread.participants || []).find((p) => p.role === "sender");
  return sender?.user_name || "Unknown";
}

function getSenderDept(thread: ThreadSummary): string | null {
  const sender = (thread.participants || []).find((p) => p.role === "sender");
  // department info not in ParticipantSummary yet — skip for now
  return null;
}

export function ThreadListItem({ thread, isSelected, onClick }: ThreadListItemProps) {
  const typeTone = TICKET_TYPE_TONES[thread.type] ?? TICKET_TYPE_TONES.fyi;
  const statusTone = TICKET_STATUS_TONES[thread.status] ?? TICKET_STATUS_TONES.open;
  const senderName = getSenderName(thread);
  const isUrgent = thread.priority === "urgent";

  return (
    <button
      onClick={onClick}
      className="w-full text-left"
      style={{
        borderLeft: isSelected ? "2px solid #0F766E" : "2px solid transparent",
        backgroundColor: isSelected ? "#F0F7F5" : "transparent",
        padding: "12px 16px 12px 14px",
        borderBottom: "1px solid var(--theme-border-default)",
        display: "block",
      }}
      onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.backgroundColor = "var(--theme-bg-page)"; }}
      onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.backgroundColor = "transparent"; }}
      aria-label={`Ticket: ${thread.subject}`}
      aria-selected={isSelected}
    >
      <div className="flex items-start gap-2.5">
        {/* Unread dot */}
        <div style={{ width: 8, flexShrink: 0, paddingTop: 5 }}>
          {thread.is_unread && (
            <div style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: "var(--theme-action-primary-bg)", marginLeft: 1 }} />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Row 1: Subject + timestamp */}
          <div className="flex items-start justify-between gap-2 mb-1">
            <p
              className="truncate"
              style={{ fontSize: 13, fontWeight: thread.is_unread ? 700 : 600, color: "var(--theme-text-primary)", lineHeight: 1.4 }}
            >
              {thread.subject}
            </p>
            <span style={{ fontSize: 10, color: "var(--theme-text-muted)", whiteSpace: "nowrap", flexShrink: 0, marginTop: 2 }}>
              {formatRelativeTime(thread.last_message_at)}
            </span>
          </div>

          {/* Row 2: Linked record chip (if workflow ticket) */}
          {thread.linked_record_type && (
            <div className="flex items-center gap-1 mb-1">
              <Zap size={10} style={{ color: "#D97706", flexShrink: 0 }} />
            <span style={{ fontSize: 11, color: "#D97706", fontWeight: 500 }}>
              {RECORD_TYPE_LABEL[thread.linked_record_type] ?? thread.linked_record_type}
            </span>
            </div>
          )}

          {/* Row 3: Sender + preview */}
          <p className="truncate mb-1.5" style={{ fontSize: 11, color: "var(--theme-text-muted)" }}>
            <span style={{ fontWeight: 500 }}>{senderName}</span>
            {thread.last_message_preview && (
              <span style={{ color: "var(--theme-text-muted)" }}> · {thread.last_message_preview}</span>
            )}
          </p>

          {/* Row 4: Badges */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span style={{
              ...ticketBadgeStyle(typeTone),
              fontSize: 10,
              padding: "1px 6px",
            }}>
              {thread.type === "fyi" ? "FYI" : thread.type === "request" ? "Request" : "Approval"}
            </span>

            {thread.status !== "draft" && (
              <span style={{
                ...ticketBadgeStyle(statusTone, 500),
                fontSize: 10,
                padding: "1px 6px",
              }}>
                {thread.status === "in_progress" ? "In Progress" : thread.status.charAt(0).toUpperCase() + thread.status.slice(1).replace("_", " ")}
              </span>
            )}

            {isUrgent && (
              <span style={{
                ...ticketBadgeStyle(TICKET_PRIORITY_TONES.urgent),
                fontSize: 10,
                padding: "1px 6px",
              }}>
                Urgent
              </span>
            )}

            {(thread.attachment_count || 0) > 0 && (
              <span className="flex items-center gap-0.5" style={{ fontSize: 11, color: "var(--theme-text-muted)" }}>
                <Paperclip size={10} />
                {thread.attachment_count}
              </span>
            )}
          </div>
        </div>
      </div>
    </button>
  );
}
