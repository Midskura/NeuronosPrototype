import { formatHour } from "../utils/calendarDateUtils";

const HOURS = Array.from({ length: 24 }, (_, i) => i);

export function TimeColumn() {
  return (
    <div className="flex flex-col" style={{ width: 56 }}>
      {HOURS.map((hour) => (
        <div
          key={hour}
          className="flex items-start justify-end pr-3 text-[11px] font-normal select-none"
          style={{
            height: 60,
            color: "var(--neuron-ink-muted)",
            marginTop: hour === 0 ? 0 : -6,
          }}
        >
          {hour === 0 ? "" : formatHour(hour)}
        </div>
      ))}
    </div>
  );
}
