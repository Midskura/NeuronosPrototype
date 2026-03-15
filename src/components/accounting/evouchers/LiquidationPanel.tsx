import { useState, useMemo } from "react";
import { X, Plus, Trash2, Save, Receipt, AlertCircle } from "lucide-react";
import { motion } from "motion/react";
import type { EVoucher } from "../../../types/evoucher";
import { useEVoucherSubmit } from "../../../hooks/useEVoucherSubmit";
import { toast } from "../../ui/toast-utils";

interface LiquidationItem {
  id: string;
  date: string;
  description: string;
  amount: number;
  receipt_ref?: string;
}

interface LiquidationPanelProps {
  isOpen: boolean;
  onClose: () => void;
  originalVoucher: EVoucher;
  onSuccess: () => void;
}

export function LiquidationPanel({ isOpen, onClose, originalVoucher, onSuccess }: LiquidationPanelProps) {
  const [items, setItems] = useState<LiquidationItem[]>([
    { id: "1", date: new Date().toISOString().split('T')[0], description: "", amount: 0 }
  ]);
  const [notes, setNotes] = useState("");
  
  // Use the submission hook
  const { submitForApproval, isSaving } = useEVoucherSubmit("accounting");

  // Calculate totals
  const totalExpenses = useMemo(() => items.reduce((sum, item) => sum + (item.amount || 0), 0), [items]);
  const originalAmount = originalVoucher.amount;
  const balance = originalAmount - totalExpenses;
  
  // Determine the result
  const isRefund = balance > 0;
  const isReimbursement = balance < 0;
  const isBalanced = balance === 0;

  const handleAddItem = () => {
    setItems([
      ...items,
      { 
        id: Math.random().toString(36).substr(2, 9), 
        date: new Date().toISOString().split('T')[0], 
        description: "", 
        amount: 0 
      }
    ]);
  };

  const handleRemoveItem = (id: string) => {
    if (items.length > 1) {
      setItems(items.filter(i => i.id !== id));
    }
  };

  const updateItem = (id: string, field: keyof LiquidationItem, value: any) => {
    setItems(items.map(i => i.id === id ? { ...i, [field]: value } : i));
  };

  const handleSubmit = async () => {
    try {
      // 1. Prepare the Liquidation Report (Payload)
      // Note: In a real system we'd save the liquidation report itself.
      // Here we will create the Resulting Voucher (Collection or Reimbursement)
      
      let payload = null;
      let transactionType = "";

      if (isRefund) {
        // Create Collection Voucher for the return of funds
        transactionType = "collection";
        payload = {
          requestName: `Liquidation Return - ${originalVoucher.voucher_number}`,
          expenseCategory: "Liquidation",
          subCategory: "Return of Funds",
          amount: balance, // The amount to return
          description: `Return of unused funds from ${originalVoucher.voucher_number}`,
          parent_voucher_id: originalVoucher.id, // LINK TO PARENT
          transaction_type: "collection",
          notes: `Total Budget: ${originalAmount}, Total Spent: ${totalExpenses}. \n\nBreakdown:\n${items.map(i => `- ${i.description}: ${i.amount}`).join('\n')}`
        };
      } else if (isReimbursement) {
        // Create Reimbursement Voucher for the overspend
        transactionType = "reimbursement";
        payload = {
          requestName: `Liquidation Reimbursement - ${originalVoucher.voucher_number}`,
          expenseCategory: "Liquidation",
          subCategory: "Reimbursement",
          amount: Math.abs(balance), // The amount to pay back to employee
          description: `Reimbursement for overspend on ${originalVoucher.voucher_number}`,
          parent_voucher_id: originalVoucher.id, // LINK TO PARENT
          transaction_type: "reimbursement",
          notes: `Total Budget: ${originalAmount}, Total Spent: ${totalExpenses}. \n\nBreakdown:\n${items.map(i => `- ${i.description}: ${i.amount}`).join('\n')}`
        };
      } else {
        // Perfectly balanced - maybe just update status?
        // For now, we'll just show a success message as no voucher is needed
        toast.success("Liquidation balanced. No further action needed.");
        onSuccess();
        onClose();
        return;
      }

      // 2. Submit the resulting voucher
      if (payload) {
        // We need to adapt the payload to what submitForApproval expects
        // It expects { requestName, expenseCategory, ... }
        // We might need to manually call the backend if the hook is too rigid, 
        // but let's try to fit the hook's expected format.
        
        // The hook maps these fields to the EVoucher object.
        await submitForApproval({
            ...payload,
            totalAmount: payload.amount,
            lineItems: items.map(i => ({ particular: i.description, amount: i.amount })), // Just for record
            preferredPayment: "Cash", // Default
            vendor: "Neuron Treasury", 
        });
        
        toast.success(`Liquidation submitted. ${isRefund ? "Please return funds to Treasury." : "Reimbursement request created."}`);
        onSuccess();
        onClose();
      }

    } catch (error) {
      console.error("Liquidation failed:", error);
      toast.error("Failed to submit liquidation.");
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50" onClick={onClose} />
      <motion.div
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        className="fixed right-0 top-0 h-full w-[600px] bg-white shadow-xl z-50 flex flex-col"
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex justify-between items-start bg-white">
          <div>
            <h2 className="text-xl font-bold text-[#12332B] flex items-center gap-2">
              <Receipt className="w-5 h-5" />
              Liquidate Budget
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Ref: {originalVoucher.voucher_number} • {originalVoucher.purpose}
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
          
          {/* Summary Card */}
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm mb-6">
            <div className="text-sm font-medium text-gray-500 mb-1">Total Budget</div>
            <div className="text-2xl font-bold text-[#12332B]">
              ₱{originalAmount.toLocaleString()}
            </div>
          </div>

          {/* Expenses List */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden mb-6">
            <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
              <h3 className="font-semibold text-gray-800 text-sm">Actual Expenses</h3>
              <button 
                onClick={handleAddItem}
                className="text-xs font-medium text-[#0F766E] hover:text-[#0D6560] flex items-center gap-1"
              >
                <Plus className="w-3 h-3" />
                Add Item
              </button>
            </div>
            
            <div className="divide-y divide-gray-100">
              {items.map((item, index) => (
                <div key={item.id} className="p-3 grid grid-cols-[1fr_auto_auto] gap-3 items-start group">
                  <div className="space-y-2">
                    <input
                      type="text"
                      placeholder="Description"
                      value={item.description}
                      onChange={(e) => updateItem(item.id, "description", e.target.value)}
                      className="w-full text-sm font-medium placeholder:text-gray-300 border-none p-0 focus:ring-0"
                    />
                    <input
                      type="date"
                      value={item.date}
                      onChange={(e) => updateItem(item.id, "date", e.target.value)}
                      className="text-xs text-gray-400 border-none p-0 focus:ring-0"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400">₱</span>
                    <input
                      type="number"
                      placeholder="0.00"
                      value={item.amount || ""}
                      onChange={(e) => updateItem(item.id, "amount", parseFloat(e.target.value) || 0)}
                      className="w-24 text-right text-sm font-semibold border-none p-0 focus:ring-0"
                    />
                  </div>
                  <button 
                    onClick={() => handleRemoveItem(item.id)}
                    className="p-1 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
            
            <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-between items-center">
              <span className="text-sm font-medium text-gray-600">Total Spent</span>
              <span className="text-lg font-bold text-[#12332B]">₱{totalExpenses.toLocaleString()}</span>
            </div>
          </div>

          {/* Result Card */}
          <div className={`p-4 rounded-xl border ${
            isRefund ? "bg-emerald-50 border-emerald-200" :
            isReimbursement ? "bg-amber-50 border-amber-200" :
            "bg-gray-100 border-gray-200"
          }`}>
            <div className="flex gap-3">
              <div className={`p-2 rounded-full ${
                isRefund ? "bg-emerald-100 text-emerald-600" :
                isReimbursement ? "bg-amber-100 text-amber-600" :
                "bg-gray-200 text-gray-500"
              }`}>
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <h4 className={`font-semibold ${
                  isRefund ? "text-emerald-800" :
                  isReimbursement ? "text-amber-800" :
                  "text-gray-700"
                }`}>
                  {isRefund ? "Funds to Return" : isReimbursement ? "Reimbursement Needed" : "Budget Balanced"}
                </h4>
                <p className={`text-sm mt-1 ${
                  isRefund ? "text-emerald-700" :
                  isReimbursement ? "text-amber-700" :
                  "text-gray-600"
                }`}>
                  {isRefund 
                    ? `You have ₱${balance.toLocaleString()} remaining from the original budget.`
                    : isReimbursement
                    ? `You spent ₱${Math.abs(balance).toLocaleString()} more than the budget.`
                    : "Actual expenses match the budget exactly."
                  }
                </p>
              </div>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-100 bg-white">
          <button
            onClick={handleSubmit}
            disabled={isSaving}
            className="w-full py-3 px-4 bg-[#0F766E] hover:bg-[#0D6560] text-white rounded-xl font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
          >
            {isSaving ? "Processing..." : (
              <>
                <Save className="w-4 h-4" />
                {isRefund ? "Create Return Voucher" : isReimbursement ? "Request Reimbursement" : "Finalize Liquidation"}
              </>
            )}
          </button>
        </div>
      </motion.div>
    </>
  );
}