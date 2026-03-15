/**
 * QUANTITY CALCULATION UTILITIES
 * 
 * Auto-calculates charge quantities based on cargo details and unit types
 */

/**
 * Calculate W/M (Weight or Measurement)
 * Industry standard: Whichever is greater between CBM and Metric Tons
 */
export function calculateWM(volumeCBM: number, weightKG: number): number {
  const weightTons = weightKG / 1000;
  const wm = Math.max(volumeCBM, weightTons);
  return Math.round(wm * 100) / 100; // Round to 2 decimals
}

/**
 * Calculate quantity based on unit/remarks type and cargo details
 */
export function calculateQuantity(
  remarks: string,
  cargoDetails: {
    volume?: string;           // e.g., "10 CBM", "10"
    grossWeight?: number;      // in KG
    chargeableWeight?: number; // in KG (for air freight)
    shipmentFreight?: "LCL" | "FCL" | "CONSOLIDATION" | "BREAK BULK";
    category?: "SEA FREIGHT" | "AIR FREIGHT" | "LAND FREIGHT";
    containerCount?: number;   // for FCL shipments
  }
): number {
  const remarksUpper = remarks.toUpperCase();

  // Parse volume from string (handle "10 CBM" or "10")
  const volumeCBM = parseFloat(cargoDetails.volume?.replace(/[^0-9.]/g, '') || '0');
  const weightKG = cargoDetails.grossWeight || 0;
  const chargeableWeightKG = cargoDetails.chargeableWeight || 0;

  // PER W/M (Weight or Measurement) - Sea Freight LCL standard
  if (remarksUpper.includes('W/M') || remarksUpper.includes('WEIGHT OR MEASUREMENT')) {
    return calculateWM(volumeCBM, weightKG);
  }

  // PER CBM (Cubic Meter)
  if (remarksUpper.includes('CBM') || remarksUpper.includes('CUBIC METER')) {
    return Math.max(volumeCBM, 1);
  }

  // PER TON / PER MT (Metric Ton)
  if (remarksUpper.includes('TON') || remarksUpper.includes('MT')) {
    const tons = weightKG / 1000;
    return Math.max(Math.round(tons * 100) / 100, 0.1); // Minimum 0.1 ton
  }

  // PER KG (Kilogram) - Common for air freight
  if (remarksUpper.includes('KG') || remarksUpper.includes('KILOGRAM')) {
    return Math.max(chargeableWeightKG || weightKG, 1);
  }

  // PER CONTAINER - FCL shipments
  if (remarksUpper.includes('CONTAINER')) {
    return cargoDetails.containerCount || 1;
  }

  // PER SHIPMENT / PER BL / PER SET / PER AWB / PER ENTRY / PER PERMIT - Always 1
  if (
    remarksUpper.includes('SHIPMENT') ||
    remarksUpper.includes('BL') ||
    remarksUpper.includes('BILL OF LADING') ||
    remarksUpper.includes('SET') ||
    remarksUpper.includes('AWB') ||
    remarksUpper.includes('AIRWAY BILL') ||
    remarksUpper.includes('ENTRY') ||
    remarksUpper.includes('PERMIT') ||
    remarksUpper.includes('POLICY')
  ) {
    return 1;
  }

  // PER HOUR (waiting time, demurrage)
  if (remarksUpper.includes('HOUR')) {
    return 1; // Default 1, can be manually adjusted
  }

  // PER TRIP (trucking)
  if (remarksUpper.includes('TRIP')) {
    return 1;
  }

  // PERCENTAGE (insurance, VAT)
  if (remarksUpper.includes('%') || remarksUpper.includes('PERCENT')) {
    return 1; // Percentage-based, price field will contain the rate
  }

  // Default fallback
  return 1;
}

/**
 * Update all line items in charge categories with calculated quantities
 */
export function updateQuantitiesInCategories(
  categories: any[],
  cargoDetails: {
    volume?: string;
    grossWeight?: number;
    chargeableWeight?: number;
    shipmentFreight?: "LCL" | "FCL" | "CONSOLIDATION" | "BREAK BULK";
    category?: "SEA FREIGHT" | "AIR FREIGHT" | "LAND FREIGHT";
    containerCount?: number;
  }
): any[] {
  return categories.map(category => ({
    ...category,
    line_items: category.line_items.map((item: any) => ({
      ...item,
      quantity: calculateQuantity(item.remarks, cargoDetails),
      // Recalculate amount
      amount: item.price * calculateQuantity(item.remarks, cargoDetails) * (item.forex_rate || 1)
    })),
    // Recalculate category subtotal
    subtotal: category.line_items.reduce((sum: number, item: any) => {
      const qty = calculateQuantity(item.remarks, cargoDetails);
      return sum + (item.price * qty * (item.forex_rate || 1));
    }, 0)
  }));
}

/**
 * Determine if shipment should use container-based pricing
 */
export function shouldUseContainerPricing(
  shipmentFreight: "LCL" | "FCL" | "CONSOLIDATION" | "BREAK BULK"
): boolean {
  return shipmentFreight === "FCL";
}

/**
 * Convert W/M charges to container charges when switching LCL → FCL
 */
export function convertToContainerPricing(
  categories: any[],
  containerCount: number = 1
): any[] {
  return categories.map(category => ({
    ...category,
    line_items: category.line_items.map((item: any) => {
      // Convert W/M based charges to container-based
      if (item.remarks.toUpperCase().includes('W/M')) {
        return {
          ...item,
          remarks: 'PER CONTAINER',
          quantity: containerCount
        };
      }
      return item;
    })
  }));
}
