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
        <p style={{ fontSize: 12, color: "#9CA3AF", fontStyle: "italic" }}>
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
            backgroundColor: "#E8F4F2",
            border: "1px solid #C8E6E2",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 10,
            fontWeight: 700,
            color: "#0F766E",
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
            <span style={{ fontSize: 13, fontWeight: 600, color: "#12332B" }}>
              {message.sender_name || "Unknown"}
            </span>
            {message.sender_department && (
              <span
                style={{
                  fontSize: 11,
                  color: "#6B7A76",
                  padding: "2px 6px",
                  borderRadius: 6,
                  border: "1px solid #E2E8E5",
                  backgroundColor: "#F4F6F5",
                }}
              >
                {message.sender_department}
              </span>
            )}
            <span style={{ fontSize: 11, color: "#9CA3AF" }}>
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
                  color: "#9CA3AF",
                  background: "none",
                  cursor: "pointer",
                  padding: "2px 6px",
                  borderRadius: 4,
                  border: "1px solid #E5E9F0",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = "#DC2626";
                  e.currentTarget.style.borderColor = "#FECACA";
                  e.currentTarget.style.backgroundColor = "#FFF5F5";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = "#9CA3AF";
                  e.currentTarget.style.borderColor = "#E5E9F0";
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
                color: "#374151",
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
                      border: "1px solid #E5E9F0",
                      backgroundColor: "#F9FAFB",
                      fontSize: 12,
                      color: "#374151",
                      fontWeight: 500,
                      cursor: "pointer",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = "#9CA3AF";
                      e.currentTarget.style.backgroundColor = "#F3F4F6";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = "#E5E9F0";
                      e.currentTarget.style.backgroundColor = "#F9FAFB";
                    }}
                  >
                    <FileText size={11} style={{ color: "#667085" }} />
                    {att.file_name || "File"}
                    {att.file_size && (
                      <span style={{ color: "#9CA3AF", fontSize: 10 }}>
                        {(att.file_size / 1024 / 1024).toFixed(1)}MB
                      </span>
                    )}
                    <Download size={10} style={{ color: "#9CA3AF" }} />
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
