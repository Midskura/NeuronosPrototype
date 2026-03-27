import { useState, useEffect } from 'react';
import { supabase } from '../utils/supabase/client';

/**
 * Fetches the IDs of all users belonging to a given team.
 * Used by useDataScope to resolve team_leader visibility.
 */
export function useTeamMembers(teamId: string | null | undefined): {
  memberIds: string[];
  isLoading: boolean;
} {
  const [memberIds, setMemberIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!teamId) {
      setMemberIds([]);
      return;
    }

    setIsLoading(true);
    supabase
      .from('users')
      .select('id')
      .eq('team_id', teamId)
      .eq('is_active', true)
      .then(({ data }) => {
        setMemberIds(data?.map((u) => u.id) ?? []);
        setIsLoading(false);
      });
  }, [teamId]);

  return { memberIds, isLoading };
}
