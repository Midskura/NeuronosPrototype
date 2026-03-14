/**
 * Charge Type Registry
 *
 * Hardcoded presets for contract charge line items, grouped by service type.
 * Designed for future migration to a dynamic KV-backed registry with admin CRUD.
 *
 * Architecture:
 *   - Each preset has a stable `id` used for downstream matching
 *     (Contract -> Project rates, Contract -> Booking autofill)
 *   - The `label` is the display name shown in the combobox
 *   - Users can always type a custom value (not locked to presets)
 *   - Custom entries have charge_type_id = undefined on the row
 *
 * @see /docs/blueprints/RATE_MATRIX_REDESIGN_BLUEPRINT.md
 */

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
