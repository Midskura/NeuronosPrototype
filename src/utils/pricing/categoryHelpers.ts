/**
 * Category Helper Functions
 * 
 * Utility functions for managing categories in quotations.
 * Handles adding, removing, and modifying categories and their line items.
 */

import type { 
  BuyingPriceCategory, 
  SellingPriceCategory,
  QuotationLineItemNew,
  SellingPriceLineItem
} from "../../types/pricing";
import type { CategoryPreset } from "./categoryPresets";
import { createBuyingCategoryFromPreset, createSellingCategoryFromPreset } from "./categoryPresets";

// ==================== CATEGORY OPERATIONS ====================

/**
 * Add a new category to the list
 * 
 * @param categories - Current array of categories
 * @param preset - The category preset to add
 * @returns New array with the added category
 * 
 * @example
 * const newCategories = addCategory(buyingCategories, freightPreset);
 */
export function addCategory<T extends BuyingPriceCategory | SellingPriceCategory>(
  categories: T[],
  preset: CategoryPreset
): T[] {
  const displayOrder = categories.length > 0 
    ? Math.max(...categories.map(c => c.display_order ?? 0)) + 1
    : 1;
  
  const newCategory = (
    createBuyingCategoryFromPreset(preset, displayOrder)
  ) as T;
  
  return [...categories, newCategory];
}

/**
 * Remove a category by ID
 * 
 * @param categories - Current array of categories
 * @param categoryId - ID of the category to remove
 * @returns New array without the removed category
 * 
 * @example
 * const updated = removeCategory(buyingCategories, "cat-123");
 */
export function removeCategory<T extends BuyingPriceCategory | SellingPriceCategory>(
  categories: T[],
  categoryId: string
): T[] {
  return categories.filter(cat => cat.id !== categoryId);
}

/**
 * Update a category's name
 * 
 * @param categories - Current array of categories
 * @param categoryId - ID of the category to rename
 * @param newName - New name for the category
 * @returns New array with the renamed category
 */
export function renameCategory<T extends BuyingPriceCategory | SellingPriceCategory>(
  categories: T[],
  categoryId: string,
  newName: string
): T[] {
  return categories.map(cat => 
    cat.id === categoryId
      ? { ...cat, category_name: newName.toUpperCase(), name: newName.toUpperCase() }
      : cat
  );
}

/**
 * Duplicate a category (including all line items)
 * 
 * @param categories - Current array of categories
 * @param categoryId - ID of the category to duplicate
 * @returns New array with the duplicated category
 */
