import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "../utils/supabase/client";
import {
  filterBillingItemsForScope,
  filterInvoicesForScope,
  filterCollectionsForScope,
  mapEvoucherExpensesForScope,
} from "../utils/financialSelectors";
import { calculateFinancialTotals } from "../utils/financialCalculations";
import { isInScope } from "../components/accounting/aggregate/types";
import type { DateScope } from "../components/accounting/aggregate/types";

export interface BookingCashFlowRow {
  bookingId: string;
  bookingReference: string;
  serviceType: string;
  customerName: string;
  projectNumber: string | null;
  status: string;
  bookingDate: string;
  bookedCharges: number;
  invoicedAmount: number;
  collectedAmount: number;
  outstandingAmount: number;
  directCost: number;
  grossProfit: number;
  grossMargin: number;
  collectionRate: number;
}

export interface BookingCashFlowSummary {
  totalBookedCharges: number;
  totalInvoiced: number;
  totalCollected: number;
  totalOutstanding: number;
  totalDirectCost: number;
  totalGrossProfit: number;
  avgGrossMargin: number;
  bookingCount: number;
}

export function useBookingCashFlowReport(scope: DateScope) {
  const [bookings, setBookings] = useState<any[]>([]);
  const [billingItems, setBillingItems] = useState<any[]>([]);
  const [evouchers, setEvouchers] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [collections, setCollections] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    try {
      setIsLoading(true);

      // Limit data to last 2 years to avoid full-table scans
      const cutoff = new Date();
      cutoff.setFullYear(cutoff.getFullYear() - 2);
      const cutoffISO = cutoff.toISOString();

      const [
        { data: bookingRows },
        { data: billingRows },
        { data: evoucherRows },
        { data: invoiceRows },
        { data: collectionRows },
      ] = await Promise.all([
        supabase
          .from("bookings")
          .select("id, booking_number, service_type, customer_name, project_id, status, created_at")
          .gte("created_at", cutoffISO)
          .order("created_at", { ascending: false }),
        supabase.from("billing_line_items").select("*").gte("created_at", cutoffISO),
        supabase
          .from("evouchers")
          .select("*")
          .in("transaction_type", ["expense", "budget_request"])
          .in("status", ["approved", "posted", "paid", "partial"])
          .gte("created_at", cutoffISO),
        supabase.from("invoices").select("*").gte("created_at", cutoffISO),
        supabase.from("collections").select("*").gte("created_at", cutoffISO),
      ]);

      setBookings(bookingRows || []);
      setBillingItems(billingRows || []);
      setEvouchers(evoucherRows || []);
      setInvoices(invoiceRows || []);
      setCollections(collectionRows || []);
    } catch (error) {
      console.error("Error fetching booking cash flow data:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const { rows, summary } = useMemo(() => {
    const computedRows = bookings
      .filter((booking) => isInScope(booking.created_at, scope))
      .map((booking): BookingCashFlowRow | null => {
        const bookingId = booking.id as string;
        if (!bookingId) return null;

        // Scope all financial data to this booking using V2 selectors
        const scopedBillingItems = filterBillingItemsForScope(
          billingItems,
          [bookingId],
          bookingId
        );

        const scopedInvoices = filterInvoicesForScope(
          invoices,
          [bookingId],
          bookingId
        );

        const scopedInvoiceIds = scopedInvoices
          .map((inv: any) => inv.id as string)
          .filter(Boolean);

        const scopedCollections = filterCollectionsForScope(
          collections,
          scopedInvoiceIds,
          bookingId
        );

        const scopedExpenses = mapEvoucherExpensesForScope(
          evouchers,
          [bookingId],
          bookingId
        );

        const totals = calculateFinancialTotals(
          scopedInvoices,
          scopedBillingItems,
          scopedExpenses,
          scopedCollections
        );

        const collectionRate =
          totals.invoicedAmount > 0
            ? (totals.collectedAmount / totals.invoicedAmount) * 100
            : 0;

        return {
          bookingId,
          bookingReference: booking.booking_number || bookingId,
          serviceType: booking.service_type || "—",
          customerName: booking.customer_name || "—",
          projectNumber: booking.project_id || null,
          status: booking.status || "—",
          bookingDate: booking.created_at || "",
          bookedCharges: totals.bookedCharges,
          invoicedAmount: totals.invoicedAmount,
          collectedAmount: totals.collectedAmount,
          outstandingAmount: totals.outstandingAmount,
          directCost: totals.directCost,
          grossProfit: totals.grossProfit,
          grossMargin: totals.grossMargin,
          collectionRate,
        };
      })
      .filter((row): row is BookingCashFlowRow => row !== null)
      .sort((a, b) => new Date(b.bookingDate).getTime() - new Date(a.bookingDate).getTime());

    const totalBookedCharges = computedRows.reduce((s, r) => s + r.bookedCharges, 0);
    const totalInvoiced = computedRows.reduce((s, r) => s + r.invoicedAmount, 0);
    const totalCollected = computedRows.reduce((s, r) => s + r.collectedAmount, 0);
    const totalOutstanding = computedRows.reduce((s, r) => s + r.outstandingAmount, 0);
    const totalDirectCost = computedRows.reduce((s, r) => s + r.directCost, 0);
    const totalGrossProfit = computedRows.reduce((s, r) => s + r.grossProfit, 0);
    const avgGrossMargin =
      totalBookedCharges > 0 ? (totalGrossProfit / totalBookedCharges) * 100 : 0;

    const nextSummary: BookingCashFlowSummary = {
      totalBookedCharges,
      totalInvoiced,
      totalCollected,
      totalOutstanding,
      totalDirectCost,
      totalGrossProfit,
      avgGrossMargin,
      bookingCount: computedRows.length,
    };

    return { rows: computedRows, summary: nextSummary };
  }, [bookings, billingItems, evouchers, invoices, collections, scope]);

  return { rows, summary, isLoading, refresh: fetchAll };
}
