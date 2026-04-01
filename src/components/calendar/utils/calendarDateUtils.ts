// ─────────────────────────────────────────────────────────────────────────────
// Calendar Date Utilities — built on date-fns
// ─────────────────────────────────────────────────────────────────────────────

import {
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfDay,
  endOfDay,
  eachDayOfInterval,
  eachHourOfInterval,
  addDays,
  addWeeks,
  addMonths,
  subDays,
  subWeeks,
  subMonths,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  isWithinInterval,
  differenceInMinutes,
  getHours,
  getMinutes,
  setHours,
  setMinutes,
  parseISO,
} from "date-fns";

import type { CalendarViewType } from "../../../types/calendar";

// ─── Week helpers ────────────────────────────────────────────────────────────

/** Returns array of 7 Date objects for the week containing `date`. */
export function getWeekDays(date: Date): Date[] {
  const start = startOfWeek(date, { weekStartsOn: 1 }); // Monday start
  return eachDayOfInterval({ start, end: endOfWeek(date, { weekStartsOn: 1 }) });
}

// ─── Month helpers ───────────────────────────────────────────────────────────

/** Returns a 6×7 grid of dates (42 days) for the month calendar. */
export function getMonthGrid(date: Date): Date[] {
  const monthStart = startOfMonth(date);
  const monthEnd = endOfMonth(date);
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const days = eachDayOfInterval({ start: gridStart, end: gridEnd });

  // Ensure exactly 42 days (6 rows × 7 cols)
  while (days.length < 42) {
    days.push(addDays(days[days.length - 1], 1));
  }
  return days;
}

// ─── Hour helpers ────────────────────────────────────────────────────────────

/** Returns 24 hour marks for a given day (00:00–23:00). */
export function getHourSlots(date: Date): Date[] {
  return eachHourOfInterval({
    start: startOfDay(date),
    end: setHours(startOfDay(date), 23),
  });
}

// ─── Navigation ──────────────────────────────────────────────────────────────

export function navigateDate(
  date: Date,
  direction: "prev" | "next" | "today",
  view: CalendarViewType
): Date {
  if (direction === "today") return new Date();
  const fn = direction === "next"
    ? { day: addDays, week: addWeeks, month: addMonths }
    : { day: subDays, week: subWeeks, month: subMonths };
  return fn[view](date, 1);
}

// ─── View date range ─────────────────────────────────────────────────────────

/** Returns the start and end dates for the visible range of a given view. */
export function getViewDateRange(
  date: Date,
  view: CalendarViewType
): { start: Date; end: Date } {
  switch (view) {
    case "day":
      return { start: startOfDay(date), end: endOfDay(date) };
    case "week": {
      const ws = startOfWeek(date, { weekStartsOn: 1 });
      return { start: startOfDay(ws), end: endOfDay(endOfWeek(date, { weekStartsOn: 1 })) };
    }
    case "month": {
      const ms = startOfMonth(date);
      const me = endOfMonth(date);
      return {
        start: startOfDay(startOfWeek(ms, { weekStartsOn: 1 })),
        end: endOfDay(endOfWeek(me, { weekStartsOn: 1 })),
      };
    }
  }
}

// ─── Formatting ──────────────────────────────────────────────────────────────

export function formatToolbarTitle(date: Date, view: CalendarViewType): string {
  switch (view) {
    case "day":
      return format(date, "EEEE, MMMM d, yyyy");
    case "week": {
      const ws = startOfWeek(date, { weekStartsOn: 1 });
      const we = endOfWeek(date, { weekStartsOn: 1 });
      if (isSameMonth(ws, we)) {
        return `${format(ws, "MMM d")} – ${format(we, "d, yyyy")}`;
      }
      return `${format(ws, "MMM d")} – ${format(we, "MMM d, yyyy")}`;
    }
    case "month":
      return format(date, "MMMM yyyy");
  }
}

export function formatHour(hour: number): string {
  if (hour === 0) return "12 AM";
  if (hour < 12) return `${hour} AM`;
  if (hour === 12) return "12 PM";
  return `${hour - 12} PM`;
}

export function formatDayHeader(date: Date): string {
  return format(date, "EEE");
}

export function formatDayNumber(date: Date): string {
  return format(date, "d");
}

// ─── Event positioning ───────────────────────────────────────────────────────

const HOUR_HEIGHT = 60; // px per hour in Day/Week view

/** Calculate CSS top offset for an event based on its start time. */
export function getEventTopOffset(start: Date): number {
  return (getHours(start) + getMinutes(start) / 60) * HOUR_HEIGHT;
}

/** Calculate CSS height for an event based on its duration. */
export function getEventHeight(start: Date, end: Date): number {
  const mins = differenceInMinutes(end, start);
  return Math.max((mins / 60) * HOUR_HEIGHT, 20); // min 20px
}

/** Calculate current-time indicator position. */
export function getCurrentTimeOffset(): number {
  const now = new Date();
  return (getHours(now) + getMinutes(now) / 60) * HOUR_HEIGHT;
}

// ─── Re-exports for convenience ──────────────────────────────────────────────

export {
  isSameDay,
  isSameMonth,
  isToday,
  isWithinInterval,
  format,
  parseISO,
  startOfDay,
  endOfDay,
  setHours,
  setMinutes,
  differenceInMinutes,
  addDays,
};
