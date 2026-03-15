import { AddRequestForPaymentPanel } from "../AddRequestForPaymentPanel";

interface CreateEVoucherFormProps {
  isOpen: boolean;
  onClose: () => void;
  context?: "bd" | "accounting" | "operations" | "collection" | "billing";
  defaultRequestor?: string;
  bookingId?: string;
  bookingType?: "forwarding" | "brokerage" | "trucking" | "marine-insurance" | "others";
  onSuccess?: () => void;
}

export function CreateEVoucherForm({
  isOpen,
  onClose,
  context = "accounting",
  defaultRequestor,
  bookingId,
  bookingType,
  onSuccess
}: CreateEVoucherFormProps) {
  return (
    <AddRequestForPaymentPanel
      isOpen={isOpen}
      onClose={onClose}
      onSuccess={onSuccess}
      context={context}
      defaultRequestor={defaultRequestor}
      bookingId={bookingId}
      bookingType={bookingType}
      mode="create"
    />
  );
}
