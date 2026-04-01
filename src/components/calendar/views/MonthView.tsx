import type { CalendarEvent } from "../../../types/calendar";
import { AllDayBanner } from "../components/AllDayBanner";
import { EventBlock } from "../components/EventBlock";
import {
  getMonthGrid,
  isToday,
  isSameMonth,
  formatDayNumber,
} from "../utils/calendarDateUtils";
import { getEventsForDay } from "../utils/eventMerger";

interface MonthViewProps {
  currentDate: Date;
  events: CalendarEvent[];
  onDayClick: (date: Date) => void;
  onEventClick: (event: CalendarEvent) => void;
}

const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const MAX_VISIBLE = 3;

export function MonthView({
  currentDate,
  events,
  onDayClick,
  onEventClick,
}: MonthViewProps) {
  const grid = getMonthGrid(currentDate);
  const weeks: Date[][] = [];
  for (let i = 0; i < grid.length; i += 7) {
    weeks.push(grid.slice(i, i + 7));
  }

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      {/* Day name headers */}
      <div
        className="grid"
        style={{
          gridTemplateColumns: "repeat(7, 1fr)",
          borderBottom: "1px solid var(--neuron-ui-border)",
          backgroundColor: "var(--neuron-bg-elevated)",
        }}
      >
        {DAY_NAMES.map((name) => (
          <div
            key={name}
            className="text-center py-2 text-[11px] font-medium uppercase select-none"
            style={{ color: "var(--neuron-ink-muted)" }}
          >
            {name}
          </div>
        ))}
      </div>

      {/* Week rows */}
      <div className="flex-1 grid" style={{ gridTemplateRows: `repeat(${weeks.length}, 1fr)`, backgroundColor: "var(--neuron-bg-elevated)" }}>
        {weeks.map((week, wi) => (
          <div
            key={wi}
            className="grid"
            style={{
              gridTemplateColumns: "repeat(7, 1fr)",
              borderBottom: "1px solid var(--neuron-ui-divider)",
            }}
          >
            {week.map((day) => {
              const today = isToday(day);
              const inMonth = isSameMonth(day, currentDate);
              const dayEvents = getEventsForDay(events, day);
              const overflow = dayEvents.length - MAX_VISIBLE;

              return (
                <div
                  key={day.toISOString()}
                  onClick={() => onDayClick(day)}
                  className="min-h-[100px] p-1 cursor-pointer transition-colors duration-100"
                  style={{
                    borderRight: "1px solid var(--neuron-ui-divider)",
                    backgroundColor: today
                      ? "var(--theme-bg-surface-subtle)"
                      : "transparent",
                  }}
                  onMouseEnter={(e) => {
                    if (!today)
                      e.currentTarget.style.backgroundColor =
                        "var(--neuron-state-hover)";
                  }}
                  onMouseLeave={(e) => {
                    if (!today)
                      e.currentTarget.style.backgroundColor = "transparent";
                  }}
                >
                  {/* Date number */}
                  <div className="flex justify-end mb-0.5">
                    <span
                      className="text-[13px] font-medium flex items-center justify-center rounded-full"
                      style={{
                        width: 26,
                        height: 26,
                        color: today
                          ? "var(--neuron-action-primary-text)"
                          : inMonth
                            ? "var(--neuron-ink-primary)"
                            : "var(--neuron-ink-muted)",
                        backgroundColor: today
                          ? "var(--neuron-action-primary)"
                          : "transparent",
                        opacity: inMonth ? 1 : 0.5,
                      }}
                    >
                      {formatDayNumber(day)}
                    </span>
                  </div>

                  {/* Event chips */}
                  <div className="space-y-0.5">
                    {dayEvents.slice(0, MAX_VISIBLE).map((event) =>
                      event.isAllDay ? (
                        <AllDayBanner
                          key={event.id}
                          event={event}
                          onClick={onEventClick}
                        />
                      ) : (
                        <EventBlock
                          key={event.id}
                          event={event}
                          compact
                          onClick={onEventClick}
                        />
                      )
                    )}
                    {overflow > 0 && (
                      <div
                        className="text-[10px] font-medium pl-1 cursor-pointer"
                        style={{ color: "var(--neuron-ink-muted)" }}
                      >
                        +{overflow} more
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
