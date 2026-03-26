/**
 * Charge Type Registry
 *
 * Provides charge type options for contract rate line items.
 * Matches on stable `charge_type_code` (never the display label), so users can
 * freely rename catalog items without breaking the rate engine.
 *
 * Architecture:
 *   - loadChargeTypesFromCatalog() reads catalog_items where charge_type_code IS NOT NULL
 *   - CHARGE_TYPE_PRESETS is the fallback used only if the DB call fails
 *   - Custom user entries (not in catalog) get charge_type_id = undefined on the row
 *
 * @see /docs/blueprints/RATE_MATRIX_REDESIGN_BLUEPRINT.md
 */

import { supabase } from "./supabase/client";

// ============================================
// TYPES
// ============================================

export interface ChargeTypeOption {
  id: string;              // Stable identifier for matching (e.g., "processing_fee")
  label: string;           // Display name (e.g., "Processing Fee")
  serviceTypes: string[];  // Which service types this appears in
  category: string;        // Grouping in dropdown ("standard", "other", "delivery")
  defaultUnit?: string;    // Auto-fills unit when selected (e.g., "per_entry")
  isSystem: boolean;       // true = hardcoded preset; future: false = user-created
}

// ============================================
// PRESETS
// ============================================

export const CHARGE_TYPE_PRESETS: ChargeTypeOption[] = [
  // ── Brokerage: Standard Charges ──
  {
    id: "processing_fee",
    label: "Processing Fee",
    serviceTypes: ["Brokerage"],
    category: "standard",
    defaultUnit: "per_entry",
    isSystem: true,
  },
  {
    id: "documentation_fee",
    label: "Documentation Fee",
    serviceTypes: ["Brokerage"],
    category: "standard",
    defaultUnit: "per_entry",
    isSystem: true,
  },
  {
    id: "handling_fee",
    label: "Handling Fee",
    serviceTypes: ["Brokerage"],
    category: "standard",
    defaultUnit: "per_entry",
    isSystem: true,
  },
  {
    id: "brokerage_fee",
    label: "Brokerage Fee",
    serviceTypes: ["Brokerage"],
    category: "standard",
    defaultUnit: "per_entry",
    isSystem: true,
  },
  {
    id: "stamps_and_notary",
    label: "Stamps and Notary",
    serviceTypes: ["Brokerage"],
    category: "standard",
    defaultUnit: "per_bl",
    isSystem: true,
  },

  // ── Brokerage: Other Charges ──
  {
    id: "examination_fee",
    label: "Examination Fee",
    serviceTypes: ["Brokerage"],
    category: "other",
    defaultUnit: "per_container",
    isSystem: true,
  },
  {
    id: "dea_examination",
    label: "DEA Examination",
    serviceTypes: ["Brokerage"],
    category: "other",
    isSystem: true,
  },
  {
    id: "bai_processing",
    label: "BAI Processing",
    serviceTypes: ["Brokerage"],
    category: "other",
    defaultUnit: "per_shipment",
    isSystem: true,
  },

  // ── Trucking: Vehicle Types ──
  {
    id: "20ft_40ft",
    label: "20ft / 40ft",
    serviceTypes: ["Trucking"],
    category: "delivery",
    defaultUnit: "per_container",
    isSystem: true,
  },
  {
    id: "back_to_back",
    label: "Back to back",
    serviceTypes: ["Trucking"],
    category: "delivery",
    defaultUnit: "per_container",
    isSystem: true,
  },
  {
    id: "4wheeler",
    label: "4Wheeler",
    serviceTypes: ["Trucking"],
    category: "delivery",
    defaultUnit: "per_container",
    isSystem: true,
  },
  {
    id: "6wheeler",
    label: "6Wheeler",
    serviceTypes: ["Trucking"],
    category: "delivery",
    defaultUnit: "per_container",
    isSystem: true,
  },
];

// ============================================
// CATEGORY LABELS (for dropdown section headers)
// ============================================

export const CATEGORY_LABELS: Record<string, string> = {
  standard: "Standard Charges",
  other: "Other Charges",
  delivery: "Vehicle Types",
};

// ============================================
// QUERY HELPERS
// ============================================

/**
 * Get all presets for a given service type, grouped by category.
 */
export function getPresetsForService(serviceType: string): ChargeTypeOption[] {
  return CHARGE_TYPE_PRESETS.filter((p) =>
    p.serviceTypes.includes(serviceType)
  );
}

/**
 * Get presets grouped by category for dropdown rendering.
 */
export function getPresetsGrouped(
  serviceType: string
): { category: string; label: string; options: ChargeTypeOption[] }[] {
  const presets = getPresetsForService(serviceType);
  const groups: Record<string, ChargeTypeOption[]> = {};

  for (const preset of presets) {
    if (!groups[preset.category]) groups[preset.category] = [];
    groups[preset.category].push(preset);
  }

  // Maintain a stable category order
  const categoryOrder = ["standard", "other", "delivery"];
  return categoryOrder
    .filter((cat) => groups[cat])
    .map((cat) => ({
      category: cat,
      label: CATEGORY_LABELS[cat] || cat,
      options: groups[cat],
    }));
}

/**
 * Find a preset by its stable ID.
 */
export function findPresetById(id: string): ChargeTypeOption | undefined {
  return CHARGE_TYPE_PRESETS.find((p) => p.id === id);
}

/**
 * Find a preset by label within a service type (for backward-compat matching).
 */
export function findPresetByLabel(
  label: string,
  serviceType: string
): ChargeTypeOption | undefined {
  return CHARGE_TYPE_PRESETS.find(
    (p) =>
      p.label.toLowerCase() === label.toLowerCase() &&
      p.serviceTypes.includes(serviceType)
  );
}

// ============================================
// DYNAMIC CATALOG LOADER
// ============================================

/**
 * Load charge type options from the catalog_items table.
 * Matches on charge_type_code (stable), not the display name — so renaming
 * a catalog item never breaks contract rate calculations.
 *
 * Falls back to CHARGE_TYPE_PRESETS if the DB call fails.
 */
export async function loadChargeTypesFromCatalog(): Promise<ChargeTypeOption[]> {
  try {
    const { data, error } = await supabase
      .from("catalog_items")
      .select("id, name, charge_type_code, service_types, unit_type, category_id")
      .not("charge_type_code", "is", null)
      .eq("is_active", true);

    if (error || !data || data.length === 0) {
      return CHARGE_TYPE_PRESETS;
    }

    // Map catalog rows to ChargeTypeOption shape.
    // category_id → category mapping: use a best-effort default.
    const categoryMap: Record<string, string> = {
      "cat-001": "other",
      "cat-002": "other",
      "cat-003": "delivery",
      "cat-004": "standard",
    };

    return data.map((row: any) => ({
      id: row.charge_type_code,
      label: row.name,
      serviceTypes: row.service_types ?? [],
      category: categoryMap[row.category_id] ?? "other",
      defaultUnit: row.unit_type ?? undefined,
      isSystem: false, // sourced from DB, not hardcoded
    }));
  } catch {
    return CHARGE_TYPE_PRESETS;
  }
}
