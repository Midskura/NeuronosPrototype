// ─────────────────────────────────────────────────────────────────────────────
// RRULE Utilities — RFC 5545 recurrence rule builder & expander
// ─────────────────────────────────────────────────────────────────────────────

import {
  addDays,
  addWeeks,
  addMonths,
  addYears,
  isBefore,
  isAfter,
  getDay,
  format,
} from "date-fns";

import type { RecurrenceFormData } from "../../../types/calendar";

const DAY_MAP: Record<string, number> = {
  SU: 0, MO: 1, TU: 2, WE: 3, TH: 4, FR: 5, SA: 6,
};

const DAY_NAMES = ["SU", "MO", "TU", "WE", "TH", "FR", "SA"];

// ─── Build RRULE string from form data ───────────────────────────────────────

export function buildRRule(data: RecurrenceFormData): string {
  const parts: string[] = [`FREQ=${data.frequency}`];

  if (data.interval > 1) {
    parts.push(`INTERVAL=${data.interval}`);
  }

  if (data.frequency === "WEEKLY" && data.byDay.length > 0) {
    parts.push(`BYDAY=${data.byDay.join(",")}`);
  }

  if (data.endType === "count" && data.count > 0) {
    parts.push(`COUNT=${data.count}`);
  } else if (data.endType === "until" && data.until) {
    parts.push(`UNTIL=${format(data.until, "yyyyMMdd'T'235959'Z'")}`);
  }

  return parts.join(";");
}

// ─── Parse RRULE string ──────────────────────────────────────────────────────

interface ParsedRRule {
  freq: "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY";
  interval: number;
  byDay: string[];
  count: number | null;
  until: Date | null;
}

export function parseRRule(rrule: string): ParsedRRule {
  const parts = rrule.split(";");
  const map: Record<string, string> = {};
  for (const part of parts) {
    const [key, val] = part.split("=");
    map[key] = val;
  }

  return {
    freq: (map.FREQ as ParsedRRule["freq"]) ?? "WEEKLY",
    interval: map.INTERVAL ? parseInt(map.INTERVAL, 10) : 1,
    byDay: map.BYDAY ? map.BYDAY.split(",") : [],
    count: map.COUNT ? parseInt(map.COUNT, 10) : null,
    until: map.UNTIL ? parseUntilDate(map.UNTIL) : null,
  };
}

function parseUntilDate(str: string): Date {
  // Format: YYYYMMDDTHHMMSSZ
  const y = parseInt(str.slice(0, 4), 10);
  const m = parseInt(str.slice(4, 6), 10) - 1;
  const d = parseInt(str.slice(6, 8), 10);
  return new Date(y, m, d, 23, 59, 59);
}

// ─── Expand RRULE into concrete occurrences within a date range ──────────────

export function expandRRule(
  rrule: string,
  eventStart: Date,
  eventEnd: Date,
  rangeStart: Date,
  rangeEnd: Date,
  maxOccurrences = 200
): Array<{ start: Date; end: Date }> {
  const parsed = parseRRule(rrule);
  const durationMs = eventEnd.getTime() - eventStart.getTime();
  const occurrences: Array<{ start: Date; end: Date }> = [];

  const advanceFn = {
    DAILY: addDays,
    WEEKLY: addWeeks,
    MONTHLY: addMonths,
    YEARLY: addYears,
  }[parsed.freq];

  let current = new Date(eventStart);
  let count = 0;

  while (count < maxOccurrences) {
    // Stop if past the UNTIL date or range end
    if (parsed.until && isAfter(current, parsed.until)) break;
    if (isAfter(current, rangeEnd)) break;
    if (parsed.count !== null && count >= parsed.count) break;

    // For WEEKLY with BYDAY, check if current day matches
    if (parsed.freq === "WEEKLY" && parsed.byDay.length > 0) {
      // Iterate each day of the current week
      const weekStart = current;
      for (let d = 0; d < 7; d++) {
        const candidate = addDays(weekStart, d);
        const dayName = DAY_NAMES[getDay(candidate)];
        if (parsed.byDay.includes(dayName)) {
          if (
            !isBefore(candidate, rangeStart) ||
            isBefore(rangeStart, new Date(candidate.getTime() + durationMs))
          ) {
            if (!isAfter(candidate, rangeEnd)) {
              occurrences.push({
                start: candidate,
                end: new Date(candidate.getTime() + durationMs),
              });
            }
          }
          count++;
          if (parsed.count !== null && count >= parsed.count) break;
        }
      }
      current = advanceFn(current, parsed.interval);
    } else {
      // Simple frequency: DAILY, MONTHLY, YEARLY (and WEEKLY without BYDAY)
      const occEnd = new Date(current.getTime() + durationMs);
      if (!isAfter(rangeStart, occEnd) && !isAfter(current, rangeEnd)) {
        occurrences.push({ start: new Date(current), end: occEnd });
      }
      count++;
      current = advanceFn(current, parsed.interval);
    }
  }

  return occurrences;
}

// ─── Human-readable description ──────────────────────────────────────────────

export function describeRRule(rrule: string): string {
  const parsed = parseRRule(rrule);
  const interval = parsed.interval > 1 ? `every ${parsed.interval} ` : "every ";

  const freqLabel: Record<string, string> = {
    DAILY: "day",
    WEEKLY: "week",
    MONTHLY: "month",
    YEARLY: "year",
  };

  let desc = `Repeats ${interval}${freqLabel[parsed.freq]}`;
  if (parsed.interval > 1) desc += "s";

  if (parsed.byDay.length > 0) {
    desc += ` on ${parsed.byDay.join(", ")}`;
  }

  if (parsed.count !== null) {
    desc += `, ${parsed.count} times`;
  } else if (parsed.until) {
    desc += `, until ${format(parsed.until, "MMM d, yyyy")}`;
  }

  return desc;
}
