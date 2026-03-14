import { useState, useRef, useEffect } from "react";
import { Input } from "../../ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../ui/select";
import { Button } from "../../ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "../../ui/popover";
import { Calendar } from "../../ui/calendar";
import { X, Calendar as CalendarIcon, Filter } from "lucide-react";
import { format } from "date-fns";

export type FilterBarVariant = "default" | "compact" | "locked-status";

interface FilterBarStickyProps {
  // Values
  bookingNo?: string;
  client?: string;
  company?: string[];
  type?: string;
  account?: string;
  category?: string;
  dateRange?: { from?: Date; to?: Date };
  status?: string;
  enteredBy?: string;
  
  // Change handlers
  onBookingNoChange?: (value: string) => void;
  onClientChange?: (value: string) => void;
  onCompanyChange?: (values: string[]) => void;
  onTypeChange?: (value: string) => void;
  onAccountChange?: (value: string) => void;
  onCategoryChange?: (value: string) => void;
  onDateRangeChange?: (range: { from?: Date; to?: Date }) => void;
  onStatusChange?: (value: string) => void;
  onEnteredByChange?: (value: string) => void;
  onClearFilters?: () => void;
  
  // Options for selects
  bookingNoOptions?: string[];
  clientOptions?: string[];
  companyOptions?: Array<{ value: string; label: string }>;
  typeOptions?: Array<{ value: string; label: string }>;
  accountOptions?: Array<{ value: string; label: string }>;
  categoryOptions?: Array<{ value: string; label: string }>;
  statusOptions?: Array<{ value: string; label: string }>;
  userOptions?: Array<{ value: string; label: string }>;
  
  // Variant and styling
  variant?: FilterBarVariant;
  className?: string;
}

