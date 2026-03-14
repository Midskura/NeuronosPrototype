import { useState } from "react";
import { AddRequestForPaymentPanel } from "../accounting/AddRequestForPaymentPanel";

interface AddBudgetRequestPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function AddBudgetRequestPanel({
  isOpen,
  onClose,
  onSuccess
}: AddBudgetRequestPanelProps) {
  // Get current user from localStorage
  const userData = localStorage.getItem("neuron_user");
  const currentUser = userData ? JSON.parse(userData) : null;

  return (
    <AddRequestForPaymentPanel
      context="bd"
      isOpen={isOpen}
      onClose={onClose}
      onSave={onSuccess}
      defaultRequestor={currentUser?.name || "Current User"}
    />
  );
}