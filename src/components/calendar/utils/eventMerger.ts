// ─────────────────────────────────────────────────────────────────────────────
// Event Merger — combines personal/team events with auto-pulled business events
// ─────────────────────────────────────────────────────────────────────────────

import type { CalendarEvent } from "../../../types/calendar";

/**
 * Merges two arrays of CalendarEvents and returns a single sorted array.
 * Deduplicates by id (auto-pull ids are prefixed to avoid collision).
 */
export function mergeCalendarEvents(
  personalEvents: CalendarEvent[],
  autoEvents: CalendarEvent[]
): CalendarEvent[] {
  const seen = new Set<string>();
  const merged: CalendarEvent[] = [];

  for (const event of [...personalEvents, ...autoEvents]) {
    if (!seen.has(event.id)) {
      seen.add(event.id);
      merged.push(event);
    }
  }

  return merged.sort((a, b) => a.start.getTime() - b.start.getTime());
}

/**
 * Filters events to those visible on a specific day.
 */
export function getEventsForDay(
  events: CalendarEvent[],
  day: Date
): CalendarEvent[] {
  const dayStart = new Date(day);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(day);
  dayEnd.setHours(23, 59, 59, 999);

  return events.filter(
    (e) => e.start <= dayEnd && e.end >= dayStart
  );
}

/**
 * Separate all-day events from timed events.
 */
export function partitionEvents(events: CalendarEvent[]): {
  allDay: CalendarEvent[];
  timed: CalendarEvent[];
} {
  const allDay: CalendarEvent[] = [];
  const timed: CalendarEvent[] = [];

  for (const e of events) {
    if (e.isAllDay) allDay.push(e);
    else timed.push(e);
  }

  return { allDay, timed };
}

/**
 * Calculate collision groups for overlapping timed events within a day.
 * Returns events with `columnIndex` and `totalColumns` for horizontal layout.
 */
export interface PositionedEvent extends CalendarEvent {
  columnIndex: number;
  totalColumns: number;
}

export function calculateEventPositions(
  events: CalendarEvent[]
): PositionedEvent[] {
  if (events.length === 0) return [];

  const sorted = [...events].sort(
    (a, b) => a.start.getTime() - b.start.getTime() || b.end.getTime() - a.end.getTime()
  );

  const columns: CalendarEvent[][] = [];

  for (const event of sorted) {
    let placed = false;
    for (let col = 0; col < columns.length; col++) {
      const lastInCol = columns[col][columns[col].length - 1];
      if (lastInCol.end <= event.start) {
        columns[col].push(event);
        placed = true;
        break;
      }
    }
    if (!placed) {
      columns.push([event]);
    }
  }

  const totalColumns = columns.length;
  const result: PositionedEvent[] = [];

  for (let col = 0; col < columns.length; col++) {
    for (const event of columns[col]) {
      result.push({ ...event, columnIndex: col, totalColumns });
    }
  }

  return result;
}
