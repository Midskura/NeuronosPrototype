import React from "react";

interface GroupedSectionProps {
  title: string;
  children: React.ReactNode;
}

export function GroupedSection({ title, children }: GroupedSectionProps) {
  return (
    <div className="mb-6 last:mb-0">
      <h3 className="mb-3 text-[13px] font-semibold text-[#0F766E] uppercase tracking-[0.5px]">
        {title}
      </h3>
      <div className="rounded-[10px] border border-[#E5E9F0] bg-white overflow-hidden">
         {children}
      </div>
    </div>
  );
}
