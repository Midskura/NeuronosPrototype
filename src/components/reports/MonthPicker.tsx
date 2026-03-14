import { useState } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../ui/popover";
import { Button } from "../ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "../ui/utils";

interface MonthPickerProps {
  value: string; // Format: "Nov 2025"
  onChange: (value: string) => void;
}

export function MonthPicker({ value, onChange }: MonthPickerProps) {
  const [open, setOpen] = useState(false);
  
  // Parse current value
  const parseValue = (val: string) => {
    const parts = val.split(" ");
    const monthName = parts[0];
    const year = parseInt(parts[1] || new Date().getFullYear().toString());
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const month = monthNames.indexOf(monthName);
    return { month: month >= 0 ? month : new Date().getMonth(), year };
  };

  const { month: currentMonth, year: currentYear } = parseValue(value);
  const [selectedYear, setSelectedYear] = useState(currentYear);

  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  const handleMonthSelect = (monthIndex: number) => {
    const newValue = `${monthNames[monthIndex]} ${selectedYear}`;
    onChange(newValue);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "border-[#E5E7EB] hover:bg-[#F9FAFB] justify-start",
            "transition-colors duration-150"
          )}
          style={{ 
            width: "130px", 
            height: "36px",
            borderRadius: "8px",
            fontSize: "13px",
            padding: "8px 12px",
            fontWeight: 500,
          }}
        >
          {value}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-4" align="start">
        {/* Year selector */}
        <div className="flex items-center justify-between mb-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelectedYear(selectedYear - 1)}
            className="h-8 w-8 p-0"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="text-[14px]" style={{ fontWeight: 600 }}>
            {selectedYear}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelectedYear(selectedYear + 1)}
            className="h-8 w-8 p-0"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Month grid */}
        <div className="grid grid-cols-3 gap-2">
          {monthNames.map((month, index) => {
            const isSelected = index === currentMonth && selectedYear === currentYear;
            return (
              <Button
                key={month}
                variant={isSelected ? "default" : "outline"}
                size="sm"
                onClick={() => handleMonthSelect(index)}
                className={cn(
                  "h-9 text-[12px]",
                  isSelected 
                    ? "bg-[#F25C05] hover:bg-[#F25C05]/90 text-white" 
                    : "hover:bg-[#F9FAFB]"
                )}
                style={{ fontWeight: isSelected ? 600 : 500 }}
              >
                {month}
              </Button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}
