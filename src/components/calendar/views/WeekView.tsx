import { useRef } from "react";
import type { CalendarEvent } from "../../../types/calendar";
import { TimeColumn } from "../components/TimeColumn";
import { CurrentTimeIndicator } from "../components/CurrentTimeIndicator";
import { EventBlock } from "../components/EventBlock";
import {
  getWeekDays,
  formatDayHeader,
  formatDayNumber,
  isToday,
  isSameDay,
  getEventTopOffset,
  getEventHeight,
} from "../utils/calendarDateUtils";
import {
  getEventsForDay,
  partitionEvents,
  calculateEventPositions,
} from "../utils/eventMerger";
import { AllDayBanner } from "../components/AllDayBanner";

interface WeekViewProps {
  currentDate: Date;
  events: CalendarEvent[];
  onSlotClick: (date: Date, hour: number) => void;
  onEventClick: (event: CalendarEvent) => void;
  onEventDrop: (eventId: string, newStart: Date, newEnd: Date) => void;
}

const HOURS = Array.from({ length: 24 }, (_, i) => i);

export function WeekView({
  currentDate,
  events,
  onSlotClick,
  onEventClick,
  onEventDrop,
}: WeekViewProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const days = getWeekDays(currentDate);

  const handleDrop = (day: Date, hour: number, e: React.DragEvent) => {
    e.preventDefault();
    try {
      const data = JSON.parse(
        e.dataTransfer.getData("application/neuron-event")
      );
      const durationMs = data.endMs - data.startMs;
      const newStart = new Date(day);
      newStart.setHours(hour, 0, 0, 0);
      const newEnd = new Date(newStart.getTime() + durationMs);
      onEventDrop(data.id, newStart, newEnd);
    } catch {
      // ignore invalid drops
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      {/* Day headers */}
      <div
        className="grid"
        style={{
          gridTemplateColumns: "56px repeat(7, 1fr)",
          borderBottom: "1px solid var(--neuron-ui-border)",
          backgroundColor: "var(--neuron-bg-elevated)",
        }}
      >
        <div /> {/* spacer for time column */}
        {days.map((day) => {
          const today = isToday(day);
          return (
            <div
              key={day.toISOString()}
              className="flex flex-col items-center py-2.5 gap-0.5"
              style={{
                borderLeft: "1px solid var(--neuron-ui-divider)",
              }}
            >
              <span
                className="text-[11px] font-semibold uppercase tracking-wide"
                style={{
                  color: today
                    ? "var(--neuron-action-primary)"
                    : "var(--neuron-ink-muted)",
                }}
              >
                {formatDayHeader(day)}
              </span>
              <span
                className="text-[22px] font-semibold flex items-center justify-center rounded-full"
                style={{
                  width: 36,
                  height: 36,
                  color: today
                    ? "var(--neuron-action-primary-text)"
                    : "var(--neuron-ink-primary)",
                  backgroundColor: today
                    ? "var(--neuron-action-primary)"
                    : "transparent",
                }}
              >
                {formatDayNumber(day)}
              </span>
            </div>
          );
        })}
      </div>

      {/* All-day events row */}
      {(() => {
        const hasAllDay = days.some(
          (d) => getEventsForDay(events, d).some((e) => e.isAllDay)
        );
        if (!hasAllDay) return null;
        return (
          <div
            className="grid"
            style={{
              gridTemplateColumns: "56px repeat(7, 1fr)",
              borderBottom: "1px solid var(--neuron-ui-border)",
              backgroundColor: "var(--neuron-bg-elevated)",
            }}
          >
            <div
              className="flex items-center justify-end pr-3 text-[10px]"
              style={{ color: "var(--neuron-ink-muted)" }}
            >
              all-day
            </div>
            {days.map((day) => {
              const dayAllDay = getEventsForDay(events, day).filter(
                (e) => e.isAllDay
              );
              return (
                <div
                  key={day.toISOString()}
                  className="px-1 py-1 min-h-[28px]"
                  style={{ borderLeft: "1px solid var(--neuron-ui-divider)" }}
                >
                  {dayAllDay.slice(0, 3).map((e) => (
                    <AllDayBanner
                      key={e.id}
                      event={e}
                      onClick={onEventClick}
                    />
                  ))}
                  {dayAllDay.length > 3 && (
                    <span
                      className="text-[10px] pl-1"
                      style={{ color: "var(--neuron-ink-muted)" }}
                    >
                      +{dayAllDay.length - 3} more
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        );
      })()}

      {/* Scrollable time grid */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto" style={{ backgroundColor: "var(--neuron-bg-elevated)" }}>
        <div
          className="grid"
          style={{ gridTemplateColumns: "56px repeat(7, 1fr)", backgroundColor: "var(--neuron-bg-elevated)" }}
        >
          {/* Time column */}
          <TimeColumn />

          {/* Day columns */}
          {days.map((day) => {
            const dayEvents = getEventsForDay(events, day).filter(
              (e) => !e.isAllDay
            );
            const positioned = calculateEventPositions(dayEvents);
            const today = isToday(day);

            return (
              <div
                key={day.toISOString()}
                className="relative"
                style={{
                  borderLeft: "1px solid var(--neuron-ui-divider)",
                  backgroundColor: today
                    ? "var(--theme-bg-surface-subtle)"
                    : "transparent",
                }}
              >
                {/* Hour grid lines */}
                {HOURS.map((hour) => (
                  <div
                    key={hour}
                    onClick={() => onSlotClick(day, hour)}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(day, hour, e)}
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

                {/* Events */}
                {positioned.map((event) => (
                  <EventBlock
                    key={event.id}
                    event={event}
                    top={getEventTopOffset(event.start)}
                    height={getEventHeight(event.start, event.end)}
                    onClick={onEventClick}
                  />
                ))}

                {/* Current time indicator */}
                {today && <CurrentTimeIndicator />}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
