import type { CalendarEvent, CalendarViewType } from "../../types/calendar";
import { WeekView } from "./views/WeekView";
import { DayView } from "./views/DayView";
import { MonthView } from "./views/MonthView";

interface CalendarGridProps {
  currentView: CalendarViewType;
  currentDate: Date;
  events: CalendarEvent[];
  onSlotClick: (date: Date, hour?: number) => void;
  onEventClick: (event: CalendarEvent) => void;
  onEventDrop: (eventId: string, newStart: Date, newEnd: Date) => void;
}

export function CalendarGrid({
  currentView,
  currentDate,
  events,
  onSlotClick,
  onEventClick,
  onEventDrop,
}: CalendarGridProps) {
  switch (currentView) {
    case "day":
      return (
        <DayView
          currentDate={currentDate}
          events={events}
          onSlotClick={onSlotClick}
          onEventClick={onEventClick}
          onEventDrop={onEventDrop}
        />
      );
    case "week":
      return (
        <WeekView
          currentDate={currentDate}
          events={events}
          onSlotClick={onSlotClick}
          onEventClick={onEventClick}
          onEventDrop={onEventDrop}
        />
      );
    case "month":
      return (
        <MonthView
          currentDate={currentDate}
          events={events}
          onDayClick={(date) => onSlotClick(date)}
          onEventClick={onEventClick}
        />
      );
  }
}
