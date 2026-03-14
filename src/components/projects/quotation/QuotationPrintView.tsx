import React from "react";
import type { Project } from "../../../types/pricing";
import { QuotationDocument } from "./QuotationDocument";

interface QuotationPrintViewProps {
  project: Project;
  currentUser?: { name: string; email: string; } | null;
}

export const QuotationPrintView = React.forwardRef<HTMLDivElement, QuotationPrintViewProps>(
  ({ project, currentUser }, ref) => {
    return (
      <div className="print-portal-root" style={{ display: "none" }}>
        <style>
          {`
            @media print {
              @page {
                size: A4;
                margin: 0;
              }
              body {
                margin: 0 !important;
                padding: 0 !important;
                background-color: white !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
              
              /* Hide all other body children */
              body > *:not(.print-portal-root) {
                display: none !important;
              }

              /* Show our container */
              .print-portal-root {
                display: block !important;
                position: absolute;
                top: 0;
                left: 0;
                width: 210mm;
                height: 297mm;
                background: white;
                z-index: 9999;
              }
            }
          `}
        </style>

        <div ref={ref}>
            <QuotationDocument project={project} mode="print" currentUser={currentUser} />
        </div>
      </div>
    );
  }
);

QuotationPrintView.displayName = "QuotationPrintView";
