import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../utils/supabase/client";
import { queryKeys } from "../lib/queryKeys";

interface UseCRMActivitiesOptions {
  customerId?: string;
  contactId?: string;
  enabled?: boolean;
}

export function useCRMActivities({ customerId, contactId, enabled = true }: UseCRMActivitiesOptions = {}) {
  const queryClient = useQueryClient();

  const qKey = customerId
    ? queryKeys.crmActivities.forCustomer(customerId)
    : contactId
    ? queryKeys.crmActivities.forContact(contactId)
    : queryKeys.crmActivities.list();

  const { data: activities = [], isLoading } = useQuery({
    queryKey: qKey,
    queryFn: async () => {
      let query = supabase.from("crm_activities").select("*").order("created_at", { ascending: false });
      if (customerId) query = query.eq("customer_id", customerId);
      if (contactId) query = query.eq("contact_id", contactId);
      const { data, error } = await query;
      if (error) throw error;
      return data ?? [];
    },
    enabled,
    staleTime: 30_000,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: queryKeys.crmActivities.all() });
  return { activities, isLoading, invalidate };
}
