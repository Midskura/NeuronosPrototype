/**
 * Category Presets for Quotation Pricing
 * 
 * Provides 6 standard category templates commonly used in freight forwarding quotations.
 * Each preset includes metadata for UI display and an empty line items array.
 */

import type { BuyingPriceCategory, SellingPriceCategory } from "../../types/pricing";

/**
 * Category Preset Definition
 * Used for displaying in the "+ Add Category" dropdown
 */
export interface CategoryPreset {
  id: string;
  name: string;
  description: string;
  icon: string;  // Emoji or icon identifier
  color: string; // Hex color for visual distinction (optional feature)
}

/**
 * Standard freight forwarding category presets
 */
export const CATEGORY_PRESETS: CategoryPreset[] = [
  {
    id: "freight-charges",
    name: "FREIGHT CHARGES",
    description: "Ocean/Air freight rates, fuel surcharges, carrier fees",
    icon: "🚢",
    color: "#3B82F6" // Blue
  },
  {
    id: "origin-local",
    name: "ORIGIN LOCAL CHARGES",
    description: "Pickup, documentation, export customs clearance",
    icon: "📦",
    color: "#10B981" // Green
  },
  {
    id: "destination-local",
    name: "DESTINATION LOCAL CHARGES",
    description: "Delivery, import customs clearance, destination port fees",
    icon: "🏭",
    color: "#14B8A6" // Teal
  },
  {
    id: "reimbursable",
    name: "REIMBURSABLE CHARGES",
    description: "Client-reimbursed expenses and third-party costs",
    icon: "💰",
    color: "#F59E0B" // Orange
  },
  {
    id: "brokerage",
    name: "BROKERAGE CHARGES",
    description: "Customs clearance, duties, taxes, brokerage fees",
    icon: "🏛️",
    color: "#8B5CF6" // Purple
  },
  {
    id: "others",
    name: "OTHERS",
    description: "Miscellaneous charges and special services",
    icon: "⚙️",
    color: "#6B7280" // Gray
  }
];

/**
 * Create a new buying price category from a preset
 * 
 * @param preset - The category preset to use
 * @param displayOrder - Optional order number for the category
 * @returns A new BuyingPriceCategory with empty line items
 */
export function createBuyingCategoryFromPreset(
  preset: CategoryPreset,
  displayOrder?: number
): BuyingPriceCategory {
  return {
    id: `cat-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    category_name: preset.name,
    name: preset.name, // Backward compatibility
    line_items: [],
    subtotal: 0,
    is_expanded: true, // New categories are expanded by default
    display_order: displayOrder ?? 999
  };
}

/**
 * Create a new selling price category from a preset
 * 
 * @param preset - The category preset to use
 * @param displayOrder - Optional order number for the category
 * @returns A new SellingPriceCategory with empty line items
 */
export function createSellingCategoryFromPreset(
  preset: CategoryPreset,
  displayOrder?: number
): SellingPriceCategory {
  return {
    id: `cat-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    category_name: preset.name,
    name: preset.name, // Backward compatibility
    line_items: [],
    subtotal: 0,
    is_expanded: true, // New categories are expanded by default
    display_order: displayOrder ?? 999
  };
}

/**
 * Create a custom category (not from a preset)
 * 
 * @param categoryName - Custom name for the category
 * @param displayOrder - Optional order number for the category
 * @returns A new BuyingPriceCategory with the custom name
 */
export function createCustomBuyingCategory(
  categoryName: string,
  displayOrder?: number
): BuyingPriceCategory {
  return {
    id: `cat-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    category_name: categoryName.toUpperCase(),
    name: categoryName.toUpperCase(),
    line_items: [],
    subtotal: 0,
    is_expanded: true,
    display_order: displayOrder ?? 999
  };
}

/**
 * Create a custom selling price category (not from a preset)
 * 
 * @param categoryName - Custom name for the category
 * @param displayOrder - Optional order number for the category
 * @returns A new SellingPriceCategory with the custom name
 */
export function createCustomSellingCategory(
  categoryName: string,
  displayOrder?: number
): SellingPriceCategory {
  return {
    id: `cat-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    category_name: categoryName.toUpperCase(),
    name: categoryName.toUpperCase(),
    line_items: [],
    subtotal: 0,
    is_expanded: true,
    display_order: displayOrder ?? 999
  };
}

/**
 * Get a preset by ID
 * 
 * @param presetId - The ID of the preset to retrieve
 * @returns The CategoryPreset, or undefined if not found
 */
export function getPresetById(presetId: string): CategoryPreset | undefined {
  return CATEGORY_PRESETS.find(p => p.id === presetId);
}

/**
 * Get a preset by name (case-insensitive)
 * 
 * @param name - The name of the preset to retrieve
 * @returns The CategoryPreset, or undefined if not found
 */
export function getPresetByName(name: string): CategoryPreset | undefined {
  const normalizedName = name.toUpperCase().trim();
  return CATEGORY_PRESETS.find(p => p.name.toUpperCase() === normalizedName);
}
