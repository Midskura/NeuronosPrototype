import React, { useState, useEffect, useMemo } from 'react';
import { ArrowLeft, ArrowUpRight, ArrowDownLeft, FileText, Search, Download, Filter } from 'lucide-react';
import { format } from 'date-fns';
import { Account } from '../../../types/accounting-core';
import { Transaction } from '../../../types/accounting';
import { getTransactions } from '../../../utils/accounting-api';
import { DataTable, ColumnDef } from '../../common/DataTable';

interface AccountLedgerProps {
  account: Account;
  onBack: () => void;
}

type LedgerRow = Transaction & {
  debit: number | null;
  credit: number | null;
  running_balance: number;
};

export function AccountLedger({ account, onBack }: AccountLedgerProps) {
  const [transactions, setTransactions] = useState<LedgerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const allTxns = await getTransactions();
        
        // Filter for this account
        const accountTxns = allTxns.filter(t => 
          t.bank_account_id === account.id || t.category_account_id === account.id
        );

        // Sort by date ASC for running balance calculation
        const sorted = accountTxns.sort((a, b) => 
          new Date(a.date).getTime() - new Date(b.date).getTime()
        );

        let balance = 0;
        const rows: LedgerRow[] = sorted.map(txn => {
          const isDebit = txn.category_account_id === account.id;
          const isCredit = txn.bank_account_id === account.id;

          // Debit increases Asset/Expense, decreases Liability/Equity/Income
          // Credit decreases Asset/Expense, increases Liability/Equity/Income
          // However, for simple display:
          // Debit is typically positive for Asset/Expense
          // Credit is negative for Asset/Expense
          // Let's stick to simple Debit/Credit columns and a running balance that respects the account type?
          // Or just simple: Debit adds, Credit subtracts?
          // Standard accounting:
          // Asset: Debit (+), Credit (-)
          // Liability: Debit (-), Credit (+)
          // Equity: Debit (-), Credit (+)
          // Income: Debit (-), Credit (+)
          // Expense: Debit (+), Credit (-)
          
          let impact = 0;
          if (['Asset', 'Expense'].includes(account.type)) {
             if (isDebit) impact = txn.amount;
             if (isCredit) impact = -txn.amount;
          } else {
             // Liability, Equity, Income -> Normal Credit Balance
             if (isDebit) impact = -txn.amount;
             if (isCredit) impact = txn.amount;
          }

          balance += impact;

          return {
            ...txn,
            debit: isDebit ? txn.amount : null,
            credit: isCredit ? txn.amount : null,
            running_balance: balance
          };
        });

        // We might want to reverse back to DESC for display (newest first)
        // providing the running balance is correct for that point in time
        setTransactions(rows.reverse());
      } catch (error) {
        console.error("Failed to load ledger:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [account]);

  const filteredData = useMemo(() => {
    return transactions.filter(t => 
      t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.reference && t.reference.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [transactions, searchQuery]);

  const formatCurrency = (val: number | null) => {
    if (val === null) return "-";
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: account.currency || 'PHP',
      minimumFractionDigits: 2
    }).format(val);
  };

  const columns: ColumnDef<LedgerRow>[] = [
    {
      header: "Date",
      accessorKey: "date",
      cell: (item) => <span className="text-gray-600">{format(new Date(item.date), 'MMM dd, yyyy')}</span>
    },
    {
      header: "Type",
      accessorKey: "status", // Using status as proxy for type, or maybe we need a type field
      cell: (item) => (
        <span className="capitalize px-2 py-1 bg-gray-100 rounded text-xs text-gray-600 font-medium">
          Transaction
        </span>
      )
    },
    {
      header: "Description / Payee",
      accessorKey: "description",
      cell: (item) => (
         <div className="flex flex-col">
            <span className="font-medium text-gray-900">{item.description}</span>
            {item.reference && <span className="text-xs text-gray-400">Ref: {item.reference}</span>}
         </div>
      )
    },
    {
      header: "Debit",
      align: "right",
      cell: (item) => (
        <span className={`font-mono ${item.debit ? 'text-gray-900' : 'text-gray-300'}`}>
          {formatCurrency(item.debit)}
        </span>
      )
    },
    {
      header: "Credit",
      align: "right",
      cell: (item) => (
        <span className={`font-mono ${item.credit ? 'text-gray-900' : 'text-gray-300'}`}>
          {formatCurrency(item.credit)}
        </span>
      )
    },
    {
      header: "Balance",
      align: "right",
      cell: (item) => (
        <span className="font-mono font-medium text-[#12332B]">
          {formatCurrency(item.running_balance)}
        </span>
      )
    }
  ];

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="px-8 py-6 border-b border-[#E5E9F0]">
        <div className="flex items-center gap-4 mb-6">
          <button 
            onClick={onBack}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-[#12332B] tracking-tight flex items-center gap-3">
              {account.name}
              <span className={`text-sm font-normal px-2.5 py-0.5 rounded-full 
                ${['Asset', 'Expense'].includes(account.type) ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                {account.type}
              </span>
            </h1>
            <p className="text-[#667085] text-sm mt-1 font-mono">
              Code: {account.code || "N/A"} • Currency: {account.currency}
            </p>
          </div>
          <div className="ml-auto flex items-end flex-col">
             <span className="text-sm text-gray-500">Current Balance</span>
             <span className="text-3xl font-bold text-[#12332B] tracking-tight font-mono">
                {formatCurrency(account.balance)}
             </span>
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex items-center justify-between gap-4">
           <div className="flex items-center gap-2 flex-1">
              <div className="relative w-full max-w-sm">
                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                 <input
                   type="text"
                   placeholder="Search transactions..."
                   value={searchQuery}
                   onChange={(e) => setSearchQuery(e.target.value)}
                   className="w-full pl-10 pr-4 py-2 bg-white border border-[#E5E9F0] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0F766E]/20 focus:border-[#0F766E] transition-all placeholder:text-gray-400"
                 />
              </div>
           </div>
           <div className="flex gap-2">
              <button className="h-9 px-3 bg-white border border-[#E5E9F0] text-[#344054] rounded-lg font-medium text-sm hover:bg-gray-50 transition-colors flex items-center gap-2">
                 <Filter size={16} />
                 Filter
              </button>
              <button className="h-9 px-3 bg-white border border-[#E5E9F0] text-[#344054] rounded-lg font-medium text-sm hover:bg-gray-50 transition-colors flex items-center gap-2">
                 <Download size={16} />
                 Export
              </button>
           </div>
        </div>
      </div>

      {/* Ledger Table */}
      <div className="flex-1 overflow-auto p-6">
        <DataTable
          data={filteredData}
          columns={columns}
          isLoading={loading}
          emptyMessage="There are no transactions matching the selected criteria"
          renderTableOnEmpty={true}
          rowClassName={() => "hover:bg-gray-50"}
        />
      </div>
    </div>
  );
}