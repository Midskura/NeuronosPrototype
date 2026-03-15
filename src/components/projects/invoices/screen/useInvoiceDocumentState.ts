import { useState } from "react";
import type { Project } from "../../../../types/pricing";
import { Invoice } from "../../../../types/accounting";
import { InvoicePrintOptions } from "../InvoiceDocument";

export interface Signatory {
  name: string;
  title: string;
}

export function useInvoiceDocumentState(project: Project, invoice: Invoice, currentUser?: { name: string; email: string; } | null) {
  
  // Initialize state with invoice defaults or intelligent fallbacks
  const [options, setOptions] = useState<InvoicePrintOptions>({
    signatories: {
      prepared_by: {
        name: invoice.created_by_name || currentUser?.name || "System User",
        title: "Authorized User"
      },
      approved_by: {
        name: "MANAGEMENT",
        title: "Authorized Signatory"
      }
    },
    display: {
      show_bank_details: true,
      show_notes: true,
      show_tax_summary: true
    },
    custom_notes: invoice.notes || ""
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

  const toggleDisplay = (key: keyof InvoicePrintOptions["display"]) => {
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
