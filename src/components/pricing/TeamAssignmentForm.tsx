import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "../../utils/supabase/client";
import type { ServiceType } from "../../types/operations";
import type { User } from "../../hooks/useUser";
import { CustomDropdown } from "../bd/CustomDropdown";

export interface TeamAssignment {
  manager: { id: string; name: string };
  supervisor: { id: string; name: string } | null;
  handler: { id: string; name: string } | null;
  saveAsDefault: boolean;
}

interface TeamAssignmentFormProps {
  serviceType: ServiceType;
  customerId: string;
  onChange: (assignments: TeamAssignment) => void;
  initialAssignments?: TeamAssignment;
}

export function TeamAssignmentForm({ 
  serviceType, 
  customerId, 
  onChange, 
  initialAssignments 
}: TeamAssignmentFormProps) {
  const [selectedSupervisor, setSelectedSupervisor] = useState<string>("");
  const [selectedHandler, setSelectedHandler] = useState<string>("");
  const [saveAsDefault, setSaveAsDefault] = useState(false);
  const [hasSavedPreference, setHasSavedPreference] = useState(false);

  const { data: managerData, isLoading: isLoadingManager } = useQuery({
    queryKey: ["client_handler_preferences", "manager", serviceType],
    queryFn: async () => {
      const { data } = await supabase.from('users').select('*').eq('department', 'Operations').eq('service_type', serviceType).eq('role', 'manager');
      return data && data.length > 0 ? { id: data[0].id, name: data[0].name } : null;
    },
    staleTime: 5 * 60 * 1000,
  });

  const manager = managerData ?? null;

  const { data: supervisors = [], isLoading: isLoadingSupervisors } = useQuery({
    queryKey: ["client_handler_preferences", "supervisors", serviceType],
    queryFn: async () => {
      const { data } = await supabase.from('users').select('*').eq('department', 'Operations').eq('service_type', serviceType).eq('role', 'team_leader');
      return (data || []) as User[];
    },
    staleTime: 5 * 60 * 1000,
  });

  const { data: handlers = [], isLoading: isLoadingHandlers } = useQuery({
    queryKey: ["client_handler_preferences", "handlers", serviceType],
    queryFn: async () => {
      const { data } = await supabase.from('users').select('*').eq('department', 'Operations').eq('service_type', serviceType).eq('role', 'staff');
      return (data || []) as User[];
    },
    staleTime: 5 * 60 * 1000,
  });

  const { isLoading: isLoadingPreference } = useQuery({
    queryKey: ["client_handler_preferences", customerId, serviceType],
    queryFn: async () => {
      const { data: pref } = await supabase.from('client_handler_preferences').select('*').eq('client_id', customerId).eq('service_type', serviceType).maybeSingle();
      if (pref) {
        setSelectedSupervisor(pref.preferred_supervisor_id);
        setSelectedHandler(pref.preferred_handler_id);
        setHasSavedPreference(true);
      }
      return pref ?? null;
    },
    enabled: !!(customerId && serviceType),
    staleTime: 30_000,
  });

  // Use initial assignments if provided
  useEffect(() => {
    if (initialAssignments) {
      if (initialAssignments.manager) {
        setManager(initialAssignments.manager);
      }
      if (initialAssignments.supervisor) {
        setSelectedSupervisor(initialAssignments.supervisor.id);
      }
      if (initialAssignments.handler) {
        setSelectedHandler(initialAssignments.handler.id);
      }
      setSaveAsDefault(initialAssignments.saveAsDefault);
    }
  }, [initialAssignments]);

  // Trigger onChange when selections change
  useEffect(() => {
    if (manager && selectedSupervisor && selectedHandler) {
      const supervisorUser = supervisors.find(s => s.id === selectedSupervisor);
      const handlerUser = handlers.find(h => h.id === selectedHandler);

      if (supervisorUser && handlerUser) {
        onChange({
          manager,
          supervisor: { id: supervisorUser.id, name: supervisorUser.name },
          handler: { id: handlerUser.id, name: handlerUser.name },
          saveAsDefault,
        });
      }
    }
  }, [manager, selectedSupervisor, selectedHandler, saveAsDefault, supervisors, handlers, onChange]);

  const isLoading = isLoadingManager || isLoadingSupervisors || isLoadingHandlers || isLoadingPreference;

  return (
    <div className="space-y-4">
      {/* Manager (auto-filled, disabled) */}
      <div>
        <label className="block text-sm font-['Inter:Medium',sans-serif] font-medium text-[#0a1d4d] mb-1.5">
          Manager <span className="text-[var(--theme-action-primary-bg)]">(Auto-assigned)</span>
        </label>
        <input
          type="text"
          value={isLoadingManager ? "Loading..." : manager?.name || "No manager available"}
          disabled
          className="w-full px-3.5 py-2.5 rounded-lg border border-[var(--theme-border-default)] bg-[var(--theme-bg-surface-subtle)] font-['Inter:Regular',sans-serif] text-[#0a1d4d] cursor-not-allowed"
        />
      </div>

      {/* Supervisor dropdown */}
      <CustomDropdown
        label="Supervisor"
        value={selectedSupervisor}
        onChange={setSelectedSupervisor}
        options={supervisors.map(s => ({ value: s.id, label: s.name }))}
        placeholder={isLoadingSupervisors ? "Loading..." : "Select supervisor..."}
        disabled={isLoadingSupervisors}
        required
        helperText={
          hasSavedPreference ? (
            <span className="text-xs text-[var(--theme-action-primary-bg)]">(Saved preference)</span>
          ) : undefined
        }
        fullWidth
      />

      {/* Handler dropdown */}
      <CustomDropdown
        label="Handler"
        value={selectedHandler}
        onChange={setSelectedHandler}
        options={handlers.map(h => ({ value: h.id, label: h.name }))}
        placeholder={isLoadingHandlers ? "Loading..." : "Select handler..."}
        disabled={isLoadingHandlers}
        required
        helperText={
          hasSavedPreference ? (
            <span className="text-xs text-[var(--theme-action-primary-bg)]">(Saved preference)</span>
          ) : undefined
        }
        fullWidth
      />

      {/* Save as default checkbox */}
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="save-as-default"
          checked={saveAsDefault}
          onChange={(e) => setSaveAsDefault(e.target.checked)}
          className="w-4 h-4 rounded cursor-pointer appearance-none"
          style={{
            backgroundColor: saveAsDefault ? "var(--theme-action-primary-bg)" : "var(--theme-bg-surface)",
            border: "1px solid",
            borderColor: saveAsDefault ? "var(--theme-action-primary-bg)" : "var(--neuron-ui-muted)",
            backgroundImage: saveAsDefault 
              ? `url("data:image/svg+xml,%3Csvg viewBox='0 0 16 16' fill='white' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M12.207 4.793a1 1 0 010 1.414l-5 5a1 1 0 01-1.414 0l-2-2a1 1 0 011.414-1.414L6.5 9.086l4.293-4.293a1 1 0 011.414 0z'/%3E%3C/svg%3E")` 
              : "none",
            backgroundSize: "100% 100%",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
          }}
        />
        <label
          htmlFor="save-as-default"
          className="text-sm font-['Inter:Regular',sans-serif] text-[#0a1d4d] cursor-pointer"
        >
          Save as default handler preference for this customer
        </label>
      </div>

      {/* Loading indicator */}
      {isLoading && (
        <div className="text-sm text-[var(--theme-text-muted)] italic">
          Loading team members...
        </div>
      )}
    </div>
  );
}