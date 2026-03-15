// Mock Financial Data Generator for Reports Module
// Generates consistent, realistic financial data from bookings

interface Booking {
  id: string;
  trackingNo: string;
  client: string;
  pickup: string;
  dropoff: string;
  status: string;
  deliveryDate: string;
  deliveryType?: "Import" | "Export" | "Domestic";
  profit: number;
  driver?: string;
  vehicle?: string;
  notes?: string;
}

export interface MockFinancialRecord {
  bookingId: string;
  bookingNo: string;
  date: string;
  clientName: string;
  companyName: string;
  serviceDesc: string;
  revenue: number;
  itemizedCost: number;
  opExpenses: number;
  adminCost: number;
  totalExpenses: number;
  collectedAmount: number;
  profit: number;
  profitMargin: number;
  paymentStatus: "PAID" | "UNPAID" | "PARTIAL";
  billingReference: string;
}

// Seeded random number generator for consistency
function seededRandom(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state * 9301 + 49297) % 233280;
    return state / 233280;
  };
}

// Create a seed from a string (booking ID + date)
function createSeed(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

// Generate random number in range using seeded random
function randomInRange(min: number, max: number, rng: () => number): number {
  return min + rng() * (max - min);
}

// Round to 2 decimal places
function round(num: number): number {
  return Math.round(num * 100) / 100;
}

// Extract mode from tracking number (SEA, AIR, etc.)
function extractMode(trackingNo: string): string {
  const parts = trackingNo.split("-");
  return parts[parts.length - 1] || "TRUCK";
}

// Generate service description from booking
function generateServiceDesc(booking: Booking): string {
  const type = booking.deliveryType || "Domestic";
  const mode = extractMode(booking.trackingNo);
  return `${type} delivery (${mode}) from ${booking.pickup} to ${booking.dropoff}`;
}

// Determine company from booking (in future this could come from booking.company)
function determineCompany(booking: Booking, index: number): string {
  const companies = ["CCE", "ZNICF", "JLCS"];
  // Use booking ID to consistently assign company
  const seed = createSeed(booking.id);
  const companyIndex = Math.floor((seed % 100) / 34); // Distribute across 3 companies
  return companies[Math.min(companyIndex, 2)];
}

// Generate financial record for a single booking
function generateFinancialRecord(booking: Booking, index: number): MockFinancialRecord {
  // Create consistent random number generator for this booking
  const seed = createSeed(booking.id + booking.deliveryDate);
  const rng = seededRandom(seed);
  
  // Determine revenue based on mode/type
  const mode = extractMode(booking.trackingNo);
  const type = booking.deliveryType || "Domestic";
  
  let revenueMin = 4000;
  let revenueMax = 25000;
  
  if (mode === "SEA" || type === "Import") {
    revenueMin = 35000;
    revenueMax = 120000;
  } else if (mode === "AIR") {
    revenueMin = 8000;
    revenueMax = 45000;
  } else if (type === "Export") {
    revenueMin = 15000;
    revenueMax = 60000;
  }
  
  const revenue = round(randomInRange(revenueMin, revenueMax, rng));
  
  // Calculate expenses
  const itemizedCostPercent = randomInRange(0.18, 0.35, rng);
  const itemizedCost = round(revenue * itemizedCostPercent);
  
  // Op expenses scale with revenue
  let opExpenseMin = 800;
  let opExpenseMax = 3000;
  if (revenue > 50000) {
    opExpenseMin = 5000;
    opExpenseMax = 12000;
  } else if (revenue > 20000) {
    opExpenseMin = 2000;
    opExpenseMax = 8000;
  }
  const opExpenses = round(randomInRange(opExpenseMin, opExpenseMax, rng));
  
  // Admin cost is 3% of revenue
  const adminCost = round(revenue * 0.03);
  
  const totalExpenses = round(itemizedCost + opExpenses + adminCost);
  
  // Determine payment status and collected amount
  const paymentRoll = rng();
  let paymentStatus: "PAID" | "UNPAID" | "PARTIAL";
  let collectedAmount: number;
  
  if (paymentRoll < 0.70) {
    // 70% fully paid
    paymentStatus = "PAID";
    collectedAmount = revenue;
  } else if (paymentRoll < 0.90) {
    // 20% partial
    paymentStatus = "PARTIAL";
    collectedAmount = round(revenue * randomInRange(0.40, 0.85, rng));
  } else {
    // 10% unpaid
    paymentStatus = "UNPAID";
    collectedAmount = 0;
  }
  
  // Calculate profit
  const profit = Math.max(0, round(collectedAmount - totalExpenses));
  const profitMargin = collectedAmount > 0 ? round((profit / collectedAmount) * 100) : 0;
  
  // Generate billing reference
  const trackingParts = booking.trackingNo.split("-");
  const lastPart = trackingParts[trackingParts.length - 2] || "001";
  const billingReference = paymentStatus === "PAID" 
    ? `INV-${lastPart}` 
    : paymentStatus === "PARTIAL"
    ? `INV-${lastPart} (Partial)`
    : "—";
  
  return {
    bookingId: booking.id,
    bookingNo: booking.trackingNo,
    date: new Date(booking.deliveryDate).toLocaleDateString("en-US", { 
      month: "short", 
      day: "numeric", 
      year: "numeric" 
    }),
    clientName: booking.client,
    companyName: determineCompany(booking, index),
    serviceDesc: generateServiceDesc(booking),
    revenue,
    itemizedCost,
    opExpenses,
    adminCost,
    totalExpenses,
    collectedAmount,
    profit,
    profitMargin,
    paymentStatus,
    billingReference,
  };
}

// Main function: Build mock financials from bookings list
export function buildMockFinancialsFromBookings(
  bookings: Booking[]
): MockFinancialRecord[] {
  return bookings.map((booking, index) => generateFinancialRecord(booking, index));
}

// Format currency
export function formatCurrency(amount: number): string {
  return `₱${amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// Helper to sum a field across records
export function sumField(records: MockFinancialRecord[], field: keyof MockFinancialRecord): number {
  return round(records.reduce((sum, record) => {
    const value = record[field];
    return sum + (typeof value === "number" ? value : 0);
  }, 0));
}
