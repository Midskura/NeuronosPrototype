// useReportsData — Shared data hook for the Reports module.
// Fetches all raw data streams in parallel via useCachedFetch (dedup + SWR).
// WHERE filters limit data to the last 2 years to avoid full-table scans.

import { useCallback } from "react";
import { supabase } from "../utils/supabase/client";
import { useCachedFetch } from "./useNeuronCache";

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
  const cutoff = twoYearsAgo();

  const fetcher = useCallback(async (): Promise<ReportsPayload> => {
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
  }, [cutoff]);

  const { data, isLoading, refresh } = useCachedFetch<ReportsPayload>(
    "reports-data",
    fetcher,
    EMPTY_PAYLOAD,
    { ttl: 300_000 } // 5-min TTL
  );

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