export function FilterBarSticky({
  bookingNo = "",
  client = "",
  company = [],
  type = "",
  account = "",
  category = "",
  dateRange,
  status = "Pending",
  enteredBy = "",
  onBookingNoChange,
  onClientChange,
  onCompanyChange,
  onTypeChange,
  onAccountChange,
  onCategoryChange,
  onDateRangeChange,
  onStatusChange,
  onEnteredByChange,
  onClearFilters,
  bookingNoOptions = [],
  clientOptions = [],
  companyOptions = [],
  typeOptions = [
    { value: "all", label: "All Types" },
    { value: "revenue", label: "Revenue" },
    { value: "expense", label: "Expense" },
    { value: "transfer", label: "Transfer" },
  ],
  accountOptions = [],
  categoryOptions = [],
  statusOptions = [
    { value: "all", label: "All Statuses" },
    { value: "Pending", label: "Pending" },
    { value: "Approved", label: "Approved" },
    { value: "Rejected", label: "Rejected" },
  ],
  userOptions = [],
  variant = "default",
  className = "",
}: FilterBarStickyProps) {
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [isCompanyPickerOpen, setIsCompanyPickerOpen] = useState(false);
  const [showBookingSuggestions, setShowBookingSuggestions] = useState(false);
  const [showClientSuggestions, setShowClientSuggestions] = useState(false);
  
  const bookingInputRef = useRef<HTMLInputElement>(null);
  const clientInputRef = useRef<HTMLInputElement>(null);

  // Filter suggestions based on input
  const bookingSuggestions = bookingNoOptions.filter((option) =>
    option.toLowerCase().includes(bookingNo.toLowerCase())
  ).slice(0, 5);

  const clientSuggestions = clientOptions.filter((option) =>
    option.toLowerCase().includes(client.toLowerCase())
  ).slice(0, 5);

  const toggleCompany = (companyValue: string) => {
    const newCompanies = company.includes(companyValue)
      ? company.filter((c) => c !== companyValue)
      : [...company, companyValue];
    onCompanyChange?.(newCompanies);
  };

  const handleClearFilters = () => {
    onBookingNoChange?.("");
    onClientChange?.("");
    onCompanyChange?.([]);
    onTypeChange?.("");
    onAccountChange?.("");
    onCategoryChange?.("");
    onDateRangeChange?.({});
    if (variant !== "locked-status") {
      onStatusChange?.("Pending");
    }
    onEnteredByChange?.("");
    onClearFilters?.();
  };

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (bookingInputRef.current && !bookingInputRef.current.contains(event.target as Node)) {
        setShowBookingSuggestions(false);
      }
      if (clientInputRef.current && !clientInputRef.current.contains(event.target as Node)) {
        setShowClientSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const isCompact = variant === "compact";
  const isLockedStatus = variant === "locked-status";
  const fieldWidth = isCompact ? "w-[120px]" : "w-[140px]";

  return (
    <div 
      className={`sticky top-0 z-10 bg-white border-b border-[#E5E7EB] mb-6 ${className}`}
      style={{ height: '56px' }}
    >
      <div className={`flex items-center ${isCompact ? 'gap-2 px-3' : 'gap-3 px-3'} h-full overflow-x-auto`}>
        <Filter className="w-4 h-4 text-[#6B7280] flex-shrink-0" />
        
        {/* Booking No Input with Autocomplete */}
        <div className="relative" ref={bookingInputRef}>
          <Input
            placeholder="Booking No"
            value={bookingNo}
            onChange={(e) => {
              onBookingNoChange?.(e.target.value);
              setShowBookingSuggestions(true);
            }}
            onFocus={() => setShowBookingSuggestions(true)}
            className={`${fieldWidth} h-9 text-[14px]`}
            style={{ borderRadius: 'var(--radius-sm)' }}
          />
          {showBookingSuggestions && bookingSuggestions.length > 0 && bookingNo && (
            <div className="absolute top-full left-0 mt-1 w-full bg-white border border-[#E5E7EB] shadow-lg z-20" style={{ borderRadius: 'var(--radius-sm)' }}>
              {bookingSuggestions.map((suggestion, index) => (
                <div
                  key={index}
                  className="px-3 py-2 text-[14px] hover:bg-[#F9FAFB] cursor-pointer"
                  onClick={() => {
                    onBookingNoChange?.(suggestion);
                    setShowBookingSuggestions(false);
                  }}
                >
                  {suggestion}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Client Input with Autocomplete */}
        <div className="relative" ref={clientInputRef}>
          <Input
            placeholder="Client"
            value={client}
            onChange={(e) => {
              onClientChange?.(e.target.value);
              setShowClientSuggestions(true);
            }}
            onFocus={() => setShowClientSuggestions(true)}
            className={`${fieldWidth} h-9 text-[14px]`}
            style={{ borderRadius: 'var(--radius-sm)' }}
          />
          {showClientSuggestions && clientSuggestions.length > 0 && client && (
            <div className="absolute top-full left-0 mt-1 w-full bg-white border border-[#E5E7EB] shadow-lg z-20" style={{ borderRadius: 'var(--radius-sm)' }}>
              {clientSuggestions.map((suggestion, index) => (
                <div
                  key={index}
                  className="px-3 py-2 text-[14px] hover:bg-[#F9FAFB] cursor-pointer"
                  onClick={() => {
                    onClientChange?.(suggestion);
                    setShowClientSuggestions(false);
                  }}
                >
                  {suggestion}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Multi-Select Company */}
        {companyOptions.length > 0 && (
          <Popover open={isCompanyPickerOpen} onOpenChange={setIsCompanyPickerOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={`${fieldWidth} h-9 justify-start text-[14px]`}
                style={{ borderRadius: 'var(--radius-sm)' }}
              >
                {company.length > 0 ? `${company.length} Compan${company.length > 1 ? 'ies' : 'y'}` : 'Company'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[200px] p-2" align="start">
              <div className="space-y-1">
                {companyOptions.map((option) => (
                  <div
                    key={option.value}
                    className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-[#F9FAFB] cursor-pointer"
                    onClick={() => toggleCompany(option.value)}
                  >
                    <div className={`w-4 h-4 border rounded ${company.includes(option.value) ? 'bg-[#F25C05] border-[#F25C05]' : 'border-[#E5E7EB]'}`}>
                      {company.includes(option.value) && (
                        <svg className="w-full h-full text-white" viewBox="0 0 16 16" fill="none">
                          <path d="M13 4L6 11L3 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      )}
                    </div>
                    <span className="text-[14px] text-[#374151]">{option.label}</span>
                  </div>
                ))}
              </div>
            </PopoverContent>
          </Popover>
        )}

        {/* Type Select */}
        <Select value={type} onValueChange={onTypeChange}>
          <SelectTrigger className={`${fieldWidth} h-9 text-[14px]`} style={{ borderRadius: 'var(--radius-sm)' }}>
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            {typeOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Account Select */}
        {accountOptions.length > 0 && (
          <Select value={account} onValueChange={onAccountChange}>
            <SelectTrigger className={`${fieldWidth} h-9 text-[14px]`} style={{ borderRadius: 'var(--radius-sm)' }}>
              <SelectValue placeholder="Account" />
            </SelectTrigger>
            <SelectContent>
              {accountOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {/* Category Select */}
        {categoryOptions.length > 0 && (
          <Select value={category} onValueChange={onCategoryChange}>
            <SelectTrigger className={`${fieldWidth} h-9 text-[14px]`} style={{ borderRadius: 'var(--radius-sm)' }}>
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              {categoryOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {/* Date Range Picker */}
        <Popover open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={`${isCompact ? 'w-[160px]' : 'w-[180px]'} h-9 justify-start text-[14px]`}
              style={{ borderRadius: 'var(--radius-sm)' }}
            >
              <CalendarIcon className="w-4 h-4 mr-2" />
              {dateRange?.from ? (
                dateRange.to ? (
                  `${format(dateRange.from, "MMM d")} - ${format(dateRange.to, "MMM d")}`
                ) : (
                  format(dateRange.from, "MMM d, yyyy")
                )
              ) : (
                "Date Range"
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

        {/* Status Select */}
        <Select 
          value={status} 
          onValueChange={onStatusChange}
          disabled={isLockedStatus}
        >
          <SelectTrigger 
            className={`${fieldWidth} h-9 text-[14px] ${isLockedStatus ? 'bg-[#F9FAFB] cursor-not-allowed' : ''}`} 
            style={{ borderRadius: 'var(--radius-sm)' }}
          >
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            {statusOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Entered By Select */}
        {userOptions.length > 0 && (
          <Select value={enteredBy} onValueChange={onEnteredByChange}>
            <SelectTrigger className={`${fieldWidth} h-9 text-[14px]`} style={{ borderRadius: 'var(--radius-sm)' }}>
              <SelectValue placeholder="Entered By" />
            </SelectTrigger>
            <SelectContent>
              {userOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {/* Clear Filters Button */}
        <Button
          variant="ghost"
          className="h-9 px-3 text-[14px] text-[#6B7280] hover:text-[#374151] flex-shrink-0"
          style={{ borderRadius: 'var(--radius-sm)' }}
          onClick={handleClearFilters}
        >
          <X className="w-4 h-4 mr-1" />
          Clear
        </Button>
      </div>
    </div>
  );
}
