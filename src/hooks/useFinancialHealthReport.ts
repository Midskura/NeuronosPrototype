// useFinancialHealthReport — fetches all projects, billings, expenses, invoices, collections
// and groups them by project for the Financial Health / Sales Report page

import { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "../utils/supabase/client";

export interface ProjectFinancialRow {
  projectNumber: string;
  projectDate: string;
  customerName: string;
  invoiceNumbers: string[];
  billingTotal: number;
  expensesTotal: number;
  adminCost: number; // 3% of expenses
  totalExpenses: number; // expenses + admin cost
  collectedAmount: number;
  grossProfit: number; // billing total - total expenses
}

export interface FinancialHealthSummary {
  totalBillings: number;
  totalExpenses: number;
  totalCollected: number;
  totalGrossProfit: number;
  projectCount: number;
}

export function useFinancialHealthReport(monthFilter?: string) {
  const [projects, setProjects] = useState<any[]>([]);
  const [billingItems, setBillingItems] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [collections, setCollections] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    try {
      setIsLoading(true);
      const [
        { data: projRows },
        { data: billRows },
        { data: expRows },
        { data: invRows },
        { data: colRows },
      ] = await Promise.all([
        supabase.from("projects").select("*"),
        supabase.from("billing_line_items").select("*"),
        supabase.from("expenses").select("*"),
        supabase.from("invoices").select("*"),
        supabase.from("collections").select("*"),
      ]);

      setProjects(projRows || []);
      setBillingItems(billRows || []);
      setExpenses(expRows || []);
      setInvoices(invRows || []);
      setCollections(colRows || []);
    } catch (error) {
      console.error("Error fetching financial health data:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // Group and calculate per-project financials
  const { rows, summary } = useMemo(() => {
    // Build lookup maps by project_number
    const billingsByProject = new Map<string, any[]>();
    billingItems.forEach((b) => {
      const pn = b.project_number || "";
      if (!pn) return;
      if (!billingsByProject.has(pn)) billingsByProject.set(pn, []);
      billingsByProject.get(pn)!.push(b);
    });

    const expensesByProject = new Map<string, any[]>();
    expenses.forEach((e) => {
      const pn = e.project_number || "";
      if (!pn) return;
      if (!expensesByProject.has(pn)) expensesByProject.set(pn, []);
      expensesByProject.get(pn)!.push(e);
    });

    const invoicesByProject = new Map<string, any[]>();
    invoices.forEach((inv) => {
      const pn = inv.project_number || inv.projectNumber || "";
      if (!pn) return;
      if (!invoicesByProject.has(pn)) invoicesByProject.set(pn, []);
      invoicesByProject.get(pn)!.push(inv);
    });

    const collectionsByProject = new Map<string, any[]>();
    collections.forEach((col) => {
      const pn = col.project_number || "";
      if (!pn) return;
      if (!collectionsByProject.has(pn)) collectionsByProject.set(pn, []);
      collectionsByProject.get(pn)!.push(col);
    });

    // Build rows from projects
    let allRows: ProjectFinancialRow[] = projects.map((p) => {
      const pn = p.project_number || "";
      const projBillings = billingsByProject.get(pn) || [];
      const projExpenses = expensesByProject.get(pn) || [];
      const projInvoices = invoicesByProject.get(pn) || [];
      const projCollections = collectionsByProject.get(pn) || [];

      const billingTotal = projBillings.reduce(
        (sum: number, b: any) => sum + (Number(b.amount) || 0),
        0
      );
      const expensesTotal = projExpenses.reduce(
        (sum: number, e: any) => sum + (Number(e.total_amount) || Number(e.amount) || 0),
        0
      );
      const adminCost = expensesTotal * 0.03;
      const totalExpenses = expensesTotal + adminCost;
      const collectedAmount = projCollections.reduce(
        (sum: number, c: any) => sum + (Number(c.amount) || 0),
        0
      );
      const grossProfit = billingTotal - totalExpenses;

      const invoiceNumbers = projInvoices
        .map((inv: any) => inv.invoice_number)
        .filter(Boolean);

      return {
        projectNumber: pn,
        projectDate: p.created_at || "",
        customerName: p.customer_name || "—",
        invoiceNumbers,
        billingTotal,
        expensesTotal,
        adminCost,
        totalExpenses,
        collectedAmount,
        grossProfit,
      };
    });

    // Apply month filter
    if (monthFilter) {
      // monthFilter format: "YYYY-MM"
      allRows = allRows.filter((r) => {
        if (!r.projectDate) return false;
        const d = new Date(r.projectDate);
        const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        return ym === monthFilter;
      });
    }

    // Sort by date descending
    allRows.sort((a, b) => {
      const da = new Date(b.projectDate).getTime() || 0;
      const db = new Date(a.projectDate).getTime() || 0;
      return da - db;
    });

    // Summary
    const summary: FinancialHealthSummary = {
      totalBillings: allRows.reduce((s, r) => s + r.billingTotal, 0),
      totalExpenses: allRows.reduce((s, r) => s + r.totalExpenses, 0),
      totalCollected: allRows.reduce((s, r) => s + r.collectedAmount, 0),
      totalGrossProfit: allRows.reduce((s, r) => s + r.grossProfit, 0),
      projectCount: allRows.length,
    };

    return { rows: allRows, summary };
  }, [projects, billingItems, expenses, invoices, collections, monthFilter]);

  return { rows, summary, isLoading, refresh: fetchAll };
}