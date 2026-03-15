import type { Customer } from "../../types/bd";
import { CustomerDetail } from "../bd/CustomerDetail";

interface PricingCustomerDetailProps {
  customer: Customer;
  onBack: () => void;
  onCreateInquiry?: (customer: Customer) => void;
  onViewInquiry?: (inquiryId: string) => void;
}

export function PricingCustomerDetail({ customer, onBack, onCreateInquiry, onViewInquiry }: PricingCustomerDetailProps) {
  return (
    <CustomerDetail 
      customer={customer} 
      onBack={onBack} 
      onCreateInquiry={onCreateInquiry}
      onViewInquiry={onViewInquiry}
      variant="pricing"
    />
  );
}
