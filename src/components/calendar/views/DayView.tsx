import { useRef } from "react";
import type { CalendarEvent } from "../../../types/calendar";
import { TimeColumn } from "../components/TimeColumn";
import { CurrentTimeIndicator } from "../components/CurrentTimeIndicator";
import { EventBlock } from "../components/EventBlock";
import { AllDayBanner } from "../components/AllDayBanner";
import {
  isToday,
  format,
  getEventTopOffset,
  getEventHeight,
} from "../utils/calendarDateUtils";
import {
  getEventsForDay,
  calculateEventPositions,
} from "../utils/eventMerger";

interface DayViewProps {
  currentDate: Date;
  events: CalendarEvent[];
  onSlotClick: (date: Date, hour: number) => void;
  onEventClick: (event: CalendarEvent) => void;
  onEventDrop: (eventId: string, newStart: Date, newEnd: Date) => void;
}

const HOURS = Array.from({ length: 24 }, (_, i) => i);

export function DayView({
  currentDate,
  events,
  onSlotClick,
  onEventClick,
  onEventDrop,
}: DayViewProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const dayEvents = getEventsForDay(events, currentDate);
  const allDayEvents = dayEvents.filter((e) => e.isAllDay);
  const timedEvents = dayEvents.filter((e) => !e.isAllDay);
  const positioned = calculateEventPositions(timedEvents);
  const today = isToday(currentDate);

  const handleDrop = (hour: number, e: React.DragEvent) => {
    e.preventDefault();
    try {
      const data = JSON.parse(
        e.dataTransfer.getData("application/neuron-event")
      );
      const durationMs = data.endMs - data.startMs;
      const newStart = new Date(currentDate);
      newStart.setHours(hour, 0, 0, 0);
      const newEnd = new Date(newStart.getTime() + durationMs);
      onEventDrop(data.id, newStart, newEnd);
    } catch {}
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      {/* Day header */}
      <div
        className="flex items-center justify-center py-3"
        style={{
          borderBottom: "1px solid var(--neuron-ui-border)",
          backgroundColor: "var(--neuron-bg-elevated)",
        }}
      >
        <div className="text-center">
          <div
            className="text-[11px] font-medium uppercase"
            style={{
              color: today
                ? "var(--neuron-action-primary)"
                : "var(--neuron-ink-muted)",
            }}
          >
            {format(currentDate, "EEEE")}
          </div>
          <div
            className="text-[28px] font-medium flex items-center justify-center rounded-full mt-0.5 mx-auto"
            style={{
              width: 44,
              height: 44,
              color: today
                ? "var(--neuron-action-primary-text)"
                : "var(--neuron-ink-primary)",
              backgroundColor: today
                ? "var(--neuron-action-primary)"
                : "transparent",
            }}
          >
            {format(currentDate, "d")}
          </div>
        </div>
      </div>

      {/* All-day events */}
      {allDayEvents.length > 0 && (
        <div
          className="px-16 py-1"
          style={{
            borderBottom: "1px solid var(--neuron-ui-border)",
            backgroundColor: "var(--neuron-bg-elevated)",
          }}
        >
          {allDayEvents.map((e) => (
            <AllDayBanner key={e.id} event={e} onClick={onEventClick} />
          ))}
        </div>
      )}

      {/* Scrollable time grid */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto" style={{ backgroundColor: "var(--neuron-bg-elevated)" }}>
        <div
          className="grid"
          style={{ gridTemplateColumns: "56px 1fr", backgroundColor: "var(--neuron-bg-elevated)" }}
        >
          <TimeColumn />

          <div
            className="relative"
            style={{
              borderLeft: "1px solid var(--neuron-ui-divider)",
            }}
          >
            {HOURS.map((hour) => (
              <div
                key={hour}
                onClick={() => onSlotClick(currentDate, hour)}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(hour, e)}
                className="cursor-pointer transition-colors duration-100"
                style={{
                  height: 60,
                  borderBottom: "1px solid var(--neuron-ui-divider)",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.backgroundColor =
                    "var(--neuron-state-hover)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.backgroundColor = "transparent")
                }
              />
            ))}

            {positioned.map((event) => (
              <EventBlock
                key={event.id}
                event={event}
                top={getEventTopOffset(event.start)}
                height={getEventHeight(event.start, event.end)}
                onClick={onEventClick}
              />
            ))}

            {today && <CurrentTimeIndicator />}
          </div>
        </div>
      </div>
    </div>
  );
}
