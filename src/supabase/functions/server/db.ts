/**
 * Relational Database Client
 * 
 * Provides a Supabase client configured to query the normalized relational tables
 * instead of the KV store. Uses the same environment variables as kv_store_robust.tsx.
 * 
 * Usage:
 *   import { db } from "./db.ts";
 *   const { data, error } = await db.from("customers").select("*");
 */

import { createClient, SupabaseClient } from "npm:@supabase/supabase-js@2";

let _client: SupabaseClient | null = null;

/**
 * Get the Supabase client (singleton).
 * Lazily initialized on first call.
 */
export function getClient(): SupabaseClient {
  if (!_client) {
    const url = Deno.env.get("SUPABASE_URL") || "";
    const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    if (!url || !key) {
      throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
    }
    _client = createClient(url, key);
  }
  return _client;
}

/**
 * Shorthand: get the Supabase client.
 * 
 * Usage:
 *   const { data } = await db.from("customers").select("*");
 */
export const db = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    return (getClient() as any)[prop];
  },
});

// ============================================================================
// Helper utilities for common patterns
// ============================================================================

/**
 * Standard success response shape (matches existing API contract)
 */
export function ok(data: any, status = 200) {
  return { success: true, data, _status: status };
}

/**
 * Standard error response shape
 */
export function err(message: string, status = 500) {
  return { success: false, error: message, _status: status };
}

/**
 * Generate a prefixed ID matching existing KV format.
 * E.g., generateId("BKG") => "BKG-1710000000000-a1b2c3d4e"
 */
export function generateId(prefix: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 11);
  return `${prefix}-${timestamp}-${random}`;
}

/**
 * Normalize an object's keys to snake_case (shallow).
 * Handles common camelCase fields found in KV data.
 */
const CAMEL_TO_SNAKE: Record<string, string> = {
  bookingId: "booking_id",
  billingId: "billing_id",
  customerId: "customer_id",
  contactId: "contact_id",
  projectId: "project_id",
  contractId: "contract_id",
  createdAt: "created_at",
  updatedAt: "updated_at",
  createdBy: "created_by",
  serviceType: "service_type",
  bookingNumber: "booking_number",
  projectNumber: "project_number",
  invoiceNumber: "invoice_number",
  customerName: "customer_name",
  vendorName: "vendor_name",
  lineItems: "line_items",
  chargeCategories: "charge_categories",
  companyName: "company_name",
  contactPerson: "contact_person",
  contactEmail: "contact_email",
  contactPhone: "contact_phone",
  totalShipments: "total_shipments",
  servicesOffered: "services",
  services_offered: "services",
  preferredPayment: "payment_method",
  quotationType: "quotation_type",
  quotationNumber: "quotation_number",
  ticketNumber: "ticket_number",
  ticketType: "ticket_type",
};

export function normalizeKeys(obj: Record<string, any>): Record<string, any> {
  const result: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    const snakeKey = CAMEL_TO_SNAKE[key] || key;
    result[snakeKey] = value;
  }
  return result;
}

/**
 * Strip fields that don't belong in a table (e.g., computed UI fields).
 * Pass a whitelist of allowed column names.
 */
export function pickColumns(obj: Record<string, any>, columns: string[]): Record<string, any> {
  const result: Record<string, any> = {};
  for (const col of columns) {
    if (obj[col] !== undefined) {
      result[col] = obj[col];
    }
  }
  return result;
}

/**
 * Apply text search filter across multiple columns.
 * Returns a Supabase query with OR ilike filters.
 */
export function applySearch(
  query: any,
  search: string,
  columns: string[]
): any {
  if (!search || columns.length === 0) return query;
  const filter = columns.map(col => `${col}.ilike.%${search}%`).join(",");
  return query.or(filter);
}

// ============================================================================
// Entity split/merge helpers for tables with a JSONB "details" overflow column
// ============================================================================

/**
 * Split an incoming KV-style payload into { row, overflow }.
 * `row` contains only keys present in `columns`; `overflow` is the rest.
 * The `overflow` object is stored in the `details` JSONB column.
 */
export function splitForInsert(
  data: Record<string, any>,
  columns: string[]
): Record<string, any> {
  const row: Record<string, any> = {};
  const overflow: Record<string, any> = {};
  for (const [key, value] of Object.entries(data)) {
    if (columns.includes(key)) {
      row[key] = value;
    } else {
      overflow[key] = value;
    }
  }
  row.details = overflow;
  return row;
}

/**
 * Merge a relational row back into a flat KV-compatible object.
 * Spreads `details` JSONB back to top level, then overlays the row columns.
 */
export function mergeFromRow(row: Record<string, any>): Record<string, any> {
  if (!row) return row;
  const { details, ...columns } = row;
  return { ...(details || {}), ...columns };
}