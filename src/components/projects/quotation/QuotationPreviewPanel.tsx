import { X, Printer, Download } from "lucide-react";
import type { Project } from "../../../types/pricing";
import { QuotationDocument } from "./QuotationDocument";

interface QuotationPreviewPanelProps {
  project: Project;
  onClose: () => void;
  onPrint: () => void;
  currentUser?: { name: string; email: string; } | null;
}

export function QuotationPreviewPanel({ project, onClose, onPrint, currentUser }: QuotationPreviewPanelProps) {
  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Side Panel */}
      <div 
        className="fixed inset-y-0 right-0 w-[900px] max-w-[95vw] bg-[#F3F4F6] shadow-2xl z-50 transform transition-transform duration-300 ease-in-out flex flex-col"
        style={{ borderLeft: "1px solid #E5E7EB" }}
      >
        {/* Header */}
        <div className="h-16 bg-white border-b border-[#E5E9F0] px-6 flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-lg font-semibold text-[#12332B]">Quotation Preview</h2>
            <p className="text-xs text-[#6B7280]">Review the document before printing</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={20} className="text-[#6B7280]" />
          </button>
        </div>

        {/* Content Area (Scrollable Gray Background) */}
        <div className="flex-1 overflow-y-auto p-8 flex justify-center">
            {/* The "Paper" Container */}
            <div className="bg-white shadow-lg origin-top scale-90 sm:scale-100 transition-transform duration-200" style={{ width: '210mm', minHeight: '297mm' }}>
                 <QuotationDocument project={project} mode="preview" currentUser={currentUser} />
            </div>
        </div>

        {/* Footer */}
        <div className="h-20 bg-white border-t border-[#E5E9F0] px-6 flex items-center justify-between shrink-0">
          <div className="text-sm text-[#6B7280]">
             Ready to export?
          </div>
          <div className="flex gap-3">
             <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-[#6B7280] hover:text-[#111827] transition-colors"
             >
                Cancel
             </button>
             <button
                onClick={onPrint}
                className="flex items-center gap-2 px-6 py-2.5 bg-[#0F766E] text-white rounded-lg hover:bg-[#0D6960] transition-colors shadow-sm font-medium"
             >
                <Printer size={18} />
                Print / Save as PDF
             </button>
          </div>
        </div>
      </div>
    </>
  );
}
