import type { Contact, Customer } from "../../types/bd";
import { ContactDetail } from "../bd/ContactDetail";

interface PricingContactDetailProps {
  contact: Contact;
  onBack: () => void;
  onCreateInquiry?: (customer: Customer, contact?: Contact) => void;
}

export function PricingContactDetail({ contact, onBack, onCreateInquiry }: PricingContactDetailProps) {
  return (
    <ContactDetail 
      contact={contact} 
      onBack={onBack} 
      onCreateInquiry={onCreateInquiry}
      variant="pricing"
    />
  );
}
