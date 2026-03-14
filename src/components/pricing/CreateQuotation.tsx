import { QuotationBuilderV3 } from "./quotations/QuotationBuilderV3";
import type { QuotationNew } from "../../types/pricing";

interface CreateQuotationProps {
  onBack: () => void;
  initialData?: QuotationNew;
}

export function CreateQuotation({ onBack, initialData }: CreateQuotationProps) {
  const handleSave = (data: any) => {
    console.log("Quotation created:", data);
    // In real app, save to Supabase
    // TODO: Implement Supabase integration
    onBack();
  };

  return (
    <QuotationBuilderV3
      onClose={onBack}
      onSave={handleSave}
      initialData={initialData}
      mode={initialData ? "edit" : "create"}
    />
  );
}