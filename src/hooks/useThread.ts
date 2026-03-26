import { useState, useEffect, useCallback } from "react";
import { supabase } from "../utils/supabase/client";
import { useUser } from "./useUser";

export interface ThreadMessage {
  id: string;
  ticket_id: string;
  sender_id: string;
  sender_name?: string;
  sender_department?: string;
  body: string | null;
  is_system: boolean;
  system_event: string | null;
  system_metadata: Record<string, any> | null;
  is_retracted: boolean;
  retracted_at: string | null;
  retracted_by: string | null;
  created_at: string;
  attachments?: ThreadAttachment[];
}

export interface ThreadAttachment {
  id: string;
  message_id: string;
  attachment_type: "file" | "entity";
  file_path: string | null;
  file_name: string | null;
  file_size: number | null;
  file_mime_type: string | null;
  entity_type: string | null;
  entity_id: string | null;
  entity_label: string | null;
  uploaded_by: string;
}

export interface ThreadParticipant {
  id: string;
  participant_type: "user" | "department";
  user_id: string | null;
  department: string | null;
  role: "sender" | "to" | "cc";
  user_name?: string;
  user_department?: string;
}

export interface ThreadDetail {
  id: string;
  subject: string;
  type: "fyi" | "request" | "approval";
  priority: "normal" | "urgent";
  status: "draft" | "open" | "acknowledged" | "in_progress" | "done" | "returned" | "archived";
  created_by: string;
  created_by_name?: string;
  created_at: string;
  last_message_at: string;
  // Workflow linkage
  linked_record_type: string | null;
  linked_record_id: string | null;
  auto_created: boolean;
  resolution_action: string | null;
  // Return tracking
  return_reason: string | null;
  returned_at: string | null;
  returned_by: string | null;
  returned_by_name?: string;
  // Approval
  approval_result: "accepted" | "declined" | null;
  approval_decided_at: string | null;
  approval_decided_by: string | null;
  messages: ThreadMessage[];
  participants: ThreadParticipant[];
  assignment?: { assigned_to: string; assigned_to_name?: string; assigned_by: string; assigned_by_name?: string; department: string };
}

export function useThread(ticketId: string | null) {
  const { user } = useUser();
  const [thread, setThread] = useState<ThreadDetail | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const markAsRead = useCallback(async (tid: string, lastMsgId: string) => {
    if (!user) return;
    await supabase.from("ticket_read_receipts").upsert(
      { ticket_id: tid, user_id: user.id, last_read_at: new Date().toISOString(), last_read_message_id: lastMsgId },
      { onConflict: "ticket_id,user_id" }
    );
  }, [user]);

  const fetchThread = useCallback(async () => {
    if (!ticketId || !user) return;
    setIsLoading(true);
    try {
      // Ticket metadata
      const { data: ticket } = await supabase
        .from("tickets")
        .select("*")
        .eq("id", ticketId)
        .single();

      if (!ticket) { setThread(null); setIsLoading(false); return; }

      // Participants
      const { data: participants } = await supabase
        .from("ticket_participants")
        .select("*")
        .eq("ticket_id", ticketId);

      // Messages
      const { data: messages } = await supabase
        .from("ticket_messages")
        .select("*")
        .eq("ticket_id", ticketId)
        .order("created_at", { ascending: true });

      // Attachments
      const { data: attachments } = await supabase
        .from("ticket_attachments")
        .select("*")
        .eq("ticket_id", ticketId);

      // Assignment
      const { data: assignment } = await supabase
        .from("ticket_assignments")
        .select("*")
        .eq("ticket_id", ticketId)
        .order("assigned_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      // Collect all user IDs to enrich
      const allUserIds = new Set<string>();
      allUserIds.add(ticket.created_by);
      (participants || []).forEach((p) => { if (p.user_id) allUserIds.add(p.user_id); });
      (messages || []).forEach((m) => { allUserIds.add(m.sender_id); if (m.retracted_by) allUserIds.add(m.retracted_by); });
      if (assignment) { allUserIds.add(assignment.assigned_to); allUserIds.add(assignment.assigned_by); }

      const { data: usersData } = await supabase
        .from("users")
        .select("id, name, department")
        .in("id", [...allUserIds]);
      const userMap = Object.fromEntries((usersData || []).map((u) => [u.id, u]));

      // Attach message attachments
      const attachByMsg: Record<string, ThreadAttachment[]> = {};
      (attachments || []).forEach((a) => {
        if (!attachByMsg[a.message_id]) attachByMsg[a.message_id] = [];
        attachByMsg[a.message_id].push(a);
      });

      const enrichedMessages: ThreadMessage[] = (messages || []).map((m) => ({
        ...m,
        sender_name: userMap[m.sender_id]?.name,
        sender_department: userMap[m.sender_id]?.department,
        attachments: attachByMsg[m.id] || [],
      }));

      const enrichedParticipants: ThreadParticipant[] = (participants || []).map((p) => ({
        ...p,
        user_name: p.user_id ? userMap[p.user_id]?.name : undefined,
        user_department: p.user_id ? userMap[p.user_id]?.department : undefined,
      }));

      const detail: ThreadDetail = {
        ...ticket,
        created_by_name: userMap[ticket.created_by]?.name,
        messages: enrichedMessages,
        participants: enrichedParticipants,
        assignment: assignment
          ? {
              ...assignment,
              assigned_to_name: userMap[assignment.assigned_to]?.name,
              assigned_by_name: userMap[assignment.assigned_by]?.name,
            }
          : undefined,
      };

      setThread(detail);

      // Mark as read — use last non-system message id
      const lastMsg = [...enrichedMessages].reverse().find((m) => !m.is_system);
      if (lastMsg) markAsRead(ticketId, lastMsg.id);
    } catch (err) {
      console.error("useThread fetch error:", err);
    } finally {
      setIsLoading(false);
    }
  }, [ticketId, user, markAsRead]);

  useEffect(() => {
    if (ticketId) fetchThread();
    else setThread(null);
  }, [ticketId, fetchThread]);

  return { thread, isLoading, refresh: fetchThread };
}
