import { useEffect, useState } from "react";
import { getCurrentTimeOffset } from "../utils/calendarDateUtils";

export function CurrentTimeIndicator() {
  const [offset, setOffset] = useState(getCurrentTimeOffset);

  useEffect(() => {
    const timer = setInterval(() => {
      setOffset(getCurrentTimeOffset());
    }, 60_000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div
      className="absolute left-0 right-0 z-20 pointer-events-none"
      style={{ top: offset }}
    >
      <div className="flex items-center">
        <div
          className="rounded-full"
          style={{
            width: 8,
            height: 8,
            backgroundColor: "var(--neuron-semantic-danger)",
            marginLeft: -4,
          }}
        />
        <div
          className="flex-1"
          style={{
            height: 1,
            backgroundColor: "var(--neuron-semantic-danger)",
          }}
        />
      </div>
    </div>
  );
}
