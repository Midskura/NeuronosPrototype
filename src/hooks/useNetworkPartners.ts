import { useState, useEffect, useCallback, useRef } from "react";
import { NetworkPartner, NETWORK_PARTNERS } from "../data/networkPartners";
import { supabase } from "../utils/supabase/client";

export function useNetworkPartners() {
  const [partners, setPartners] = useState<NetworkPartner[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const seedingAttempted = useRef(false);

  const seedPartners = async (seedData: NetworkPartner[]) => {
    if (seedingAttempted.current) return false;
    seedingAttempted.current = true;

    try {
      console.log(`Starting seed with ${seedData.length} partners...`);
      
      const { error: insertErr } = await supabase
        .from('service_providers')
        .upsert(seedData, { onConflict: 'id' });
      
      if (insertErr) {
        console.error("Seeding failed:", insertErr.message);
        return false;
      }
      
      console.log(`Seeding complete. Successfully seeded ${seedData.length} partners.`);
      return true;
    } catch (err) {
      console.error("Seeding process error:", err);
      return false;
    }
  };

  const fetchPartners = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const { data, error: fetchErr } = await supabase
        .from('service_providers')
        .select('*');

      if (fetchErr) {
        throw new Error(fetchErr.message);
      }

      let rows = data || [];
      
      // Auto-seeding logic
      if (rows.length === 0 && NETWORK_PARTNERS && NETWORK_PARTNERS.length > 0) {
        console.log("Empty backend detected. Initiating seeding...");
        
        // Show local data immediately for better UX
        setPartners(NETWORK_PARTNERS);
        
        // Seed in background
        seedPartners(NETWORK_PARTNERS).then((seeded) => {
          if (seeded) {
            console.log("Seeding finished successfully. Data synced.");
          } else {
            console.warn("Seeding finished with errors or was skipped.");
          }
        });
        
      } else {
        setPartners(rows);
      }
    } catch (err) {
      console.error("Error in useNetworkPartners:", err);
      setError(String(err));
      // Fallback to local data on error to keep app usable
      if (NETWORK_PARTNERS) {
        console.log("Falling back to local data due to error.");
        setPartners(NETWORK_PARTNERS);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  const savePartner = async (partnerData: Partial<NetworkPartner>) => {
    try {
      const isNew = !partnerData.id || partnerData.id.startsWith("new-");
      
      // Optimistic update
      const tempId = partnerData.id || `temp-${Date.now()}`;
      const optimisticPartner = { ...partnerData, id: tempId } as NetworkPartner;
      
      setPartners(prev => {
        if (isNew) return [...prev, optimisticPartner];
        return prev.map(p => p.id === partnerData.id ? { ...p, ...partnerData } : p);
      });

      if (isNew) {
        const newPartner = { ...partnerData, id: `sp-${Date.now()}` };
        const { data: created, error: insertErr } = await supabase
          .from('service_providers')
          .insert(newPartner)
          .select()
          .single();
        
        if (insertErr) throw new Error(insertErr.message);
        
        setPartners(prev => prev.map(p => p.id === tempId ? created : p));
        return created;
      } else {
        const { data: updated, error: updateErr } = await supabase
          .from('service_providers')
          .update(partnerData)
          .eq('id', partnerData.id!)
          .select()
          .single();
        
        if (updateErr) throw new Error(updateErr.message);
        
        setPartners(prev => prev.map(p => p.id === updated.id ? updated : p));
        return updated;
      }
    } catch (err) {
      console.error("Error saving partner:", err);
      throw err;
    }
  };

  const deletePartner = async (id: string) => {
    try {
      // Optimistic update
      setPartners(prev => prev.filter(p => p.id !== id));

      const { error: deleteErr } = await supabase
        .from('service_providers')
        .delete()
        .eq('id', id);

      if (deleteErr) {
        throw new Error(deleteErr.message);
      }
    } catch (err) {
      console.error("Error deleting partner:", err);
      fetchPartners(); // Revert on error
      throw err;
    }
  };

  useEffect(() => {
    fetchPartners();
  }, [fetchPartners]);

  return {
    partners,
    isLoading,
    error,
    refetch: fetchPartners,
    savePartner,
    deletePartner
  };
}