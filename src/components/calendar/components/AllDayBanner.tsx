import type { CalendarEvent } from "../../../types/calendar";
import { getCalendarColors } from "../utils/calendarColors";

interface AllDayBannerProps {
  event: CalendarEvent;
  onClick?: (event: CalendarEvent) => void;
}

export function AllDayBanner({ event, onClick }: AllDayBannerProps) {
  const colors = getCalendarColors(event.colorKey);

  return (
    <button
      type="button"
      onClick={() => onClick?.(event)}
      className="w-full text-left rounded px-1.5 py-0.5 text-[11px] font-medium truncate mb-0.5 transition-[filter] duration-150 hover:brightness-[0.97]"
      style={{
        backgroundColor: colors.bg,
        color: colors.text,
        borderLeft: `2px solid ${colors.border}`,
        cursor: "pointer",
      }}
      title={event.title}
    >
      {event.title}
    </button>
  );
}
