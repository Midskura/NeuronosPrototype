import React, { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";

interface CollapsibleSectionProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

export function CollapsibleSection({ title, icon, children, defaultOpen = false }: CollapsibleSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-[var(--theme-border-default)] last:border-b-0">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-6 py-4 flex items-center justify-between bg-[var(--theme-bg-surface)] hover:bg-[var(--theme-bg-surface-subtle)] transition-colors"
      >
        <div className="flex items-center gap-3 text-[var(--theme-text-primary)]">
          <span className="text-[var(--theme-text-muted)]">{icon}</span>
          <span className="text-sm font-bold tracking-tight">{title}</span>
        </div>
        <div className="text-[var(--theme-text-muted)]">
          {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        </div>
      </button>
      
      {isOpen && (
        <div className="px-6 pb-6 pt-2">
          {children}
        </div>
      )}
    </div>
  );
}
