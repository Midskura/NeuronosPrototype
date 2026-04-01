// ─────────────────────────────────────────────────────────────────────────────
// Calendar Module — Type Definitions
// ─────────────────────────────────────────────────────────────────────────────

export type CalendarViewType = "day" | "week" | "month";

export type CalendarEventSource =
  | "personal"
  | "team"
  | "department"
  | "booking"
  | "quotation"
  | "task"
  | "invoice"
  | "crm_activity";

export type CalendarEventType = "personal" | "team" | "department";

export type ParticipantStatus = "pending" | "accepted" | "declined";

/** Unified event shape used by all calendar views. */
export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  start: Date;
  end: Date;
  isAllDay: boolean;

  /** Where this event originates from */
  source: CalendarEventSource;
  /** For department-colored events */
  department?: string;
  /** Maps to CSS variable group in calendarColors */
  colorKey: string;

  /** URL path for navigating to the source entity */
  deepLink?: string;

  /** Only personal events are draggable */
  isDraggable: boolean;
  /** Auto-pulled business events are read-only */
  isReadOnly: boolean;

  /** RFC 5545 RRULE string */
  rrule?: string;
  /** True if this is an exception to a recurring series */
  isRecurrenceException?: boolean;

  /** Raw entity data for tooltips / preview */
  metadata?: Record<string, unknown>;
}

/** Row shape from calendar_events table */
export interface CalendarEventRow {
  id: string;
  title: string;
  description: string | null;
  start_at: string;
  end_at: string;
  is_all_day: boolean;
  timezone: string;
  event_type: CalendarEventType;
  department: string | null;
  rrule: string | null;
  recurrence_id: string | null;
  original_start: string | null;
  created_by: string;
  location: string | null;
  color_override: string | null;
  created_at: string;
  updated_at: string;
}

/** Row shape from calendar_event_participants table */
export interface CalendarEventParticipantRow {
  id: string;
  event_id: string;
  user_id: string;
  status: ParticipantStatus;
  created_at: string;
}

/** Form data for creating / editing an event */
export interface CalendarEventFormData {
  title: string;
  description: string;
  startDate: Date;
  startTime: string; // "HH:mm"
  endDate: Date;
  endTime: string; // "HH:mm"
  isAllDay: boolean;
  eventType: CalendarEventType;
  department: string;
  location: string;
  rrule: string;
  participantIds: string[];
  reminderMinutes: number | null; // null = no reminder
  colorOverride: string;
}

/** Recurrence form state (maps to RRULE builder) */
export interface RecurrenceFormData {
  frequency: "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY";
  interval: number;
  byDay: string[]; // ["MO", "TU", "WE", ...]
  endType: "never" | "count" | "until";
  count: number;
  until: Date | null;
}

/** Shape for upcoming deadline items in right sidebar */
export interface UpcomingDeadline {
  id: string;
  label: string;
  entityRef: string; // e.g. "BKG-001", "QTN-005"
  date: Date;
  deepLink: string;
  source: CalendarEventSource;
  colorKey: string;
  isOverdue: boolean;
}

/** Team member with availability status */
export interface TeamMemberAvailability {
  id: string;
  name: string;
  avatarUrl: string | null;
  department: string;
  isOnline: boolean;
  lastSeenAt: Date | null;
  isCalendarVisible: boolean; // toggled by manager
}
