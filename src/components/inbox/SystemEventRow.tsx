import type { ThreadMessage } from "../../hooks/useThread";

interface SystemEventRowProps {
  message: ThreadMessage;
}

function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleString("en-PH", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

const STATUS_LABELS: Record<string, string> = {
  open: "Open", acknowledged: "Acknowledged", in_progress: "In Progress",
  done: "Done", returned: "Returned", draft: "Draft", archived: "Archived",
};

function buildEventText(event: string | null, meta: Record<string, any> | null): string {
  if (!event || !meta) return "System event";
  const who = meta.changed_by_name || meta.assigned_by_name || meta.decided_by_name || meta.by || "Someone";
  switch (event) {
    case "assigned":
      return `${meta.assigned_by_name || "A manager"} assigned this to ${meta.assigned_to_name || "someone"} (${meta.department || ""})`;
    case "status_changed": {
      const to = STATUS_LABELS[meta.to] ?? meta.to;
      if (meta.to === "acknowledged") return `${who} acknowledged this request`;
      if (meta.to === "in_progress") return `${who} started working on this`;
      if (meta.to === "done") return `${who} marked this as Done`;
      if (meta.to === "returned") return `${who} returned this${meta.reason ? ` — "${meta.reason}"` : ""}`;
      if (meta.to === "open") return `${who} reopened this ticket`;
      return `${who} changed status to ${to}`;
    }
    case "participant_added":
      return `${meta.by || "Someone"} added ${meta.name || "a participant"}`;
    case "approval_accepted":
      return `${who} accepted this request`;
    case "approval_declined":
      return `${who} declined this request${meta.reason ? ` — "${meta.reason}"` : ""}`;
    default:
      return "System event";
  }
}

export function SystemEventRow({ message }: SystemEventRowProps) {
  const text = buildEventText(message.system_event, message.system_metadata);

  return (
    <div
      style={{
        padding: "6px 16px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
      }}
    >
      <div
        style={{
          flex: 1,
          height: 1,
          backgroundColor: "#F3F4F6",
        }}
      />
      <p
        style={{
          fontSize: 11,
          color: "#9CA3AF",
          fontStyle: "italic",
          whiteSpace: "nowrap",
          padding: "0 8px",
        }}
      >
        {text} · {formatTime(message.created_at)}
      </p>
      <div
        style={{
          flex: 1,
          height: 1,
          backgroundColor: "#F3F4F6",
        }}
      />
    </div>
  );
}
