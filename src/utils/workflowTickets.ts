import { supabase } from "./supabase/client";

export type WorkflowRecordType =
  | "quotation"
  | "booking"
  | "project"
  | "invoice"
  | "collection"
  | "expense"
  | "budget_request";

export interface WorkflowTicketParams {
  subject: string;
  body: string;
  type: "fyi" | "request" | "approval";
  priority?: "normal" | "urgent";
  recipientDept: string;
  linkedRecordType: WorkflowRecordType;
  linkedRecordId: string;
  linkedRecordLabel?: string;
  resolutionAction?: string;
  createdBy: string;
  createdByName: string;
  createdByDept: string;
}

/**
 * Creates a workflow-linked ticket routed to a department queue.
 * Returns the new ticket ID, or null on failure.
 */
export async function createWorkflowTicket(
  params: WorkflowTicketParams
): Promise<string | null> {
  const {
    subject,
    body,
    type,
    priority = "normal",
    recipientDept,
    linkedRecordType,
    linkedRecordId,
    resolutionAction,
    createdBy,
    createdByName,
    createdByDept,
  } = params;

  // 1. Create the ticket
  const { data: ticket, error: ticketError } = await supabase
    .from("tickets")
    .insert({
      subject,
      type,
      priority,
      status: "open",
      created_by: createdBy,
      linked_record_type: linkedRecordType,
      linked_record_id: linkedRecordId,
      resolution_action: resolutionAction ?? null,
      auto_created: false,
      last_message_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (ticketError || !ticket) {
    console.error("createWorkflowTicket: failed to create ticket", ticketError);
    return null;
  }

  const ticketId = ticket.id;

  // 2. Add sender as participant
  await supabase.from("ticket_participants").insert({
    ticket_id: ticketId,
    participant_type: "user",
    participant_user_id: createdBy,
    participant_dept: null,
    role: "sender",
  });

  // 3. Add recipient department as participant
  await supabase.from("ticket_participants").insert({
    ticket_id: ticketId,
    participant_type: "department",
    participant_user_id: null,
    participant_dept: recipientDept,
    role: "to",
  });

  // 4. Insert opening message
  await supabase.from("ticket_messages").insert({
    ticket_id: ticketId,
    sender_id: createdBy,
    sender_name: createdByName,
    sender_department: createdByDept,
    body,
    message_type: "user",
    is_system: false,
    is_retracted: false,
  });

  return ticketId;
}

/**
 * Executes the resolution action when a workflow ticket is marked Done.
 * Maps action strings to database updates on the linked record.
 */
export async function executeResolutionAction(
  action: string,
  linkedRecordType: string,
  linkedRecordId: string
): Promise<void> {
  switch (action) {
    case "set_quotation_priced":
      await supabase
        .from("quotations")
        .update({ status: "Priced" })
        .eq("id", linkedRecordId);
      break;

    case "set_quotation_pricing_in_progress":
      await supabase
        .from("quotations")
        .update({ status: "Pricing in Progress" })
        .eq("id", linkedRecordId);
      break;

    case "set_booking_billed":
      await supabase
        .from("bookings")
        .update({ billing_status: "billed" })
        .eq("id", linkedRecordId);
      break;

    default:
      console.warn("executeResolutionAction: unknown action", action);
  }
}

/**
 * Checks if an open workflow ticket already exists for a given record.
 * Prevents duplicate tickets from being created.
 */
export async function getOpenWorkflowTicket(
  linkedRecordType: string,
  linkedRecordId: string
): Promise<{ id: string; status: string } | null> {
  const { data } = await supabase
    .from("tickets")
    .select("id, status")
    .eq("linked_record_type", linkedRecordType)
    .eq("linked_record_id", linkedRecordId)
    .not("status", "in", '("done","archived","returned")')
    .maybeSingle();

  return data ?? null;
}
