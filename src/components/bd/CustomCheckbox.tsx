import { Check } from "lucide-react";

interface CustomCheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}

export function CustomCheckbox({ checked, onChange, disabled = false }: CustomCheckboxProps) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      onClick={() => !disabled && onChange(!checked)}
      disabled={disabled}
      style={{
        width: "18px",
        height: "18px",
        borderRadius: "4px",
        border: checked ? "none" : "1.5px solid #D1D5DB",
        backgroundColor: checked ? "var(--neuron-brand-green)" : "white",
        cursor: disabled ? "not-allowed" : "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        transition: "all 0.15s ease",
        opacity: disabled ? 0.5 : 1,
        padding: 0
      }}
      onMouseEnter={(e) => {
        if (!disabled && !checked) {
          e.currentTarget.style.borderColor = "var(--neuron-brand-green)";
          e.currentTarget.style.backgroundColor = "#F0F9F8";
        }
      }}
      onMouseLeave={(e) => {
        if (!disabled && !checked) {
          e.currentTarget.style.borderColor = "#D1D5DB";
          e.currentTarget.style.backgroundColor = "white";
        }
      }}
    >
      {checked && (
        <Check 
          size={12} 
          strokeWidth={3}
          style={{ 
            color: "white",
            display: "block"
          }} 
        />
      )}
    </button>
  );
}
