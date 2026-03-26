import { useCallback, useMemo } from "react";
import { supabase } from "../utils/supabase/client";
import { useCachedFetch } from "./useNeuronCache";

export interface ProjectFinancialRow {
  projectNumber: string;
  projectDate: string;
  customerName: string;
  invoiceNumbers: string[];
  billingTotal: number;
  expensesTotal: number;
  adminCost: number;
  totalExpenses: number;
  collectedAmount: number;
  grossProfit: number;
}

export interface FinancialHealthSummary {
  totalBillings: number;
  totalExpenses: number;
  totalCollected: number;
  totalGrossProfit: number;
  projectCount: number;
}

/** Admin overhead percentage applied to direct costs */
export const ADMIN_COST_PCT = 0.03;

interface RpcRow {
  project_number: string;
  project_date: string;
  customer_name: string;
  invoice_numbers: string[] | null;
  billing_total: number;
  expenses_total: number;
  collected_amount: number;
  gross_profit: number;
}

export function useFinancialHealthReport(monthFilter?: string) {
  const fetcher = useCallback(async (): Promise<RpcRow[]> => {
    const { data, error } = await supabase.rpc("get_financial_health_summary", {
      p_month: monthFilter ?? null,
    });
    if (error) {
      console.error("Financial health RPC error:", error);
      return [];
    }
    return (data as RpcRow[]) || [];
  }, [monthFilter]);

  const { data: rpcRows, isLoading, refresh } = useCachedFetch<RpcRow[]>(
    `financial-health:${monthFilter ?? "all"}`,
    fetcher,
    [],
    { ttl: 300_000, deps: [monthFilter] } // 5-min TTL
  );

  const { rows, summary } = useMemo(() => {
    const computedRows: ProjectFinancialRow[] = rpcRows.map((row) => {
      const expensesTotal = Number(row.expenses_total) || 0;
      const adminCost = expensesTotal * ADMIN_COST_PCT;
      const totalExpenses = expensesTotal + adminCost;
      const billingTotal = Number(row.billing_total) || 0;

      return {
        projectNumber: row.project_number,
        projectDate: row.project_date || "",
        customerName: row.customer_name || "—",
        invoiceNumbers: row.invoice_numbers || [],
        billingTotal,
        expensesTotal,
        adminCost,
        totalExpenses,
        collectedAmount: Number(row.collected_amount) || 0,
        grossProfit: billingTotal - totalExpenses,
      };
    });

    const nextSummary: FinancialHealthSummary = {
      totalBillings: computedRows.reduce((sum, r) => sum + r.billingTotal, 0),
      totalExpenses: computedRows.reduce((sum, r) => sum + r.totalExpenses, 0),
      totalCollected: computedRows.reduce((sum, r) => sum + r.collectedAmount, 0),
      totalGrossProfit: computedRows.reduce((sum, r) => sum + r.grossProfit, 0),
      projectCount: computedRows.length,
    };

    return { rows: computedRows, summary: nextSummary };
  }, [rpcRows]);

  return { rows, summary, isLoading, refresh };
}
