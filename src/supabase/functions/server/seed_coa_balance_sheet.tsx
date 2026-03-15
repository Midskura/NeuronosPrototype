
import { COANode, upsertAccount } from "./coa_structure.ts";

// ==================== BALANCE SHEET DATA (Neuron-Style) ====================
// Based on Freight Forwarding standards and strict Currency Folder logic

const BALANCE_SHEET_DATA: COANode[] = [
  // ==================== ASSETS ====================
  {
    code: "1000",
    name: "Cash and Cash Equivalents",
    type: "Asset",
    subtype: "Cash and Cash Equivalents",
    normal_balance: "debit",
    currency: "PHP",
    is_folder: true,
    children: [
      // PHP CASH
      {
        code: "1010",
        name: "Cash on Hand - PHP",
        type: "Asset",
        subtype: "Cash and Cash Equivalents",
        normal_balance: "debit",
        currency: "PHP",
        is_folder: true,
        children: [
          {
            code: "1010-001",
            name: "Petty Cash Fund - PHP (Main)",
            type: "Asset",
            subtype: "Cash and Cash Equivalents",
            normal_balance: "debit",
            currency: "PHP",
            is_folder: false,
          },
          {
            code: "1010-002",
            name: "Revolving Fund - Operations",
            type: "Asset",
            subtype: "Cash and Cash Equivalents",
            normal_balance: "debit",
            currency: "PHP",
            is_folder: false,
          }
        ]
      },
      // USD CASH
      {
        code: "1020",
        name: "Cash on Hand - USD",
        type: "Asset",
        subtype: "Cash and Cash Equivalents",
        normal_balance: "debit",
        currency: "USD",
        is_folder: true,
        children: [
          {
            code: "1020-001",
            name: "Petty Cash Fund - USD",
            type: "Asset",
            subtype: "Cash and Cash Equivalents",
            normal_balance: "debit",
            currency: "USD",
            is_folder: false,
          }
        ]
      },
      // PHP BANKS
      {
        code: "1030",
        name: "Cash in Bank - PHP",
        type: "Asset",
        subtype: "Cash and Cash Equivalents",
        normal_balance: "debit",
        currency: "PHP",
        is_folder: true,
        children: [
          {
            code: "1030-001",
            name: "BDO Savings - PHP",
            type: "Asset",
            subtype: "Cash and Cash Equivalents",
            normal_balance: "debit",
            currency: "PHP",
            is_folder: false,
          },
          {
            code: "1030-002",
            name: "BPI Current - PHP",
            type: "Asset",
            subtype: "Cash and Cash Equivalents",
            normal_balance: "debit",
            currency: "PHP",
            is_folder: false,
          }
        ]
      },
      // USD BANKS
      {
        code: "1040",
        name: "Cash in Bank - USD",
        type: "Asset",
        subtype: "Cash and Cash Equivalents",
        normal_balance: "debit",
        currency: "USD",
        is_folder: true,
        children: [
          {
            code: "1040-001",
            name: "BDO Savings - USD",
            type: "Asset",
            subtype: "Cash and Cash Equivalents",
            normal_balance: "debit",
            currency: "USD",
            is_folder: false,
          }
        ]
      }
    ]
  },
  {
    code: "1200",
    name: "Trade and Other Receivables",
    type: "Asset",
    subtype: "Accounts Receivable",
    normal_balance: "debit",
    currency: "PHP",
    is_folder: true,
    children: [
      {
        code: "1201",
        name: "Accounts Receivable - Trade",
        type: "Asset",
        subtype: "Accounts Receivable",
        normal_balance: "debit",
        currency: "PHP",
        is_folder: false,
      },
      {
        code: "1202",
        name: "Advances to Employees",
        type: "Asset",
        subtype: "Other Receivables",
        normal_balance: "debit",
        currency: "PHP",
        is_folder: true, // Will contain sub-accounts per employee later
        children: [
            {
                code: "1202-000",
                name: "General Advances",
                type: "Asset",
                subtype: "Other Receivables",
                normal_balance: "debit",
                currency: "PHP",
                is_folder: false
            }
        ]
      },
      {
        code: "1203",
        name: "Advances to Suppliers",
        type: "Asset",
        subtype: "Other Receivables",
        normal_balance: "debit",
        currency: "PHP",
        is_folder: false,
      }
    ]
  },
  {
    code: "1500",
    name: "Property and Equipment",
    type: "Asset",
    subtype: "Property, Plant and Equipment",
    normal_balance: "debit",
    currency: "PHP",
    is_folder: true,
    children: [
      {
        code: "1501",
        name: "Office Equipment",
        type: "Asset",
        subtype: "Property, Plant and Equipment",
        normal_balance: "debit",
        currency: "PHP",
        is_folder: false,
      },
      {
        code: "1502",
        name: "Furniture and Fixtures",
        type: "Asset",
        subtype: "Property, Plant and Equipment",
        normal_balance: "debit",
        currency: "PHP",
        is_folder: false,
      },
      {
        code: "1503",
        name: "Transportation Equipment",
        type: "Asset",
        subtype: "Property, Plant and Equipment",
        normal_balance: "debit",
        currency: "PHP",
        is_folder: false,
      }
    ]
  },
  
  // ==================== LIABILITIES ====================
  {
    code: "2000",
    name: "Current Liabilities",
    type: "Liability",
    subtype: "Current Liabilities",
    normal_balance: "credit",
    currency: "PHP",
    is_folder: true,
    children: [
      {
        code: "2100",
        name: "Accounts Payable",
        type: "Liability",
        subtype: "Accounts Payable",
        normal_balance: "credit",
        currency: "PHP",
        is_folder: true,
        children: [
          {
            code: "2101",
            name: "Accounts Payable - Trade",
            type: "Liability",
            subtype: "Accounts Payable",
            normal_balance: "credit",
            currency: "PHP",
            is_folder: false,
          },
          {
            code: "2102",
            name: "Accounts Payable - Non-Trade",
            type: "Liability",
            subtype: "Accounts Payable",
            normal_balance: "credit",
            currency: "PHP",
            is_folder: false,
          }
        ]
      },
      {
        code: "2200",
        name: "Due to Government Agencies",
        type: "Liability",
        subtype: "Taxes Payable",
        normal_balance: "credit",
        currency: "PHP",
        is_folder: true,
        children: [
          {
            code: "2201",
            name: "BIR Payable (Withholding Tax)",
            type: "Liability",
            subtype: "Taxes Payable",
            normal_balance: "credit",
            currency: "PHP",
            is_folder: false,
          },
          {
            code: "2202",
            name: "SSS Payable",
            type: "Liability",
            subtype: "Taxes Payable",
            normal_balance: "credit",
            currency: "PHP",
            is_folder: false,
          },
          {
            code: "2203",
            name: "PhilHealth Payable",
            type: "Liability",
            subtype: "Taxes Payable",
            normal_balance: "credit",
            currency: "PHP",
            is_folder: false,
          },
          {
            code: "2204",
            name: "Pag-IBIG Payable",
            type: "Liability",
            subtype: "Taxes Payable",
            normal_balance: "credit",
            currency: "PHP",
            is_folder: false,
          }
        ]
      }
    ]
  },
  
  // ==================== EQUITY ====================
  {
    code: "3000",
    name: "Equity",
    type: "Equity",
    subtype: "Equity",
    normal_balance: "credit",
    currency: "PHP",
    is_folder: true,
    children: [
      {
        code: "3100",
        name: "Share Capital",
        type: "Equity",
        subtype: "Equity",
        normal_balance: "credit",
        currency: "PHP",
        is_folder: false,
      },
      {
        code: "3200",
        name: "Retained Earnings",
        type: "Equity",
        subtype: "Equity",
        normal_balance: "credit",
        currency: "PHP",
        is_folder: false,
      }
    ]
  }
];

export async function seedBalanceSheet() {
  console.log("🌱 Starting Balance Sheet COA Seeding...");
  
  let count = 0;
  
  // Iterate through top-level nodes
  for (const node of BALANCE_SHEET_DATA) {
    await upsertAccount(node);
    count++;
  }
  
  console.log("✅ Balance Sheet COA Seeding Completed.");
  return { success: true, message: "Balance Sheet seeded successfully" };
}
