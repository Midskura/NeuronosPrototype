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
          border: "1px solid var(--theme-border-default)",
          borderRadius: "8px",
          fontSize: "15px",
          color: value ? "var(--theme-text-primary)" : "var(--theme-text-muted)",
          backgroundColor: "var(--theme-bg-surface)",
          cursor: "pointer",
          transition: "border-color 0.2s ease",
          outline: "none",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          textAlign: "left"
        }}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = "var(--theme-action-primary-bg)";
          e.currentTarget.style.boxShadow = "0 0 0 3px rgba(15, 118, 110, 0.1)";
        }}
        onBlur={(e) => {
          if (!isOpen) {
            e.currentTarget.style.borderColor = "var(--theme-border-default)";
            e.currentTarget.style.boxShadow = "none";
          }
        }}
        onMouseEnter={(e) => {
          if (!isOpen) {
            e.currentTarget.style.borderColor = "var(--theme-text-muted)";
          }
        }}
        onMouseLeave={(e) => {
          if (!isOpen) {
            e.currentTarget.style.borderColor = "var(--theme-border-default)";
          }
        }}
      >
        <span>{displayValue}</span>
        <ChevronDown 
          size={18} 
          style={{ 
            color: "var(--theme-text-muted)",
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
            backgroundColor: "var(--theme-bg-surface)",
            border: "1px solid var(--theme-border-default)",
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
                backgroundColor: value === option.value ? "var(--theme-bg-surface-tint)" : "var(--theme-bg-surface)",
                border: "none",
                borderBottom: index < options.length - 1 ? "1px solid var(--theme-border-subtle)" : "none",
                cursor: "pointer",
                fontSize: "15px",
                color: value === option.value ? "var(--theme-action-primary-bg)" : "var(--theme-text-primary)",
                textAlign: "left",
                transition: "background-color 0.15s ease",
                fontWeight: value === option.value ? 600 : 400
              }}
              onMouseEnter={(e) => {
                if (value !== option.value) {
                  e.currentTarget.style.backgroundColor = "var(--theme-bg-page)";
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = value === option.value ? "var(--theme-bg-surface-tint)" : "var(--theme-bg-surface)";
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
