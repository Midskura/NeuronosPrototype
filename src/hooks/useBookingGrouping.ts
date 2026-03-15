/**
 * useBookingGrouping — Shared hook for grouping items by booking ID
 * 
 * Used by:
 * - BillingsTable.tsx (billing items grouped by booking)
 * - InvoiceBuilder.tsx (invoice billing items grouped by booking)
 * 
 * @see /docs/blueprints/INVOICE_BOOKING_GROUPING_BLUEPRINT.md
 */

import { useState, useMemo, useEffect, useCallback } from "react";

// ── Pure Utilities (exported for non-hook use) ──

/**
 * Infer service type from a booking ID prefix.
 * Fallback hierarchy: meta fields → prefix pattern → "Others"
 */
export function inferServiceType(bookingId: string, meta?: any): string {
  if (meta?.serviceType || meta?.bookingType) return meta.serviceType || meta.bookingType;
  if (bookingId.startsWith("FWD-")) return "Forwarding";
  if (bookingId.startsWith("BRK-")) return "Brokerage";
  if (bookingId.startsWith("TRK-")) return "Trucking";
  if (bookingId.startsWith("INS-")) return "Marine Insurance";
  if (bookingId.startsWith("OTH-")) return "Others";
  return "Others";
}

/**
 * Groups items by booking ID, normalizing unknown IDs to "unassigned".
 * Ensures every linked booking has an entry (even if empty).
 */
export function groupItemsByBooking<T>(
  items: T[],
  linkedBookings: any[],
  getBookingId: (item: T) => string
): Record<string, T[]> {
  // Build set of known booking IDs for normalization
  const knownBookingIds = new Set<string>();
  linkedBookings.forEach((b: any) => {
    const id = b.bookingId || b.id;
    if (id) knownBookingIds.add(id);
  });

  const groups: Record<string, T[]> = {};
  items.forEach(item => {
    let bid = getBookingId(item);
    // Normalize: if booking_id is not a known booking (e.g. a project ID fallback),
    // treat it as "unassigned" so it renders cleanly instead of showing raw IDs
    if (bid !== "unassigned" && !knownBookingIds.has(bid)) {
      bid = "unassigned";
    }
    if (!groups[bid]) groups[bid] = [];
    groups[bid].push(item);
  });

  // Ensure every linked booking has an entry (even if empty)
  linkedBookings.forEach((b: any) => {
    const id = b.bookingId || b.id;
    if (id && !groups[id]) groups[id] = [];
  });

  return groups;
}

/**
 * Sort booking IDs: real bookings alphabetically, "unassigned" always last.
 */
export function sortBookingIds(ids: string[]): string[] {
  return [...ids].sort((a, b) => {
    if (a === "unassigned") return 1;
    if (b === "unassigned") return -1;
    return a.localeCompare(b);
  });
}

/**
 * Build a Map of booking metadata from linkedBookings array.
 */
export function buildBookingMeta(linkedBookings: any[]): Map<string, any> {
  const map = new Map<string, any>();
  linkedBookings.forEach((b: any) => {
    const id = b.bookingId || b.id;
    if (id) map.set(id, b);
  });
  return map;
}


// ── Module-level constant to prevent re-render loops ──
const EMPTY_LINKED_BOOKINGS: any[] = [];


// ── Hook ──

interface UseBookingGroupingOptions<T> {
  /** The items to group */
  items: T[];
  /** Linked bookings metadata array */
  linkedBookings?: any[];
  /** Accessor to extract booking_id from an item */
  getBookingId: (item: T) => string;
  /** Whether booking grouping is active (default: true) */
  enabled?: boolean;
}

interface UseBookingGroupingResult<T> {
  /** Items grouped by booking ID */
  bookingGroupedData: Record<string, T[]>;
  /** Sorted booking IDs (unassigned last) */
  bookingIds: string[];
  /** Map of booking ID → metadata */
  bookingMeta: Map<string, any>;
  /** Infer service type from booking ID */
  inferServiceType: (bookingId: string, meta?: any) => string;
  /** Set of currently expanded booking IDs */
  expandedBookings: Set<string>;
  /** Toggle a single booking's expanded state */
  toggleBooking: (bookingId: string) => void;
  /** Toggle all bookings expanded/collapsed */
  toggleAllBookings: () => void;
  /** Whether all bookings are currently expanded */
  allExpanded: boolean;
  /** Whether grouping is active and has data */
  hasBookings: boolean;
}

export function useBookingGrouping<T>({
  items,
  linkedBookings,
  getBookingId,
  enabled = true,
}: UseBookingGroupingOptions<T>): UseBookingGroupingResult<T> {
  // Stable reference for empty bookings
  const stableLinkedBookings = linkedBookings && linkedBookings.length > 0
    ? linkedBookings
    : EMPTY_LINKED_BOOKINGS;

  // State
  const [expandedBookings, setExpandedBookings] = useState<Set<string>>(new Set());
  const [allExpanded, setAllExpanded] = useState(true);

  // Group data by booking_id
  const bookingGroupedData = useMemo(() => {
    if (!enabled) return {};
    return groupItemsByBooking(items, stableLinkedBookings, getBookingId);
  }, [items, stableLinkedBookings, getBookingId, enabled]);

  // Ordered list of booking IDs
  const bookingIds = useMemo(() => {
    return sortBookingIds(Object.keys(bookingGroupedData));
  }, [bookingGroupedData]);

  // Build metadata lookup
  const bookingMeta = useMemo(() => {
    return buildBookingMeta(stableLinkedBookings);
  }, [stableLinkedBookings]);

  // Initialize expanded bookings when booking IDs change
  useEffect(() => {
    if (enabled && bookingIds.length > 0) {
      setExpandedBookings(new Set(bookingIds));
      setAllExpanded(true);
    }
  }, [bookingIds.length, enabled]);

  // Toggle a single booking
  const toggleBooking = useCallback((bookingId: string) => {
    setExpandedBookings(prev => {
      const newSet = new Set(prev);
      if (newSet.has(bookingId)) {
        newSet.delete(bookingId);
      } else {
        newSet.add(bookingId);
      }
      // Sync allExpanded
      setAllExpanded(newSet.size === bookingIds.length);
      return newSet;
    });
  }, [bookingIds.length]);

  // Toggle all
  const toggleAllBookings = useCallback(() => {
    setAllExpanded(prev => {
      if (prev) {
        setExpandedBookings(new Set());
        return false;
      } else {
        setExpandedBookings(new Set(bookingIds));
        return true;
      }
    });
  }, [bookingIds]);

  const hasBookings = enabled && bookingIds.length > 0;

  return {
    bookingGroupedData,
    bookingIds,
    bookingMeta,
    inferServiceType,
    expandedBookings,
    toggleBooking,
    toggleAllBookings,
    allExpanded,
    hasBookings,
  };
}
