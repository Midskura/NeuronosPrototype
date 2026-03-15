// Predefined charge items organized by category
export const CHARGE_ITEMS_BY_CATEGORY: Record<string, string[]> = {
  // Freight Charges
  "Freight Charges": [
    "Ocean Freight",
    "Air Freight",
  ],

  // Origin Local Charges
  "Origin Local Charges": [
    "Pick up fee",
    "CFS",
    "CUS",
    "DOCS",
    "Handling Fee",
    "FE Fee",
    "THC",
    "BL Fee",
    "MBL Surrender Fee",
    "Seal",
    "IRF",
    "Customs Clearance",
    "Export Customs Fee",
    "Add Broker",
    "Gate Permission Receipt",
    "Special Form A/I, C/O",
  ],

  // Destination Local Charges
  "Destination Local Charges": [
    "Turn Over Fee",
    "LCL Charges",
    "Documentation Fee",
    "THC",
    "CIC",
    "CRS",
    "BL Fee",
    "Breakbulk Fee (BBF)",
    "Equipment Examination Charge (EEC)",
    "Import Release Fee (IRF)",
    "Empty Control Charge (ECC)",
    "Peak Season Surcharge (PSS)",
    "Container Handling Charge (CHC)",
  ],

  // Reimbursable Charges
  "Reimbursable Charges": [
    "Warehouse Charges",
    "Arrastre & Wharfage Due",
  ],

  // Brokerage Charges
  "Brokerage Charges": [
    "Documentation Fee",
    "Processing Fee",
    "Brokerage Fee",
    "Handling",
  ],

  // Customs Duty & VAT
  "Customs Duty & VAT": [
    "Duties & Taxes",
  ],
};

// Helper function to get charge items for a category
export function getChargeItemsForCategory(categoryName: string): string[] {
  return CHARGE_ITEMS_BY_CATEGORY[categoryName] || [];
}

// Available charge categories (fixed list)
export const AVAILABLE_CHARGE_CATEGORIES = [
  "Freight Charges",
  "Origin Local Charges",
  "Destination Local Charges",
  "Reimbursable Charges",
  "Brokerage Charges",
  "Customs Duty & VAT",
];
