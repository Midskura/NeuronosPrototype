import { useState, useRef, useEffect } from "react";

interface FormattedNumberInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
  value: number;
  onChange: (value: number) => void;
  decimals?: number;
}

export function FormattedNumberInput({ 
  value, 
  onChange, 
  decimals = 2,
  className,
  onBlur,
  ...props 
}: FormattedNumberInputProps) {
  // Initialize with formatted value
  const [localValue, setLocalValue] = useState<string>(
    value !== undefined && value !== null ? value.toFixed(decimals) : ""
  );
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync with external value when not focused
  useEffect(() => {
    if (document.activeElement !== inputRef.current) {
      setLocalValue(value !== undefined && value !== null ? value.toFixed(decimals) : "");
    }
  }, [value, decimals]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setLocalValue(val);
    
    // Handle empty or partial inputs
    if (val === "" || val === "-") {
      onChange(0);
      return;
    }

    // Only parse if it looks like a valid number part
    if (/^-?\d*\.?\d*$/.test(val)) {
        const num = parseFloat(val);
        if (!isNaN(num)) {
            onChange(num);
        }
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    // On blur, format to specified decimals
    if (value !== undefined && value !== null) {
      setLocalValue(value.toFixed(decimals));
    }
    if (onBlur) onBlur(e);
  };

  return (
    <input
      ref={inputRef}
      type="text" 
      value={localValue}
      onChange={handleChange}
      onBlur={handleBlur}
      {...props}
    />
  );
}
