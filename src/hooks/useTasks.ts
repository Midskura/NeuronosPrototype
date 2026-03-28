import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../utils/supabase/client";
import { queryKeys } from "../lib/queryKeys";

interface UseTasksOptions {
  customerId?: string;
  contactId?: string;
  assigneeId?: string;
  enabled?: boolean;
}

export function useTasks({ customerId, contactId, assigneeId, enabled = true }: UseTasksOptions = {}) {
  const queryClient = useQueryClient();
  const filters = { customerId, contactId, assigneeId };

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: queryKeys.tasks.list(filters),
    queryFn: async () => {
      let query = supabase.from("tasks").select("*").order("due_date", { ascending: true });
      if (customerId) query = query.eq("customer_id", customerId);
      if (contactId) query = query.eq("contact_id", contactId);
      if (assigneeId) query = query.eq("assignee_id", assigneeId);
      const { data, error } = await query;
      if (error) throw error;
      return data ?? [];
    },
    enabled,
    staleTime: 30_000,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: queryKeys.tasks.all() });
  return { tasks, isLoading, invalidate };
}
