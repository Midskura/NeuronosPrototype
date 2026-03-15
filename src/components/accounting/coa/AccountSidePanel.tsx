import { useState, useEffect } from "react";
import { X, Save, Trash2, Folder, FileText } from "lucide-react";
import { toast } from "sonner@2.0.3";
import { motion, AnimatePresence } from "motion/react";
import { saveAccount, deleteAccount, getAccounts } from "../../../utils/accounting-api";
import type { Account, AccountType } from "../../../types/accounting-core";

interface AccountSidePanelProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  account: Account | null; // If null, it's create mode
}

const ACCOUNT_TYPES: AccountType[] = ["Asset", "Liability", "Equity", "Income", "Expense"];
const CURRENCIES = ["USD", "PHP"] as const;

export function AccountSidePanel({ isOpen, onClose, onSave, account }: AccountSidePanelProps) {
  const [formData, setFormData] = useState<Partial<Account>>({
    name: "",
    code: "", // Added code field
    type: "Asset",
    currency: "USD",
    is_folder: false,
    parent_id: undefined,
    balance: 0,
    subtype: ""
  });
  
  const [loading, setLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [availableParents, setAvailableParents] = useState<Account[]>([]);

  // Load available parents (only folders can be parents)
  useEffect(() => {
    if (isOpen) {
      getAccounts().then(accounts => {
        // Prevent circular dependency: an account cannot be its own parent
        // And only folders can be parents
        const validParents = accounts.filter(a => 
          a.is_folder && 
          (account ? a.id !== account.id : true)
        );
        setAvailableParents(validParents);
      });
    }
  }, [isOpen, account]);

  useEffect(() => {
    if (account) {
      setFormData(account);
    } else {
      setFormData({
        name: "",
        code: "",
        type: "Asset",
        currency: "USD",
        is_folder: false,
        parent_id: undefined,
        balance: 0,
        subtype: ""
      });
    }
  }, [account, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name) {
      toast.error("Please fill in the account name");
      return;
    }

    try {
      setLoading(true);
      
      const newAccount: Account = {
        id: account?.id || Math.random().toString(36).substring(2, 15),
        created_at: account?.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString(),
        name: formData.name,
        code: formData.code || "",
        type: formData.type as AccountType,
        currency: formData.currency as "USD" | "PHP",
        is_folder: formData.is_folder || false,
        parent_id: formData.parent_id,
        balance: formData.balance || 0,
        subtype: formData.subtype || "",
        is_system: account?.is_system || false,
        is_active: true
      };

      await saveAccount(newAccount);

      toast.success(account ? "Account updated" : "Account created");
      onSave();
      onClose();
    } catch (error) {
      console.error("Error saving account:", error);
      toast.error("Failed to save account");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!account) return;

    if (!confirm("Are you sure you want to delete this account? This action cannot be undone.")) return;

    try {
      setIsDeleting(true);
      await deleteAccount(account.id);

      toast.success("Account deleted");
      onSave();
      onClose();
    } catch (error) {
      console.error("Error deleting account:", error);
      toast.error("Failed to delete account");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
          />

          {/* Panel */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed inset-y-0 right-0 w-[500px] bg-white shadow-2xl z-50 flex flex-col border-l border-gray-100"
          >
            {/* Header */}
            <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <div>
                <h2 className="text-xl font-semibold text-[#12332B]">
                  {account ? "Edit Account" : "New Account"}
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  {account ? "Modify account details" : "Add a new account to your chart of accounts"}
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-500"
              >
                <X size={20} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-8 py-6 space-y-6">
              
              {/* Type Selection */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-[#12332B]">Account Type</label>
                <div className="grid grid-cols-3 gap-2">
                  {ACCOUNT_TYPES.map(type => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, type }))}
                      className={`px-3 py-2 rounded-lg text-sm font-medium border transition-all capitalize ${
                        formData.type === type
                          ? "bg-[#0F766E]/10 border-[#0F766E] text-[#0F766E]"
                          : "bg-white border-gray-200 text-gray-600 hover:border-gray-300"
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              {/* Code & Name Row */}
              <div className="flex gap-4">
                 <div className="space-y-1.5 w-32">
                    <label className="text-sm font-medium text-[#12332B]">Code</label>
                    <input
                      type="text"
                      value={formData.code || ""}
                      onChange={e => setFormData(prev => ({ ...prev, code: e.target.value }))}
                      className="w-full px-3 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:border-[#0F766E] text-sm font-mono"
                      placeholder="e.g. 1000"
                    />
                 </div>
                 <div className="space-y-1.5 flex-1">
                    <label className="text-sm font-medium text-[#12332B]">Account Name <span className="text-red-500">*</span></label>
                    <input
                      required
                      type="text"
                      value={formData.name || ""}
                      onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-3 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:border-[#0F766E] text-sm"
                      placeholder="e.g. HSBC Account"
                    />
                 </div>
              </div>

              {/* Detail Type / Subtype */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-[#12332B]">Detail Type (Subtype)</label>
                <input
                  type="text"
                  value={formData.subtype || ""}
                  onChange={e => setFormData(prev => ({ ...prev, subtype: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:border-[#0F766E] text-sm"
                  placeholder="e.g. Bank, Accounts Receivable, etc."
                />
              </div>

              {/* Currency */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-[#12332B]">Currency</label>
                <div className="flex gap-4">
                  {CURRENCIES.map(curr => (
                    <label key={curr} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="currency"
                        value={curr}
                        checked={formData.currency === curr}
                        onChange={() => setFormData(prev => ({ ...prev, currency: curr }))}
                        className="text-[#0F766E] focus:ring-[#0F766E]"
                      />
                      <span className="text-sm text-gray-700 font-medium">{curr}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Is Folder */}
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg border border-gray-100">
                <input
                  type="checkbox"
                  id="isFolder"
                  checked={formData.is_folder || false}
                  onChange={e => setFormData(prev => ({ ...prev, is_folder: e.target.checked }))}
                  className="w-4 h-4 text-[#0F766E] rounded border-gray-300 focus:ring-[#0F766E]"
                />
                <div className="flex-1">
                  <label htmlFor="isFolder" className="text-sm font-medium text-gray-700 cursor-pointer flex items-center gap-2">
                    <Folder size={16} className="text-gray-500" />
                    This is a Folder (Parent Account)
                  </label>
                  <p className="text-xs text-gray-500 mt-1">Folders can contain other accounts but cannot store transactions directly.</p>
                </div>
              </div>

              {/* Parent Account */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-[#12332B]">Parent Account (Optional)</label>
                <select
                  value={formData.parent_id || ""}
                  onChange={e => setFormData(prev => ({ ...prev, parent_id: e.target.value || undefined }))}
                  className="w-full px-3 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:border-[#0F766E] text-sm bg-white"
                >
                  <option value="">None (Top Level)</option>
                  {availableParents.map(parent => (
                    <option key={parent.id} value={parent.id}>
                      {parent.code ? `${parent.code} - ` : ""}{parent.name} ({parent.currency})
                    </option>
                  ))}
                </select>
              </div>

            </form>

            {/* Footer */}
            <div className="px-8 py-6 border-t border-gray-100 flex items-center justify-between bg-white">
              {account ? (
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="text-red-600 hover:text-red-700 text-sm font-medium flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-red-50 transition-colors"
                >
                  <Trash2 size={18} />
                  Delete
                </button>
              ) : (
                <div></div>
              )}

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2.5 text-gray-600 hover:text-gray-900 font-medium text-sm transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="px-6 py-2.5 bg-[#0F766E] hover:bg-[#0D6560] text-white rounded-xl font-semibold text-sm shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save size={18} />
                      Save Account
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
