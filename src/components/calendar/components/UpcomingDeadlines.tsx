import { useNavigate } from "react-router";
import { format, isPast } from "date-fns";
import { Calendar, Settings } from "lucide-react@0.487.0";
import type { UpcomingDeadline } from "../../../types/calendar";
import { getCalendarColors } from "../utils/calendarColors";

interface UpcomingDeadlinesProps {
  deadlines: UpcomingDeadline[];
}

export function UpcomingDeadlines({ deadlines }: UpcomingDeadlinesProps) {
  const navigate = useNavigate();

  return (
    <div className="py-4 px-4">
      {/* Section header */}
      <div className="flex items-center gap-2 mb-3">
        <Settings size={14} style={{ color: "var(--neuron-ink-muted)" }} />
        <h3
          className="text-[12px] font-semibold uppercase tracking-wider"
          style={{ color: "var(--neuron-ink-muted)" }}
        >
          Upcoming Deadlines
        </h3>
      </div>

      {deadlines.length === 0 ? (
        <p
          className="text-[13px] py-6 text-center"
          style={{ color: "var(--neuron-ink-muted)" }}
        >
          No upcoming deadlines
        </p>
      ) : (
        <div className="space-y-0.5">
          {deadlines.slice(0, 10).map((d) => {
            const colors = getCalendarColors(d.colorKey);
            const overdue = isPast(d.date);
            const dateLabel = format(d.date, "MMM d");

            return (
              <button
                key={d.id}
                type="button"
                onClick={() => navigate(d.deepLink)}
                className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-[var(--neuron-radius-s)] text-left transition-colors duration-150"
                style={{ cursor: "pointer" }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.backgroundColor =
                    "var(--neuron-state-hover)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.backgroundColor = "transparent")
                }
              >
                {/* Calendar icon with color accent */}
                <div
                  className="flex items-center justify-center rounded-[var(--neuron-radius-s)] flex-shrink-0"
                  style={{
                    width: 32,
                    height: 32,
                    backgroundColor: colors.bg,
                  }}
                >
                  <Calendar
                    size={15}
                    style={{ color: colors.border }}
                  />
                </div>

                {/* Label + date */}
                <div className="flex-1 min-w-0">
                  <div
                    className="text-[13px] font-medium truncate"
                    style={{ color: "var(--neuron-ink-primary)" }}
                  >
                    {d.label}
                  </div>
                  <div
                    className="text-[12px] truncate"
                    style={{
                      color: overdue
                        ? "var(--neuron-semantic-danger)"
                        : "var(--neuron-ink-muted)",
                    }}
                  >
                    {dateLabel}
                    {overdue && " · Overdue"}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
