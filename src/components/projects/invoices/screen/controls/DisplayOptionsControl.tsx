import React from "react";
import type { InvoicePrintOptions } from "../useInvoiceDocumentState";
import { Eye, EyeOff } from "lucide-react";

interface DisplayOptionsControlProps {
  options: InvoicePrintOptions["display"];
  onToggle: (key: keyof InvoicePrintOptions["display"]) => void;
}

export function DisplayOptionsControl({ options, onToggle }: DisplayOptionsControlProps) {
  
  const ToggleItem = ({ label, active, onClick }: { label: string, active: boolean, onClick: () => void }) => (
    <div 
        onClick={onClick}
        className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all ${
            active 
            ? 'bg-[#F0FDF9] border-[#CCFBF1] text-[#0F766E]' 
            : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300'
        }`}
    >
        <span className="text-sm font-medium">{label}</span>
        {active ? <Eye size={16} /> : <EyeOff size={16} />}
    </div>
  );

  return (
    <div className="space-y-3">
       <ToggleItem 
         label="Bank Details" 
         active={options.show_bank_details} 
         onClick={() => onToggle("show_bank_details")} 
       />
       <ToggleItem 
         label="Notes Section" 
         active={options.show_notes} 
         onClick={() => onToggle("show_notes")} 
       />
       <ToggleItem 
         label="Tax Summary" 
         active={options.show_tax_summary} 
         onClick={() => onToggle("show_tax_summary")} 
       />
    </div>
  );
}
