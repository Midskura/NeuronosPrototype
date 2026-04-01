// ─────────────────────────────────────────────────────────────────────────────
// Calendar Color Tokens — maps department / source to CSS variables
// ─────────────────────────────────────────────────────────────────────────────

export interface CalendarColorSet {
  bg: string;
  text: string;
  border: string;
}

const v = (name: string): string => `var(${name})`;

export const calendarColorMap: Record<string, CalendarColorSet> = {
  "Business Development": {
    bg: v("--neuron-cal-bd"),
    text: v("--neuron-cal-bd-text"),
    border: v("--neuron-cal-bd-border"),
  },
  Pricing: {
    bg: v("--neuron-cal-pricing"),
    text: v("--neuron-cal-pricing-text"),
    border: v("--neuron-cal-pricing-border"),
  },
  Operations: {
    bg: v("--neuron-cal-ops"),
    text: v("--neuron-cal-ops-text"),
    border: v("--neuron-cal-ops-border"),
  },
  Accounting: {
    bg: v("--neuron-cal-accounting"),
    text: v("--neuron-cal-accounting-text"),
    border: v("--neuron-cal-accounting-border"),
  },
  HR: {
    bg: v("--neuron-cal-hr"),
    text: v("--neuron-cal-hr-text"),
    border: v("--neuron-cal-hr-border"),
  },
  Executive: {
    bg: v("--neuron-cal-executive"),
    text: v("--neuron-cal-executive-text"),
    border: v("--neuron-cal-executive-border"),
  },
  personal: {
    bg: v("--neuron-cal-personal"),
    text: v("--neuron-cal-personal-text"),
    border: v("--neuron-cal-personal-border"),
  },
  crm: {
    bg: v("--neuron-cal-crm"),
    text: v("--neuron-cal-crm-text"),
    border: v("--neuron-cal-crm-border"),
  },
};

/** Resolve color set from a colorKey (department name or source type). */
export function getCalendarColors(colorKey: string): CalendarColorSet {
  return calendarColorMap[colorKey] ?? calendarColorMap.personal;
}
