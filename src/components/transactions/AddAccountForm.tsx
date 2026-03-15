import { useState } from "react";
import { toast } from "sonner@2.0.3";
import { Wallet, Globe, Loader2, Check } from "lucide-react";
import type { Currency, Account, AccountType } from "../../types/accounting";

interface AddAccountFormProps {
  onSuccess: (account: Omit<Account, "id" | "created_at">) => Promise<void>;
  onCancel: () => void;
}

export function AddAccountForm({ onSuccess, onCancel }: AddAccountFormProps) {
  const [name, setName] = useState("");
  const [currency, setCurrency] = useState<Currency>("USD");
  const [balance, setBalance] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      setIsSubmitting(true);
      
      const newAccount: Omit<Account, "id" | "created_at"> = {
        name: name.trim(),
        currency,
        type: 'asset' as AccountType, // Fixed as asset for Bank Accounts
        is_folder: false,
        balance: parseFloat(balance) || 0,
        parent_id: undefined // Top level for now
      };

      await onSuccess(newAccount);
      
    } catch (error) {
      console.error("Failed to create account:", error);
      toast.error("Failed to create account");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <form onSubmit={handleSubmit} className="flex-1 flex flex-col">
        <div className="flex-1 p-8 space-y-8">
          
          {/* Account Name */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-[#374151]">
              Account Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. BDO Savings"
              className="w-full h-11 px-4 rounded-lg border border-gray-300 focus:border-[#0F766E] focus:ring-1 focus:ring-[#0F766E] outline-none transition-all placeholder:text-gray-400 text-[#12332B]"
              autoFocus
              required
            />
          </div>

          {/* Currency Selection */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-[#374151]">
              Currency
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setCurrency("USD")}
                className={`
                  relative flex flex-col items-center justify-center gap-2 h-24 rounded-xl border-2 transition-all duration-200
                  ${currency === "USD" 
                    ? "border-[#0F766E] bg-[#F0FDF9] text-[#0F766E]" 
                    : "border-gray-200 hover:border-gray-300 text-gray-500 hover:bg-gray-50"
                  }
                `}
              >
                <Globe size={24} strokeWidth={1.5} />
                <span className="font-semibold text-sm">USD</span>
                {currency === "USD" && (
                  <div className="absolute top-2 right-2 text-[#0F766E]">
                    <Check size={14} strokeWidth={3} />
                  </div>
                )}
              </button>

              <button
                type="button"
                onClick={() => setCurrency("PHP")}
                className={`
                  relative flex flex-col items-center justify-center gap-2 h-24 rounded-xl border-2 transition-all duration-200
                  ${currency === "PHP" 
                    ? "border-[#0F766E] bg-[#F0FDF9] text-[#0F766E]" 
                    : "border-gray-200 hover:border-gray-300 text-gray-500 hover:bg-gray-50"
                  }
                `}
              >
                <Wallet size={24} strokeWidth={1.5} />
                <span className="font-semibold text-sm">PHP</span>
                {currency === "PHP" && (
                  <div className="absolute top-2 right-2 text-[#0F766E]">
                    <Check size={14} strokeWidth={3} />
                  </div>
                )}
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              The currency cannot be changed after the account is created.
            </p>
          </div>

          {/* Opening Balance */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-[#374151]">
              Opening Balance
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">
                {currency === "USD" ? "$" : "₱"}
              </span>
              <input
                type="number"
                step="0.01"
                value={balance}
                onChange={(e) => setBalance(e.target.value)}
                placeholder="0.00"
                className="w-full h-11 pl-10 pr-4 rounded-lg border border-gray-300 focus:border-[#0F766E] focus:ring-1 focus:ring-[#0F766E] outline-none transition-all placeholder:text-gray-400 text-[#12332B] font-mono"
              />
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-100 bg-gray-50/50 flex items-center justify-end gap-3 mt-auto">
          <button
            type="button"
            onClick={onCancel}
            className="px-5 py-2.5 text-sm font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!name.trim() || isSubmitting}
            className={`
              flex items-center gap-2 px-6 py-2.5 text-sm font-semibold text-white rounded-lg transition-all shadow-sm
              ${!name.trim() || isSubmitting 
                ? "bg-gray-300 cursor-not-allowed" 
                : "bg-[#0F766E] hover:bg-[#0D635D] hover:shadow"
              }
            `}
          >
            {isSubmitting && <Loader2 size={16} className="animate-spin" />}
            Create Account
          </button>
        </div>
      </form>
    </div>
  );
}
