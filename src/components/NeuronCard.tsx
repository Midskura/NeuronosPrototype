import { ReactNode, CSSProperties } from "react";

interface NeuronCardProps {
  children: ReactNode;
  padding?: "sm" | "md" | "lg";
  elevation?: "1" | "2";
  className?: string;
  style?: CSSProperties;
}

export function NeuronCard({ 
  children, 
  padding = "md", 
  elevation = "1",
  className = "",
  style = {}
}: NeuronCardProps) {
  const paddingValues = {
    sm: "12px",
    md: "16px",
    lg: "20px",
  };

  const elevationValues = {
    "1": "var(--elevation-1)",
    "2": "var(--elevation-2)",
  };

  return (
    <div
      className={className}
      style={{
        background: "var(--neuron-bg-elevated)",
        border: "1px solid var(--neuron-ui-border)",
        borderRadius: "var(--neuron-radius-l)",
        boxShadow: elevationValues[elevation],
        padding: paddingValues[padding],
        ...style,
      }}
    >
      {children}
    </div>
  );
}
