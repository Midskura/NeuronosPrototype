import { useMemo } from "react";
import type { BillingItem } from "../components/shared/billings/UnifiedBillingsTab";
import type { QuotationNew } from "../types/pricing";

interface UseBillingMergeProps {
  items: BillingItem[];
  quotation?: QuotationNew;
  projectId: string;
  bookingId?: string;
  linkedBookings?: any[];
}

export function useBillingMerge({ items, quotation, projectId, bookingId, linkedBookings }: UseBillingMergeProps) {
  // Merges Real Billing Items with Virtual Quotation Items
  const mergedItems = useMemo(() => {
    // Build service-to-booking map from linkedBookings for auto-routing
    // Maps e.g. "Brokerage" → "BRK-20260301-1234"
    // (Same logic as UnifiedBillingsTab inline merge)
    const serviceToBookingMap = new Map<string, string>();
    if (linkedBookings) {
      linkedBookings.forEach((b: any) => {
        const svc = b.serviceType || b.service_type || "";
        const bid = b.bookingId || b.id;
        if (svc && bid) serviceToBookingMap.set(svc, bid);
      });
    }

    // Helper: resolve booking_id from a service type
    const resolveBookingId = (serviceType: string | undefined) => {
      // If we're already at booking-level (bookingId prop set), use that
      if (bookingId) return bookingId;
      // Try to match service → booking
      if (serviceType && serviceToBookingMap.has(serviceType)) {
        return serviceToBookingMap.get(serviceType)!;
      }
      // Fallback to project ID
      return projectId;
    };

    // 1. Deep copy existing real items to avoid mutating props
    const combined = items.map(item => ({ ...item }));
    
    // Create a map of "Source IDs" to their index in the combined array
    const realItemIndices = new Map<string, number>();
    
    combined.forEach((item, index) => {
        const sourceId = item.source_quotation_item_id || item.source_id;
        if (sourceId) {
            realItemIndices.set(sourceId, index);
        }
    });

    // If we have a quotation, reflect its items
    if (quotation && quotation.selling_price) {
        quotation.selling_price.forEach(cat => {
            cat.line_items.forEach(item => {
                const sourceId = item.id;
                const existingIndex = realItemIndices.get(sourceId);

                if (existingIndex !== undefined) {
                    // REAL ITEM EXISTS
                    // If the item is UNBILLED, we reflect the quotation changes live.
                    const existingItem = combined[existingIndex];
                    
                    if (existingItem.status === 'unbilled') {
                        combined[existingIndex] = {
                            ...existingItem,
                            // Reflective fields (Overwrite DB with Quote)
                            description: item.description,
                            service_type: item.service || existingItem.service_type || "General",
                            amount: item.amount, // Calculated final price
                            currency: item.currency,
                            quotation_category: cat.category_name,
                            // Auto-route to correct booking based on service tag
                            booking_id: resolveBookingId(item.service || existingItem.service_type),
                            // Extended fields
                            quantity: item.quantity,
                            forex_rate: item.forex_rate,
                            is_taxed: item.is_taxed,
                            amount_added: item.amount_added,
                            percentage_added: item.percentage_added,
                            base_cost: item.base_cost
                        };
                    }
                    return; 
                }

                // NO REAL ITEM -> Create Virtual Item
                const virtualItem: BillingItem = {
                    id: `virtual-${item.id}`,
                    source_id: item.id, // We use generic source_id for internal tracking
                    source_quotation_item_id: item.id, // We set specific one for backend compatibility
                    source_type: 'quotation_item',
                    is_virtual: true,
                    created_at: quotation.created_at || new Date().toISOString(),
                    service_type: item.service || "General",
                    description: item.description,
                    amount: item.amount, // This is final_price (unit * qty * forex)
                    currency: item.currency,
                    status: 'unbilled', // Virtual items are always unbilled by definition
                    quotation_category: cat.category_name,
                    booking_id: resolveBookingId(item.service),
                    // Extended fields for editing
                    quantity: item.quantity,
                    forex_rate: item.forex_rate,
                    is_taxed: item.is_taxed,
                    amount_added: item.amount_added,
                    percentage_added: item.percentage_added,
                    base_cost: item.base_cost
                };

                combined.push(virtualItem);
            });
        });
    }

    return combined;
  }, [items, quotation, projectId, bookingId, linkedBookings]);

  return mergedItems;
}
