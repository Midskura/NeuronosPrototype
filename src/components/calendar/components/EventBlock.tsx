import { useNavigate } from "react-router";
import type { CalendarEvent } from "../../../types/calendar";
import type { PositionedEvent } from "../utils/eventMerger";
import { getCalendarColors } from "../utils/calendarColors";
import { format } from "../utils/calendarDateUtils";

interface EventBlockProps {
  event: CalendarEvent | PositionedEvent;
  /** Absolute positioning values (for Day/Week view) */
  top?: number;
  height?: number;
  /** Compact mode for month view */
  compact?: boolean;
  onClick?: (event: CalendarEvent) => void;
  onDragStart?: (event: CalendarEvent, e: React.DragEvent) => void;
}

export function EventBlock({
  event,
  top,
  height,
  compact = false,
  onClick,
  onDragStart,
}: EventBlockProps) {
  const navigate = useNavigate();
  const colors = getCalendarColors(event.colorKey);

  // Column positioning for overlapping events
  const positioned = "columnIndex" in event ? (event as PositionedEvent) : null;
  const columnWidth = positioned
    ? `${100 / positioned.totalColumns}%`
    : "100%";
  const columnLeft = positioned
    ? `${(positioned.columnIndex / positioned.totalColumns) * 100}%`
    : "0%";

  const handleClick = () => {
    if (event.isReadOnly && event.deepLink) {
      navigate(event.deepLink);
    } else if (onClick) {
      onClick(event);
    }
  };

  const handleDragStart = (e: React.DragEvent) => {
    if (!event.isDraggable) return;
    e.dataTransfer.setData(
      "application/neuron-event",
      JSON.stringify({ id: event.id, startMs: event.start.getTime(), endMs: event.end.getTime() })
    );
    e.dataTransfer.effectAllowed = "move";
    onDragStart?.(event, e);
  };

  if (compact) {
    return (
      <button
        type="button"
        onClick={handleClick}
        draggable={event.isDraggable}
        onDragStart={handleDragStart}
        className="w-full text-left rounded px-1.5 py-0.5 text-[11px] font-medium truncate transition-[filter] duration-150 hover:brightness-[0.97]"
        style={{
          backgroundColor: colors.bg,
          color: colors.text,
          borderLeft: `2px solid ${colors.border}`,
          cursor: event.isDraggable ? "grab" : "pointer",
        }}
        title={event.title}
      >
        {event.title}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      draggable={event.isDraggable}
      onDragStart={handleDragStart}
      className="absolute rounded-[var(--neuron-radius-s)] px-2 py-1 text-left overflow-hidden transition-[filter] duration-150 hover:brightness-[0.97]"
      style={{
        top,
        height: Math.max(height ?? 20, 20),
        left: columnLeft,
        width: `calc(${columnWidth} - 2px)`,
        backgroundColor: colors.bg,
        color: colors.text,
        borderLeft: `2px solid ${colors.border}`,
        cursor: event.isDraggable ? "grab" : "pointer",
        zIndex: 10,
      }}
    >
      <div className="text-[11px] font-medium truncate leading-tight">
        {event.title}
      </div>
      {(height ?? 40) > 30 && (
        <div className="text-[10px] opacity-75 truncate leading-tight">
          {format(event.start, "h:mm a")}
          {!event.isAllDay && ` – ${format(event.end, "h:mm a")}`}
        </div>
      )}
    </button>
  );
}
