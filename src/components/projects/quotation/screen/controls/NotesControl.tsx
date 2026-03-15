import React from "react";

interface NotesControlProps {
  value: string;
  onChange: (text: string) => void;
}

export function NotesControl({ value, onChange }: NotesControlProps) {
  return (
    <div className="space-y-2">
      <textarea
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          className="w-full h-32 px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg focus:border-[#0F766E] focus:ring-1 focus:ring-[#0F766E] outline-none resize-none transition-all placeholder:text-gray-400 bg-white"
          placeholder="Enter custom terms and conditions here (overrides default terms)..."
      />
      <p className="text-xs text-gray-500 px-1">
          Leave empty to use default standard terms.
      </p>
    </div>
  );
}
