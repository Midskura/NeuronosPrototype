import React from "react";

interface NotesControlProps {
  value: string;
  onChange: (value: string) => void;
}

export function NotesControl({ value, onChange }: NotesControlProps) {
  return (
    <div>
      <textarea 
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-32 px-3.5 py-3 text-sm border border-gray-200 rounded-lg focus:border-[#0F766E] focus:ring-1 focus:ring-[#0F766E] outline-none transition-all placeholder:text-gray-400 resize-none leading-relaxed"
        placeholder="Add custom notes or payment instructions..."
      />
      <p className="mt-2 text-[11px] text-gray-500">
        These notes will appear in the footer section of the invoice.
      </p>
    </div>
  );
}
