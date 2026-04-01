/**
 * ConsigneeInfoBadge — Small enrichment badge shown below the Consignee
 * field in booking detail views when a `consignee_id` is linked.
 *
 * Shows the saved consignee's address and TIN from the entity store,
 * giving the user richer context than the plain-text name alone.
 * If no consignee_id is present (free-text only), renders nothing.
 *
 * @see /docs/blueprints/CONSIGNEE_FEATURE_BLUEPRINT.md — Phase 3
 */

import { Building2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import type { Consignee } from "../../types/bd";
import { supabase } from "../../utils/supabase/client";
import { queryKeys } from "../../lib/queryKeys";

interface ConsigneeInfoBadgeProps {
  consigneeId?: string;
}

export function ConsigneeInfoBadge({ consigneeId }: ConsigneeInfoBadgeProps) {
  const { data: consignee = null } = useQuery({
    queryKey: ["consignees", consigneeId ?? ""],
    queryFn: async () => {
      const { data, error } = await supabase.from('consignees').select('*').eq('id', consigneeId!).single();
      if (error) return null;
      return (data as Consignee) ?? null;
    },
    enabled: !!consigneeId,
    staleTime: 5 * 60 * 1000,
  });

  if (!consigneeId || !consignee) return null;

  const details: string[] = [];
  if (consignee.tin) details.push(`TIN: ${consignee.tin}`);
  if (consignee.address) details.push(consignee.address);
  if (consignee.contact_person) details.push(consignee.contact_person);

  if (details.length === 0) return null;

  return (
    <div
      className="flex items-start gap-1.5 mt-1 px-2 py-1.5 rounded-md"
      style={{ backgroundColor: "var(--theme-bg-surface-tint)", border: "1px solid var(--theme-status-success-border)" }}
    >
      <Building2 size={12} className="mt-0.5 shrink-0" style={{ color: "var(--theme-action-primary-bg)" }} />
      <div className="text-[11px] leading-[16px]" style={{ color: "var(--theme-text-primary)" }}>
        <span className="font-medium" style={{ color: "var(--theme-action-primary-bg)" }}>Linked Consignee</span>
        <span className="mx-1" style={{ color: "var(--theme-text-muted)" }}>&middot;</span>
        {details.join(" · ")}
      </div>
    </div>
  );
}