export function duplicateCategory<T extends BuyingPriceCategory | SellingPriceCategory>(
  categories: T[],
  categoryId: string
): T[] {
  const categoryToDuplicate = categories.find(cat => cat.id === categoryId);
  
  if (!categoryToDuplicate) {
    return categories;
  }
  
  const newDisplayOrder = Math.max(...categories.map(c => c.display_order ?? 0)) + 1;
  
  const duplicatedCategory = {
    ...categoryToDuplicate,
    id: `cat-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    category_name: `${categoryToDuplicate.category_name} (Copy)`,
    name: `${categoryToDuplicate.category_name} (Copy)`,
    display_order: newDisplayOrder,
    line_items: categoryToDuplicate.line_items.map(item => ({
      ...item,
      id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    }))
  } as T;
  
  return [...categories, duplicatedCategory];
}

/**
 * Reorder categories
 * 
 * @param categories - Current array of categories
 * @param fromIndex - Source index
 * @param toIndex - Destination index
 * @returns New array with reordered categories
 */
export function reorderCategories<T extends BuyingPriceCategory | SellingPriceCategory>(
  categories: T[],
  fromIndex: number,
  toIndex: number
): T[] {
  const result = Array.from(categories);
  const [removed] = result.splice(fromIndex, 1);
  result.splice(toIndex, 0, removed);
  
  // Update display_order for all categories
  return result.map((cat, index) => ({
    ...cat,
    display_order: index + 1
  }));
}

// ==================== LINE ITEM OPERATIONS ====================

/**
 * Add a line item to a specific category
 * 
 * @param categories - Current array of categories
 * @param categoryId - ID of the category to add the item to
 * @param lineItem - The line item to add
 * @returns New array with the added line item
 * 
 * @example
 * const updated = addItemToCategory(buyingCategories, "cat-123", newItem);
 */
export function addItemToCategory<T extends BuyingPriceCategory | SellingPriceCategory>(
  categories: T[],
  categoryId: string,
  lineItem: QuotationLineItemNew | SellingPriceLineItem
): T[] {
  return categories.map(cat => {
    if (cat.id !== categoryId) {
      return cat;
    }
    
    const updatedLineItems = [...cat.line_items, lineItem as any];
    const newSubtotal = updatedLineItems.reduce((sum, item) => sum + item.amount, 0);
    
    return {
      ...cat,
      line_items: updatedLineItems,
      subtotal: newSubtotal
    };
  });
}

/**
 * Remove a line item from a category
 * 
 * @param categories - Current array of categories
 * @param categoryId - ID of the category containing the item
 * @param itemId - ID of the line item to remove
 * @returns New array with the removed line item
 */
export function removeItemFromCategory<T extends BuyingPriceCategory | SellingPriceCategory>(
  categories: T[],
  categoryId: string,
  itemId: string
): T[] {
  return categories.map(cat => {
    if (cat.id !== categoryId) {
      return cat;
    }
    
    const updatedLineItems = cat.line_items.filter(item => item.id !== itemId);
    const newSubtotal = updatedLineItems.reduce((sum, item) => sum + item.amount, 0);
    
    return {
      ...cat,
      line_items: updatedLineItems,
      subtotal: newSubtotal
    };
  });
}

/**
 * Update a line item in a category
 * 
 * @param categories - Current array of categories
 * @param categoryId - ID of the category containing the item
 * @param itemId - ID of the line item to update
 * @param updates - Partial updates to apply to the line item
 * @returns New array with the updated line item
 */
export function updateItemInCategory<T extends BuyingPriceCategory | SellingPriceCategory>(
  categories: T[],
  categoryId: string,
  itemId: string,
  updates: Partial<QuotationLineItemNew | SellingPriceLineItem>
): T[] {
  return categories.map(cat => {
    if (cat.id !== categoryId) {
      return cat;
    }
    
    const updatedLineItems = cat.line_items.map(item =>
      item.id === itemId ? { ...item, ...updates } : item
    );
    const newSubtotal = updatedLineItems.reduce((sum, item) => sum + item.amount, 0);
    
    return {
      ...cat,
      line_items: updatedLineItems as any,
      subtotal: newSubtotal
    };
  });
}

/**
 * Recalculate all category subtotals
 * Useful after bulk operations or imports
 * 
 * @param categories - Current array of categories
 * @returns New array with recalculated subtotals
 */
export function recalculateSubtotals<T extends BuyingPriceCategory | SellingPriceCategory>(
  categories: T[]
): T[] {
  return categories.map(cat => ({
    ...cat,
    subtotal: cat.line_items.reduce((sum, item) => sum + item.amount, 0)
  }));
}

// ==================== EXPANSION STATE OPERATIONS ====================

/**
 * Toggle a category's expansion state in a Set
 * 
 * @param categoryId - ID of the category to toggle
 * @param expandedSet - Current Set of expanded category IDs
 * @returns New Set with the toggled state
 * 
 * @example
 * const newSet = toggleCategoryExpansion("cat-123", expandedCategories);
 * setExpandedCategories(newSet);
 */
export function toggleCategoryExpansion(
  categoryId: string,
  expandedSet: Set<string>
): Set<string> {
  const newSet = new Set(expandedSet);
  
  if (newSet.has(categoryId)) {
    newSet.delete(categoryId);
  } else {
    newSet.add(categoryId);
  }
  
  return newSet;
}

/**
 * Expand all categories
 * 
 * @param categories - Current array of categories
 * @returns New Set with all category IDs
 */
export function expandAllCategories<T extends BuyingPriceCategory | SellingPriceCategory>(
  categories: T[]
): Set<string> {
  return new Set(categories.map(cat => cat.id));
}

/**
 * Collapse all categories
 * 
 * @returns Empty Set
 */
export function collapseAllCategories(): Set<string> {
  return new Set();
}

/**
 * Check if a category is expanded
 * 
 * @param categoryId - ID of the category to check
 * @param expandedSet - Current Set of expanded category IDs
 * @returns true if expanded, false if collapsed
 */
export function isCategoryExpanded(
  categoryId: string,
  expandedSet: Set<string>
): boolean {
  return expandedSet.has(categoryId);
}

// ==================== UTILITY FUNCTIONS ====================

/**
 * Get total of all categories
 * 
 * @param categories - Array of categories
 * @returns Sum of all category subtotals
 */
export function calculateGrandTotal<T extends BuyingPriceCategory | SellingPriceCategory>(
  categories: T[]
): number {
  return categories.reduce((sum, cat) => sum + cat.subtotal, 0);
}

/**
 * Get category by ID
 * 
 * @param categories - Array of categories
 * @param categoryId - ID to search for
 * @returns The category, or undefined if not found
 */
export function getCategoryById<T extends BuyingPriceCategory | SellingPriceCategory>(
  categories: T[],
  categoryId: string
): T | undefined {
  return categories.find(cat => cat.id === categoryId);
}

/**
 * Count total line items across all categories
 * 
 * @param categories - Array of categories
 * @returns Total number of line items
 */
export function countTotalLineItems<T extends BuyingPriceCategory | SellingPriceCategory>(
  categories: T[]
): number {
  return categories.reduce((sum, cat) => sum + cat.line_items.length, 0);
}

/**
 * Check if category name already exists (case-insensitive)
 * 
 * @param categories - Array of categories
 * @param categoryName - Name to check
 * @param excludeId - Optional ID to exclude from the check (for renames)
 * @returns true if name exists, false otherwise
 */
export function categoryNameExists<T extends BuyingPriceCategory | SellingPriceCategory>(
  categories: T[],
  categoryName: string,
  excludeId?: string
): boolean {
  const normalizedName = categoryName.toUpperCase().trim();
  
  return categories.some(cat => 
    cat.id !== excludeId && 
    cat.category_name.toUpperCase() === normalizedName
  );
}
