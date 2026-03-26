export interface TicketTone {
  bg: string;
  text: string;
  border: string;
}

export const TICKET_TYPE_TONES: Record<string, TicketTone> = {
  fyi: { bg: "#F4F6F5", text: "#5F6E69", border: "#E2E8E5" },
  request: { bg: "#EEF4F1", text: "#2E5147", border: "#D7E5E0" },
  approval: { bg: "#F6F2EC", text: "#7A6048", border: "#E6D9CC" },
};

export const TICKET_PRIORITY_TONES: Record<string, TicketTone> = {
  normal: { bg: "#F4F6F5", text: "#5F6E69", border: "#E2E8E5" },
  urgent: { bg: "#FAF1EE", text: "#A05B45", border: "#E7D1C7" },
};

export const TICKET_STATUS_TONES: Record<string, TicketTone> = {
  draft: { bg: "#F4F6F5", text: "#7A8782", border: "#E2E8E5" },
  open: { bg: "#F7FAF8", text: "#5F6E69", border: "#E2E8E5" },
  acknowledged: { bg: "#EEF4F1", text: "#2E5147", border: "#D7E5E0" },
  in_progress: { bg: "#F6F2EC", text: "#8A5A44", border: "#E6D9CC" },
  done: { bg: "#EEF4F1", text: "#2E5147", border: "#D7E5E0" },
  returned: { bg: "#FAF1EE", text: "#A05B45", border: "#E7D1C7" },
  archived: { bg: "#F4F6F5", text: "#7A8782", border: "#E2E8E5" },
};

export const TICKET_ENTITY_TONES: Record<string, TicketTone> = {
  quotation: { bg: "#F7FAF8", text: "#2E5147", border: "#D7E5E0" },
  contract: { bg: "#F7FAF8", text: "#2E5147", border: "#D7E5E0" },
  booking: { bg: "#F7FAF8", text: "#2E5147", border: "#D7E5E0" },
  project: { bg: "#F7FAF8", text: "#2E5147", border: "#D7E5E0" },
  customer: { bg: "#F7FAF8", text: "#2E5147", border: "#D7E5E0" },
  contact: { bg: "#F7FAF8", text: "#2E5147", border: "#D7E5E0" },
  budget_request: { bg: "#F7FAF8", text: "#2E5147", border: "#D7E5E0" },
  invoice: { bg: "#FBF7F2", text: "#7A6048", border: "#E6D9CC" },
  collection: { bg: "#FBF7F2", text: "#7A6048", border: "#E6D9CC" },
  expense: { bg: "#FBF7F2", text: "#7A6048", border: "#E6D9CC" },
};

export const TICKET_AVATAR_TONES = [
  { bg: "#E8F2EE", text: "#2E5147", border: "#D7E5E0" },
  { bg: "#F2F4F3", text: "#5F6E69", border: "#E2E8E5" },
  { bg: "#F3EEE8", text: "#8A5A44", border: "#E6D9CC" },
];

export function ticketBadgeStyle(tone: TicketTone, fontWeight = 600) {
  return {
    fontSize: 11,
    fontWeight,
    padding: "3px 8px",
    borderRadius: 6,
    border: `1px solid ${tone.border}`,
    backgroundColor: tone.bg,
    color: tone.text,
  };
}

export function ticketToggleStyle(selected: boolean, tone: TicketTone) {
  if (selected) {
    return {
      ...ticketBadgeStyle(tone),
      fontSize: 12,
      fontWeight: 600,
      padding: "4px 12px",
      cursor: "pointer",
      transition: "all 150ms ease",
    };
  }

  return {
    fontSize: 12,
    fontWeight: 500,
    padding: "4px 12px",
    borderRadius: 6,
    border: "1px solid var(--neuron-ui-border)",
    backgroundColor: "#FFFFFF",
    color: "var(--neuron-ink-secondary)",
    cursor: "pointer",
    transition: "all 150ms ease",
  };
}
