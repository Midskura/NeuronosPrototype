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
        className="w-full h-32 px-3.5 py-3 text-sm border border-[var(--theme-border-default)] rounded-lg focus:border-[var(--theme-action-primary-bg)] focus:ring-1 focus:ring-[var(--theme-action-primary-bg)] outline-none transition-all placeholder:text-[var(--theme-text-muted)] resize-none leading-relaxed"
        placeholder="Add custom notes or payment instructions..."
      />
      <p className="mt-2 text-[11px] text-[var(--theme-text-muted)]">
        These notes will appear in the footer section of the invoice.
      </p>
    </div>
  );
}
