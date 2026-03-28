import { useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../utils/supabase/client";
import { queryKeys } from "../lib/queryKeys";

export interface ReportsData {
  bookings: any[];
  projects: any[];
  billingItems: any[];
  invoices: any[];
  collections: any[];
  expenses: any[];
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

/** Only fetch records from the last 2 years */
function twoYearsAgo(): string {
  const d = new Date();
  d.setFullYear(d.getFullYear() - 2);
  return d.toISOString();
}

interface ReportsPayload {
  bookings: any[];
  projects: any[];
  billingItems: any[];
  invoices: any[];
  collections: any[];
  expenses: any[];
}

const EMPTY_PAYLOAD: ReportsPayload = {
  bookings: [],
  projects: [],
  billingItems: [],
  invoices: [],
  collections: [],
  expenses: [],
};

export function useReportsData(): ReportsData {
  const queryClient = useQueryClient();

  const queryFn = useCallback(async (): Promise<ReportsPayload> => {
    const cutoff = twoYearsAgo();

    const [
      { data: bk },
      { data: p },
      { data: b },
      { data: e },
      { data: i },
      { data: c },
    ] = await Promise.all([
      supabase
        .from("bookings")
        .select("id, booking_number, service_type, customer_name, project_id, status, created_at")
        .gte("created_at", cutoff)
        .order("created_at", { ascending: false }),
      supabase
        .from("projects")
        .select("*, customers(id, name)")
        .gte("created_at", cutoff),
      supabase
        .from("billing_line_items")
        .select("*")
        .gte("created_at", cutoff),
      supabase
        .from("evouchers")
        .select("*")
        .in("transaction_type", ["expense", "budget_request"])
        .in("status", ["approved", "posted", "paid", "partial"])
        .gte("created_at", cutoff),
      supabase
        .from("invoices")
        .select("*")
        .gte("created_at", cutoff),
      supabase
        .from("collections")
        .select("*")
        .gte("created_at", cutoff),
    ]);

    return {
      bookings: bk || [],
      projects: p || [],
      billingItems: b || [],
      invoices: i || [],
      collections: c || [],
      expenses: e || [],
    };
  }, []);

  const { data = EMPTY_PAYLOAD, isLoading } = useQuery({
    queryKey: queryKeys.financials.reportsData(),
    queryFn,
    staleTime: 30_000,
  });

  const refresh = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: queryKeys.financials.reportsData() });
  }, [queryClient]);

  return {
    bookings: data.bookings,
    projects: data.projects,
    billingItems: data.billingItems,
    invoices: data.invoices,
    collections: data.collections,
    expenses: data.expenses,
    isLoading,
    error: null,
    refresh,
  };
}
