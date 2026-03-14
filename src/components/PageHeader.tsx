import { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: ReactNode;
}

export function PageHeader({ title, description, actions }: PageHeaderProps) {
  return (
    <div className="flex items-start justify-between mb-6">
      <div>
        <h1 
          style={{ 
            fontSize: "24px", 
            fontWeight: 600, 
            lineHeight: "32px", 
            color: "var(--neuron-ink-primary)",
            letterSpacing: "-0.005em",
            marginBottom: "4px"
          }}
        >
          {title}
        </h1>
        {description && (
          <p 
            style={{ 
              fontSize: "14px", 
              lineHeight: "20px",
              color: "var(--neuron-ink-secondary)"
            }}
          >
            {description}
          </p>
        )}
      </div>
      {actions && <div className="flex items-center gap-3">{actions}</div>}
    </div>
  );
}
