import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "../utils/supabase/client";
import type { Project, QuotationNew } from "../types/pricing";
import {
  calculateFinancialTotals,
  mergeBillableExpenses,
  FinancialTotals,
  convertQuotationToVirtualItems,
  mergeVirtualItemsWithRealItems,
} from "../utils/financialCalculations";
import {
  collectLinkedBookingIds,
  filterBillingItemsForScope,
  filterCollectionsForScope,
  filterInvoicesForScope,
  mapEvoucherExpensesForScope,
} from "../utils/financialSelectors";
import { queryKeys } from "../lib/queryKeys";

export interface ProjectFinancials extends FinancialTotals {
  income: number;
  costs: number;
  margin?: number;
}

interface FinancialsPayload {
  invoicesData: any[];
  expensesData: any[];
  billingItemsData: any[];
  collectionsData: any[];
  quotationsData: any[];
}

const EMPTY_PAYLOAD: FinancialsPayload = {
  invoicesData: [],
  expensesData: [],
  billingItemsData: [],
  collectionsData: [],
  quotationsData: [],
};

async function fetchFinancialsPayload(): Promise<FinancialsPayload> {
  const [
    { data: invoices, error: e1 },
    { data: expenses, error: e2 },
    { data: billingItems, error: e3 },
    { data: collections, error: e4 },
    { data: quotations, error: e5 },
  ] = await Promise.all([
    supabase.from("invoices").select("*"),
    supabase.from("evouchers").select("*"),
    supabase.from("billing_line_items").select("*"),
    supabase.from("collections").select("*"),
    supabase.from("quotations").select("*"),
  ]);

  if (e1) throw new Error(`Failed to fetch invoices: ${e1.message}`);
  if (e2) throw new Error(`Failed to fetch evouchers: ${e2.message}`);
  if (e3) throw new Error(`Failed to fetch billing_line_items: ${e3.message}`);
  if (e4) throw new Error(`Failed to fetch collections: ${e4.message}`);
  if (e5) throw new Error(`Failed to fetch quotations: ${e5.message}`);

  return {
    invoicesData: invoices || [],
    expensesData: expenses || [],
    billingItemsData: billingItems || [],
    collectionsData: collections || [],
    quotationsData: quotations || [],
  };
}

export function useProjectsFinancialsMap(projects: Project[]) {
  const [financialsMap, setFinancialsMap] = useState<Record<string, ProjectFinancials>>({});

  const { data = EMPTY_PAYLOAD, isLoading } = useQuery({
    queryKey: queryKeys.financials.projectsMap(),
    queryFn: fetchFinancialsPayload,
    staleTime: 30_000,
    enabled: projects.length > 0,
  });

  const { invoicesData, expensesData, billingItemsData, collectionsData, quotationsData } = data;

  useEffect(() => {
    if (isLoading || projects.length === 0) return;

    const quotationsMap = new Map<string, QuotationNew>();
    if (Array.isArray(quotationsData)) {
      quotationsData.forEach((quotation: QuotationNew) => {
        quotationsMap.set(quotation.id, quotation);
      });
    }

    const nextMap: Record<string, ProjectFinancials> = {};

    projects.forEach((project) => {
      const linkedBookingIds = collectLinkedBookingIds(project.linkedBookings || []);
      const containerReference = project.project_number;

      const projectInvoices = filterInvoicesForScope(
        invoicesData,
        linkedBookingIds,
        containerReference,
      );

      const projectExpenses = mapEvoucherExpensesForScope(
        expensesData,
        linkedBookingIds,
        containerReference,
      );

      let projectBillingItems = filterBillingItemsForScope(
        billingItemsData,
        linkedBookingIds,
        containerReference,
      );

      const linkedQuotation = quotationsMap.get(project.quotation_id);
      if (linkedQuotation) {
        const virtualItems = convertQuotationToVirtualItems(linkedQuotation as any, containerReference);
        projectBillingItems = mergeVirtualItemsWithRealItems(projectBillingItems, virtualItems);
      }

      projectBillingItems = mergeBillableExpenses(projectBillingItems, projectExpenses);

      const projectCollections = filterCollectionsForScope(
        collectionsData,
        projectInvoices.map((invoice: any) => invoice.id).filter(Boolean),
        containerReference,
      );

      const totals = calculateFinancialTotals(
        projectInvoices,
        projectBillingItems,
        projectExpenses,
        projectCollections,
      );

      nextMap[project.project_number] = {
        ...totals,
        income: totals.bookedCharges,
        costs: totals.directCost,
        margin: totals.grossMargin,
      };
    });

    setFinancialsMap(nextMap);
  }, [projects, invoicesData, expensesData, billingItemsData, collectionsData, quotationsData, isLoading]);

  return { financialsMap, isLoading };
}
