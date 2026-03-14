import { useState, useRef, useEffect } from "react";
import { ChevronDown, Search } from "lucide-react";

interface DropdownOption {
  value: string;
  label: string;
}

interface SearchableDropdownProps {
  label?: string;
  value: string;
  options: DropdownOption[];
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  fullWidth?: boolean;
}

export function SearchableDropdown({
  label,
  value,
  options,
  onChange,
  placeholder = "Search...",
  disabled = false,
  required = false,
  fullWidth = false,
}: SearchableDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchText, setSearchText] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Derive display text from the selected value
  const selectedOption = options.find((o) => o.value === value);

  // Sync searchText when value changes externally (e.g. prefill)
  useEffect(() => {
    if (!isOpen) {
      setSearchText(selectedOption?.label || "");
    }
  }, [value, selectedOption, isOpen]);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        // Revert to last valid selection on blur
        setSearchText(selectedOption?.label || "");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [selectedOption]);

  // Filter options by search text
  const filtered = searchText.trim()
    ? options.filter((o) =>
        o.label.toLowerCase().includes(searchText.toLowerCase())
      )
    : options;

  const handleSelect = (option: DropdownOption) => {
    onChange(option.value);
    setSearchText(option.label);
    setIsOpen(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchText(e.target.value);
    if (!isOpen) setIsOpen(true);

    // If the user clears the input, clear the selection
    if (e.target.value === "") {
      onChange("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setIsOpen(false);
      setSearchText(selectedOption?.label || "");
      inputRef.current?.blur();
    }
  };

  return (
    <div className={fullWidth ? "w-full" : ""}>
      {label && (
        <label
          className="block mb-1.5"
          style={{ fontSize: "13px", fontWeight: 500, color: "#12332B" }}
        >
          {label} {required && <span style={{ color: "#C94F3D" }}>*</span>}
        </label>
      )}

      <div ref={containerRef} className="relative">
        {/* Input field */}
        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            value={searchText}
            onChange={handleInputChange}
            onFocus={() => setIsOpen(true)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled}
            className="w-full px-3.5 py-2.5 pr-9 rounded-lg text-[13px] transition-all border border-[#D1D5DB]"
            style={{
              backgroundColor: disabled ? "#F9FAFB" : "#FFFFFF",
              color: "#12332B",
              cursor: disabled ? "not-allowed" : "text",
            }}
          />
          <button
            type="button"
            tabIndex={-1}
            onClick={() => {
              if (!disabled) {
                setIsOpen(!isOpen);
                inputRef.current?.focus();
              }
            }}
            className="absolute right-0 top-0 h-full px-2.5 flex items-center"
            style={{ color: "#9CA3AF" }}
          >
            <ChevronDown
              size={16}
              style={{
                transition: "transform 0.2s",
                transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
              }}
            />
          </button>
        </div>

        {/* Dropdown list */}
        {isOpen && !disabled && (
          <div
            className="absolute top-full left-0 mt-1 rounded-lg overflow-hidden z-50 w-full"
            style={{
              backgroundColor: "#FFFFFF",
              border: "1px solid #E5E7EB",
              boxShadow:
                "0px 4px 6px -2px rgba(16, 24, 40, 0.03), 0px 12px 16px -4px rgba(16, 24, 40, 0.08)",
              maxHeight: "240px",
              overflowY: "auto",
            }}
          >
            {filtered.length === 0 ? (
              <div
                className="px-3.5 py-3 text-[13px] flex items-center gap-2"
                style={{ color: "#9CA3AF" }}
              >
                <Search size={14} />
                No matching customers
              </div>
            ) : (
              filtered.map((option, index) => {
                const isSelected = value === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleSelect(option)}
                    className="w-full px-3.5 py-2.5 text-left text-[13px] transition-colors flex items-center gap-2"
                    style={{
                      backgroundColor: isSelected ? "#E8F5F3" : "#FFFFFF",
                      color: isSelected ? "#0F766E" : "#12332B",
                      borderBottom:
                        index < filtered.length - 1
                          ? "1px solid #F3F4F6"
                          : "none",
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.backgroundColor = "#F9FAFB";
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = isSelected
                        ? "#E8F5F3"
                        : "#FFFFFF";
                    }}
                  >
                    {option.label}
                  </button>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
}