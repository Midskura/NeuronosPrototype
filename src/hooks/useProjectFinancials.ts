import { useState, useEffect } from "react";
import { supabase } from "../utils/supabase/client";
import { toast } from "../components/ui/toast-utils";

export interface FinancialData {
  invoices: any[];
  billingItems: any[];
  expenses: any[];
  collections: any[];
  isLoading: boolean;
  refresh: () => Promise<void>;
  totals: FinancialTotals;
}

export function useProjectFinancials(
  projectNumber: string, 
  linkedBookings: any[] = [],
  quotationId?: string
): FinancialData {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [billingItems, setBillingItems] = useState<any[]>([]);
  const [collections, setCollections] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchFinancials = async () => {
    if (!projectNumber) {
      // No project number — can't fetch project-level data, but we still need
      // to fetch billing items (filtered by booking_id client-side).
      try {
        setIsLoading(true);
        const { data, error } = await supabase.from('billing_line_items').select('*');
        if (!error && data) {
          setBillingItems(data);
        }
      } catch (error) {
        console.error("Error fetching billing items (no projectNumber):", error);
      } finally {
        setIsLoading(false);
      }
      return;
    }
    
    try {
      setIsLoading(true);
      
      // Parallel fetch from Supabase tables
      const [
        { data: invoiceRows, error: invoiceErr },
        { data: billingItemRows, error: billingErr },
        { data: evoucherRows, error: evoucherErr },
        { data: collectionRows, error: collectionErr },
      ] = await Promise.all([
        supabase.from('invoices').select('*').eq('project_number', projectNumber),
        supabase.from('billing_line_items').select('*'),
        supabase.from('evouchers').select('*'),
        supabase.from('collections').select('*').eq('project_number', projectNumber),
      ]);

      // 5. Fetch Quotation (Optional)
      let quotationData = null;
      if (quotationId) {
        const { data: qData } = await supabase
          .from('quotations')
          .select('*')
          .eq('id', quotationId)
          .maybeSingle();
        quotationData = qData;
      }
      
      // Process Invoices
      if (!invoiceErr && invoiceRows) {
        setInvoices(invoiceRows.filter((b: any) => {
          const status = (b.status || "").toLowerCase();
          const paymentStatus = (b.payment_status || "").toLowerCase();
          return ["draft", "posted", "approved", "paid", "open", "partial"].includes(status) || 
                 ["paid", "partial"].includes(paymentStatus);
        }));
      }

      // Process Expenses
      let relevantExpenses: any[] = [];
      if (!evoucherErr && evoucherRows) {
         const allEVouchers = evoucherRows;
         
         // Create a Set of valid IDs (Project Number + All Linked Booking IDs)
         const validIds = new Set([
           projectNumber,
           ...(linkedBookings.map(b => b.bookingId))
         ]);

         // Filter for relevant expenses
         relevantExpenses = allEVouchers.filter((ev: any) => {
           const isRelevant = validIds.has(ev.project_number) || validIds.has(ev.booking_id);
           if (!isRelevant) return false;
           const type = (ev.transaction_type || "").toLowerCase();
           return type === "expense" || type === "budget_request";
         }).map((ev: any) => ({
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
           payment_status: (ev.status || "").toLowerCase() === 'paid' ? 'paid' : 'unpaid'
         }));

         setExpenses(relevantExpenses.filter((e: any) => 
           ["approved", "posted", "paid", "partial"].includes((e.status || "").toLowerCase())
         ));
      }
      
      // Process Billing Items (Client-side filtering for robustness)
      if (!billingErr && billingItemRows) {
          const allItems = billingItemRows;
          const validIds = new Set([
               projectNumber,
               ...(linkedBookings.map(b => b.bookingId))
          ]);
          
          let relevantBillingItems = allItems.filter((item: any) => {
              if (item.project_number === projectNumber) return true;
              if (item.booking_id && validIds.has(item.booking_id)) return true;
              return false;
          });
          
          // MERGE: Add Virtual Items from Quotation (Potential Revenue)
          if (quotationData) {
             const virtualItems = convertQuotationToVirtualItems(quotationData, projectNumber);
             relevantBillingItems = mergeVirtualItemsWithRealItems(relevantBillingItems, virtualItems);
          }

          // MERGE: Add billable expenses as Unbilled Revenue
          const allBillingItems = mergeBillableExpenses(relevantBillingItems, relevantExpenses);
          setBillingItems(allBillingItems);
      }
      
      if (!collectionErr && collectionRows) {
        setCollections(collectionRows);
      }
    } catch (error) {
      console.error("Error fetching financials:", error);
      toast.error("Failed to load financial data");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFinancials();
  }, [projectNumber, JSON.stringify(linkedBookings), quotationId]);

  // -- Calculations --
  const totals = calculateFinancialTotals(invoices, billingItems, expenses, collections);

  return {
    invoices,
    billingItems,
    expenses,
    collections,
    isLoading,
    refresh: fetchFinancials,
    totals
  };
}