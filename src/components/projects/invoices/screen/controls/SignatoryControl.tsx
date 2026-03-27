import React from "react";
import type { Signatory } from "../useInvoiceDocumentState";

interface SignatoryControlProps {
  preparedBy: Signatory;
  approvedBy: Signatory;
  onUpdate: (type: "prepared_by" | "approved_by", field: "name" | "title", value: string) => void;
}

export function SignatoryControl({ preparedBy, approvedBy, onUpdate }: SignatoryControlProps) {
  return (
    <div className="space-y-5">
      {/* Prepared By */}
      <div className="space-y-2.5">
          <label className="text-xs font-semibold text-[var(--theme-text-primary)] uppercase tracking-wider">Prepared By</label>
          <div className="space-y-2">
              <input 
                  type="text" 
                  value={preparedBy.name}
                  onChange={(e) => onUpdate("prepared_by", "name", e.target.value)}
                  className="w-full px-3.5 py-2 text-sm border border-[var(--theme-border-default)] rounded-lg focus:border-[var(--theme-action-primary-bg)] focus:ring-1 focus:ring-[#0F766E] outline-none transition-all placeholder:text-[var(--theme-text-muted)]"
                  placeholder="Name"
              />
              <input 
                  type="text" 
                  value={preparedBy.title}
                  onChange={(e) => onUpdate("prepared_by", "title", e.target.value)}
                  className="w-full px-3.5 py-2 text-sm border border-[var(--theme-border-default)] rounded-lg focus:border-[var(--theme-action-primary-bg)] focus:ring-1 focus:ring-[#0F766E] outline-none transition-all bg-[var(--theme-bg-surface-subtle)] placeholder:text-[var(--theme-text-muted)]"
                  placeholder="Job Title"
              />
          </div>
      </div>

      {/* Approved By */}
      <div className="space-y-2.5">
          <label className="text-xs font-semibold text-[var(--theme-text-primary)] uppercase tracking-wider">Approved By</label>
          <div className="space-y-2">
              <input 
                  type="text" 
                  value={approvedBy.name}
                  onChange={(e) => onUpdate("approved_by", "name", e.target.value)}
                  className="w-full px-3.5 py-2 text-sm border border-[var(--theme-border-default)] rounded-lg focus:border-[var(--theme-action-primary-bg)] focus:ring-1 focus:ring-[#0F766E] outline-none transition-all placeholder:text-[var(--theme-text-muted)]"
                  placeholder="Name (Optional)"
              />
              <input 
                  type="text" 
                  value={approvedBy.title}
                  onChange={(e) => onUpdate("approved_by", "title", e.target.value)}
                  className="w-full px-3.5 py-2 text-sm border border-[var(--theme-border-default)] rounded-lg focus:border-[var(--theme-action-primary-bg)] focus:ring-1 focus:ring-[#0F766E] outline-none transition-all bg-[var(--theme-bg-surface-subtle)] placeholder:text-[var(--theme-text-muted)]"
                  placeholder="Job Title"
              />
          </div>
      </div>
    </div>
  );
}
