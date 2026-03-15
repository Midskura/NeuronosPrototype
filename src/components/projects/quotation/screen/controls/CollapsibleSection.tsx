import React, { useState } from "react";
import { ChevronDown } from "lucide-react";

interface CollapsibleSectionProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

export function CollapsibleSection({ title, icon, children, defaultOpen = true }: CollapsibleSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-[#E5E9F0] last:border-0">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-6 hover:bg-gray-50 transition-colors group"
      >
        <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#E0F2F1] flex items-center justify-center shrink-0 group-hover:bg-[#B2DFDB] transition-colors">
                <div className="text-[#0F766E]">
                    {icon}
                </div>
            </div>
            <h4 className="font-bold text-[#12332B] text-sm select-none">{title}</h4>
        </div>
        <div className={`text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}>
            <ChevronDown size={20} />
        </div>
      </button>
      
      <div 
        className={`grid transition-all duration-300 ease-in-out ${isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}
      >
        <div className="overflow-hidden">
            <div className="px-6 pb-6">
                {children}
            </div>
        </div>
      </div>
    </div>
  );
}
