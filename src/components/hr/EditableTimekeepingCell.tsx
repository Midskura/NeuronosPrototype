import { useState } from "react";
import { MoreVertical } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../ui/popover";
import { cn } from "../ui/utils";

type CellState = "time" | "leave" | "absent" | "empty";

interface EditableTimekeepingCellProps {
  employeeId: string;
  day: number;
  initialState?: CellState;
  initialIn?: string;
  initialOut?: string;
  isLocked?: boolean;
  onUpdate?: (employeeId: string, day: number, state: CellState, inTime?: string, outTime?: string) => void;
}

export function EditableTimekeepingCell({
  employeeId,
  day,
  initialState = "time",
  initialIn = "08:00",
  initialOut = "17:00",
  isLocked = false,
  onUpdate,
}: EditableTimekeepingCellProps) {
  const [cellState, setCellState] = useState<CellState>(initialState);
  const [inTime, setInTime] = useState(initialIn);
  const [outTime, setOutTime] = useState(initialOut);
  const [isHovering, setIsHovering] = useState(false);
  const [popoverOpen, setPopoverOpen] = useState(false);

  const handleStateChange = (newState: CellState) => {
    setCellState(newState);
    setPopoverOpen(false);
    onUpdate?.(employeeId, day, newState, inTime, outTime);
  };

  const handleClear = () => {
    setCellState("empty");
    setInTime("");
    setOutTime("");
    setPopoverOpen(false);
    onUpdate?.(employeeId, day, "empty", "", "");
  };

  if (isLocked) {
    return (
      <>
        <td
          className="px-2 py-3 text-center text-[12px] border-r border-[#D1D5DB] bg-[#F3F4F6] text-[#9CA3AF] relative"
          style={{ height: "40px" }}
        >
          <div
            className="absolute inset-0 flex items-center justify-center text-[9px] text-[#D1D5DB] pointer-events-none"
            style={{
              transform: "rotate(-45deg)",
              fontWeight: 600,
            }}
          >
            LOCKED
          </div>
        </td>
        <td
          className="px-2 py-3 text-center text-[12px] border-r border-[#D1D5DB] bg-[#F3F4F6] text-[#9CA3AF]"
          style={{ height: "40px" }}
        >
        </td>
      </>
    );
  }

  if (cellState === "leave") {
    return (
      <td
        colSpan={2}
        className="px-2 py-2 text-center border-r border-[#D1D5DB] relative group"
        style={{ height: "40px" }}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
      >
        <div className="flex items-center justify-center gap-2">
          <span
            className="px-3 py-1 text-[12px] rounded-full bg-[#FFE7B3] text-[#9B6B1B]"
            style={{ fontWeight: 600 }}
          >
            LEAVE
          </span>
          {isHovering && (
            <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
              <PopoverTrigger asChild>
                <button className="opacity-0 group-hover:opacity-100 transition-opacity">
                  <MoreVertical className="w-3 h-3 text-[#6B7280]" />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-40 p-1" align="start">
                <button
                  onClick={() => handleStateChange("time")}
                  className="w-full text-left px-3 py-2 text-[12px] hover:bg-[#F9FAFB] rounded"
                >
                  Set time
                </button>
                <button
                  onClick={() => handleStateChange("leave")}
                  className="w-full text-left px-3 py-2 text-[12px] hover:bg-[#F9FAFB] rounded"
                >
                  Mark as LEAVE
                </button>
                <button
                  onClick={() => handleStateChange("absent")}
                  className="w-full text-left px-3 py-2 text-[12px] hover:bg-[#F9FAFB] rounded"
                >
                  Mark as ABSENT
                </button>
                <button
                  onClick={handleClear}
                  className="w-full text-left px-3 py-2 text-[12px] hover:bg-[#F9FAFB] rounded text-[#6B7280]"
                >
                  Clear
                </button>
              </PopoverContent>
            </Popover>
          )}
        </div>
      </td>
    );
  }

  if (cellState === "absent") {
    return (
      <td
        colSpan={2}
        className="px-2 py-2 text-center border-r border-[#D1D5DB] relative group"
        style={{ height: "40px" }}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
      >
        <div className="flex items-center justify-center gap-2">
          <span
            className="px-3 py-1 text-[12px] rounded-full bg-[#FFE2E2] text-[#B53737]"
            style={{ fontWeight: 600 }}
          >
            ABSENT
          </span>
          {isHovering && (
            <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
              <PopoverTrigger asChild>
                <button className="opacity-0 group-hover:opacity-100 transition-opacity">
                  <MoreVertical className="w-3 h-3 text-[#6B7280]" />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-40 p-1" align="start">
                <button
                  onClick={() => handleStateChange("time")}
                  className="w-full text-left px-3 py-2 text-[12px] hover:bg-[#F9FAFB] rounded"
                >
                  Set time
                </button>
                <button
                  onClick={() => handleStateChange("leave")}
                  className="w-full text-left px-3 py-2 text-[12px] hover:bg-[#F9FAFB] rounded"
                >
                  Mark as LEAVE
                </button>
                <button
                  onClick={() => handleStateChange("absent")}
                  className="w-full text-left px-3 py-2 text-[12px] hover:bg-[#F9FAFB] rounded"
                >
                  Mark as ABSENT
                </button>
                <button
                  onClick={handleClear}
                  className="w-full text-left px-3 py-2 text-[12px] hover:bg-[#F9FAFB] rounded text-[#6B7280]"
                >
                  Clear
                </button>
              </PopoverContent>
            </Popover>
          )}
        </div>
      </td>
    );
  }

  // Time entry state (or empty)
  return (
    <>
      <td
        className="px-2 py-2 text-center border-r border-[#D1D5DB] relative group"
        style={{ height: "40px" }}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
      >
        <div className="flex items-center justify-center gap-1">
          <input
            type="text"
            value={inTime}
            onChange={(e) => {
              setInTime(e.target.value);
              onUpdate?.(employeeId, day, "time", e.target.value, outTime);
            }}
            placeholder="08:00"
            className="w-16 h-9 text-center text-[12px] border border-[#E6E9F0] rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#0F766E]/20 focus:border-[#0F766E]"
          />
          {isHovering && (
            <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
              <PopoverTrigger asChild>
                <button className="opacity-0 group-hover:opacity-100 transition-opacity">
                  <MoreVertical className="w-3 h-3 text-[#6B7280]" />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-40 p-1" align="start">
                <button
                  onClick={() => handleStateChange("time")}
                  className="w-full text-left px-3 py-2 text-[12px] hover:bg-[#F9FAFB] rounded"
                >
                  Set time
                </button>
                <button
                  onClick={() => handleStateChange("leave")}
                  className="w-full text-left px-3 py-2 text-[12px] hover:bg-[#F9FAFB] rounded"
                >
                  Mark as LEAVE
                </button>
                <button
                  onClick={() => handleStateChange("absent")}
                  className="w-full text-left px-3 py-2 text-[12px] hover:bg-[#F9FAFB] rounded"
                >
                  Mark as ABSENT
                </button>
                <button
                  onClick={handleClear}
                  className="w-full text-left px-3 py-2 text-[12px] hover:bg-[#F9FAFB] rounded text-[#6B7280]"
                >
                  Clear
                </button>
              </PopoverContent>
            </Popover>
          )}
        </div>
      </td>
      <td
        className="px-2 py-2 text-center border-r border-[#D1D5DB]"
        style={{ height: "40px" }}
      >
        <input
          type="text"
          value={outTime}
          onChange={(e) => {
            setOutTime(e.target.value);
            onUpdate?.(employeeId, day, "time", inTime, e.target.value);
          }}
          placeholder="17:00"
          className="w-16 h-9 text-center text-[12px] border border-[#E6E9F0] rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#0F766E]/20 focus:border-[#0F766E]"
        />
      </td>
    </>
  );
}