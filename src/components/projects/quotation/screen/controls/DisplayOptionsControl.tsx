import React from "react";
import { Check } from "lucide-react";
import type { QuotationPrintOptions } from "../useQuotationDocumentState";

interface DisplayOptionsControlProps {
  options: QuotationPrintOptions["display"];
  onToggle: (key: keyof QuotationPrintOptions["display"]) => void;
}

export function DisplayOptionsControl({ options, onToggle }: DisplayOptionsControlProps) {
  const ToggleItem = ({ label, checked, onClick }: { label: string, checked: boolean, onClick: () => void }) => (
    <button 
      onClick={onClick}
      className="group flex items-center justify-between w-full p-3 bg-white border border-gray-100 rounded-lg hover:border-[#0F766E]/30 hover:shadow-sm transition-all text-left"
    >
      <span className={`text-sm ${checked ? "text-[#12332B] font-medium" : "text-gray-500"}`}>{label}</span>
      
      {/* Custom Checkbox */}
      <div className={`w-5 h-5 rounded flex items-center justify-center transition-all ${checked ? "bg-[#0F766E] border-[#0F766E]" : "bg-white border-gray-300 group-hover:border-[#0F766E]"}`} style={{ borderWidth: '1.5px' }}>
         {checked && <Check size={14} className="text-white stroke-[3]" />}
      </div>
    </button>
  );

  return (
    <div className="space-y-2">
      <ToggleItem 
          label="Show Bank Details" 
          checked={options.show_bank_details} 
          onClick={() => onToggle("show_bank_details")} 
      />
      <ToggleItem 
          label="Show Terms & Notes" 
          checked={options.show_notes} 
          onClick={() => onToggle("show_notes")} 
      />
      <ToggleItem 
          label="Show Tax Summary" 
          checked={options.show_tax_summary} 
          onClick={() => onToggle("show_tax_summary")} 
      />
    </div>
  );
}
