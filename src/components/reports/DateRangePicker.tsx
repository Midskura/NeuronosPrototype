import { useState } from "react";
import { Calendar } from "../ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../ui/popover";
import { Button } from "../ui/button";
import { Calendar as CalendarIcon } from "lucide-react";
import { cn } from "../ui/utils";
import { format } from "date-fns";

interface DateRangePickerProps {
  startDate: Date | undefined;
  endDate: Date | undefined;
  onStartDateChange: (date: Date | undefined) => void;
  onEndDateChange: (date: Date | undefined) => void;
}

export function DateRangePicker({ 
  startDate, 
  endDate, 
  onStartDateChange, 
  onEndDateChange 
}: DateRangePickerProps) {
  const [startOpen, setStartOpen] = useState(false);
  const [endOpen, setEndOpen] = useState(false);

  return (
    <div className="flex items-center" style={{ gap: '4px' }}>
      {/* Start Date */}
      <Popover open={startOpen} onOpenChange={setStartOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "border-[#E5E7EB] hover:bg-[#F9FAFB] justify-start",
              "transition-colors duration-150"
            )}
            style={{ 
              width: "100px", 
              height: "36px",
              borderRadius: "8px",
              fontSize: "13px",
              padding: "8px 10px",
              fontWeight: 500,
            }}
          >
            <CalendarIcon className="mr-1 h-3.5 w-3.5 flex-shrink-0" />
            <span className="truncate">
              {startDate ? format(startDate, "MMM dd") : "Start"}
            </span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={startDate}
            onSelect={(date) => {
              onStartDateChange(date);
              setStartOpen(false);
            }}
            initialFocus
          />
        </PopoverContent>
      </Popover>

      <span className="text-[#94A3B8] flex-shrink-0" style={{ fontSize: '12px' }}>–</span>

      {/* End Date */}
      <Popover open={endOpen} onOpenChange={setEndOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "border-[#E5E7EB] hover:bg-[#F9FAFB] justify-start",
              "transition-colors duration-150"
            )}
            style={{ 
              width: "100px", 
              height: "36px",
              borderRadius: "8px",
              fontSize: "13px",
              padding: "8px 10px",
              fontWeight: 500,
            }}
          >
            <CalendarIcon className="mr-1 h-3.5 w-3.5 flex-shrink-0" />
            <span className="truncate">
              {endDate ? format(endDate, "MMM dd") : "End"}
            </span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={endDate}
            onSelect={(date) => {
              onEndDateChange(date);
              setEndOpen(false);
            }}
            disabled={(date) => startDate ? date < startDate : false}
            initialFocus
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
