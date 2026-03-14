
import { COANode, upsertAccount } from "./coa_structure.ts";

// ==================== INCOME STATEMENT DATA ====================

const INCOME_STATEMENT_DATA: COANode[] = [
  // ==================== REVENUE (INCOME) ====================
  {
    code: "4000",
    name: "Revenue",
    type: "Income",
    subtype: "Revenue",
    normal_balance: "credit",
    currency: "PHP",
    is_folder: true,
    children: [
      // BROKERAGE INCOME
      {
        code: "4100",
        name: "Brokerage Income",
        type: "Income",
        subtype: "Revenue",
        normal_balance: "credit",
        currency: "PHP",
        is_folder: true,
        children: [
            // Sub-accounts are dynamic in the image ("NAME OF SERVICES")
            // I will create a few placeholders as per common practice
            { code: "4100-001", name: "Customs Clearance Fees", type: "Income", subtype: "Revenue", normal_balance: "credit", currency: "PHP", is_folder: false },
            { code: "4100-002", name: "Documentation Fees", type: "Income", subtype: "Revenue", normal_balance: "credit", currency: "PHP", is_folder: false }
        ]
      },
      {
        code: "4190",
        name: "Discounts - Brokerage",
        type: "Income",
        subtype: "Revenue",
        normal_balance: "debit", // Contra-Revenue
        currency: "PHP",
        is_folder: false
      },
      // FORWARDING INCOME
      {
        code: "4200",
        name: "Forwarding Income",
        type: "Income",
        subtype: "Revenue",
        normal_balance: "credit",
        currency: "PHP",
        is_folder: true,
        children: [
            { code: "4200-001", name: "Sea Freight Revenue", type: "Income", subtype: "Revenue", normal_balance: "credit", currency: "PHP", is_folder: false },
            { code: "4200-002", name: "Air Freight Revenue", type: "Income", subtype: "Revenue", normal_balance: "credit", currency: "PHP", is_folder: false }
        ]
      },
      {
        code: "4290",
        name: "Discounts - Forwarding",
        type: "Income",
        subtype: "Revenue",
        normal_balance: "debit", // Contra-Revenue
        currency: "PHP",
        is_folder: false
      },
      // TRUCKING INCOME
      {
        code: "4300",
        name: "Trucking Income",
        type: "Income",
        subtype: "Revenue",
        normal_balance: "credit",
        currency: "PHP",
        is_folder: true,
        children: [
             { code: "4300-001", name: "Trucking Fees - Local", type: "Income", subtype: "Revenue", normal_balance: "credit", currency: "PHP", is_folder: false }
        ]
      },
      {
        code: "4390",
        name: "Discounts - Trucking",
        type: "Income",
        subtype: "Revenue",
        normal_balance: "debit", // Contra-Revenue
        currency: "PHP",
        is_folder: false
      },
      // OTHER INCOME
      {
        code: "4400",
        name: "Miscellaneous Income",
        type: "Income",
        subtype: "Revenue",
        normal_balance: "credit",
        currency: "PHP",
        is_folder: true,
        children: [
             { code: "4400-001", name: "Misc. Service Fees", type: "Income", subtype: "Revenue", normal_balance: "credit", currency: "PHP", is_folder: false }
        ]
      },
      {
        code: "4500",
        name: "Other Income",
        type: "Income",
        subtype: "Revenue",
        normal_balance: "credit",
        currency: "PHP",
        is_folder: true,
        children: [
             { code: "4500-001", name: "Interest Income", type: "Income", subtype: "Revenue", normal_balance: "credit", currency: "PHP", is_folder: false },
             { code: "4500-002", name: "Forex Gain/Loss", type: "Income", subtype: "Revenue", normal_balance: "credit", currency: "PHP", is_folder: false }
        ]
      }
    ]
  },

  // ==================== COST OF SERVICES ====================
  {
    code: "5000",
    name: "Cost of Services",
    type: "Expense",
    subtype: "Cost of Goods Sold",
    normal_balance: "debit",
    currency: "PHP",
    is_folder: true,
    children: [
        {
            code: "5100",
            name: "Brokerage Expenses",
            type: "Expense",
            subtype: "Cost of Goods Sold",
            normal_balance: "debit",
            currency: "PHP",
            is_folder: true,
            children: [
                { code: "5100-001", name: "Port Charges", type: "Expense", subtype: "Cost of Goods Sold", normal_balance: "debit", currency: "PHP", is_folder: false },
                { code: "5100-002", name: "Storage Fees", type: "Expense", subtype: "Cost of Goods Sold", normal_balance: "debit", currency: "PHP", is_folder: false }
            ]
        },
        {
            code: "5200",
            name: "Forwarding Expenses",
            type: "Expense",
            subtype: "Cost of Goods Sold",
            normal_balance: "debit",
            currency: "PHP",
            is_folder: true,
            children: [
                { code: "5200-001", name: "Ocean Freight Cost", type: "Expense", subtype: "Cost of Goods Sold", normal_balance: "debit", currency: "PHP", is_folder: false },
                { code: "5200-002", name: "Air Freight Cost", type: "Expense", subtype: "Cost of Goods Sold", normal_balance: "debit", currency: "PHP", is_folder: false }
            ]
        },
        {
            code: "5300",
            name: "Trucking Expenses",
            type: "Expense",
            subtype: "Cost of Goods Sold",
            normal_balance: "debit",
            currency: "PHP",
            is_folder: true,
            children: [
                { code: "5300-001", name: "Truck Rental Cost", type: "Expense", subtype: "Cost of Goods Sold", normal_balance: "debit", currency: "PHP", is_folder: false },
                { code: "5300-002", name: "Driver Allowances (Direct)", type: "Expense", subtype: "Cost of Goods Sold", normal_balance: "debit", currency: "PHP", is_folder: false }
            ]
        },
        {
            code: "5400",
            name: "Miscellaneous Expenses (Direct)",
            type: "Expense",
            subtype: "Cost of Goods Sold",
            normal_balance: "debit",
            currency: "PHP",
            is_folder: true,
            children: [
                 { code: "5400-001", name: "Other Direct Costs", type: "Expense", subtype: "Cost of Goods Sold", normal_balance: "debit", currency: "PHP", is_folder: false }
            ]
        }
    ]
  },

  // ==================== OPERATING EXPENSES ====================
  {
    code: "6000",
    name: "Operating Expenses",
    type: "Expense",
    subtype: "Operating Expenses",
    normal_balance: "debit",
    currency: "PHP",
    is_folder: true,
    children: [
        { code: "6001", name: "Sales Commission", type: "Expense", subtype: "Operating Expenses", normal_balance: "debit", currency: "PHP", is_folder: false },
        
        // ADVERTISING / MARKETING
        {
            code: "6100",
            name: "Advertising / Marketing",
            type: "Expense",
            subtype: "Operating Expenses",
            normal_balance: "debit",
            currency: "PHP",
            is_folder: true,
            children: [
                { code: "6100-001", name: "Sponsorship", type: "Expense", subtype: "Operating Expenses", normal_balance: "debit", currency: "PHP", is_folder: false },
                { code: "6100-002", name: "Business Profile", type: "Expense", subtype: "Operating Expenses", normal_balance: "debit", currency: "PHP", is_folder: false },
                { code: "6100-003", name: "Marketing Kits", type: "Expense", subtype: "Operating Expenses", normal_balance: "debit", currency: "PHP", is_folder: false },
                { code: "6100-004", name: "Business Card", type: "Expense", subtype: "Operating Expenses", normal_balance: "debit", currency: "PHP", is_folder: false }
            ]
        },

        // TRAVELS AND ENTERTAINMENT
        {
            code: "6200",
            name: "Travels and Entertainment",
            type: "Expense",
            subtype: "Operating Expenses",
            normal_balance: "debit",
            currency: "PHP",
            is_folder: true,
            children: [
                { code: "6200-001", name: "Airfare", type: "Expense", subtype: "Operating Expenses", normal_balance: "debit", currency: "PHP", is_folder: false },
                { code: "6200-002", name: "Land Fare", type: "Expense", subtype: "Operating Expenses", normal_balance: "debit", currency: "PHP", is_folder: false },
                { code: "6200-003", name: "Accommodation", type: "Expense", subtype: "Operating Expenses", normal_balance: "debit", currency: "PHP", is_folder: false },
                { code: "6200-004", name: "Foods", type: "Expense", subtype: "Operating Expenses", normal_balance: "debit", currency: "PHP", is_folder: false },
                { code: "6200-005", name: "Gifts/Tokens", type: "Expense", subtype: "Operating Expenses", normal_balance: "debit", currency: "PHP", is_folder: false }
            ]
        },

        // TRAINING AND DEVELOPMENT
        {
            code: "6300",
            name: "Training and Development",
            type: "Expense",
            subtype: "Operating Expenses",
            normal_balance: "debit",
            currency: "PHP",
            is_folder: true,
            children: [
                { code: "6300-001", name: "Professional Fee", type: "Expense", subtype: "Operating Expenses", normal_balance: "debit", currency: "PHP", is_folder: false },
                { code: "6300-002", name: "Venue", type: "Expense", subtype: "Operating Expenses", normal_balance: "debit", currency: "PHP", is_folder: false },
                { code: "6300-003", name: "Foods", type: "Expense", subtype: "Operating Expenses", normal_balance: "debit", currency: "PHP", is_folder: false }
            ]
        },

        // TALENT ACQUISITION
        {
            code: "6400",
            name: "Talent Acquisition & Recruitment",
            type: "Expense",
            subtype: "Operating Expenses",
            normal_balance: "debit",
            currency: "PHP",
            is_folder: true,
            children: [
                { code: "6400-001", name: "Job Ads", type: "Expense", subtype: "Operating Expenses", normal_balance: "debit", currency: "PHP", is_folder: false }
            ]
        },

        // EMPLOYEE ENGAGEMENT
        {
            code: "6500",
            name: "Employee Engagement & Relations",
            type: "Expense",
            subtype: "Operating Expenses",
            normal_balance: "debit",
            currency: "PHP",
            is_folder: true,
            children: [
                { code: "6500-001", name: "Bonuses", type: "Expense", subtype: "Operating Expenses", normal_balance: "debit", currency: "PHP", is_folder: false },
                { code: "6500-002", name: "Incentives/Rewards", type: "Expense", subtype: "Operating Expenses", normal_balance: "debit", currency: "PHP", is_folder: false }
            ]
        },

        // HEALTH & SAFETY
        {
            code: "6600",
            name: "Health & Safety",
            type: "Expense",
            subtype: "Operating Expenses",
            normal_balance: "debit",
            currency: "PHP",
            is_folder: true,
            children: [
                { code: "6600-001", name: "Medicines", type: "Expense", subtype: "Operating Expenses", normal_balance: "debit", currency: "PHP", is_folder: false },
                { code: "6600-002", name: "PPE/Equipment", type: "Expense", subtype: "Operating Expenses", normal_balance: "debit", currency: "PHP", is_folder: false }
            ]
        },

        // CSR
        {
            code: "6700",
            name: "Corporate Social Responsibility",
            type: "Expense",
            subtype: "Operating Expenses",
            normal_balance: "debit",
            currency: "PHP",
            is_folder: true,
            children: [
                { code: "6700-001", name: "Donations (Cash/Goods)", type: "Expense", subtype: "Operating Expenses", normal_balance: "debit", currency: "PHP", is_folder: false }
            ]
        },

        // TRADE SHOW
        {
            code: "6800",
            name: "Trade Show and Conference",
            type: "Expense",
            subtype: "Operating Expenses",
            normal_balance: "debit",
            currency: "PHP",
            is_folder: true,
            children: [
                { code: "6800-001", name: "Registration Fees", type: "Expense", subtype: "Operating Expenses", normal_balance: "debit", currency: "PHP", is_folder: false }
            ]
        },

        // TRUCKING MAINT
        {
            code: "6900",
            name: "Trucking Maintenance and Repairs",
            type: "Expense",
            subtype: "Operating Expenses",
            normal_balance: "debit",
            currency: "PHP",
            is_folder: true,
            children: [
                { code: "6900-001", name: "Preventive Maintenance Service (PMS)", type: "Expense", subtype: "Operating Expenses", normal_balance: "debit", currency: "PHP", is_folder: false },
                { code: "6900-002", name: "Parts and Equipment", type: "Expense", subtype: "Operating Expenses", normal_balance: "debit", currency: "PHP", is_folder: false },
                { code: "6900-003", name: "Vulcanizing", type: "Expense", subtype: "Operating Expenses", normal_balance: "debit", currency: "PHP", is_folder: false }
            ]
        },

        // OFFICE MAINTENANCE
        {
            code: "7000",
            name: "Office Maintenance",
            type: "Expense",
            subtype: "Operating Expenses",
            normal_balance: "debit",
            currency: "PHP",
            is_folder: true,
            children: [
                { code: "7000-001", name: "Cleaning Materials & Supplies", type: "Expense", subtype: "Operating Expenses", normal_balance: "debit", currency: "PHP", is_folder: false },
                { code: "7000-002", name: "Repairs", type: "Expense", subtype: "Operating Expenses", normal_balance: "debit", currency: "PHP", is_folder: false }
            ]
        },

        // PERMITS
        {
            code: "7100",
            name: "Permits & Licenses",
            type: "Expense",
            subtype: "Operating Expenses",
            normal_balance: "debit",
            currency: "PHP",
            is_folder: true,
            children: [
                { code: "7100-001", name: "Business Permit", type: "Expense", subtype: "Operating Expenses", normal_balance: "debit", currency: "PHP", is_folder: false },
                { code: "7100-002", name: "Sanitary Permit", type: "Expense", subtype: "Operating Expenses", normal_balance: "debit", currency: "PHP", is_folder: false },
                { code: "7100-003", name: "Fire Certification", type: "Expense", subtype: "Operating Expenses", normal_balance: "debit", currency: "PHP", is_folder: false }
            ]
        },
        
        // OFFICE IMPROVEMENTS
        {
            code: "7200",
            name: "Office Improvements / Renovation",
            type: "Expense",
            subtype: "Operating Expenses",
            normal_balance: "debit",
            currency: "PHP",
            is_folder: true,
            children: [
                 { code: "7200-001", name: "Construction Materials", type: "Expense", subtype: "Operating Expenses", normal_balance: "debit", currency: "PHP", is_folder: false },
                 { code: "7200-002", name: "Labor Fees", type: "Expense", subtype: "Operating Expenses", normal_balance: "debit", currency: "PHP", is_folder: false }
            ]
        },

        // TAXES PAID
        {
            code: "7300",
            name: "Taxes Paid",
            type: "Expense",
            subtype: "Operating Expenses",
            normal_balance: "debit",
            currency: "PHP",
            is_folder: true,
            children: [
                 { code: "7300-001", name: "Income Tax", type: "Expense", subtype: "Operating Expenses", normal_balance: "debit", currency: "PHP", is_folder: false },
                 { code: "7300-002", name: "Value Added Tax (Expense portion)", type: "Expense", subtype: "Operating Expenses", normal_balance: "debit", currency: "PHP", is_folder: false }
            ]
        },

        // EMPLOYEES ALLOWANCES
        {
            code: "7400",
            name: "Employees Allowances",
            type: "Expense",
            subtype: "Operating Expenses",
            normal_balance: "debit",
            currency: "PHP",
            is_folder: true,
            children: [
                 { code: "7400-001", name: "Gas Allowance", type: "Expense", subtype: "Operating Expenses", normal_balance: "debit", currency: "PHP", is_folder: false },
                 { code: "7400-002", name: "Meal Allowance", type: "Expense", subtype: "Operating Expenses", normal_balance: "debit", currency: "PHP", is_folder: false },
                 { code: "7400-003", name: "Parking Allowance", type: "Expense", subtype: "Operating Expenses", normal_balance: "debit", currency: "PHP", is_folder: false }
            ]
        },

        // COMPENSATION & BENEFITS
        {
            code: "7500",
            name: "Compensation & Benefits",
            type: "Expense",
            subtype: "Operating Expenses",
            normal_balance: "debit",
            currency: "PHP",
            is_folder: true,
            children: [
                 { code: "7500-001", name: "Salaries and Wages", type: "Expense", subtype: "Operating Expenses", normal_balance: "debit", currency: "PHP", is_folder: false },
                 { code: "7500-002", name: "SSS/PhilHealth/Pag-IBIG (Employer Share)", type: "Expense", subtype: "Operating Expenses", normal_balance: "debit", currency: "PHP", is_folder: false },
                 { code: "7500-003", name: "HMO", type: "Expense", subtype: "Operating Expenses", normal_balance: "debit", currency: "PHP", is_folder: false }
            ]
        },

        // RENT/LEASE
        {
            code: "7600",
            name: "Rent / Lease",
            type: "Expense",
            subtype: "Operating Expenses",
            normal_balance: "debit",
            currency: "PHP",
            is_folder: true,
            children: [
                 { code: "7600-001", name: "Office Rental", type: "Expense", subtype: "Operating Expenses", normal_balance: "debit", currency: "PHP", is_folder: false },
                 { code: "7600-002", name: "Garage Rental", type: "Expense", subtype: "Operating Expenses", normal_balance: "debit", currency: "PHP", is_folder: false }
            ]
        },
        
        // UTILITIES
        {
            code: "7700",
            name: "Utilities",
            type: "Expense",
            subtype: "Operating Expenses",
            normal_balance: "debit",
            currency: "PHP",
            is_folder: true,
            children: [
                 { code: "7700-001", name: "Internet", type: "Expense", subtype: "Operating Expenses", normal_balance: "debit", currency: "PHP", is_folder: false },
                 { code: "7700-002", name: "Electricity", type: "Expense", subtype: "Operating Expenses", normal_balance: "debit", currency: "PHP", is_folder: false },
                 { code: "7700-003", name: "Water", type: "Expense", subtype: "Operating Expenses", normal_balance: "debit", currency: "PHP", is_folder: false }
            ]
        },
        
        // INSURANCE
        {
            code: "7800",
            name: "Insurance",
            type: "Expense",
            subtype: "Operating Expenses",
            normal_balance: "debit",
            currency: "PHP",
            is_folder: true,
            children: [
                 { code: "7800-001", name: "Fire Insurance", type: "Expense", subtype: "Operating Expenses", normal_balance: "debit", currency: "PHP", is_folder: false },
                 { code: "7800-002", name: "Vehicle Insurance", type: "Expense", subtype: "Operating Expenses", normal_balance: "debit", currency: "PHP", is_folder: false }
            ]
        },
        
        // OFFICE SUPPLIES
        { code: "7900", name: "Office Supplies Expense", type: "Expense", subtype: "Operating Expenses", normal_balance: "debit", currency: "PHP", is_folder: false },
        
        // PROFESSIONAL FEES
        {
             code: "8000",
             name: "Professional Fees",
             type: "Expense",
             subtype: "Operating Expenses",
             normal_balance: "debit",
             currency: "PHP",
             is_folder: true,
             children: [
                  { code: "8000-001", name: "Accountant Fee", type: "Expense", subtype: "Operating Expenses", normal_balance: "debit", currency: "PHP", is_folder: false },
                  { code: "8000-002", name: "Legal Fee", type: "Expense", subtype: "Operating Expenses", normal_balance: "debit", currency: "PHP", is_folder: false }
             ]
        },
        
        // SOFTWARE
        {
             code: "8100",
             name: "Software / Technology Subscription",
             type: "Expense",
             subtype: "Operating Expenses",
             normal_balance: "debit",
             currency: "PHP",
             is_folder: true,
             children: [
                  { code: "8100-001", name: "QuickBooks", type: "Expense", subtype: "Operating Expenses", normal_balance: "debit", currency: "PHP", is_folder: false },
                  { code: "8100-002", name: "Google Workspace", type: "Expense", subtype: "Operating Expenses", normal_balance: "debit", currency: "PHP", is_folder: false },
                  { code: "8100-003", name: "Server Domain", type: "Expense", subtype: "Operating Expenses", normal_balance: "debit", currency: "PHP", is_folder: false }
             ]
        },

        // INTEREST EXPENSE
        {
            code: "8200",
            name: "Interest Expense",
            type: "Expense",
            subtype: "Operating Expenses",
            normal_balance: "debit",
            currency: "PHP",
            is_folder: true,
            children: [
                 { code: "8200-001", name: "Credit Card Interest", type: "Expense", subtype: "Operating Expenses", normal_balance: "debit", currency: "PHP", is_folder: false },
                 { code: "8200-002", name: "Loan Interest", type: "Expense", subtype: "Operating Expenses", normal_balance: "debit", currency: "PHP", is_folder: false }
            ]
        },

        // DEPRECIATION
        {
            code: "8300",
            name: "Depreciation Expense",
            type: "Expense",
            subtype: "Operating Expenses",
            normal_balance: "debit",
            currency: "PHP",
            is_folder: true,
            children: [
                 { code: "8300-001", name: "Furnitures and Fixtures", type: "Expense", subtype: "Operating Expenses", normal_balance: "debit", currency: "PHP", is_folder: false },
                 { code: "8300-002", name: "Equipment", type: "Expense", subtype: "Operating Expenses", normal_balance: "debit", currency: "PHP", is_folder: false },
                 { code: "8300-003", name: "Vehicle", type: "Expense", subtype: "Operating Expenses", normal_balance: "debit", currency: "PHP", is_folder: false }
            ]
        },

        // OTHER FIXED / UNCATEGORIZED
        { code: "9000", name: "Other Fixed Expenses", type: "Expense", subtype: "Operating Expenses", normal_balance: "debit", currency: "PHP", is_folder: false },
        { code: "9999", name: "Uncategorized Expense", type: "Expense", subtype: "Operating Expenses", normal_balance: "debit", currency: "PHP", is_folder: false }
    ]
  }
];

export async function seedIncomeStatement() {
  console.log("🌱 Starting Income Statement COA Seeding...");
  
  let count = 0;
  
  // Iterate through top-level nodes
  for (const node of INCOME_STATEMENT_DATA) {
    await upsertAccount(node);
    count++;
  }
  
  console.log("✅ Income Statement COA Seeding Completed.");
  return { success: true, message: "Income Statement seeded successfully" };
}
