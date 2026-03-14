import { useState } from "react";
import type { Project } from "../../../../types/pricing";

export interface Signatory {
  name: string;
  title: string;
}

export interface QuotationPrintOptions {
  signatories: {
    prepared_by: Signatory;
    approved_by: Signatory;
  };
  display: {
    show_bank_details: boolean;
    show_notes: boolean;
    show_tax_summary: boolean;
    show_letterhead: boolean;
  };
  custom_notes?: string;
}

export function useQuotationDocumentState(project: Project, currentUser?: { name: string; email: string; } | null) {
  const quote = project.quotation || (project as any);

  // Initialize state with project defaults or intelligent fallbacks
  const [options, setOptions] = useState<QuotationPrintOptions>({
    signatories: {
      prepared_by: {
        name: quote?.prepared_by || quote?.created_by || currentUser?.name || "System User",
        title: quote?.prepared_by_title || "Sales Representative"
      },
      approved_by: {
        name: quote?.approved_by || "Management",
        title: quote?.approved_by_title || "Authorized Signatory"
      }
    },
    display: {
      show_bank_details: true,
      show_notes: true,
      show_tax_summary: true,
      show_letterhead: true
    },
    custom_notes: quote?.notes || ""
  });

  // Actions
  const updateSignatory = (type: "prepared_by" | "approved_by", field: "name" | "title", value: string) => {
    setOptions(prev => ({
      ...prev,
      signatories: {
        ...prev.signatories,
        [type]: {
          ...prev.signatories[type],
          [field]: value
        }
      }
    }));
  };

  const toggleDisplay = (key: keyof QuotationPrintOptions["display"]) => {
    setOptions(prev => ({
      ...prev,
      display: {
        ...prev.display,
        [key]: !prev.display[key]
      }
    }));
  };

  const setCustomNotes = (text: string) => {
    setOptions(prev => ({ ...prev, custom_notes: text }));
  };

  return {
    options,
    updateSignatory,
    toggleDisplay,
    setCustomNotes
  };
}
