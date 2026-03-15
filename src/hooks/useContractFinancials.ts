/**
 * useContractFinancials
 *
 * Aggregated financial data hook for contracts — mirrors useProjectFinancials
 * but sources data from the contract's linked booking IDs instead of a
 * project number.
 *
 * Returns the same `FinancialData` interface so that all downstream shared
 * components (ProjectFinancialOverview, UnifiedBillingsTab, UnifiedInvoicesTab,
 * UnifiedCollectionsTab) work unchanged.
 *
 * Key difference from useProjectFinancials:
 *   - Accepts `contractQuoteNumber` (used as the "project number" key for
 *     invoices and collections, since those APIs key by project_number).
 *   - Accepts `linkedBookingIds` for client-side filtering of billing items
 *     and expenses.
 *   - No quotation virtual-item merge (contracts don't have selling_price
 *     categories in the same way projects do).
 *
 * @see /docs/blueprints/CONTRACT_PARITY_BLUEPRINT.md — Phase 1, Task 1.2
 * @see /hooks/useProjectFinancials.ts — Reference pattern
 */

import { useState, useEffect, useCallback } from "react";
import { supabase } from "../utils/supabase/client";
import { toast } from "../components/ui/toast-utils";
import {
  calculateFinancialTotals,
  mergeBillableExpenses,
  type FinancialTotals,
} from "../utils/financialCalculations";
import type { FinancialData } from "./useProjectFinancials";

/**
 * @param contractQuoteNumber  The contract's quote_number (e.g., "CQ25060001").
 *   Used as the keying value for invoices and collections APIs.
 * @param linkedBookingIds  Array of booking IDs linked to this contract.
 *   Used for client-side filtering of billing items and expenses.
 * @param contractId  Optional contract ID for fetching the quotation data
 *   (used for virtual item merge if applicable).
 */
export function useContractFinancials(
  contractQuoteNumber: string,
  linkedBookingIds: string[] = [],
  contractId?: string
): FinancialData {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [billingItems, setBillingItems] = useState<any[]>([]);
  const [collections, setCollections] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Stable key for dependency tracking
  const bookingIdsKey = JSON.stringify(
    linkedBookingIds.filter(Boolean).sort()
  );

  const fetchFinancials = useCallback(async () => {
    if (!contractQuoteNumber) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);

      // Parallel fetch — same 4 tables as useProjectFinancials
      const [
        { data: invoiceRows, error: invoiceErr },
        { data: billingItemRows, error: billingErr },
        { data: evoucherRows, error: evoucherErr },
        { data: collectionRows, error: collectionErr },
      ] = await Promise.all([
        // 1. Invoices — keyed by projectNumber (we use contractQuoteNumber)
        supabase
          .from("invoices")
          .select("*")
          .eq("project_number", contractQuoteNumber),
        // 2. Billing Items — fetch all, filter client-side
        supabase.from("billing_line_items").select("*"),
        // 3. Expenses — fetch all e-vouchers, filter client-side
        supabase.from("evouchers").select("*"),
        // 4. Collections — keyed by project_number
        supabase
          .from("collections")
          .select("*")
          .eq("project_number", contractQuoteNumber),
      ]);

      // --- Process Invoices ---
      if (!invoiceErr && invoiceRows) {
        setInvoices(
          invoiceRows.filter((inv: any) => {
            const status = (inv.status || "").toLowerCase();
            const paymentStatus = (inv.payment_status || "").toLowerCase();
            return (
              ["draft", "posted", "approved", "paid", "open", "partial"].includes(
                status
              ) ||
              ["paid", "partial"].includes(paymentStatus)
            );
          })
        );
      }

      // --- Process Billing Items (client-side filtering by booking IDs) ---
      const parsedBookingIds = JSON.parse(bookingIdsKey) as string[];
      const validIds = new Set([contractQuoteNumber, ...parsedBookingIds]);

      if (!billingErr && billingItemRows) {
        const relevantItems = billingItemRows.filter(
          (item: any) => {
            if (item.project_number === contractQuoteNumber) return true;
            if (item.booking_id && validIds.has(item.booking_id)) return true;
            return false;
          }
        );
        setBillingItems(relevantItems);
      }

      // --- Process Expenses ---
      let relevantExpenses: any[] = [];
      if (!evoucherErr && evoucherRows) {
        relevantExpenses = evoucherRows
          .filter((ev: any) => {
            const isRelevant =
              validIds.has(ev.project_number) ||
              validIds.has(ev.booking_id);
            if (!isRelevant) return false;
            const type = (ev.transaction_type || "").toLowerCase();
            return type === "expense" || type === "budget_request";
          })
          .map((ev: any) => ({
            id: ev.id,
            evoucher_id: ev.id,
            created_at: ev.created_at || ev.request_date,
            description: ev.purpose || ev.description,
            amount: ev.total_amount || ev.amount || 0,
            total_amount: ev.total_amount || ev.amount || 0,
            currency: ev.currency || "PHP",
            status: ev.status,
            expense_category: ev.expense_category,
            is_billable: ev.is_billable,
            project_number: ev.project_number,
            booking_id: ev.booking_id,
            vendor_name: ev.vendor_name,
            payment_status:
              (ev.status || "").toLowerCase() === "paid" ? "paid" : "unpaid",
          }));

        setExpenses(
          relevantExpenses.filter((e: any) =>
            ["approved", "posted", "paid", "partial"].includes(
              (e.status || "").toLowerCase()
            )
          )
        );
      }

      // Merge billable expenses into billing items
      if (!billingErr && billingItemRows) {
        setBillingItems((prev) => mergeBillableExpenses(prev, relevantExpenses));
      }

      // --- Process Collections ---
      if (!collectionErr && collectionRows) {
        setCollections(collectionRows);
      }
    } catch (error) {
      console.error("Error fetching contract financials:", error);
      toast.error("Failed to load contract financial data");
    } finally {
      setIsLoading(false);
    }
  }, [contractQuoteNumber, bookingIdsKey, contractId]);

  useEffect(() => {
    fetchFinancials();
  }, [fetchFinancials]);

  // Calculate totals using the same shared function as useProjectFinancials
  const totals: FinancialTotals = calculateFinancialTotals(
    invoices,
    billingItems,
    expenses,
    collections
  );

  return {
    invoices,
    billingItems,
    expenses,
    collections,
    isLoading,
    refresh: fetchFinancials,
    totals,
  };
}