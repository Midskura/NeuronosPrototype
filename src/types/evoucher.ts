// E-Voucher System Types

export type EVoucherStatus = 
  | "draft"           // Initial creation (lowercase to match backend)
  | "pending"         // Submitted, awaiting Accounting approval
  | "posted"          // Approved and posted to ledger
  | "rejected"        // Rejected by Accounting
  | "cancelled"       // Cancelled by user
  | "Submitted"       // Legacy - keeping for backwards compatibility
  | "Under Review"    // Legacy
  | "Approved"        // Legacy
  | "Rejected"        // Legacy (capitalized)
  | "Processing"      // Legacy
  | "Disbursed"       // Legacy
  | "Recorded"        // Legacy
  | "Audited";        // Legacy

// Transaction Types - Universal E-Voucher System
export type EVoucherTransactionType = 
  | "expense"           // General expense voucher
  | "budget_request"    // Budget request from BD module
  | "cash_advance"      // Cash Advance for operations/staff
  | "collection"        // Collection entry
  | "billing"           // Billing adjustment
  | "adjustment"        // General adjustment
  | "reimbursement";    // Employee reimbursement

// Source Module - Which module created this E-Voucher
export type EVoucherSourceModule = 
  | "bd"                // Business Development
  | "operations"        // Operations
  | "accounting"        // Accounting
  | "pricing"           // Pricing
  | "hr"                // HR
  | "executive";        // Executive

// GL Account Categories for Financial Statements
export type GLCategory = 
  | "Revenue"         // Income Statement - Revenue
  | "Cost of Sales"   // Income Statement - COGS
  | "Operating Expenses" // Income Statement - OpEx
  | "Assets"          // Balance Sheet - Assets
  | "Liabilities"     // Balance Sheet - Liabilities
  | "Equity";         // Balance Sheet - Equity

// Sub-categories mapped to specific GL accounts
export type GLSubCategory = {
  // Revenue sub-categories
  Revenue: 
    | "Brokerage Income"
    | "Forwarding Income"
    | "Trucking Income"
    | "Warehousing Income"
    | "Documentation Fees"
    | "Other Service Income";
  
  // Cost of Sales sub-categories
  "Cost of Sales":
    | "Brokerage Costs"
    | "Forwarding Costs"
    | "Trucking Costs"
    | "Warehousing Costs"
    | "Port Charges"
    | "Customs Duties";
  
  // Operating Expenses sub-categories
  "Operating Expenses":
    | "Salaries & Wages"
    | "Office Rent"
    | "Utilities"
    | "Marketing & Advertising"
    | "Travel & Entertainment"
    | "Office Supplies"
    | "Professional Fees"
    | "Telecommunications"
    | "Depreciation"
    | "Miscellaneous";
  
  // Assets sub-categories
  Assets:
    | "Cash & Cash Equivalents"
    | "Accounts Receivable"
    | "Inventory"
    | "Prepaid Expenses"
    | "Property & Equipment"
    | "Other Assets";
  
  // Liabilities sub-categories
  Liabilities:
    | "Accounts Payable"
    | "Accrued Expenses"
    | "Loans Payable"
    | "Other Liabilities";
  
  // Equity sub-categories
  Equity:
    | "Capital"
    | "Retained Earnings"
    | "Drawings";
};

export type PaymentMethod = "Cash" | "Bank Transfer" | "Check" | "Credit Card" | "Online Payment";

export type PaymentType = "Full" | "Partial";

export type LiquidationStatus = "Yes" | "No" | "Pending";

// New Types for Billing Architecture
export type BillingStatus = "unbilled" | "billed" | "paid" | "partial";

export interface LinkedBilling {
  id: string; // The ID of the billing EVoucher being paid
  amount: number; // The amount applied to this billing
}

export interface EVoucherApprover {
  id: string;
  name: string;
  role: string;
  approved_at?: string;
  remarks?: string;
}

export interface EVoucherWorkflowHistory {
  id: string;
  timestamp: string;
  status: EVoucherStatus;
  user_name: string;
  user_role: string;
  action: string;
  remarks?: string;
}

export interface EVoucher {
  id: string;
  voucher_number: string; // e.g., EVRN-2025-001 or BR-001
  
  // Universal Transaction Fields
  transaction_type: EVoucherTransactionType; // Type of transaction
  source_module: EVoucherSourceModule; // Which module created this
  
  // Request Details
  requestor_id: string;
  requestor_name: string;
  requestor_department?: string; // BD, Operations, HR, etc.
  request_date: string;
  
  // Transaction Information (filled by requestor)
  amount: number;
  currency: string;
  purpose: string;
  description?: string;
  
  // GL Categorization (filled by Accounting during approval)
  gl_category?: GLCategory;
  gl_sub_category?: string; // Varies based on gl_category
  
  // Linking
  project_number?: string; // Booking ID
  customer_id?: string;
  customer_name?: string;
  budget_request_id?: string;
  budget_request_number?: string;
  parent_voucher_id?: string; // For linking liquidations/returns to original request
  
  // Billing & Collections Architecture (New Fields)
  statement_reference?: string; // ID for grouping billings (SOA)
  billing_status?: BillingStatus; // Lifecycle of a billing item
  remaining_balance?: number; // Amount left to be paid
  linked_billings?: LinkedBilling[]; // For collections: which billings this pays
  billable_item_reference?: string; // ID of source item (e.g. Quotation Charge ID)

  // Vendor Information (filled by requestor)
  vendor_id?: string;
  vendor_name: string;
  vendor_contact?: string;
  is_billable?: boolean; // Is this expense billable to the client?
  
  // Payment Terms (filled by requestor)
  credit_terms?: string;
  due_date?: string;
  payment_method?: PaymentMethod;
  payment_type?: PaymentType;
  source_account_id?: string; // ID of the bank/cash account
  
  // Approval Flow
  status: EVoucherStatus;
  current_approver_id?: string;
  current_approver_name?: string;
  approvers: EVoucherApprover[];
  
  // Treasury/Disbursement
  disbursement_officer_id?: string;
  disbursement_officer_name?: string;
  disbursement_date?: string;
  liquidation_status?: LiquidationStatus;
  source_of_funds?: string;
  
  // Accounting
  recorded_by_id?: string;
  recorded_by_name?: string;
  recorded_date?: string;
  
  // Audit
  audited_by_id?: string;
  audited_by_name?: string;
  audited_date?: string;
  pre_audit_remarks?: string;
  
  // Attachments & History
  attachments?: string[];
  workflow_history: EVoucherWorkflowHistory[];
  
  // Timestamps
  created_at: string;
  updated_at: string;
}

export interface EVoucherFilters {
  status?: EVoucherStatus | "all";
  transaction_type?: EVoucherTransactionType | "all"; // New filter
  source_module?: EVoucherSourceModule | "all"; // New filter
  gl_category?: GLCategory | "all";
  date_from?: string;
  date_to?: string;
  requestor_id?: string;
  customer_id?: string;
  search?: string;
}