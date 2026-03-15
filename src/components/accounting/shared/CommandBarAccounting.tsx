import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../ui/select";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "../../ui/popover";
import { Calendar } from "../../ui/calendar";
import { Building2, Calendar as CalendarIcon, Search, Plus, Loader2 } from "lucide-react";
import { format } from "date-fns";

interface CommandBarAccountingProps {
  company: string;
  onCompanyChange: (value: string) => void;
  dateRange?: { from?: Date; to?: Date };
  onDateRangeChange?: (range: { from?: Date; to?: Date }) => void;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  onNewEntry?: () => void;
  companyOptions?: Array<{ value: string; label: string }>;
  loading?: boolean;
  disabled?: boolean;
  className?: string;
}

export function CommandBarAccounting({
  company,
  onCompanyChange,
  dateRange,
  onDateRangeChange,
  searchQuery = "",
  onSearchChange,
  onNewEntry,
  companyOptions = [
    { value: "jjb", label: "JJB Group" },
    { value: "subsidiary", label: "JJB Subsidiary" },
    { value: "logistics", label: "JJB Logistics" },
  ],
  loading = false,
  disabled = false,
  className = "",
}: CommandBarAccountingProps) {
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);

  return (
    <div className={`w-full border-b border-[#E5E7EB] bg-white ${className}`}>
      <div className="max-w-[1200px] mx-auto px-3">
        <div className="flex items-center gap-3 h-[56px]">
          {/* Company Switcher - Required */}
          <div className="flex items-center gap-2">
            <Select 
              value={company} 
              onValueChange={onCompanyChange}
              disabled={disabled || loading}
            >
              <SelectTrigger 
                className="w-[200px] h-10 text-[14px] border-[#E5E7EB]" 
                style={{ borderRadius: 'var(--radius-sm)' }}
              >
                <Building2 className="w-4 h-4 mr-2 text-[#6B7280]" />
                <SelectValue placeholder="Select company" />
              </SelectTrigger>
              <SelectContent>
                {companyOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span className="text-[#dc2626] text-[12px]">*</span>
          </div>

          {/* Date Range Picker */}
          <Popover open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-[240px] h-10 justify-start text-[14px] border-[#E5E7EB]"
                style={{ borderRadius: 'var(--radius-sm)' }}
                disabled={disabled || loading}
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
              disabled={disabled || loading}
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
              disabled={disabled || loading}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Loading...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  New Entry
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
