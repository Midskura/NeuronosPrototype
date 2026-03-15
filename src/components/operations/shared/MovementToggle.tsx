import { SegmentedToggle } from "../../ui/SegmentedToggle";

interface MovementToggleProps {
  value: "IMPORT" | "EXPORT";
  onChange: (value: "IMPORT" | "EXPORT") => void;
  className?: string;
  layoutIdPrefix?: string;
}

export function MovementToggle({ value, onChange, className, layoutIdPrefix = "movement-pill" }: MovementToggleProps) {
  return (
    <SegmentedToggle 
      value={value}
      onChange={onChange}
      className={className}
      layoutIdPrefix={layoutIdPrefix}
      options={[
        { value: "IMPORT", label: "Import" },
        { value: "EXPORT", label: "Export" }
      ]}
    />
  );
}
