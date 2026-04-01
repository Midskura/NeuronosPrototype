import { useState } from "react";
import { RotateCcw, FileText, Download } from "lucide-react";
import { supabase } from "../../utils/supabase/client";
import { useUser } from "../../hooks/useUser";
import { toast } from "sonner@2.0.3";
import type { ThreadMessage } from "../../hooks/useThread";
import { EntityContextCard } from "./EntityContextCard";

function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleString("en-PH", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function getInitials(name?: string) {
  if (!name) return "?";
  return name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

interface MessageBubbleProps {
  message: ThreadMessage;
  onRetract: () => void;
}

export function MessageBubble({ message, onRetract }: MessageBubbleProps) {
  const { user } = useUser();
  const [isRetracting, setIsRetracting] = useState(false);
  const [showRetract, setShowRetract] = useState(false);

  const isOwn = message.sender_id === user?.id;

  const handleRetract = async () => {
    if (!window.confirm("Retract this message? It will leave an audit placeholder visible to all participants.")) return;
    setIsRetracting(true);
    const { error } = await supabase
      .from("ticket_messages")
      .update({
        is_retracted: true,
        retracted_at: new Date().toISOString(),
        retracted_by: user?.id,
      })
      .eq("id", message.id);
    setIsRetracting(false);
    if (error) {
      toast.error("Failed to retract message");
    } else {
      toast.success("Message retracted");
      onRetract();
    }
  };

  const handleOpenFile = async (filePath: string, fileName: string) => {
    const { data } = await supabase.storage
      .from("ticket-files")
      .createSignedUrl(filePath, 3600);
    if (data?.signedUrl) {
      const a = document.createElement("a");
      a.href = data.signedUrl;
      a.download = fileName;
      a.click();
    } else {
      toast.error("Could not generate download link");
    }
  };

  // Retracted placeholder
  if (message.is_retracted) {
    return (
      <div
        style={{
          padding: "8px 16px",
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        <div style={{ width: 28, flexShrink: 0 }} />
        <p style={{ fontSize: 12, color: "var(--theme-text-muted)", fontStyle: "italic" }}>
          {message.sender_name} retracted a message ·{" "}
          {formatTime(message.retracted_at || message.created_at)}
        </p>
      </div>
    );
  }

  return (
    <div
      className="group"
      style={{ padding: "12px 16px" }}
      onMouseEnter={() => setShowRetract(true)}
      onMouseLeave={() => setShowRetract(false)}
    >
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: "50%",
            backgroundColor: "var(--theme-bg-surface-tint)",
            border: "1px solid var(--theme-status-success-border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 10,
            fontWeight: 700,
            color: "var(--theme-action-primary-bg)",
            flexShrink: 0,
            marginTop: 1,
          }}
        >
          {getInitials(message.sender_name)}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Header row */}
          <div className="flex items-center gap-2 mb-1.5">
            <span style={{ fontSize: 13, fontWeight: 600, color: "var(--theme-text-primary)" }}>
              {message.sender_name || "Unknown"}
            </span>
            {message.sender_department && (
              <span
                style={{
                  fontSize: 11,
                  color: "var(--theme-text-muted)",
                  padding: "2px 6px",
                  borderRadius: 6,
                  border: "1px solid var(--theme-border-default)",
                  backgroundColor: "var(--theme-bg-page)",
                }}
              >
                {message.sender_department}
              </span>
            )}
            <span style={{ fontSize: 11, color: "var(--theme-text-muted)" }}>
              {formatTime(message.created_at)}
            </span>
            {/* Retract button — own messages only */}
            {isOwn && showRetract && !isRetracting && (
              <button
                onClick={handleRetract}
                className="flex items-center gap-1 transition-opacity duration-150"
                style={{
                  marginLeft: "auto",
                  fontSize: 11,
                  color: "var(--theme-text-muted)",
                  background: "none",
                  cursor: "pointer",
                  padding: "2px 6px",
                  borderRadius: 4,
                  border: "1px solid var(--theme-border-default)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = "var(--theme-status-danger-fg)";
                  e.currentTarget.style.borderColor = "var(--theme-status-danger-border)";
                  e.currentTarget.style.backgroundColor = "var(--theme-status-danger-bg)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = "var(--theme-text-muted)";
                  e.currentTarget.style.borderColor = "var(--theme-border-default)";
                  e.currentTarget.style.backgroundColor = "transparent";
                }}
                title="Retract this message"
              >
                <RotateCcw size={10} />
                Retract
              </button>
            )}
          </div>

          {/* Body */}
          {message.body && (
            <p
              style={{
                fontSize: 13,
                color: "var(--theme-text-secondary)",
                lineHeight: 1.6,
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
              }}
            >
              {message.body}
            </p>
          )}

          {/* Attachments */}
          {(message.attachments || []).length > 0 && (
            <div
              className="flex flex-wrap gap-2"
              style={{ marginTop: 10 }}
            >
              {message.attachments!.map((att) => {
                if (att.attachment_type === "entity") {
                  return (
                    <EntityContextCard
                      key={att.id}
                      entity_type={att.entity_type || ""}
                      entity_id={att.entity_id || ""}
                      entity_label={att.entity_label || att.entity_id || ""}
                    />
                  );
                }

                // File attachment
                return (
                  <button
                    key={att.id}
                    onClick={() =>
                      att.file_path && att.file_name &&
                      handleOpenFile(att.file_path, att.file_name)
                    }
                    className="flex items-center gap-1.5 transition-colors duration-150"
                    style={{
                      padding: "4px 10px",
                      borderRadius: 6,
                      border: "1px solid var(--theme-border-default)",
                      backgroundColor: "var(--theme-bg-page)",
                      fontSize: 12,
                      color: "var(--theme-text-secondary)",
                      fontWeight: 500,
                      cursor: "pointer",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = "var(--theme-text-muted)";
                      e.currentTarget.style.backgroundColor = "var(--theme-bg-surface-subtle)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = "var(--theme-border-default)";
                      e.currentTarget.style.backgroundColor = "var(--theme-bg-page)";
                    }}
                  >
                    <FileText size={11} style={{ color: "var(--theme-text-muted)" }} />
                    {att.file_name || "File"}
                    {att.file_size && (
                      <span style={{ color: "var(--theme-text-muted)", fontSize: 10 }}>
                        {(att.file_size / 1024 / 1024).toFixed(1)}MB
                      </span>
                    )}
                    <Download size={10} style={{ color: "var(--theme-text-muted)" }} />
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
