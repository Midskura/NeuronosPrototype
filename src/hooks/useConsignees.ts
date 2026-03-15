import { useState, useEffect, useCallback } from "react";
import type { Consignee } from "../types/bd";
import { supabase } from "../utils/supabase/client";

export function useConsignees(customerId?: string) {
  const [consignees, setConsignees] = useState<Consignee[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchConsignees = useCallback(async () => {
    if (!customerId) {
      setConsignees([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fetchErr } = await supabase
        .from('consignees')
        .select('*')
        .eq('customer_id', customerId);

      if (fetchErr) {
        setError(fetchErr.message);
        setConsignees([]);
      } else {
        setConsignees(data || []);
      }
    } catch (err) {
      console.warn("Consignees fetch failed:", err);
      setConsignees([]);
    } finally {
      setIsLoading(false);
    }
  }, [customerId]);

  useEffect(() => {
    fetchConsignees();
  }, [fetchConsignees]);

  const createConsignee = useCallback(
    async (data: Partial<Consignee>) => {
      if (!customerId) throw new Error("No customer_id");

      const newConsignee = {
        ...data,
        customer_id: customerId,
        id: `consignee-${Date.now()}`,
        created_at: new Date().toISOString(),
      };

      const { data: created, error } = await supabase
        .from('consignees')
        .insert(newConsignee)
        .select()
        .single();

      if (error) throw new Error(error.message);

      await fetchConsignees();
      return created as Consignee;
    },
    [customerId, fetchConsignees]
  );

  const updateConsignee = useCallback(
    async (id: string, data: Partial<Consignee>) => {
      const { data: updated, error } = await supabase
        .from('consignees')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw new Error(error.message);

      await fetchConsignees();
      return updated as Consignee;
    },
    [fetchConsignees]
  );

  const deleteConsignee = useCallback(
    async (id: string) => {
      const { error } = await supabase
        .from('consignees')
        .delete()
        .eq('id', id);

      if (error) throw new Error(error.message);

      await fetchConsignees();
    },
    [fetchConsignees]
  );

  return {
    consignees,
    isLoading,
    error,
    fetchConsignees,
    createConsignee,
    updateConsignee,
    deleteConsignee,
  };
}