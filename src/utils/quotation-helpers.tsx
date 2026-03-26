/**
 * Shared helpers for the Inquiries/Quotations module.
 *
 * Single source of truth for service icons, status colors, and date formatting
 * used across list pages, detail views, and contract views.
 *
 * @see /docs/blueprints/INQUIRIES_QUOTATIONS_CLEANUP_BLUEPRINT.md — Phase 2
 */

import { Briefcase, Ship, Shield, Truck, FileText } from "lucide-react";
import type { QuotationStatus } from "../types/pricing";
import { getDisplayStatus, type DisplayStatus } from "./statusMapping";
import { normalizeQuotationStatus } from "./quotationStatus";

// ============================================
// SERVICE ICONS
// ============================================

interface ServiceIconOptions {
  size?: number;
  color?: string;
}

/**
 * Returns a Lucide icon element for the given service type.
 * Default: size 16, color #667085 (muted).
 * ContractDetailView uses size 15, color #0F766E (teal).
 */
export function getServiceIcon(service: string, opts?: ServiceIconOptions) {
  const size = opts?.size ?? 16;
  const color = opts?.color ?? "#667085";
  const style = { color };

  switch (service) {
    case "Brokerage":
      return <Briefcase size={size} style={style} />;
    case "Forwarding":
      return <Ship size={size} style={style} />;
    case "Marine Insurance":
      return <Shield size={size} style={style} />;
    case "Trucking":
      return <Truck size={size} style={style} />;
    default:
      return <FileText size={size} style={style} />;
  }
}

// ============================================
// QUOTATION STATUS COLORS (internal statuses)
// ============================================

/**
 * Returns the accent color for a raw internal QuotationStatus value.
 * Used for status badges, dots, and text in list/detail views.
 */
export function getQuotationStatusColor(status: QuotationStatus | string): string {
  const normalizedStatus = normalizeQuotationStatus(status);

  switch (normalizedStatus) {
    case "Draft":
      return "#6B7280";
    case "Pending Pricing":
    case "Needs Revision":
      return "#F59E0B";
    case "Priced":
      return "#8B5CF6";
    case "Sent to Client":
      return "#3B82F6";
    case "Accepted by Client":
    case "Converted to Project":
    case "Converted to Contract":
      return "#10B981";
    case "Rejected by Client":
      return "#EF4444";
    case "Disapproved":
      return "#DC2626";
    case "Cancelled":
      return "#6B7280";
    default:
      return "#6B7280";
  }
}

/**
 * Returns the background tint for a raw internal QuotationStatus value.
 * Used for pill-style badges.
 */
export function getQuotationStatusBgColor(status: QuotationStatus | string): string {
  const normalizedStatus = normalizeQuotationStatus(status);

  switch (normalizedStatus) {
    case "Draft":
      return "#F3F4F6";
    case "Pending Pricing":
    case "Needs Revision":
      return "#FEF3C7";
    case "Priced":
      return "#EDE9FE";
    case "Sent to Client":
      return "#DBEAFE";
    case "Accepted by Client":
    case "Converted to Project":
    case "Converted to Contract":
      return "#D1FAE5";
    case "Rejected by Client":
    case "Disapproved":
      return "#FEE2E2";
    case "Cancelled":
      return "#F3F4F6";
    default:
      return "#F3F4F6";
  }
}

// ============================================
// DISPLAY STATUS COLORS (for client-facing 5-status system)
// ============================================

/**
 * Returns the accent color for a display status.
 * Mirrors the existing `getStatusStyle()` in statusMapping.ts but returns just the color string.
 */
export function getDisplayStatusColor(displayStatus: DisplayStatus): string {
  switch (displayStatus) {
    case "Ongoing":
      return "#D97706";
    case "Waiting Approval":
      return "#C88A2B";
    case "Approved":
      return "#0F766E";
    case "Disapproved":
      return "#DC2626";
    case "Cancelled":
      return "#6B7280";
  }
}

/**
 * Returns the background tint for a display status.
 */
export function getDisplayStatusBgColor(displayStatus: DisplayStatus): string {
  switch (displayStatus) {
    case "Ongoing":
      return "#FEF3C7";
    case "Waiting Approval":
      return "#FEF3C7";
    case "Approved":
      return "#D1FAE5";
    case "Disapproved":
      return "#FEE2E2";
    case "Cancelled":
      return "#F3F4F6";
  }
}

// ============================================
// DATE FORMATTING
// ============================================

/**
 * Formats a date string to a short display format.
 * Example: "2026-02-28T10:00:00Z" → "Feb 28, 2026"
 */
export function formatShortDate(dateStr?: string): string {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });
}

/**
 * Formats a date string to day-month-year without leading zeros.
 * Example: "2026-02-28T10:00:00Z" → "28 Feb 2026"
 */
export function formatDayMonthYear(dateStr?: string): string {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

// ============================================
// BOOKING TYPE MAPPING
// ============================================

/**
 * Maps a human-readable service type string (e.g. "Forwarding", "Marine Insurance")
 * to a URL-safe booking type slug used by ProjectBookingReadOnlyView and booking endpoints.
 */
export function serviceTypeToBookingType(
  serviceType: string
): "forwarding" | "brokerage" | "trucking" | "marine-insurance" | "others" {
  switch (serviceType?.toLowerCase()) {
    case "forwarding":
      return "forwarding";
    case "brokerage":
      return "brokerage";
    case "trucking":
      return "trucking";
    case "marine insurance":
      return "marine-insurance";
    case "others":
      return "others";
    default:
      return "others";
  }
}
