// Expense & Charge Catalog API Handlers (RELATIONAL)
// Manages master catalog of financial line items (Item Master)
// Tables: catalog_items, catalog_categories

import type { Context } from "npm:hono";
import { db } from "./db.ts";

// ==================== UTILITIES ====================

function generateId(prefix: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 9);
  return `${prefix}_${timestamp}_${random}`;
}

function errorResponse(c: Context, message: string, status: number = 500) {
  console.error(`Catalog Error: ${message}`);
  return c.json({ success: false, error: message }, status);
}

function successResponse(c: Context, data: any, status: number = 200) {
  return c.json({ success: true, data }, status);
}

// ==================== TYPES ====================

export interface CatalogItem {
  id: string;
  name: string;
  type: "expense" | "charge" | "both";
  category: string;
  service_types: string[];
  default_currency: string;
  default_amount: number | null;
  is_taxable: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CatalogCategory {
  id: string;
  name: string;
  is_active: boolean;
  created_at: string;
}

// ==================== CATALOG ITEMS ====================

export async function listCatalogItems(c: Context) {
  try {
    const search = c.req.query("search")?.toLowerCase() || "";
    const serviceType = c.req.query("service_type") || "";
    const itemType = c.req.query("type") || "";
    const includeInactive = c.req.query("include_inactive") === "true";

    const { data: allItems } = await db.from("catalog_items").select("*");
    let filtered: any[] = allItems || [];

    if (!includeInactive) {
      filtered = filtered.filter((item: any) => item.is_active !== false);
    }

    if (search) {
      filtered = filtered.filter((item: any) =>
        (item.name || "").toLowerCase().includes(search)
      );
    }

    if (serviceType) {
      filtered = filtered.filter((item: any) =>
        item.service_types?.includes(serviceType)
      );
    }

    if (itemType) {
      filtered = filtered.filter((item: any) => item.type === itemType);
    }

    filtered.sort((a: any, b: any) => (a.name || "").localeCompare(b.name || ""));

    return successResponse(c, filtered);
  } catch (error) {
    return errorResponse(c, `Error listing catalog items: ${String(error)}`);
  }
}

export async function getCatalogItem(c: Context) {
  try {
    const id = c.req.param("id");
    const { data: item } = await db.from("catalog_items").select("*").eq("id", id).maybeSingle();

    if (!item) {
      return errorResponse(c, `Catalog item not found: ${id}`, 404);
    }

    return successResponse(c, item);
  } catch (error) {
    return errorResponse(c, `Error getting catalog item: ${String(error)}`);
  }
}

export async function createCatalogItem(c: Context) {
  try {
    const body = await c.req.json();
    const { name, type, category, service_types, default_currency, default_amount, is_taxable } = body;

    if (!name || !type) {
      return errorResponse(c, "Name and type are required", 400);
    }

    if (!["expense", "charge", "both"].includes(type)) {
      return errorResponse(c, "Type must be 'expense', 'charge', or 'both'", 400);
    }

    const id = generateId("ci");
    const now = new Date().toISOString();

    const item: CatalogItem = {
      id,
      name: name.trim(),
      type,
      category: (category || "Uncategorized").trim(),
      service_types: service_types || [],
      default_currency: default_currency || "PHP",
      default_amount: default_amount ?? null,
      is_taxable: is_taxable ?? false,
      is_active: true,
      created_at: now,
      updated_at: now,
    };

    await db.from("catalog_items").insert(item);

    if (item.category && item.category !== "Uncategorized") {
      await ensureCategoryExists(item.category);
    }

    console.log(`Created catalog item: ${item.name} (${item.id})`);
    return successResponse(c, item, 201);
  } catch (error) {
    return errorResponse(c, `Error creating catalog item: ${String(error)}`);
  }
}

export async function updateCatalogItem(c: Context) {
  try {
    const id = c.req.param("id");
    const { data: existing } = await db.from("catalog_items").select("*").eq("id", id).maybeSingle();

    if (!existing) {
      return errorResponse(c, `Catalog item not found: ${id}`, 404);
    }

    const body = await c.req.json();
    const updated: CatalogItem = {
      ...existing,
      ...body,
      id,
      updated_at: new Date().toISOString(),
    };

    if (body.type && !["expense", "charge", "both"].includes(body.type)) {
      return errorResponse(c, "Type must be 'expense', 'charge', or 'both'", 400);
    }

    await db.from("catalog_items").update(updated).eq("id", id);

    if (updated.category && updated.category !== "Uncategorized") {
      await ensureCategoryExists(updated.category);
    }

    console.log(`Updated catalog item: ${updated.name} (${id})`);
    return successResponse(c, updated);
  } catch (error) {
    return errorResponse(c, `Error updating catalog item: ${String(error)}`);
  }
}

export async function deleteCatalogItem(c: Context) {
  try {
    const id = c.req.param("id");
    const { data: existing } = await db.from("catalog_items").select("*").eq("id", id).maybeSingle();

    if (!existing) {
      return errorResponse(c, `Catalog item not found: ${id}`, 404);
    }

    await db.from("catalog_items").update({
      is_active: false,
      updated_at: new Date().toISOString(),
    }).eq("id", id);

    console.log(`Deactivated catalog item: ${existing.name} (${id})`);
    return successResponse(c, { ...existing, is_active: false });
  } catch (error) {
    return errorResponse(c, `Error deactivating catalog item: ${String(error)}`);
  }
}

// ==================== CATALOG CATEGORIES ====================

async function ensureCategoryExists(categoryName: string) {
  const { data: allCategories } = await db.from("catalog_categories").select("*");
  const exists = (allCategories || []).some(
    (cat: any) => (cat.name || "").toLowerCase() === categoryName.toLowerCase()
  );

  if (!exists) {
    const id = generateId("cc");
    const category: CatalogCategory = {
      id,
      name: categoryName.trim(),
      is_active: true,
      created_at: new Date().toISOString(),
    };
    await db.from("catalog_categories").insert(category);
    console.log(`Auto-created catalog category: ${categoryName} (${id})`);
  }
}

export async function listCatalogCategories(c: Context) {
  try {
    const { data: allCategories } = await db.from("catalog_categories").select("*");
    const active = (allCategories || []).filter((cat: any) => cat.is_active !== false);
    active.sort((a: any, b: any) => (a.name || "").localeCompare(b.name || ""));
    return successResponse(c, active);
  } catch (error) {
    return errorResponse(c, `Error listing catalog categories: ${String(error)}`);
  }
}

export async function createCatalogCategory(c: Context) {
  try {
    const body = await c.req.json();
    const { name } = body;

    if (!name) {
      return errorResponse(c, "Category name is required", 400);
    }

    const { data: allCategories } = await db.from("catalog_categories").select("*");
    const exists = (allCategories || []).some(
      (cat: any) => (cat.name || "").toLowerCase() === name.trim().toLowerCase()
    );

    if (exists) {
      return errorResponse(c, `Category '${name}' already exists`, 409);
    }

    const id = generateId("cc");
    const category: CatalogCategory = {
      id,
      name: name.trim(),
      is_active: true,
      created_at: new Date().toISOString(),
    };

    await db.from("catalog_categories").insert(category);
    console.log(`Created catalog category: ${name} (${id})`);
    return successResponse(c, category, 201);
  } catch (error) {
    return errorResponse(c, `Error creating catalog category: ${String(error)}`);
  }
}

// ==================== SEED DATA ====================

export async function seedCatalogItems(c: Context) {
  try {
    const { data: existingItems } = await db.from("catalog_items").select("*");
    const existingNames = new Set((existingItems || []).map((i: any) => (i.name || "").toLowerCase()));

    const seedItems: Omit<CatalogItem, "id" | "created_at" | "updated_at">[] = [
      // Government Fees
      { name: "Arrastre/Wharfage", type: "both", category: "Government Fees", service_types: ["Brokerage", "Forwarding"], default_currency: "PHP", default_amount: null, is_taxable: false, is_active: true },
      { name: "Duties & Taxes", type: "both", category: "Government Fees", service_types: ["Brokerage"], default_currency: "PHP", default_amount: null, is_taxable: false, is_active: true },
      { name: "Import Processing Fee", type: "expense", category: "Government Fees", service_types: ["Brokerage"], default_currency: "PHP", default_amount: null, is_taxable: false, is_active: true },
      { name: "Customs Exam Fee", type: "expense", category: "Government Fees", service_types: ["Brokerage"], default_currency: "PHP", default_amount: null, is_taxable: false, is_active: true },
      { name: "Value Added Tax (VAT)", type: "both", category: "Government Fees", service_types: ["Brokerage", "Forwarding"], default_currency: "PHP", default_amount: null, is_taxable: false, is_active: true },
      // Brokerage Fees
      { name: "Document Fees", type: "both", category: "Brokerage Fees", service_types: ["Brokerage"], default_currency: "PHP", default_amount: null, is_taxable: true, is_active: true },
      { name: "Processing Fee", type: "charge", category: "Brokerage Fees", service_types: ["Brokerage", "Forwarding"], default_currency: "PHP", default_amount: null, is_taxable: true, is_active: true },
      { name: "Handling Fee", type: "charge", category: "Brokerage Fees", service_types: ["Brokerage", "Forwarding", "Trucking"], default_currency: "PHP", default_amount: null, is_taxable: true, is_active: true },
      { name: "Brokerage Fee", type: "charge", category: "Brokerage Fees", service_types: ["Brokerage"], default_currency: "PHP", default_amount: null, is_taxable: true, is_active: true },
      { name: "Arrangement Fee", type: "charge", category: "Brokerage Fees", service_types: ["Brokerage", "Forwarding"], default_currency: "PHP", default_amount: null, is_taxable: true, is_active: true },
      // Trucking Costs
      { name: "Local Trucking", type: "both", category: "Trucking Costs", service_types: ["Trucking", "Brokerage"], default_currency: "PHP", default_amount: null, is_taxable: true, is_active: true },
      { name: "Toll Fees", type: "expense", category: "Trucking Costs", service_types: ["Trucking"], default_currency: "PHP", default_amount: null, is_taxable: false, is_active: true },
      { name: "Fuel Surcharge", type: "both", category: "Trucking Costs", service_types: ["Trucking"], default_currency: "PHP", default_amount: null, is_taxable: true, is_active: true },
      { name: "Driver Allowance", type: "expense", category: "Trucking Costs", service_types: ["Trucking"], default_currency: "PHP", default_amount: null, is_taxable: false, is_active: true },
      { name: "Demurrage/Detention", type: "both", category: "Trucking Costs", service_types: ["Trucking", "Brokerage", "Forwarding"], default_currency: "PHP", default_amount: null, is_taxable: true, is_active: true },
      // Forwarding Charges
      { name: "Ocean Freight", type: "both", category: "Freight Charges", service_types: ["Forwarding"], default_currency: "USD", default_amount: null, is_taxable: false, is_active: true },
      { name: "Air Freight", type: "both", category: "Freight Charges", service_types: ["Forwarding"], default_currency: "USD", default_amount: null, is_taxable: false, is_active: true },
      { name: "Bill of Lading Fee", type: "both", category: "Freight Charges", service_types: ["Forwarding"], default_currency: "USD", default_amount: null, is_taxable: false, is_active: true },
      { name: "CFS Charges", type: "both", category: "Freight Charges", service_types: ["Forwarding"], default_currency: "USD", default_amount: null, is_taxable: false, is_active: true },
      { name: "Terminal Handling Charge", type: "both", category: "Freight Charges", service_types: ["Forwarding"], default_currency: "USD", default_amount: null, is_taxable: false, is_active: true },
      // Equipment Costs
      { name: "Container Rental", type: "expense", category: "Equipment Costs", service_types: ["Forwarding", "Trucking"], default_currency: "PHP", default_amount: null, is_taxable: true, is_active: true },
      { name: "Container Deposit", type: "expense", category: "Equipment Costs", service_types: ["Forwarding"], default_currency: "PHP", default_amount: null, is_taxable: false, is_active: true },
      // Insurance
      { name: "Marine Insurance", type: "both", category: "Insurance", service_types: ["Forwarding", "Brokerage"], default_currency: "PHP", default_amount: null, is_taxable: true, is_active: true },
      // Surcharges
      { name: "Rush Surcharge", type: "charge", category: "Surcharges", service_types: ["Brokerage", "Trucking", "Forwarding"], default_currency: "PHP", default_amount: null, is_taxable: true, is_active: true },
      { name: "Overweight Surcharge", type: "charge", category: "Surcharges", service_types: ["Trucking"], default_currency: "PHP", default_amount: null, is_taxable: true, is_active: true },
      { name: "Weekend/Holiday Surcharge", type: "charge", category: "Surcharges", service_types: ["Trucking", "Brokerage"], default_currency: "PHP", default_amount: null, is_taxable: true, is_active: true },
      // Service Fees
      { name: "Coordination Fee", type: "charge", category: "Service Fees", service_types: ["Brokerage", "Forwarding", "Trucking", "Others"], default_currency: "PHP", default_amount: null, is_taxable: true, is_active: true },
      { name: "Communication Fee", type: "charge", category: "Service Fees", service_types: ["Brokerage", "Forwarding"], default_currency: "PHP", default_amount: null, is_taxable: true, is_active: true },
      // Others
      { name: "Storage Charges", type: "both", category: "Warehousing", service_types: ["Brokerage", "Forwarding"], default_currency: "PHP", default_amount: null, is_taxable: true, is_active: true },
      { name: "Stripping Charges", type: "both", category: "Warehousing", service_types: ["Brokerage", "Forwarding"], default_currency: "PHP", default_amount: null, is_taxable: true, is_active: true },
    ];

    const now = new Date().toISOString();
    let created = 0;
    let skipped = 0;

    for (const seed of seedItems) {
      if (existingNames.has(seed.name.toLowerCase())) {
        skipped++;
        continue;
      }

      const id = generateId("ci");
      const item: CatalogItem = {
        ...seed,
        id,
        created_at: now,
        updated_at: now,
      };
      await db.from("catalog_items").insert(item);

      if (item.category) {
        await ensureCategoryExists(item.category);
      }

      created++;
    }

    console.log(`Catalog seed complete: ${created} created, ${skipped} skipped (already exist)`);
    return successResponse(c, { created, skipped, total: seedItems.length });
  } catch (error) {
    return errorResponse(c, `Error seeding catalog items: ${String(error)}`);
  }
}

// ==================== AUDITING / AGGREGATION ====================

function inferServiceType(bookingId: string): string {
  if (!bookingId) return "Unknown";
  const prefix = bookingId.split("-")[0]?.toUpperCase();
  switch (prefix) {
    case "BRK": return "Brokerage";
    case "TRK": return "Trucking";
    case "FWD": return "Forwarding";
    case "MI":  return "Marine Insurance";
    case "OTH": return "Others";
    default:    return "Unknown";
  }
}

function normalizeLineItem(item: any): {
  booking_id: string;
  description: string;
  amount: number;
  currency: string;
  catalog_item_id: string | null;
  date: string;
  project_number: string;
} {
  return {
    booking_id: item.booking_id || item.bookingId || "",
    description: item.description || item.name || "",
    amount: Number(item.amount) || 0,
    currency: item.currency || "PHP",
    catalog_item_id: item.catalog_item_id || null,
    date: item.created_at || item.createdAt || item.request_date || "",
    project_number: item.project_number || item.projectNumber || "",
  };
}

export async function auditMatrix(c: Context) {
  try {
    const periodParam = c.req.query("period") || "";
    const serviceTypeFilter = c.req.query("service_type") || "";
    const view = c.req.query("view") || "charges";

    let startDate: Date;
    let endDate: Date;
    if (periodParam && /^\d{4}-\d{2}$/.test(periodParam)) {
      const [year, month] = periodParam.split("-").map(Number);
      startDate = new Date(year, month - 1, 1);
      endDate = new Date(year, month, 0, 23, 59, 59, 999);
    } else {
      const now = new Date();
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    }

    let rawItems: any[] = [];

    if (view === "charges" || view === "both") {
      const { data: billingItems } = await db.from("billing_line_items").select("*");
      rawItems.push(...(billingItems || []));
    }

    if (view === "expenses" || view === "both") {
      const { data: expenses } = await db.from("expenses").select("*");
      rawItems.push(...(expenses || []));
    }

    const normalized = rawItems.map(normalizeLineItem);

    const inPeriod = normalized.filter((item) => {
      if (!item.date) return false;
      const d = new Date(item.date);
      return d >= startDate && d <= endDate;
    });

    const filtered = serviceTypeFilter
      ? inPeriod.filter((item) => inferServiceType(item.booking_id) === serviceTypeFilter)
      : inPeriod;

    const { data: catalogItems } = await db.from("catalog_items").select("*");
    const catalogMap = new Map<string, string>();
    for (const ci of (catalogItems || [])) {
      catalogMap.set(ci.id, ci.name);
    }

    const bookingMap = new Map<string, {
      booking_id: string;
      project_number: string;
      cells: Map<string, { amount: number; currency: string }>;
    }>();

    const seenCatalogIds = new Set<string>();
    let totalLineItems = 0;
    let unlinkedCount = 0;

    for (const item of filtered) {
      if (!item.booking_id) continue;
      totalLineItems++;

      const colKey = item.catalog_item_id || "__unlinked__";
      if (!item.catalog_item_id) unlinkedCount++;
      seenCatalogIds.add(colKey);

      if (!bookingMap.has(item.booking_id)) {
        bookingMap.set(item.booking_id, {
          booking_id: item.booking_id,
          project_number: item.project_number,
          cells: new Map(),
        });
      }

      const bookingEntry = bookingMap.get(item.booking_id)!;
      const existing = bookingEntry.cells.get(colKey);
      if (existing) {
        existing.amount += item.amount;
      } else {
        bookingEntry.cells.set(colKey, { amount: item.amount, currency: item.currency });
      }
    }

    const columns: { catalog_item_id: string; name: string }[] = [];
    for (const cid of seenCatalogIds) {
      if (cid === "__unlinked__") continue;
      columns.push({ catalog_item_id: cid, name: catalogMap.get(cid) || cid });
    }
    columns.sort((a, b) => a.name.localeCompare(b.name));
    if (seenCatalogIds.has("__unlinked__")) {
      columns.push({ catalog_item_id: "__unlinked__", name: "Unlinked Items" });
    }

    const rows: any[] = [];
    for (const [, entry] of bookingMap) {
      const cellsObj: Record<string, { amount: number; currency: string }> = {};
      for (const [colKey, val] of entry.cells) {
        cellsObj[colKey] = val;
      }
      rows.push({
        booking_id: entry.booking_id,
        project_number: entry.project_number,
        service_type: inferServiceType(entry.booking_id),
        cells: cellsObj,
      });
    }
    rows.sort((a: any, b: any) => a.booking_id.localeCompare(b.booking_id));

    const totals: Record<string, number> = {};
    for (const col of columns) {
      let sum = 0;
      for (const row of rows) {
        sum += row.cells[col.catalog_item_id]?.amount || 0;
      }
      totals[col.catalog_item_id] = sum;
    }

    const linkedCount = totalLineItems - unlinkedCount;
    const linkedPercentage = totalLineItems > 0
      ? Math.round((linkedCount / totalLineItems) * 1000) / 10
      : 100;

    return successResponse(c, {
      columns,
      rows,
      totals,
      meta: {
        total_bookings: rows.length,
        total_line_items: totalLineItems,
        unlinked_count: unlinkedCount,
        linked_count: linkedCount,
        linked_percentage: linkedPercentage,
        period: periodParam || `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, "0")}`,
        service_type: serviceTypeFilter || "All",
        view,
      },
    });
  } catch (error) {
    return errorResponse(c, `Error building audit matrix: ${String(error)}`);
  }
}

export async function auditSummary(c: Context) {
  try {
    const periodParam = c.req.query("period") || "";
    const serviceTypeFilter = c.req.query("service_type") || "";
    const view = c.req.query("view") || "both";

    let startDate: Date;
    let endDate: Date;
    if (periodParam && /^\d{4}-\d{2}$/.test(periodParam)) {
      const [year, month] = periodParam.split("-").map(Number);
      startDate = new Date(year, month - 1, 1);
      endDate = new Date(year, month, 0, 23, 59, 59, 999);
    } else {
      const now = new Date();
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    }

    let rawItems: any[] = [];

    if (view === "charges" || view === "both") {
      const { data: billingItems } = await db.from("billing_line_items").select("*");
      rawItems.push(...(billingItems || []));
    }

    if (view === "expenses" || view === "both") {
      const { data: expenses } = await db.from("expenses").select("*");
      rawItems.push(...(expenses || []));
    }

    const normalized = rawItems.map(normalizeLineItem);
    const inPeriod = normalized.filter((item) => {
      if (!item.date) return false;
      const d = new Date(item.date);
      return d >= startDate && d <= endDate;
    });
    const filtered = serviceTypeFilter
      ? inPeriod.filter((item) => inferServiceType(item.booking_id) === serviceTypeFilter)
      : inPeriod;

    const { data: catalogItems } = await db.from("catalog_items").select("*");
    const catalogMap = new Map<string, CatalogItem>();
    for (const ci of (catalogItems || []) as CatalogItem[]) {
      catalogMap.set(ci.id, ci);
    }

    const agg = new Map<string, {
      catalog_item_id: string;
      name: string;
      type: string;
      total_amount: number;
      booking_ids: Set<string>;
      line_item_count: number;
    }>();

    let totalLineItems = 0;
    let unlinkedCount = 0;

    for (const item of filtered) {
      if (!item.booking_id) continue;
      totalLineItems++;

      const colKey = item.catalog_item_id || "__unlinked__";
      if (!item.catalog_item_id) unlinkedCount++;

      if (!agg.has(colKey)) {
        const ci = catalogMap.get(colKey);
        agg.set(colKey, {
          catalog_item_id: colKey,
          name: ci?.name || (colKey === "__unlinked__" ? "Unlinked Items" : colKey),
          type: ci?.type || "\u2014",
          total_amount: 0,
          booking_ids: new Set(),
          line_item_count: 0,
        });
      }

      const entry = agg.get(colKey)!;
      entry.total_amount += item.amount;
      entry.booking_ids.add(item.booking_id);
      entry.line_item_count++;
    }

    const summaryRows: any[] = [];
    for (const [, entry] of agg) {
      if (entry.catalog_item_id === "__unlinked__") continue;
      const bookingCount = entry.booking_ids.size;
      summaryRows.push({
        catalog_item_id: entry.catalog_item_id,
        name: entry.name,
        type: entry.type,
        booking_count: bookingCount,
        line_item_count: entry.line_item_count,
        total_amount: Math.round(entry.total_amount * 100) / 100,
        avg_per_booking: bookingCount > 0 ? Math.round((entry.total_amount / bookingCount) * 100) / 100 : 0,
      });
    }
    summaryRows.sort((a, b) => b.total_amount - a.total_amount);

    // Unlinked summary
    const unlinkedEntry = agg.get("__unlinked__");
    const unlinkedSummary = unlinkedEntry ? {
      catalog_item_id: "__unlinked__",
      name: "Unlinked Items",
      type: "\u2014",
      booking_count: unlinkedEntry.booking_ids.size,
      line_item_count: unlinkedEntry.line_item_count,
      total_amount: Math.round(unlinkedEntry.total_amount * 100) / 100,
      avg_per_booking: unlinkedEntry.booking_ids.size > 0 ? Math.round((unlinkedEntry.total_amount / unlinkedEntry.booking_ids.size) * 100) / 100 : 0,
    } : null;

    const linkedCount = totalLineItems - unlinkedCount;
    const linkedPercentage = totalLineItems > 0
      ? Math.round((linkedCount / totalLineItems) * 1000) / 10
      : 100;

    return successResponse(c, {
      items: summaryRows,
      unlinked: unlinkedSummary,
      meta: {
        total_line_items: totalLineItems,
        unlinked_count: unlinkedCount,
        linked_count: linkedCount,
        linked_percentage: linkedPercentage,
        catalog_item_count: catalogMap.size,
        period: periodParam || `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, "0")}`,
        service_type: serviceTypeFilter || "All",
        view,
      },
    });
  } catch (error) {
    return errorResponse(c, `Error building audit summary: ${String(error)}`);
  }
}
