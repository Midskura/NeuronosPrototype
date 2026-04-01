import { Calendar } from "../../ui/calendar";

interface MiniCalendarProps {
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
}

export function MiniCalendar({ selectedDate, onDateSelect }: MiniCalendarProps) {
  return (
    <div
      className="px-2 py-3"
      style={{
        borderRight: "1px solid var(--neuron-ui-border)",
        backgroundColor: "var(--neuron-bg-elevated)",
        width: 220,
        flexShrink: 0,
      }}
    >
      <Calendar
        mode="single"
        selected={selectedDate}
        onSelect={(date) => date && onDateSelect(date)}
        className="w-full"
      />
    </div>
  );
}
