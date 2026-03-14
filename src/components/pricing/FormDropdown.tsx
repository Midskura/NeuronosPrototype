import { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";

interface DropdownOption {
  value: string;
  label: string;
}

interface FormDropdownProps {
  value: string;
  options: DropdownOption[];
  onChange: (value: string) => void;
  placeholder?: string;
}

export function FormDropdown({ value, options, onChange, placeholder = "Select..." }: FormDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  const selectedOption = options.find(opt => opt.value === value);
  const displayValue = selectedOption?.label || placeholder;

  return (
    <div ref={dropdownRef} style={{ position: "relative", width: "100%" }}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: "100%",
          padding: "12px 14px",
          border: "1px solid #D1D5DB",
          borderRadius: "8px",
          fontSize: "15px",
          color: value ? "#12332B" : "#9CA3AF",
          backgroundColor: "white",
          cursor: "pointer",
          transition: "border-color 0.2s ease",
          outline: "none",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          textAlign: "left"
        }}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = "#0F766E";
          e.currentTarget.style.boxShadow = "0 0 0 3px rgba(15, 118, 110, 0.1)";
        }}
        onBlur={(e) => {
          if (!isOpen) {
            e.currentTarget.style.borderColor = "#D1D5DB";
            e.currentTarget.style.boxShadow = "none";
          }
        }}
        onMouseEnter={(e) => {
          if (!isOpen) {
            e.currentTarget.style.borderColor = "#9CA3AF";
          }
        }}
        onMouseLeave={(e) => {
          if (!isOpen) {
            e.currentTarget.style.borderColor = "#D1D5DB";
          }
        }}
      >
        <span>{displayValue}</span>
        <ChevronDown 
          size={18} 
          style={{ 
            color: "#9CA3AF",
            transition: "transform 0.2s",
            transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
            flexShrink: 0
          }} 
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 4px)",
            left: 0,
            right: 0,
            backgroundColor: "white",
            border: "1px solid #D1D5DB",
            borderRadius: "8px",
            boxShadow: "0px 4px 6px -2px rgba(16, 24, 40, 0.03), 0px 12px 16px -4px rgba(16, 24, 40, 0.08)",
            zIndex: 100,
            maxHeight: "240px",
            overflow: "auto"
          }}
        >
          {options.map((option, index) => (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
              style={{
                width: "100%",
                padding: "12px 14px",
                backgroundColor: value === option.value ? "#E8F5F3" : "white",
                border: "none",
                borderBottom: index < options.length - 1 ? "1px solid #F3F4F6" : "none",
                cursor: "pointer",
                fontSize: "15px",
                color: value === option.value ? "#0F766E" : "#12332B",
                textAlign: "left",
                transition: "background-color 0.15s ease",
                fontWeight: value === option.value ? 600 : 400
              }}
              onMouseEnter={(e) => {
                if (value !== option.value) {
                  e.currentTarget.style.backgroundColor = "#F9FAFB";
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = value === option.value ? "#E8F5F3" : "white";
              }}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
