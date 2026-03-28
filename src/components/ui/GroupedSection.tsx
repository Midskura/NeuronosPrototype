import React from "react";

interface GroupedSectionProps {
  title: string;
  children: React.ReactNode;
}

export function GroupedSection({ title, children }: GroupedSectionProps) {
  return (
    <div className="mb-6 last:mb-0">
      <h3 className="mb-3 text-[13px] font-semibold text-[var(--theme-action-primary-bg)] uppercase tracking-[0.5px]">
        {title}
      </h3>
      <div className="rounded-[10px] border border-[var(--theme-border-default)] bg-[var(--theme-bg-surface)] overflow-hidden">
         {children}
      </div>
    </div>
  );
}
