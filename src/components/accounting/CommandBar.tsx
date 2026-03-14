import { useState } from "react";
import { CompanySwitcher } from "./CompanySwitcher";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Calendar } from "../ui/calendar";
import { Calendar as CalendarIcon, Search, Plus } from "lucide-react";
import { format } from "date-fns";

interface CommandBarProps {
  company: string;
  onCompanyChange: (value: string) => void;
  dateRange?: { from?: Date; to?: Date };
  onDateRangeChange?: (range: { from?: Date; to?: Date }) => void;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  onNewEntry?: () => void;
}

export function CommandBar({
  company,
  onCompanyChange,
  dateRange,
  onDateRangeChange,
  searchQuery = "",
  onSearchChange,
  onNewEntry,
}: CommandBarProps) {
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);

  return (
    <div className="w-full border-b border-[#E5E7EB] bg-white">
      <div className="max-w-[1200px] mx-auto px-6">
        <div className="flex items-center gap-3 h-16">
          {/* Company Switcher - Required */}
          <CompanySwitcher value={company} onValueChange={onCompanyChange} />

          {/* Date Range Picker */}
          <Popover open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-[240px] h-10 justify-start text-[14px] border-[#E5E7EB]"
                style={{ borderRadius: 'var(--radius-sm)' }}
              >
                <CalendarIcon className="w-4 h-4 mr-2 text-[#6B7280]" />
                {dateRange?.from ? (
                  dateRange.to ? (
                    `${format(dateRange.from, "MMM d, yyyy")} - ${format(dateRange.to, "MMM d, yyyy")}`
                  ) : (
                    format(dateRange.from, "MMM d, yyyy")
                  )
                ) : (
                  "Select date range"
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="range"
                selected={dateRange}
                onSelect={(range) => {
                  onDateRangeChange?.(range || {});
                  if (range?.from && range?.to) {
                    setIsDatePickerOpen(false);
                  }
                }}
                numberOfMonths={2}
              />
            </PopoverContent>
          </Popover>

          {/* Search */}
          <div className="relative flex-1 max-w-[400px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B7280]" />
            <Input
              placeholder="Search entries..."
              value={searchQuery}
              onChange={(e) => onSearchChange?.(e.target.value)}
              className="pl-9 h-10 text-[14px] border-[#E5E7EB]"
              style={{ borderRadius: 'var(--radius-sm)' }}
            />
          </div>

          {/* Spacer */}
          <div className="flex-1" />

          {/* New Entry Button */}
          {onNewEntry && (
            <Button
              className="bg-[#F25C05] hover:bg-[#D84D00] text-white h-10 px-4"
              onClick={onNewEntry}
              style={{ borderRadius: 'var(--radius-sm)' }}
            >
              <Plus className="w-4 h-4 mr-2" />
              New Entry
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
