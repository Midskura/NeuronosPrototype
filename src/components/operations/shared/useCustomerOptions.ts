/**
 * useCustomerOptions
 *
 * Shared hook that fetches customer dropdown options for booking creation panels.
 * Previously duplicated across all 5 panels (~15 lines each).
 *
 * @see /docs/blueprints/BOOKING_PANEL_DRY_BLUEPRINT.md
 */

import { useState, useEffect } from "react";
import { supabase } from "../../../utils/supabase/client";

interface CustomerOption {
  value: string;
  label: string;
}

export function useCustomerOptions(isOpen: boolean): CustomerOption[] {
  const [customerOptions, setCustomerOptions] = useState<CustomerOption[]>([]);

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const { data, error } = await supabase.from('customers').select('*');
        if (!error && data) {
          const options = data.map((c: any) => ({
            value: c.company_name || c.name || c.id,
            label: c.company_name || c.name || c.id,
          }));
          setCustomerOptions(options);
        }
      } catch (err) {
        console.error("Failed to fetch customers for dropdown:", err);
      }
    };
    if (isOpen) fetchCustomers();
  }, [isOpen]);

  return customerOptions;
}