import { useState, useEffect } from "react";
import { X, Save, ArrowRight } from "lucide-react";
import { toast } from "sonner@2.0.3";
import { motion, AnimatePresence } from "motion/react";
import { saveTransaction, getAccounts } from "../../utils/accounting-api";
import type { Account, Transaction, Currency } from "../../types/accounting";

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  currency: Currency;
  preselectedBankId?: string | null;
}

export function TransactionModal({ isOpen, onClose, onSave, currency, preselectedBankId }: TransactionModalProps) {
  const [formData, setFormData] = useState<Partial<Transaction>>({
    date: new Date().toISOString().split('T')[0],
    description: "",
    amount: 0,
    currency: currency,
    bank_account_id: preselectedBankId || "",
    category_account_id: "",
    status: 'posted'
  });

  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(false);
  const [transactionType, setTransactionType] = useState<'expense' | 'income'>('expense');

  useEffect(() => {
    if (isOpen) {
      getAccounts().then(setAccounts);
      setFormData(prev => ({
        ...prev,
        currency,
        bank_account_id: preselectedBankId || prev.bank_account_id
      }));
    }
  }, [isOpen, currency, preselectedBankId]);

  const bankAccounts = accounts.filter(a => 
    a.type === 'asset' && 
    !a.is_folder && 
    a.currency === currency
  );

  const categoryAccounts = accounts.filter(a => 
    !a.is_folder && 
    (transactionType === 'expense' ? (a.type === 'expense' || a.type === 'liability' || a.type === 'asset') : (a.type === 'income' || a.type === 'equity'))
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.description || !formData.amount || !formData.bank_account_id || !formData.category_account_id) {
      toast.error("Please fill in all fields");
      return;
    }

    try {
      setLoading(true);

      // Adjust amount based on type
      // Expense: Money leaves Bank (Credit Asset). We store negative amount for Bank context?
      // Let's standardise: 
      // Amount is absolute in the form.
      // If Expense: Bank Balance decreases.
      // If Income: Bank Balance increases.
      
      // In our store logic:
      // if txn.bank_account_id === accountId, balance -= amount
      // This implies amount is always positive quantity of money moved.
      
      const finalAmount = Math.abs(formData.amount!);

      // Construct the transaction
      const newTxn: Transaction = {
        id: Math.random().toString(36).substring(2, 15),
        created_at: new Date().toISOString(),
        date: formData.date!,
        description: formData.description!,
        amount: finalAmount, // Always positive
        currency: currency,
        // If expense: Source = Bank, Destination = Category
        // If income: Source = Category (Customer), Destination = Bank?
        // Wait, the store logic says:
        // if bank_account_id === accountId, balance -= amount.
        // So bank_account_id is ALWAYS the "Payer" (Source of funds).
        
        // For Expense: Bank pays Category. Bank Balance down. Correct.
        // For Income: Customer pays Bank. Bank Balance up.
        // To make Bank Balance up, Bank must be the DESTINATION (category_account_id).
        
        // Let's adjust the IDs based on type:
        bank_account_id: transactionType === 'expense' ? formData.bank_account_id! : formData.category_account_id!,
        category_account_id: transactionType === 'expense' ? formData.category_account_id! : formData.bank_account_id!,
        
        status: 'posted'
      };

      // Wait, if I swap them, the UI "Bank Account" field might get confused when displaying.
      // Let's stick to the definition in `types/accounting.ts`:
      // bank_account_id: string; // The "Bank" side
      // category_account_id: string; // The "Category" side
      
      // And in `store`:
      // if (txn.bank_account_id === accountId) balance -= txn.amount;
      // if (txn.category_account_id === accountId) balance += txn.amount;
      
      // So:
      // Expense (Money Out): Bank is Source (bank_account_id). Category is Dest.
      // Income (Money In): Bank is Dest (category_account_id). Category (Revenue) is Source (bank_account_id).
      
      // This works mathematically, but semantically "bank_account_id" being a Revenue account is confusing.
      // Let's redefine Transaction type slightly if needed, or just handle the swap carefully here.
      // actually, let's keep the IDs as "Source" and "Destination" in the logic, 
      // but the Type says "bank_account_id" and "category_account_id".
      
      // BETTER APPROACH:
      // Always keep `bank_account_id` pointing to the actual Bank Account.
      // Add a `type` or `direction` field to Transaction? Or sign the amount?
      // If amount is negative, it's money OUT of bank.
      // If amount is positive, it's money INTO bank.
      
      // Let's check `store` logic again.
      // if (txn.bank_account_id === accountId) balance -= txn.amount;
      // So if amount is negative (-500), balance -= -500 => balance += 500.
      
      // YES. Use signed amount.
      // Expense: Amount is positive (wait).
      // If I pay $50.
      // store: balance -= 50. Balance goes down. Correct.
      // So Expense = Positive Amount.
      
      // Income: I receive $50.
      // store: balance -= (-50) => balance += 50.
      // So Income = Negative Amount.
      
      // This is counter-intuitive for `amount`.
      
      // Let's stick to:
      // Expense: Bank is `bank_account_id`. Amount is positive. Balance -= Amount.
      // Income: Bank is `category_account_id`. Revenue is `bank_account_id`. Balance += Amount.
      
      // Effectively swapping the IDs is the cleanest way to use the existing `calculateBalance` logic without changing the store.
      
      await saveTransaction(newTxn);

      toast.success("Transaction saved");
      onSave();
      onClose();
    } catch (error) {
      console.error("Error saving transaction:", error);
      toast.error("Failed to save transaction");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none"
          >
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden pointer-events-auto">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                <h2 className="text-lg font-semibold text-[#12332B]">New Transaction ({currency})</h2>
                <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-500">
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                {/* Type Toggle */}
                <div className="flex bg-gray-100 p-1 rounded-lg mb-4">
                  <button
                    type="button"
                    onClick={() => setTransactionType('expense')}
                    className={`flex-1 py-2 rounded-md text-sm font-medium transition-all ${
                      transactionType === 'expense'
                        ? "bg-white text-red-600 shadow-sm"
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    Money Out (Expense)
                  </button>
                  <button
                    type="button"
                    onClick={() => setTransactionType('income')}
                    className={`flex-1 py-2 rounded-md text-sm font-medium transition-all ${
                      transactionType === 'income'
                        ? "bg-white text-green-600 shadow-sm"
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    Money In (Income)
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-[#12332B]">Date</label>
                    <input
                      type="date"
                      required
                      value={formData.date}
                      onChange={e => setFormData(prev => ({ ...prev, date: e.target.value }))}
                      className="w-full px-3 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:border-[#0F766E] text-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-[#12332B]">Amount</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-medium">
                        {currency === 'PHP' ? '₱' : '$'}
                      </span>
                      <input
                        type="number"
                        required
                        min="0.01"
                        step="0.01"
                        value={formData.amount || ""}
                        onChange={e => setFormData(prev => ({ ...prev, amount: parseFloat(e.target.value) }))}
                        className="w-full pl-8 pr-3 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:border-[#0F766E] text-sm font-mono"
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-[#12332B]">Description</label>
                  <input
                    type="text"
                    required
                    value={formData.description}
                    onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:border-[#0F766E] text-sm"
                    placeholder="e.g. Payment to Maersk"
                  />
                </div>

                {/* Account Selection */}
                <div className="grid grid-cols-[1fr,auto,1fr] gap-2 items-center">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-[#12332B]">
                      {transactionType === 'expense' ? 'From (Bank)' : 'To (Bank)'}
                    </label>
                    <select
                      required
                      value={formData.bank_account_id}
                      onChange={e => setFormData(prev => ({ ...prev, bank_account_id: e.target.value }))}
                      className="w-full px-3 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:border-[#0F766E] text-sm bg-white"
                    >
                      <option value="">Select Bank...</option>
                      {bankAccounts.map(acc => (
                        <option key={acc.id} value={acc.id}>{acc.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="pt-6 text-gray-300">
                    <ArrowRight size={20} />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-[#12332B]">
                      {transactionType === 'expense' ? 'To (Category)' : 'From (Source)'}
                    </label>
                    <select
                      required
                      value={formData.category_account_id}
                      onChange={e => setFormData(prev => ({ ...prev, category_account_id: e.target.value }))}
                      className="w-full px-3 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:border-[#0F766E] text-sm bg-white"
                    >
                      <option value="">Select Category...</option>
                      {categoryAccounts.map(acc => (
                        <option key={acc.id} value={acc.id}>{acc.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="pt-4 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-5 py-2.5 text-gray-600 hover:text-gray-900 font-medium text-sm transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-6 py-2.5 bg-[#0F766E] hover:bg-[#0D6560] text-white rounded-xl font-semibold text-sm shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {loading ? "Saving..." : <><Save size={18} /> Save Transaction</>}
                  </button>
                </div>

              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
