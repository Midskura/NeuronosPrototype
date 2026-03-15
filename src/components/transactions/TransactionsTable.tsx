import { useState } from "react";
import { ChevronDown, ChevronRight, Check, Search, AlertCircle, FileText } from "lucide-react";
import { formatCurrency } from "../../utils/accounting-math";
import type { UI_Transaction, ReviewStatus } from "./types";
import { CustomDropdown } from "../bd/CustomDropdown";

interface TransactionsTableProps {
  transactions: UI_Transaction[];
  isLoading?: boolean;
  onAction: (transaction: UI_Transaction, action: 'add' | 'match' | 'exclude') => void;
  // Options for dropdowns
  categories?: { value: string; label: string }[];
  payees?: { value: string; label: string }[];
}

interface TransactionRowProps {
  txn: UI_Transaction;
  isExpanded: boolean;
  isSelected: boolean;
  onToggleExpand: (id: string) => void;
  onToggleSelect: (id: string) => void;
  onAction: (transaction: UI_Transaction, action: 'add' | 'match' | 'exclude') => void;
  categories: { value: string; label: string }[];
  payees: { value: string; label: string }[];
}

function TransactionRow({
  txn,
  isExpanded,
  isSelected,
  onToggleExpand,
  onToggleSelect,
  onAction,
  categories,
  payees
}: TransactionRowProps) {
  const isMoneyOut = txn.amount < 0;
  const absAmount = Math.abs(txn.amount);
  
  // Local state for edits
  const [category, setCategory] = useState(txn.category_account_id || "");
  const [payee, setPayee] = useState(txn.payee || "");
  const [description, setDescription] = useState(txn.description || "");

  // Helper to trigger action with updated data
  const handleAction = (action: 'add' | 'match' | 'exclude') => {
    onAction({
        ...txn,
        category_account_id: category,
        payee: payee,
        description: description
    }, action);
  };

  return (
    <>
      {/* Main Row */}
      <tr 
        onClick={() => onToggleExpand(txn.id)}
        className={`
          group cursor-pointer transition-colors hover:bg-gray-50
          ${isExpanded ? "bg-gray-50 border-l-4 border-l-[#0F766E]" : "border-l-4 border-l-transparent"}
          ${isSelected ? "bg-[#F0FDF9]" : ""}
        `}
      >
        <td className="py-3 px-4" onClick={(e) => e.stopPropagation()}>
          <input 
            type="checkbox" 
            checked={isSelected}
            onChange={() => onToggleSelect(txn.id)}
            className="rounded border-gray-300 text-[#0F766E] focus:ring-[#0F766E]"
          />
        </td>
        <td className="py-3 px-4 text-sm text-gray-600">
          {new Date(txn.date).toLocaleDateString()}
        </td>
        <td className="py-3 px-4 text-sm font-medium text-[#12332B]">
          <div className="flex flex-col">
              <span>{txn.description}</span>
              {txn.reference && (
                  <span className="text-[10px] text-gray-400 font-mono">Ref: {txn.reference}</span>
              )}
          </div>
        </td>
        <td className="py-3 px-4 text-sm text-gray-600">
          {txn.payee || <span className="text-gray-400 italic">- Select -</span>}
        </td>
        <td className="py-3 px-4 text-sm">
          {txn.category_account_id ? (
                <span className="px-2 py-1 rounded bg-green-50 text-green-700 text-xs border border-green-200">
                    Match Found
                </span>
          ) : (
              <span className="px-2 py-1 rounded bg-gray-100 text-gray-500 text-xs border border-gray-200">
                  Uncategorized
              </span>
          )}
        </td>
        <td className="py-3 px-4 text-sm text-right font-medium text-gray-900">
          {isMoneyOut ? formatCurrency(absAmount, txn.currency) : ""}
        </td>
        <td className="py-3 px-4 text-sm text-right font-medium text-gray-900">
          {!isMoneyOut ? formatCurrency(absAmount, txn.currency) : ""}
        </td>
        <td className="py-3 px-4 text-right">
          <button 
              onClick={(e) => {
                  e.stopPropagation();
                  handleAction('add');
              }}
              className="px-3 py-1.5 bg-[#0F766E] text-white text-xs font-medium rounded hover:bg-[#0D6560] transition-colors shadow-sm"
          >
              Add
          </button>
        </td>
      </tr>

      {/* Expanded Detail Row */}
      {isExpanded && (
        <tr className="bg-gray-50 shadow-inner">
          <td colSpan={8} className="p-4 pl-14">
              <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                <div className="flex gap-6 mb-6">
                    {/* Left: Input Form */}
                    <div className="flex-1 grid grid-cols-2 gap-4">
                      <div>
                          <label className="block text-xs font-medium text-gray-500 mb-1">From/To</label>
                          <input 
                              type="text" 
                              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[#0F766E]"
                              placeholder="Enter Name"
                              value={payee}
                              onChange={(e) => setPayee(e.target.value)}
                          />
                      </div>
                      <div>
                          <label className="block text-xs font-medium text-gray-500 mb-1">Category</label>
                          <CustomDropdown 
                              value={category}
                              onChange={(val) => setCategory(val)}
                              options={categories}
                              placeholder="Select Category"
                              fullWidth
                          />
                      </div>
                      <div className="col-span-2">
                          <label className="block text-xs font-medium text-gray-500 mb-1">Memo</label>
                          <input 
                              type="text" 
                              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[#0F766E]"
                              placeholder="Add a memo..."
                              value={description}
                              onChange={(e) => setDescription(e.target.value)}
                          />
                      </div>
                    </div>

                    {/* Right: Radio selection (Add / Find Match / Transfer) */}
                    <div className="w-64 border-l border-gray-100 pl-6 space-y-3">
                      <label className="flex items-center gap-2 cursor-pointer">
                          <input type="radio" name={`action-${txn.id}`} defaultChecked className="text-[#0F766E] focus:ring-[#0F766E]" />
                          <span className="text-sm font-medium text-gray-700">Add</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                          <input type="radio" name={`action-${txn.id}`} className="text-[#0F766E] focus:ring-[#0F766E]" />
                          <span className="text-sm font-medium text-gray-700">Find match</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                          <input type="radio" name={`action-${txn.id}`} className="text-[#0F766E] focus:ring-[#0F766E]" />
                          <span className="text-sm font-medium text-gray-700">Transfer</span>
                      </label>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    <div className="flex gap-2">
                      <button className="px-3 py-2 text-sm text-[#0F766E] bg-[#0F766E]/5 rounded hover:bg-[#0F766E]/10 transition-colors">
                          Split
                      </button>
                      <button className="px-3 py-2 text-sm text-gray-500 hover:text-gray-700 transition-colors">
                          Exclude
                      </button>
                    </div>
                    <div className="flex gap-3">
                      <button 
                          onClick={() => onToggleExpand(txn.id)}
                          className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded hover:bg-gray-50"
                      >
                          Cancel
                      </button>
                      <button 
                          onClick={() => handleAction('add')}
                          className="px-4 py-2 text-sm text-white bg-[#0F766E] rounded hover:bg-[#0D6560] shadow-sm font-medium"
                      >
                          Add
                      </button>
                    </div>
                </div>
              </div>
          </td>
        </tr>
      )}
    </>
  );
}

export function TransactionsTable({ 
  transactions, 
  isLoading, 
  onAction,
  categories = [],
  payees = []
}: TransactionsTableProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === transactions.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(transactions.map(t => t.id)));
    }
  };

  if (isLoading) {
    return (
      <div className="p-8 text-center">
        <div className="animate-spin w-8 h-8 border-2 border-[#0F766E] border-t-transparent rounded-full mx-auto mb-2" />
        <p className="text-sm text-gray-500">Loading transactions...</p>
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className="p-12 text-center border-t border-gray-200">
        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check size={24} className="text-green-500" />
        </div>
        <h3 className="text-lg font-medium text-[#12332B] mb-1">All caught up!</h3>
        <p className="text-gray-500 text-sm">No transactions to review.</p>
      </div>
    );
  }

  return (
    <div className="bg-white min-h-[500px]">
      <table className="w-full border-collapse">
        <thead className="bg-gray-50 border-y border-gray-200 sticky top-0 z-10">
          <tr>
            <th className="w-10 py-3 px-4">
              <input 
                type="checkbox" 
                checked={selectedIds.size === transactions.length && transactions.length > 0}
                onChange={toggleSelectAll}
                className="rounded border-gray-300 text-[#0F766E] focus:ring-[#0F766E]"
              />
            </th>
            <th className="py-3 px-4 text-xs font-semibold text-gray-500 uppercase text-left w-24">Date</th>
            <th className="py-3 px-4 text-xs font-semibold text-gray-500 uppercase text-left">Description</th>
            <th className="py-3 px-4 text-xs font-semibold text-gray-500 uppercase text-left w-48">From/To</th>
            <th className="py-3 px-4 text-xs font-semibold text-gray-500 uppercase text-left w-48">Category</th>
            <th className="py-3 px-4 text-xs font-semibold text-gray-500 uppercase text-right w-32">Spent</th>
            <th className="py-3 px-4 text-xs font-semibold text-gray-500 uppercase text-right w-32">Received</th>
            <th className="py-3 px-4 text-xs font-semibold text-gray-500 uppercase text-right w-24">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {transactions.map((txn) => (
            <TransactionRow 
              key={txn.id}
              txn={txn}
              isExpanded={expandedId === txn.id}
              isSelected={selectedIds.has(txn.id)}
              onToggleExpand={toggleExpand}
              onToggleSelect={toggleSelect}
              onAction={onAction}
              categories={categories}
              payees={payees}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}
