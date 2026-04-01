import { useState, useEffect, useCallback } from "react";
import { supabase } from "../../utils/supabase/client";
import { TrendingUp, Scale, ChevronLeft, ChevronRight, RefreshCw, Loader2 } from "lucide-react";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

type Tab = "income_statement" | "balance_sheet";

interface JournalLine {
  account_id: string;
  account_name: string;
  account_code: string;
  debit: number;
  credit: number;
}

interface AccountBalance {
  id: string;
  name: string;
  code: string;
  type: string;
  sub_type: string;
  category: string;
  net_balance: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

const php = (n: number) =>
  new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" }).format(n);

function groupBy<T>(arr: T[], key: keyof T): Map<string, T[]> {
  return arr.reduce((m, item) => {
    const k = String(item[key]);
    m.set(k, [...(m.get(k) ?? []), item]);
    return m;
  }, new Map<string, T[]>());
}

/**
 * Fetches all posted journal entries within a date range (or cumulatively up to
 * `to` for balance sheet), joins against the accounts table for type metadata,
 * and returns per-account net balances.
 */
async function fetchBalances(
  from: string,
  to: string,
  cumulative: boolean
): Promise<AccountBalance[]> {
  let q = supabase
    .from("journal_entries")
    .select("lines")
    .eq("status", "posted");

  q = cumulative ? q.lte("entry_date", to) : q.gte("entry_date", from).lte("entry_date", to);

  const { data: entries } = await q;
  if (!entries?.length) return [];

  // Aggregate debit/credit per account_id from JSONB lines
  const totals = new Map<string, { debit: number; credit: number; name: string; code: string }>();
  for (const entry of entries) {
    for (const line of ((entry.lines ?? []) as JournalLine[])) {
      const prev = totals.get(line.account_id) ?? {
        debit: 0, credit: 0, name: line.account_name, code: line.account_code,
      };
      prev.debit += Number(line.debit) || 0;
      prev.credit += Number(line.credit) || 0;
      totals.set(line.account_id, prev);
    }
  }
  if (!totals.size) return [];

  const { data: accounts } = await supabase
    .from("accounts")
    .select("id, type, sub_type, category")
    .in("id", Array.from(totals.keys()));

  if (!accounts?.length) return [];

  return accounts.map((acct) => {
    const agg = totals.get(acct.id)!;
    // Debit-normal: Asset, Expense. Credit-normal: Revenue, Liability, Equity
    const isDebitNormal = acct.type === "Asset" || acct.type === "Expense";
    return {
      id: acct.id,
      name: agg.name,
      code: agg.code,
      type: acct.type,
      sub_type: acct.sub_type ?? "",
      category: acct.category ?? "",
      net_balance: isDebitNormal ? agg.debit - agg.credit : agg.credit - agg.debit,
    };
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Display primitives
// ─────────────────────────────────────────────────────────────────────────────

function SectionHeader({ label }: { label: string }) {
  return (
    <div className="px-6 pt-5 pb-2">
      <span className="text-[11px] font-semibold tracking-widest uppercase text-[#0F766E]">
        {label}
      </span>
    </div>
  );
}

function CategoryLabel({ label }: { label: string }) {
  return (
    <div className="px-6 pt-3 pb-1">
      <span className="text-[11px] font-medium text-[#667085] uppercase tracking-wider">
        {label}
      </span>
    </div>
  );
}

function AccountRow({ name, code, amount }: { name: string; code: string; amount: number }) {
  return (
    <div className="flex items-center justify-between px-6 py-[5px] hover:bg-[#F9FAFB]">
      <div className="flex items-center gap-2 pl-4">
        <span className="text-[11px] text-[#667085] font-mono tabular-nums w-10 shrink-0">{code}</span>
        <span className="text-[13px] text-[#12332B]">{name}</span>
      </div>
      <span className={`text-[13px] tabular-nums ${amount < 0 ? "text-red-600" : "text-[#12332B]"}`}>
        {amount < 0 ? `(${php(Math.abs(amount))})` : php(amount)}
      </span>
    </div>
  );
}

function SubtotalRow({ label, amount }: { label: string; amount: number }) {
  return (
    <div className="flex items-center justify-between px-6 py-2.5 border-t border-[#E5E9F0] bg-[#F9FAFB] mt-1">
      <span className="text-[12px] font-semibold text-[#12332B]">{label}</span>
      <span className={`text-[13px] font-semibold tabular-nums ${amount < 0 ? "text-red-600" : "text-[#12332B]"}`}>
        {amount < 0 ? `(${php(Math.abs(amount))})` : php(amount)}
      </span>
    </div>
  );
}

function TotalRow({
  label, amount, highlight = false, double = false,
}: {
  label: string; amount: number; highlight?: boolean; double?: boolean;
}) {
  return (
    <div className={`flex items-center justify-between px-6 py-3.5 ${double ? "border-t-4 border-double border-[#12332B]" : "border-t-2 border-[#12332B]"} ${highlight ? "bg-[#F7FAF8]" : ""}`}>
      <span className="text-[13px] font-bold text-[#12332B] tracking-wide uppercase">
        {label}
      </span>
      <span className={`text-[14px] font-bold tabular-nums ${amount < 0 ? "text-red-600" : "text-[#12332B]"}`}>
        {amount < 0 ? `(${php(Math.abs(amount))})` : php(amount)}
      </span>
    </div>
  );
}

function ProfitRow({ label, amount }: { label: string; amount: number }) {
  const positive = amount >= 0;
  return (
    <div className={`flex items-center justify-between px-6 py-4 border-t-2 border-[#12332B] ${positive ? "bg-[#F0FDF9]" : "bg-red-50"}`}>
      <span className="text-[14px] font-bold text-[#12332B] tracking-wide uppercase">{label}</span>
      <span className={`text-[16px] font-bold tabular-nums ${positive ? "text-[#0F766E]" : "text-red-600"}`}>
        {amount < 0 ? `(${php(Math.abs(amount))})` : php(amount)}
      </span>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="px-6 py-16 text-center">
      <p className="text-[13px] text-[#667085]">{message}</p>
      <p className="text-[12px] text-[#667085] mt-1 opacity-70">
        Post journal entries via Invoices, Collections, or E-Vouchers to see data here.
      </p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Income Statement
// ─────────────────────────────────────────────────────────────────────────────

function IncomeStatement({ balances, period }: { balances: AccountBalance[]; period: string }) {
  const revenue = balances.filter((a) => a.type === "Revenue");
  const cos = balances.filter((a) => a.type === "Expense" && a.sub_type === "Cost of Services");
  const opex = balances.filter((a) => a.type === "Expense" && a.sub_type === "Operating Expense");
  const other = balances.filter(
    (a) => a.type === "Expense" && a.sub_type !== "Cost of Services" && a.sub_type !== "Operating Expense"
  );

  const totalRevenue = revenue.reduce((s, a) => s + a.net_balance, 0);
  const totalCos = cos.reduce((s, a) => s + a.net_balance, 0);
  const grossProfit = totalRevenue - totalCos;
  const totalOpex = opex.reduce((s, a) => s + a.net_balance, 0);
  const totalOther = other.reduce((s, a) => s + a.net_balance, 0);
  const netIncome = grossProfit - totalOpex - totalOther;

  const opexByCategory = groupBy(opex, "category");

  const hasData = balances.some((a) => a.type === "Revenue" || a.type === "Expense");
  if (!hasData) {
    return <EmptyState message={`No revenue or expense entries found for ${period}.`} />;
  }

  return (
    <div>
      {/* Statement heading */}
      <div className="px-6 pt-6 pb-4 text-center border-b border-[#E5E9F0]">
        <p className="text-[10px] font-bold tracking-widest uppercase text-[#667085]">
          Income Statement
        </p>
        <p className="text-[12px] text-[#667085] mt-0.5">For the period of {period}</p>
      </div>

      {/* Revenue */}
      <div className="border-b border-[#E5E9F0]">
        <SectionHeader label="Revenue" />
        {revenue.length === 0 ? (
          <p className="px-10 pb-3 text-[12px] text-[#667085] italic">No revenue entries</p>
        ) : (
          revenue.map((a) => <AccountRow key={a.id} name={a.name} code={a.code} amount={a.net_balance} />)
        )}
        <SubtotalRow label="Total Revenue" amount={totalRevenue} />
      </div>

      {/* Cost of Services */}
      {cos.length > 0 && (
        <div className="border-b border-[#E5E9F0]">
          <SectionHeader label="Cost of Services" />
          {cos.map((a) => <AccountRow key={a.id} name={a.name} code={a.code} amount={a.net_balance} />)}
          <SubtotalRow label="Total Cost of Services" amount={totalCos} />
        </div>
      )}

      {/* Gross Profit */}
      <TotalRow label="Gross Profit" amount={grossProfit} highlight />

      {/* Operating Expenses */}
      {opex.length > 0 && (
        <div className="border-b border-[#E5E9F0]">
          <SectionHeader label="Operating Expenses" />
          {Array.from(opexByCategory.entries()).map(([category, accounts]) => (
            <div key={category}>
              <CategoryLabel label={category} />
              {accounts.map((a) => <AccountRow key={a.id} name={a.name} code={a.code} amount={a.net_balance} />)}
            </div>
          ))}
          <SubtotalRow label="Total Operating Expenses" amount={totalOpex} />
        </div>
      )}

      {/* Other Expenses */}
      {other.length > 0 && (
        <div className="border-b border-[#E5E9F0]">
          <SectionHeader label="Other Expenses" />
          {other.map((a) => <AccountRow key={a.id} name={a.name} code={a.code} amount={a.net_balance} />)}
          <SubtotalRow label="Total Other Expenses" amount={totalOther} />
        </div>
      )}

      {/* Net Income */}
      <ProfitRow label="Net Income" amount={netIncome} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Balance Sheet
// ─────────────────────────────────────────────────────────────────────────────

function BalanceSheet({ balances, asOf }: { balances: AccountBalance[]; asOf: string }) {
  const assets = balances.filter((a) => a.type === "Asset");
  const liabilities = balances.filter((a) => a.type === "Liability");
  const equity = balances.filter((a) => a.type === "Equity");

  // Roll net income (Revenue - Expenses) into equity as Current Year Earnings
  const totalRevenue = balances.filter((a) => a.type === "Revenue").reduce((s, a) => s + a.net_balance, 0);
  const totalExpenses = balances.filter((a) => a.type === "Expense").reduce((s, a) => s + a.net_balance, 0);
  const currentYearEarnings = totalRevenue - totalExpenses;

  const assetsBySub = groupBy(assets, "sub_type");
  const liabBySub = groupBy(liabilities, "sub_type");

  const totalAssets = assets.reduce((s, a) => s + a.net_balance, 0);
  const totalLiabilities = liabilities.reduce((s, a) => s + a.net_balance, 0);
  const totalEquity = equity.reduce((s, a) => s + a.net_balance, 0) + currentYearEarnings;
  const totalLiabEquity = totalLiabilities + totalEquity;

  const hasData = balances.length > 0 || currentYearEarnings !== 0;
  if (!hasData) {
    return <EmptyState message={`No balance sheet entries found as of ${asOf}.`} />;
  }

  return (
    <div>
      {/* Statement heading */}
      <div className="px-6 pt-6 pb-4 text-center border-b border-[#E5E9F0]">
        <p className="text-[10px] font-bold tracking-widest uppercase text-[#667085]">
          Balance Sheet
        </p>
        <p className="text-[12px] text-[#667085] mt-0.5">As of {asOf}</p>
      </div>

      {/* Assets */}
      <div className="border-b border-[#E5E9F0]">
        <SectionHeader label="Assets" />
        {Array.from(assetsBySub.entries()).map(([subType, accounts]) => {
          const subTotal = accounts.reduce((s, a) => s + a.net_balance, 0);
          return (
            <div key={subType}>
              <CategoryLabel label={subType} />
              {accounts.map((a) => <AccountRow key={a.id} name={a.name} code={a.code} amount={a.net_balance} />)}
              <SubtotalRow label={`Total ${subType}`} amount={subTotal} />
            </div>
          );
        })}
        <TotalRow label="Total Assets" amount={totalAssets} highlight />
      </div>

      {/* Liabilities */}
      <div className="border-b border-[#E5E9F0]">
        <SectionHeader label="Liabilities" />
        {Array.from(liabBySub.entries()).map(([subType, accounts]) => {
          const subTotal = accounts.reduce((s, a) => s + a.net_balance, 0);
          return (
            <div key={subType}>
              <CategoryLabel label={subType} />
              {accounts.map((a) => <AccountRow key={a.id} name={a.name} code={a.code} amount={a.net_balance} />)}
              <SubtotalRow label={`Total ${subType}`} amount={subTotal} />
            </div>
          );
        })}
        <TotalRow label="Total Liabilities" amount={totalLiabilities} />
      </div>

      {/* Equity */}
      <div className="border-b border-[#E5E9F0]">
        <SectionHeader label="Equity" />
        {equity.map((a) => <AccountRow key={a.id} name={a.name} code={a.code} amount={a.net_balance} />)}
        {currentYearEarnings !== 0 && (
          <AccountRow name="Current Year Earnings" code="3200" amount={currentYearEarnings} />
        )}
        <TotalRow label="Total Equity" amount={totalEquity} />
      </div>

      {/* Total Liabilities & Equity */}
      <TotalRow label="Total Liabilities & Equity" amount={totalLiabEquity} highlight double />

      {/* Balance check note */}
      {Math.abs(totalAssets - totalLiabEquity) > 0.01 && (
        <div className="px-6 py-3 bg-amber-50 border-t border-amber-200">
          <p className="text-[11px] text-amber-700">
            Note: Balance sheet is out of balance by {php(Math.abs(totalAssets - totalLiabEquity))}.
            This typically indicates unposted period-closing entries.
          </p>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main page
// ─────────────────────────────────────────────────────────────────────────────

export function FinancialStatementsPage() {
  const now = new Date();
  const [tab, setTab] = useState<Tab>("income_statement");
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth()); // 0-indexed
  const [balances, setBalances] = useState<AccountBalance[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const from = new Date(year, month, 1).toISOString();
    const to = new Date(year, month + 1, 0, 23, 59, 59, 999).toISOString();
    const data = await fetchBalances(from, to, tab === "balance_sheet");
    setBalances(data);
    setLoading(false);
  }, [year, month, tab]);

  useEffect(() => { load(); }, [load]);

  const prevMonth = () => {
    if (month === 0) { setYear((y) => y - 1); setMonth(11); }
    else setMonth((m) => m - 1);
  };
  const nextMonth = () => {
    const nowDate = new Date();
    if (year === nowDate.getFullYear() && month === nowDate.getMonth()) return;
    if (month === 11) { setYear((y) => y + 1); setMonth(0); }
    else setMonth((m) => m + 1);
  };

  const periodLabel = `${MONTHS[month]} ${year}`;
  const asOfLabel = new Date(year, month + 1, 0).toLocaleDateString("en-PH", {
    year: "numeric", month: "long", day: "numeric",
  });
  const isCurrentMonth =
    year === now.getFullYear() && month === now.getMonth();

  return (
    <div className="flex flex-col h-full bg-[#F7FAF8]">
      {/* Page header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-[#E5E9F0] bg-white">
        <div>
          <h1 className="text-[20px] font-semibold text-[#12332B]">Financial Statements</h1>
          <p className="text-[12px] text-[#667085] mt-0.5">
            GL-derived from posted journal entries only
          </p>
        </div>
        <button
          onClick={load}
          className="flex items-center gap-1.5 px-3 py-1.5 border border-[#E5E9F0] rounded text-[12px] text-[#667085] hover:bg-[#F9FAFB] transition-colors"
        >
          <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {/* Controls bar */}
      <div className="flex items-center gap-4 px-6 py-3 border-b border-[#E5E9F0] bg-white">
        {/* Statement type tabs */}
        <div className="flex items-center gap-1 p-1 bg-[#F9FAFB] border border-[#E5E9F0] rounded-lg">
          <button
            onClick={() => setTab("income_statement")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-[12px] font-medium transition-colors ${
              tab === "income_statement"
                ? "bg-white text-[#12332B] border border-[#E5E9F0] shadow-none"
                : "text-[#667085] hover:text-[#12332B]"
            }`}
          >
            <TrendingUp size={13} />
            Income Statement
          </button>
          <button
            onClick={() => setTab("balance_sheet")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-[12px] font-medium transition-colors ${
              tab === "balance_sheet"
                ? "bg-white text-[#12332B] border border-[#E5E9F0] shadow-none"
                : "text-[#667085] hover:text-[#12332B]"
            }`}
          >
            <Scale size={13} />
            Balance Sheet
          </button>
        </div>

        {/* Period picker */}
        <div className="flex items-center gap-1 ml-auto">
          <button
            onClick={prevMonth}
            className="p-1.5 rounded hover:bg-[#F9FAFB] border border-transparent hover:border-[#E5E9F0] transition-colors"
          >
            <ChevronLeft size={14} className="text-[#667085]" />
          </button>
          <span className="text-[13px] font-medium text-[#12332B] min-w-[130px] text-center">
            {periodLabel}
          </span>
          <button
            onClick={nextMonth}
            disabled={isCurrentMonth}
            className="p-1.5 rounded hover:bg-[#F9FAFB] border border-transparent hover:border-[#E5E9F0] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronRight size={14} className="text-[#667085]" />
          </button>
        </div>

        {/* Context label */}
        <span className="text-[11px] text-[#667085]">
          {tab === "balance_sheet"
            ? `Cumulative as of ${asOfLabel}`
            : `Period: ${periodLabel}`}
        </span>
      </div>

      {/* Statement body */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-2xl mx-auto bg-white border border-[#E5E9F0] rounded-lg overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-20 text-[#667085]">
              <Loader2 size={16} className="animate-spin" />
              <span className="text-[13px]">Loading journal entries…</span>
            </div>
          ) : tab === "income_statement" ? (
            <IncomeStatement balances={balances} period={periodLabel} />
          ) : (
            <BalanceSheet balances={balances} asOf={asOfLabel} />
          )}
        </div>
      </div>
    </div>
  );
}
