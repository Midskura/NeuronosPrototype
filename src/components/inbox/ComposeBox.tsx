import { useState, useRef } from "react";
import { Send, Paperclip, Link2, X, FileText } from "lucide-react";
import { supabase } from "../../utils/supabase/client";
import { useUser } from "../../hooks/useUser";
import { toast } from "sonner@2.0.3";
import { RecordBrowser } from "./RecordBrowser";
import type { LinkedEntity } from "./RecordBrowser";

interface PendingAttachment {
  type: "file" | "entity";
  // file
  file?: File;
  // entity
  entity_type?: string;
  entity_id?: string;
  entity_label?: string;
}

interface ComposeBoxProps {
  ticketId: string;
  onSent: () => void;
}

export function ComposeBox({ ticketId, onSent }: ComposeBoxProps) {
  const { user } = useUser();
  const [body, setBody] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [attachments, setAttachments] = useState<PendingAttachment[]>([]);
  const [showEntityPicker, setShowEntityPicker] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setBody(e.target.value);
    // auto-grow
    e.target.style.height = "auto";
    e.target.style.height = Math.min(e.target.scrollHeight, 200) + "px";
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const MAX = 25 * 1024 * 1024;
    const ALLOWED = ["application/pdf", "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "image/jpeg", "image/png", "image/webp"];

    for (const file of files) {
      if (file.size > MAX) { toast.error(`${file.name} exceeds 25MB limit`); continue; }
      if (!ALLOWED.includes(file.type)) { toast.error(`${file.name} is not a supported file type`); continue; }
      setAttachments((prev) => [...prev, { type: "file", file }]);
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleEntitySelect = (entities: LinkedEntity[]) => {
    setAttachments(prev => {
      const next = [...prev];
      for (const entity of entities) {
        const already = next.some(a => a.type === "entity" && a.entity_id === entity.entity_id);
        if (!already) next.push({ type: "entity", ...entity });
      }
      return next;
    });
    setShowEntityPicker(false);
  };

  const removeAttachment = (idx: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSend = async () => {
    if (!body.trim() || !user) return;
    setIsSending(true);
    try {
      // Insert message
      const { data: msg, error: msgErr } = await supabase
        .from("ticket_messages")
        .insert({
          ticket_id: ticketId,
          sender_id: user.id,
          body: body.trim(),
        })
        .select()
        .single();

      if (msgErr || !msg) {
        toast.error("Failed to send message");
        setIsSending(false);
        return;
      }

      // Upload files + insert attachments
      for (const att of attachments) {
        if (att.type === "file" && att.file) {
          const path = `tickets/${ticketId}/${msg.id}/${att.file.name}`;
          const { error: uploadErr } = await supabase.storage
            .from("ticket-files")
            .upload(path, att.file, { upsert: false });

          if (uploadErr) {
            toast.error(`Failed to upload ${att.file.name}`);
            continue;
          }
          await supabase.from("ticket_attachments").insert({
            ticket_id: ticketId,
            message_id: msg.id,
            attachment_type: "file",
            file_path: path,
            file_name: att.file.name,
            file_size: att.file.size,
            file_mime_type: att.file.type,
            uploaded_by: user.id,
          });
        } else if (att.type === "entity") {
          await supabase.from("ticket_attachments").insert({
            ticket_id: ticketId,
            message_id: msg.id,
            attachment_type: "entity",
            entity_type: att.entity_type,
            entity_id: att.entity_id,
            entity_label: att.entity_label,
            uploaded_by: user.id,
          });
        }
      }

      // Update last_message_at
      await supabase
        .from("tickets")
        .update({ last_message_at: new Date().toISOString(), updated_at: new Date().toISOString() })
        .eq("id", ticketId);

      setBody("");
      setAttachments([]);
      if (textareaRef.current) textareaRef.current.style.height = "auto";
      onSent();
    } catch (err) {
      console.error(err);
      toast.error("Failed to send message");
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      <div
        style={{
          borderTop: "1px solid var(--theme-border-default)",
          backgroundColor: "var(--theme-bg-surface)",
          padding: "12px 16px",
        }}
      >
        {/* Pending attachments */}
        {attachments.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-2">
            {attachments.map((att, idx) => (
              <span
                key={idx}
                className="flex items-center gap-1.5"
                style={{
                  padding: "3px 8px",
                  borderRadius: 6,
                  border: "1px solid var(--theme-border-default)",
                  backgroundColor: "var(--theme-bg-page)",
                  fontSize: 12,
                  color: "var(--theme-text-secondary)",
                }}
              >
                {att.type === "entity" ? (
                  <>
                    <Link2 size={11} style={{ color: "var(--neuron-brand-green)" }} />
                    <span style={{ color: "var(--theme-text-muted)", fontSize: 10 }}>
                      {att.entity_type}
                    </span>
                    {att.entity_label}
                  </>
                ) : (
                  <>
                    <FileText size={11} style={{ color: "var(--theme-text-muted)" }} />
                    {att.file?.name}
                  </>
                )}
                <button
                  onClick={() => removeAttachment(idx)}
                  style={{ background: "none", border: "none", cursor: "pointer", color: "var(--theme-text-muted)", padding: 0, display: "flex" }}
                  onMouseEnter={(e) => e.currentTarget.style.color = "var(--neuron-accent-terracotta)"}
                  onMouseLeave={(e) => e.currentTarget.style.color = "var(--theme-text-muted)"}
                >
                  <X size={12} />
                </button>
              </span>
            ))}
          </div>
        )}

        {/* Textarea */}
        <textarea
          ref={textareaRef}
          value={body}
          onChange={handleTextareaChange}
          onKeyDown={handleKeyDown}
          placeholder="Reply to this thread…  (⌘Enter to send)"
          rows={3}
          style={{
            width: "100%",
            resize: "none",
            border: "1px solid var(--theme-border-default)",
            borderRadius: 8,
            padding: "10px 12px",
            fontSize: 13,
            color: "var(--theme-text-primary)",
            backgroundColor: "var(--theme-bg-surface)",
            outline: "none",
            fontFamily: "inherit",
            lineHeight: 1.5,
            minHeight: 80,
            maxHeight: 200,
            overflow: "auto",
            transition: "border-color 150ms ease",
          }}
          onFocus={(e) => (e.currentTarget.style.borderColor = "var(--neuron-ui-active-border)")}
          onBlur={(e) => (e.currentTarget.style.borderColor = "var(--theme-border-default)")}
        />

        {/* Toolbar */}
        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center gap-1">
            {/* Link entity */}
            <button
              onClick={() => setShowEntityPicker(true)}
              className="flex items-center gap-1.5 transition-colors duration-150"
              style={{
                padding: "5px 8px",
                borderRadius: 6,
                border: "1px solid var(--theme-border-default)",
                backgroundColor: "transparent",
                fontSize: 12,
                color: "var(--theme-text-muted)",
                cursor: "pointer",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "var(--theme-bg-page)";
                e.currentTarget.style.color = "var(--theme-text-primary)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "transparent";
                e.currentTarget.style.color = "var(--theme-text-muted)";
              }}
              title="Link a system record"
            >
              <Link2 size={14} />
              <span>Link record</span>
            </button>

            {/* Upload file */}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 transition-colors duration-150"
              style={{
                padding: "5px 8px",
                borderRadius: 6,
                border: "1px solid var(--theme-border-default)",
                backgroundColor: "transparent",
                fontSize: 12,
                color: "var(--theme-text-muted)",
                cursor: "pointer",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "var(--theme-bg-page)";
                e.currentTarget.style.color = "var(--theme-text-primary)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "transparent";
                e.currentTarget.style.color = "var(--theme-text-muted)";
              }}
              title="Attach a file"
            >
              <Paperclip size={14} />
              <span>Attach file</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.webp"
              style={{ display: "none" }}
              onChange={handleFileSelect}
            />
          </div>

          {/* Send button */}
          <button
            onClick={handleSend}
            disabled={!body.trim() || isSending}
            className="flex items-center gap-1.5 transition-all duration-150"
            style={{
              padding: "6px 14px",
              borderRadius: 6,
              border: "none",
              backgroundColor: body.trim() && !isSending ? "var(--neuron-brand-green)" : "var(--neuron-ui-muted)",
              color: "#FFFFFF",
              fontSize: 13,
              fontWeight: 600,
              cursor: body.trim() && !isSending ? "pointer" : "not-allowed",
            }}
          >
            <Send size={13} />
            {isSending ? "Sending…" : "Send"}
          </button>
        </div>
      </div>

      <RecordBrowser
        isOpen={showEntityPicker}
        onLink={handleEntitySelect}
        onClose={() => setShowEntityPicker(false)}
        alreadyLinked={attachments.filter(a => a.type === "entity" && a.entity_id).map(a => a.entity_id!)}
      />
    </>
  );
}
