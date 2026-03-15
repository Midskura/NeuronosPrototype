import type { QuotationLineItemNew, QuotationChargeCategory, FinancialSummary } from "../types/pricing";

/**
 * Calculate line item amount
 * Formula: price × quantity × forex_rate
 */
export function calculateLineAmount(item: QuotationLineItemNew): number {
  return item.price * item.quantity * item.forex_rate;
}

/**
 * Calculate category subtotal
 * Sum of all line item amounts in the category
 */
export function calculateCategorySubtotal(category: QuotationChargeCategory): number {
  return category.line_items?.reduce((sum, item) => sum + item.amount, 0) || 0;
}

/**
 * Calculate financial summary
 * Separates taxed vs non-taxed, applies tax rate, calculates grand total
 */
export function calculateFinancialSummary(
  categories: QuotationChargeCategory[],
  taxRate: number = 0.12,
  otherCharges: number = 0
): FinancialSummary {
  let subtotalNonTaxed = 0;
  let subtotalTaxed = 0;

  // Iterate through all categories and line items
  categories.forEach(category => {
    category.line_items?.forEach(item => {
      if (item.is_taxed) {
        subtotalTaxed += item.amount;
      } else {
        subtotalNonTaxed += item.amount;
      }
    });
  });

  // Calculate tax on taxable amount
  const taxAmount = subtotalTaxed * taxRate;

  // Calculate grand total
  const grandTotal = subtotalNonTaxed + subtotalTaxed + taxAmount + otherCharges;

  return {
    subtotal_non_taxed: subtotalNonTaxed,
    subtotal_taxed: subtotalTaxed,
    tax_rate: taxRate,
    tax_amount: taxAmount,
    other_charges: otherCharges,
    grand_total: grandTotal
  };
}

/**
 * Update all line item amounts in a category
 * Recalculates each line item's amount based on price × quantity × forex
 */
export function recalculateCategoryAmounts(category: QuotationChargeCategory): QuotationChargeCategory {
  return {
    ...category,
    line_items: category.line_items?.map(item => ({
      ...item,
      amount: calculateLineAmount(item)
    })) || [],
    subtotal: 0 // Will be recalculated
  };
}

/**
 * Update category subtotal after line items change
 */
export function updateCategorySubtotal(category: QuotationChargeCategory): QuotationChargeCategory {
  const subtotal = calculateCategorySubtotal(category);
  return {
    ...category,
    subtotal
  };
}

/**
 * Format currency amount with proper decimals
 */
export function formatCurrency(amount: number, currency: string = "USD"): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
}

/**
 * Round to 2 decimal places
 */
export function roundTo2Decimals(value: number): number {
  return Math.round(value * 100) / 100;
}

/**
 * Generate unique ID for line items
 */
export function generateLineItemId(): string {
  return `line-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Generate unique ID for categories
 */
export function generateCategoryId(): string {
  return `cat-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}