// Accounting Module API Handlers - Clean & Consolidated (RELATIONAL)
// Handles Expenses, Collections, and Billings with consistent patterns
// Fully rewired from KV store to relational Supabase tables.

import type { Context } from "npm:hono";
import { db, mergeFromRow } from "./db.ts";

// ==================== COLUMN DEFINITIONS ====================

const ACCOUNT_COLS = [
  "id", "code", "name", "type", "sub_type", "category", "sub_category",
  "description", "parent_id", "balance", "normal_balance", "is_active",
  "is_system", "sort_order", "created_at", "updated_at",
  // Legacy aliases the KV data may carry:
  "subtype", "is_folder",
];

const JOURNAL_ENTRY_COLS = [
  "id", "entry_number", "entry_date", "evoucher_id", "invoice_id",
  "collection_id", "booking_id", "project_number", "customer_name",
  "description", "reference", "lines", "total_debit", "total_credit",
  "status", "created_by", "created_at", "updated_at",
];

const TRANSACTION_COLS = [
  "id", "date", "debit_account_id", "credit_account_id", "description",
  "reference", "amount", "type", "category", "journal_entry_id",
  "evoucher_id", "status", "is_reconciled", "created_by",
  "created_at", "updated_at",
];

const INVOICE_COLS = [
  "id", "invoice_number", "invoice_date", "booking_id", "booking_ids",
  "project_id", "project_number", "customer_id", "customer_name",
  "service_types", "subtotal", "tax_amount", "total_amount", "currency",
  "status", "posted", "posted_at", "journal_entry_id", "evoucher_id",
  "billing_item_ids", "notes", "created_by", "created_at", "updated_at",
];

const BILLING_LINE_ITEM_COLS = [
  "id", "invoice_id", "invoice_number", "booking_id", "project_id",
  "evoucher_id", "description", "charge_type", "category", "service_type",
  "customer_name", "project_number", "amount", "quantity", "unit_price",
  "currency", "unit_type", "is_taxed", "tax_code", "tax_amount", "status",
  "catalog_item_id", "notes", "created_at", "updated_at",
];

const COLLECTION_COLS = [
  "id", "collection_number", "booking_id", "booking_ids", "project_id",
  "project_number", "customer_id", "customer_name", "invoice_id",
  "evoucher_id", "service_types", "amount", "currency", "payment_method",
  "reference_number", "collection_date", "status", "posted", "posted_at",
  "journal_entry_id", "notes", "created_by", "created_at", "updated_at",
];

const EXPENSE_COLS = [
  "id", "booking_id", "project_id", "project_number", "evoucher_id",
  "customer_name", "description", "category", "charge_type", "service_type",
  "amount", "quantity", "unit_price", "currency", "unit_type",
  "is_taxed", "tax_code", "status", "catalog_item_id", "vendor_name",
  "receipt_number", "notes", "created_by", "created_at", "updated_at",
];

/** Pick only known columns from an object (prevents PostgREST column errors) */
function pick(obj: Record<string, any>, cols: string[]): Record<string, any> {
  const result: Record<string, any> = {};
  for (const col of cols) {
    if (obj[col] !== undefined) result[col] = obj[col];
  }
  return result;
}

// ==================== UTILITIES ====================

/**
 * Build lookup maps from projects and bookings for enriching financial records.
 */
async function buildProjectLookupMaps() {
  const { data: projects } = await db.from("projects").select("*");
  const allProjects = (projects || []).map((r: any) => mergeFromRow(r));

  const projectMap = new Map<string, { customer_name: string; customer_id: string; quotation_number: string }>();
  const projectIdToNumber = new Map<string, string>();

  for (const p of allProjects) {
    const pn = p.project_number || p.id;
    const meta = {
      customer_name: p.customer_name || "",
      customer_id: p.customer_id || "",
      quotation_number: p.quotation_number || "",
    };
    projectMap.set(pn, meta);
    if (p.id && p.id !== pn) {
      projectIdToNumber.set(p.id, pn);
      projectMap.set(p.id, meta);
    }
  }

  // Fetch all bookings from the unified bookings table
  const { data: bookingRows } = await db.from("bookings").select("*");
  const allBookings = (bookingRows || []).map((r: any) => mergeFromRow(r));

  const bookingToProjectMap = new Map<string, string>();
  const bookingServiceTypeMap = new Map<string, string>();

  for (const b of allBookings) {
    const bid = b.bookingId || b.booking_number || b.id;
    const pn = b.projectNumber || b.project_number;
    if (bid && pn) bookingToProjectMap.set(bid, pn);
    if (bid) {
      const svcType = b.serviceType || b.service_type || "Others";
      bookingServiceTypeMap.set(bid, svcType);
    }
  }

  const bookingCustomerMap = new Map<string, { customer_name: string; customer_id: string; quotation_number: string }>();
  for (const b of allBookings) {
    const bid = b.bookingId || b.booking_number || b.id;
    const custName = b.customerName || b.customer_name || "";
    const custId = b.customerId || b.customer_id || "";
    if (bid && custName) {
      bookingCustomerMap.set(bid, {
        customer_name: custName,
        customer_id: custId,
        quotation_number: b.quotationNumber || b.quotation_number || "",
      });
    }
  }

  return { projectMap, bookingToProjectMap, projectIdToNumber, bookingCustomerMap, bookingServiceTypeMap };
}

/**
 * Enrich an array of financial records with project metadata.
 */
function enrichRecords(
  records: any[],
  projectMap: Map<string, { customer_name: string; customer_id: string; quotation_number: string }>,
  bookingToProjectMap: Map<string, string>,
  bookingCustomerMap: Map<string, { customer_name: string; customer_id: string; quotation_number: string }>,
  projectIdToNumber: Map<string, string>,
  bookingServiceTypeMap?: Map<string, string>
): any[] {
  return records.map(record => {
    const bookingId = record.booking_id || record.bookingId || "";
    const projectNumber = record.project_number || record.projectNumber || "";
    const projectId = record.project_id || "";

    let resolvedProjectNumber = projectNumber;
    if (!resolvedProjectNumber && projectId && projectMap.has(projectId)) {
      resolvedProjectNumber = projectIdToNumber.get(projectId) || projectId;
    }
    if (!resolvedProjectNumber && bookingId) {
      resolvedProjectNumber = bookingToProjectMap.get(bookingId) || "";
    }
    if (!resolvedProjectNumber && bookingId && projectMap.has(bookingId)) {
      resolvedProjectNumber = projectIdToNumber.get(bookingId) || bookingId;
    }

    const projectMeta = projectMap.get(resolvedProjectNumber);
    const bookingMeta = bookingCustomerMap.get(bookingId);
    const existingServiceType = record.service_type || record.serviceType || "";
    const resolvedServiceType = existingServiceType || (bookingServiceTypeMap?.get(bookingId)) || "";

    return {
      ...record,
      booking_id: bookingId,
      project_number: resolvedProjectNumber,
      service_type: resolvedServiceType,
      has_project: !!resolvedProjectNumber,
      customer_name: record.customer_name || (projectMeta?.customer_name) || (bookingMeta?.customer_name) || "",
      customer_id: record.customer_id || (projectMeta?.customer_id) || (bookingMeta?.customer_id) || "",
      quotation_number: record.quotation_number || record.quotationNumber || (projectMeta?.quotation_number) || (bookingMeta?.quotation_number) || "",
    };
  });
}

function generateId(prefix: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 9);
  return `${prefix}-${timestamp}-${random}`;
}

async function generateInvoiceNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `INV-${year}-`;
  
  const { data: rows } = await db.from("invoices").select("invoice_number").ilike("invoice_number", `${prefix}%`);
  const nextNumber = (rows?.length || 0) + 1;
  return `${prefix}${String(nextNumber).padStart(3, '0')}`;
}

function errorResponse(c: Context, message: string, status: number = 500) {
  console.error(`Error: ${message}`);
  return c.json({ success: false, error: message }, status);
}

function successResponse(c: Context, data: any, status: number = 200) {
  return c.json({ success: true, data }, status);
}

async function validateEVoucherForPosting(evoucherId: string): Promise<{ valid: boolean; error?: string; evoucher?: any }> {
  const { data: row } = await db.from("evouchers").select("*").eq("id", evoucherId).maybeSingle();
  const evoucher = row ? mergeFromRow(row) : null;
  
  if (!evoucher) {
    return { valid: false, error: "E-Voucher not found" };
  }
  
  if (evoucher.status !== "Approved") {
    return { valid: false, error: "Only approved E-Vouchers can be posted" };
  }
  
  if (evoucher.posted_to_ledger) {
    return { valid: false, error: "E-Voucher has already been posted" };
  }
  
  return { valid: true, evoucher };
}

// Helper: get an account by ID
async function getAccount(accountId: string): Promise<any> {
  const { data } = await db.from("accounts").select("*").eq("id", accountId).maybeSingle();
  return data;
}

// Helper: save/update an account
async function saveAccount(account: any): Promise<void> {
  const row = pick(account, ACCOUNT_COLS);
  await db.from("accounts").upsert(row, { onConflict: "id" });
}

// Helper: save a journal entry
async function saveJournalEntry(je: any): Promise<void> {
  // Map KV field names to relational column names
  const mapped: any = {
    id: je.id,
    entry_date: je.transaction_date || je.entry_date || je.posted_at,
    description: je.description,
    reference: je.reference_number || je.reference,
    lines: je.lines,
    total_debit: je.total_amount || je.total_debit,
    total_credit: je.total_amount || je.total_credit,
    status: je.status,
    project_number: je.project_number,
    customer_name: je.customer_name,
    created_by: je.created_by,
    created_at: je.created_at,
    updated_at: je.updated_at,
  };
  if (je.transaction_type === "Expense" || je.transaction_type === "expense") {
    mapped.evoucher_id = je.entity_id || null;
  }
  const row = pick(mapped, JOURNAL_ENTRY_COLS);
  await db.from("journal_entries").upsert(row, { onConflict: "id" });
}

// Helper: save a transaction
async function saveTransaction(txn: any): Promise<void> {
  const mapped: any = {
    id: txn.id,
    date: txn.date,
    description: txn.description,
    amount: txn.amount,
    status: txn.status,
    evoucher_id: txn.source_document_id || txn.evoucher_id,
    debit_account_id: txn.bank_account_id || txn.debit_account_id,
    credit_account_id: txn.category_id || txn.credit_account_id,
    journal_entry_id: txn.journal_entry_id,
    created_at: txn.created_at,
    updated_at: txn.updated_at,
  };
  const row = pick(mapped, TRANSACTION_COLS);
  await db.from("transactions").upsert(row, { onConflict: "id" });
}

// Helper: save an evoucher (with details overflow)
async function saveEvoucherLocal(ev: any): Promise<void> {
  // Use the same EVOUCHER_COLS from index.tsx — we inline a superset here
  const EVOUCHER_COLS = [
    "id", "booking_id", "project_id", "project_number", "status", "amount",
    "currency", "transaction_type", "service_type", "notes",
    "vendor_name", "vendor_id", "customer_name", "customer_id",
    "voucher_number", "request_date", "purpose", "description",
    "expense_category", "payment_method", "reference_number",
    "requestor_id", "requestor_name",
    "approver_id", "approver_name", "approved_at",
    "posted_to_ledger", "ledger_entry_id", "ledger_entry_type",
    "journal_entry_id", "draft_transaction_id",
    "posted_at", "posted_by", "posted_by_name",
    "is_billable", "sub_category", "source_account_id",
    "invoice_number", "linked_billings",
    "created_by", "created_at", "updated_at",
  ];
  const row: Record<string, any> = {};
  const overflow: Record<string, any> = {};
  for (const [key, value] of Object.entries(ev)) {
    if (EVOUCHER_COLS.includes(key)) {
      row[key] = value;
    } else {
      overflow[key] = value;
    }
  }
  row.details = overflow;
  await db.from("evouchers").upsert(row, { onConflict: "id" });
}

// ==================== JOURNAL ENTRIES API ====================

export async function createJournalEntry(c: Context) {
  try {
    const entryData = await c.req.json();
    const { 
      transaction_date, 
      description, 
      reference_number, 
      transaction_type, 
      entity_id, 
      project_id, 
      lines,
      created_by 
    } = entryData;

    if (!lines || lines.length < 2) {
      return errorResponse(c, "Journal entry must have at least 2 lines", 400);
    }

    const totalDebits = lines.reduce((sum: number, line: any) => sum + (Number(line.debit) || 0), 0);
    const totalCredits = lines.reduce((sum: number, line: any) => sum + (Number(line.credit) || 0), 0);

    if (Math.abs(totalDebits - totalCredits) > 0.01) {
      return errorResponse(c, `Journal entry must balance. Debits: ${totalDebits}, Credits: ${totalCredits}`, 400);
    }

    const id = generateId("JE");
    const now = new Date().toISOString();

    const journalEntry = {
      id,
      transaction_date,
      posted_at: now,
      description,
      reference_number,
      transaction_type,
      entity_id,
      project_id,
      lines: lines.map((line: any) => ({
        id: generateId("JL"),
        ...line
      })),
      total_amount: totalDebits,
      status: "Posted",
      created_by,
      created_at: now,
      updated_at: now
    };

    await saveJournalEntry(journalEntry);

    // Update Account Balances
    for (const line of lines) {
      if (line.account_id) {
        const account = await getAccount(line.account_id);
        if (account) {
          let impact = 0;
          const type = account.type;
          if (["Asset", "Expense"].includes(type)) {
             impact = (Number(line.debit) || 0) - (Number(line.credit) || 0);
          } else {
             impact = (Number(line.credit) || 0) - (Number(line.debit) || 0);
          }
          account.balance = (account.balance || 0) + impact;
          await saveAccount(account);
        }
      }
    }

    console.log(`Created Journal Entry ${id} (${totalDebits})`);
    return successResponse(c, journalEntry);

  } catch (error) {
    return errorResponse(c, `Failed to create journal entry: ${error}`);
  }
}

export async function postEVoucherToLedger(c: Context) {
  try {
    const evoucherId = c.req.param("id");
    const { 
      user_id, 
      user_name, 
      debit_account_id, 
      credit_account_id,
      posting_date 
    } = await c.req.json();
    
    const validation = await validateEVoucherForPosting(evoucherId);
    if (!validation.valid) {
      return errorResponse(c, validation.error!, 400);
    }
    
    const evoucher = validation.evoucher;
    
    if (!debit_account_id || !credit_account_id) {
      return errorResponse(c, "Debit and Credit accounts are required", 400);
    }

    const debitAccount = await getAccount(debit_account_id);
    const creditAccount = await getAccount(credit_account_id);

    if (!debitAccount || !creditAccount) {
      return errorResponse(c, "One or more selected accounts not found", 400);
    }

    const jeId = generateId("JE");
    const now = new Date().toISOString();
    const amount = Number(evoucher.amount);

    const journalEntry = {
      id: jeId,
      transaction_date: posting_date || evoucher.request_date || now,
      posted_at: now,
      description: `E-Voucher Post: ${evoucher.description || evoucher.purpose}`,
      reference_number: evoucher.voucher_number,
      transaction_type: "Expense",
      entity_id: evoucher.vendor_id || null,
      project_id: null,
      project_number: evoucher.project_number,
      
      lines: [
        {
          id: generateId("JL"),
          account_id: debit_account_id,
          account_name: debitAccount.name,
          description: evoucher.description,
          debit: amount,
          credit: 0
        },
        {
          id: generateId("JL"),
          account_id: credit_account_id,
          account_name: creditAccount.name,
          description: "Payment Source",
          debit: 0,
          credit: amount
        }
      ],
      total_amount: amount,
      status: "Posted",
      created_by: user_id,
      created_at: now,
      updated_at: now
    };

    await saveJournalEntry(journalEntry);

    // Update Balances
    debitAccount.balance = (debitAccount.balance || 0) + amount;
    await saveAccount(debitAccount);
    
    let creditImpact = 0;
    if (["Asset", "Expense"].includes(creditAccount.type)) {
       creditImpact = -amount;
    } else {
       creditImpact = amount;
    }
    creditAccount.balance = (creditAccount.balance || 0) + creditImpact;
    await saveAccount(creditAccount);

    // Update Draft Transaction (Gatekeeper Sync)
    if (evoucher.draft_transaction_id) {
       const { data: draftTxn } = await db.from("transactions").select("*").eq("id", evoucher.draft_transaction_id).maybeSingle();
       if (draftTxn) {
          draftTxn.status = "posted";
          draftTxn.journal_entry_id = jeId;
          draftTxn.debit_account_id = debit_account_id;
          draftTxn.credit_account_id = credit_account_id;
          draftTxn.updated_at = now;
          await saveTransaction(draftTxn);
          console.log(`Draft Transaction ${evoucher.draft_transaction_id} marked as POSTED`);
       }
    }

    // Update E-Voucher Status
    const updatedEVoucher = {
      ...evoucher,
      status: "Posted",
      posted_to_ledger: true,
      ledger_entry_id: jeId,
      ledger_entry_type: "journal_entry",
      posted_at: now,
      posted_by: user_id,
      posted_by_name: user_name,
      updated_at: now,
    };
    
    await saveEvoucherLocal(updatedEVoucher);
    
    console.log(`Posted E-Voucher ${evoucher.voucher_number} to Ledger (JE: ${jeId})`);

    // AUTO-CREATE BILLING ATOM IF EXPENSE IS BILLABLE
    const isBillable = evoucher.is_billable || evoucher.isBillable;
    if (isBillable && evoucher.project_number) {
        const billingId = generateId("BIL");
        const billingItem = {
            id: billingId,
            project_number: evoucher.project_number,
            booking_id: evoucher.booking_id || evoucher.bookingId || evoucher.project_number,
            description: `Reimbursement: ${evoucher.description || evoucher.purpose}`,
            amount: amount,
            currency: evoucher.currency || "PHP",
            status: "unbilled",
            category: "Reimbursable Expenses",
            evoucher_id: evoucher.id,
            created_at: now,
            updated_at: now
        };
        const row = pick(billingItem, BILLING_LINE_ITEM_COLS);
        await db.from("billing_line_items").insert(row);
        console.log(`Auto-created Billing Atom ${billingId} for Billable Expense`);
    }
    
    return successResponse(c, {
      evoucher: updatedEVoucher,
      journal_entry: journalEntry,
    });
  } catch (error) {
    return errorResponse(c, `Failed to post to ledger: ${error}`);
  }
}

// ==================== EXPENSES API ====================

export async function getExpenses(c: Context) {
  try {
    const dateFrom = c.req.query("date_from");
    const dateTo = c.req.query("date_to");
    const category = c.req.query("category");
    const vendor = c.req.query("vendor");
    const projectNumber = c.req.query("project_number");
    const search = c.req.query("search");
    
    // Fetch posted expenses and all evouchers
    const [{ data: expenseRows }, { data: evoucherRows }] = await Promise.all([
      db.from("expenses").select("*"),
      db.from("evouchers").select("*"),
    ]);
    
    const postedExpenses = expenseRows || [];
    const allEvouchers = (evoucherRows || []).map((r: any) => mergeFromRow(r));
    
    const postedEvoucherIds = new Set(postedExpenses.map((e: any) => e.evoucher_id));
    
    const unpostedExpenses = allEvouchers
      .filter((ev: any) => 
        (ev.status === "Approved" || ev.status === "approved") && 
        !ev.posted_to_ledger &&
        !postedEvoucherIds.has(ev.id)
      )
      .map(mapEVoucherToExpense);
      
    let expenses = [...postedExpenses, ...unpostedExpenses];
    
    if (dateFrom) {
      expenses = expenses.filter((e: any) => 
        new Date(e.date || e.created_at) >= new Date(dateFrom)
      );
    }
    
    if (dateTo) {
      expenses = expenses.filter((e: any) => 
        new Date(e.date || e.created_at) <= new Date(dateTo)
      );
    }
    
    if (category && category !== "all") {
      expenses = expenses.filter((e: any) => e.category === category);
    }
    
    if (vendor) {
      expenses = expenses.filter((e: any) => 
        (e.vendor || e.vendor_name || "").toLowerCase().includes(vendor.toLowerCase())
      );
    }
    
    if (projectNumber) {
      expenses = expenses.filter((e: any) => e.project_number === projectNumber);
    }
    
    if (search) {
      const searchLower = search.toLowerCase();
      expenses = expenses.filter((e: any) =>
        e.description?.toLowerCase().includes(searchLower) ||
        (e.vendor || e.vendor_name || "").toLowerCase().includes(searchLower) ||
        e.evoucher_number?.toLowerCase().includes(searchLower)
      );
    }
    
    expenses.sort((a: any, b: any) => 
      new Date(b.date || b.created_at).getTime() - new Date(a.date || a.created_at).getTime()
    );

    // Self-healing: check for missing is_billable flag
    const expensesToHeal = expenses.filter((e: any) => e.is_billable === undefined && e.evoucher_id);
    if (expensesToHeal.length > 0) {
      console.log(`Self-healing ${expensesToHeal.length} expenses missing is_billable flag...`);
      try {
        const evoucherIds = expensesToHeal.map((e: any) => e.evoucher_id).filter(Boolean);
        if (evoucherIds.length > 0) {
          const { data: evRows } = await db.from("evouchers").select("*").in("id", evoucherIds);
          const evMap = new Map((evRows || []).map((r: any) => [r.id, mergeFromRow(r)]));
          
          const savePromises = [];
          for (const expense of expensesToHeal) {
            const ev = evMap.get(expense.evoucher_id);
            if (ev) {
              const isBillable = ev.is_billable === true || ev.isBillable === true;
              expense.is_billable = isBillable;
              if (!expense.is_virtual) {
                savePromises.push(
                  db.from("expenses").update({ is_billable: isBillable } as any).eq("id", expense.id)
                );
              }
            }
          }
          if (savePromises.length > 0) {
            Promise.allSettled(savePromises).catch(err => console.error("Error persisting patches:", err));
          }
        }
      } catch (err) {
        console.error("Error during self-healing:", err);
      }
    }
    
    console.log(`Fetched ${expenses.length} expenses`);
    
    const { projectMap, bookingToProjectMap, bookingCustomerMap, projectIdToNumber, bookingServiceTypeMap } = await buildProjectLookupMaps();
    const enrichedExpenses = enrichRecords(expenses, projectMap, bookingToProjectMap, bookingCustomerMap, projectIdToNumber, bookingServiceTypeMap);
    
    return successResponse(c, enrichedExpenses);
  } catch (error) {
    return errorResponse(c, `Failed to fetch expenses: ${error}`);
  }
}

function mapEVoucherToExpense(evoucher: any) {
  return {
    id: evoucher.id,
    evoucher_id: evoucher.id,
    evoucher_number: evoucher.voucher_number,
    date: evoucher.request_date || evoucher.created_at,
    vendor: evoucher.vendor_name || "\u2014",
    category: evoucher.expense_category || "Uncategorized",
    sub_category: evoucher.sub_category || "",
    amount: evoucher.total_amount || evoucher.amount || 0,
    currency: evoucher.currency || "PHP",
    description: evoucher.purpose || evoucher.description || "Untitled Expense",
    project_number: evoucher.project_number,
    booking_id: evoucher.booking_id || evoucher.bookingId || "",
    customer_name: evoucher.customer_name || "",
    status: evoucher.status === "Approved" ? "approved" : 
            evoucher.status === "Posted" ? "posted" : 
            evoucher.status === "Rejected" ? "rejected" : "pending",
    requestor_id: evoucher.requestor_id,
    requestor_name: evoucher.requestor_name,
    created_at: evoucher.created_at,
    updated_at: evoucher.updated_at,
    is_virtual: true,
    is_billable: evoucher.is_billable || evoucher.isBillable
  };
}

export async function getExpenseById(c: Context) {
  try {
    const id = c.req.param("id");
    
    // 1. Try finding exact expense record
    const { data: expRow } = await db.from("expenses").select("*").eq("id", id).maybeSingle();
    let expense = expRow;
    
    // 2. If not found, try finding as E-Voucher ID
    if (!expense) {
      const { data: evRow } = await db.from("evouchers").select("*").eq("id", id).maybeSingle();
      const evoucher = evRow ? mergeFromRow(evRow) : null;
      
      if (evoucher) {
        const type = (evoucher.transaction_type || "").toLowerCase();
        if (type === "expense" || type === "budget_request") {
          expense = mapEVoucherToExpense(evoucher);
        }
      }
    }
    
    if (!expense) {
      return errorResponse(c, "Expense not found", 404);
    }
    
    return successResponse(c, expense);
  } catch (error) {
    return errorResponse(c, `Failed to fetch expense: ${error}`);
  }
}

export async function deleteExpense(c: Context) {
  try {
    const id = c.req.param("id");
    
    // 1. Try finding exact expense record
    const { data: expRow } = await db.from("expenses").select("id").eq("id", id).maybeSingle();
    
    if (expRow) {
      await db.from("expenses").delete().eq("id", id);
      console.log(`Deleted expense ${id}`);
      return successResponse(c, { id, deleted: true });
    }
    
    // 2. If not found, try finding as E-Voucher
    const { data: evRow } = await db.from("evouchers").select("id").eq("id", id).maybeSingle();
    if (evRow) {
       await db.from("evouchers").delete().eq("id", id);
       console.log(`Deleted E-Voucher ${id} via expense endpoint`);
       return successResponse(c, { id, deleted: true });
    }
    
    return errorResponse(c, "Expense not found", 404);
  } catch (error) {
    return errorResponse(c, `Failed to delete expense: ${error}`);
  }
}

export async function createDraftTransaction(evoucher: any) {
  try {
    const txnId = generateId("TXN");
    const now = new Date().toISOString();
    
    let amount = Number(evoucher.amount) || 0;
    if (evoucher.transaction_type !== "collection" && evoucher.transaction_type !== "billing") {
        amount = -Math.abs(amount);
    } else {
        amount = Math.abs(amount);
    }

    const transaction = {
      id: txnId,
      date: evoucher.request_date || now,
      description: `${evoucher.purpose || evoucher.description} (Ref: ${evoucher.voucher_number})`,
      amount: amount,
      status: "draft",
      source_document_id: evoucher.id,
      source_document_type: evoucher.transaction_type || "expense",
      bank_account_id: evoucher.source_account_id || null,
      category_id: null,
      contact_id: evoucher.vendor_name,
      created_at: now,
      updated_at: now
    };

    await saveTransaction(transaction);
    console.log(`Created Draft Transaction ${txnId} from E-Voucher ${evoucher.voucher_number}`);
    
    return transaction;
  } catch (error) {
    console.error("Error creating draft transaction:", error);
    return null;
  }
}

// ==================== COLLECTIONS API ====================

export async function getCollections(c: Context) {
  try {
    const dateFrom = c.req.query("date_from");
    const dateTo = c.req.query("date_to");
    const customerId = c.req.query("customer_id");
    const paymentMethod = c.req.query("payment_method");
    const projectNumber = c.req.query("project_number");
    const search = c.req.query("search");
    
    const { data: collRows } = await db.from("collections").select("*");
    let collections = collRows || [];
    
    if (dateFrom) {
      collections = collections.filter((c: any) => 
        new Date(c.collection_date) >= new Date(dateFrom)
      );
    }
    
    if (dateTo) {
      collections = collections.filter((c: any) => 
        new Date(c.collection_date) <= new Date(dateTo)
      );
    }
    
    if (customerId) {
      collections = collections.filter((c: any) => c.customer_id === customerId);
    }
    
    if (paymentMethod && paymentMethod !== "all") {
      collections = collections.filter((c: any) => c.payment_method === paymentMethod);
    }
    
    if (projectNumber) {
      collections = collections.filter((c: any) => c.project_number === projectNumber);
    }
    
    if (search) {
      const searchLower = search.toLowerCase();
      collections = collections.filter((c: any) =>
        c.description?.toLowerCase().includes(searchLower) ||
        c.customer_name?.toLowerCase().includes(searchLower) ||
        c.reference_number?.toLowerCase().includes(searchLower) ||
        c.evoucher_number?.toLowerCase().includes(searchLower)
      );
    }
    
    collections.sort((a: any, b: any) => 
      new Date(b.collection_date).getTime() - new Date(a.collection_date).getTime()
    );

    const { projectMap, bookingToProjectMap, bookingCustomerMap, projectIdToNumber, bookingServiceTypeMap } = await buildProjectLookupMaps();
    collections = enrichRecords(collections, projectMap, bookingToProjectMap, bookingCustomerMap, projectIdToNumber, bookingServiceTypeMap);
    
    // Linkage Hardening Phase 3: Self-heal collections missing booking_ids
    const collectionsMissingBookingIds = collections.filter((col: any) => !col.booking_ids || (Array.isArray(col.booking_ids) && col.booking_ids.length === 0));
    
    if (collectionsMissingBookingIds.length > 0) {
      console.log(`Linkage Hardening: Self-healing ${collectionsMissingBookingIds.length} collections missing booking_ids...`);
      try {
        const { data: allInvoiceRows } = await db.from("invoices").select("*");
        const invoicesByNumber = new Map<string, any>();
        const invoicesById = new Map<string, any>();
        for (const b of (allInvoiceRows || [])) {
          if (b.invoice_number) {
            invoicesByNumber.set(b.invoice_number, b);
            if (b.id) invoicesById.set(b.id, b);
          }
        }
        
        const savePromises: Promise<any>[] = [];
        
        for (const col of collectionsMissingBookingIds) {
          const mergedBookingIds = new Set<string>();
          const mergedServiceTypes = new Set<string>();
          
          if (col.invoice_number) {
            const inv = invoicesByNumber.get(col.invoice_number);
            if (inv?.booking_ids) {
              (Array.isArray(inv.booking_ids) ? inv.booking_ids : []).forEach((bid: string) => bid && mergedBookingIds.add(bid));
              (inv.service_types || []).forEach((st: string) => st && mergedServiceTypes.add(st));
            }
          }
          
          if (col.linked_billings && Array.isArray(col.linked_billings)) {
            for (const lb of col.linked_billings) {
              const lbId = lb.id || "";
              const inv = invoicesById.get(lbId) || invoicesByNumber.get(lbId);
              if (inv?.booking_ids) {
                (Array.isArray(inv.booking_ids) ? inv.booking_ids : []).forEach((bid: string) => bid && mergedBookingIds.add(bid));
                (inv.service_types || []).forEach((st: string) => st && mergedServiceTypes.add(st));
              }
            }
          }
          
          if (mergedBookingIds.size > 0) {
            col.booking_ids = [...mergedBookingIds];
            col.service_types = [...mergedServiceTypes];
            
            savePromises.push(
              db.from("collections").update({
                booking_ids: [...mergedBookingIds],
                service_types: [...mergedServiceTypes]
              }).eq("id", col.id)
            );
          }
        }
        
        if (savePromises.length > 0) {
          Promise.allSettled(savePromises).then(() =>
            console.log(`Persisted booking_ids for ${savePromises.length} legacy collections`)
          ).catch(err => console.error("Error persisting collection linkage patches:", err));
        }
      } catch (err) {
        console.error("Error during collection linkage self-healing:", err);
      }
    }
    
    console.log(`Fetched ${collections.length} collections (enriched)`);
    
    return successResponse(c, collections);
  } catch (error) {
    return errorResponse(c, `Failed to fetch collections: ${error}`);
  }
}

export async function getCollectionById(c: Context) {
  try {
    const id = c.req.param("id");
    
    // 1. Try finding exact collection record
    const { data: colRow } = await db.from("collections").select("*").eq("id", id).maybeSingle();
    let collection = colRow;
    
    // 2. If not found, try finding as E-Voucher ID
    if (!collection) {
      const { data: evRow } = await db.from("evouchers").select("*").eq("id", id).maybeSingle();
      const evoucher = evRow ? mergeFromRow(evRow) : null;
      
      if (evoucher && evoucher.transaction_type === "collection") {
        collection = mapEVoucherToCollection(evoucher);
      }
    }

    // 3. If still not found, try to find the E-Voucher that points to this Collection ID
    if (!collection) {
      const { data: evRows } = await db.from("evouchers").select("*").eq("ledger_entry_id", id);
      const parentEVoucher = (evRows || []).map((r: any) => mergeFromRow(r)).find((ev: any) => ev.transaction_type === "collection");
      
      if (parentEVoucher) {
        console.log(`Recovered missing collection ${id} from parent E-Voucher ${parentEVoucher.id}`);
        collection = mapEVoucherToCollection(parentEVoucher);
        collection.id = id;
        collection.reference_number = parentEVoucher.reference_number || collection.reference_number;
      }
    }
    
    if (!collection) {
      return errorResponse(c, "Collection not found", 404);
    }
    
    return successResponse(c, collection);
  } catch (error) {
    return errorResponse(c, `Failed to fetch collection: ${error}`);
  }
}

function mapEVoucherToCollection(evoucher: any) {
  return {
    id: evoucher.id,
    reference_number: evoucher.voucher_number,
    evoucher_number: evoucher.voucher_number,
    customer_name: evoucher.customer_name || evoucher.vendor_name || "Unknown Customer",
    description: evoucher.purpose || evoucher.description,
    project_number: evoucher.project_number,
    amount: evoucher.amount,
    collection_date: evoucher.request_date,
    payment_method: evoucher.payment_method || "Cash",
    received_by_name: evoucher.requestor_name,
    evoucher_id: evoucher.id,
    created_at: evoucher.created_at,
    status: evoucher.status,
    is_virtual: true
  };
}

export async function processCollectionPosting(evoucherId: string, user_id: string, user_name: string) {
    // Validate E-Voucher
    const { data: evRow } = await db.from("evouchers").select("*").eq("id", evoucherId).maybeSingle();
    const evoucher = evRow ? mergeFromRow(evRow) : null;
    
    if (!evoucher) {
      throw new Error("E-Voucher not found");
    }
    
    if (evoucher.posted_to_ledger) {
      throw new Error("Collection has already been posted");
    }
    
    if (evoucher.transaction_type !== "collection") {
      throw new Error("E-Voucher transaction type must be 'collection'");
    }
    
    // 1. Create Collection Record
    const collectionId = generateId("COL");
    const collectionDate = evoucher.request_date || new Date().toISOString().split('T')[0];
    const now = new Date().toISOString();
    
    const collection: any = {
      id: collectionId,
      evoucher_id: evoucherId,
      collection_date: collectionDate,
      customer_id: evoucher.customer_id || `CUST-${Date.now()}`,
      customer_name: evoucher.customer_name || evoucher.vendor_name || "Unknown Customer",
      amount: evoucher.amount,
      currency: evoucher.currency || "PHP",
      payment_method: evoucher.payment_method || "Bank Transfer",
      reference_number: evoucher.reference_number,
      project_number: evoucher.project_number,
      notes: evoucher.notes || evoucher.description || evoucher.purpose,
      created_by: user_id,
      posted: true,
      posted_at: now,
      status: "posted",
      created_at: now,
      updated_at: now,
    };

    // Linkage Hardening Phase 2: Inherit booking lineage from invoice(s)
    try {
      const invoiceNumbers: string[] = [];
      if (evoucher.invoice_number) invoiceNumbers.push(evoucher.invoice_number);
      if (evoucher.linked_billings && Array.isArray(evoucher.linked_billings)) {
        for (const lb of evoucher.linked_billings) {
          const invId = lb.id || lb.invoice_number || "";
          if (invId && !invoiceNumbers.includes(invId)) invoiceNumbers.push(invId);
        }
      }

      if (invoiceNumbers.length > 0) {
        const { data: matchedInvoices } = await db.from("invoices").select("*").in("invoice_number", invoiceNumbers);
        
        const mergedBookingIds = new Set<string>();
        const mergedServiceTypes = new Set<string>();

        for (const inv of (matchedInvoices || [])) {
          if (inv.booking_ids && Array.isArray(inv.booking_ids)) {
            inv.booking_ids.forEach((bid: string) => bid && mergedBookingIds.add(bid));
          }
          if (inv.service_types && Array.isArray(inv.service_types)) {
            inv.service_types.forEach((st: string) => st && mergedServiceTypes.add(st));
          }
        }

        if (mergedBookingIds.size > 0) {
          collection.booking_ids = [...mergedBookingIds];
          collection.service_types = [...mergedServiceTypes];
          console.log(`Collection ${collectionId} linked to ${mergedBookingIds.size} booking(s)`);
        }
      }
    } catch (linkageErr) {
      console.warn(`Linkage Hardening: Failed to derive booking_ids for collection ${collectionId}:`, linkageErr);
    }

    const colRow = pick(collection, COLLECTION_COLS);
    await db.from("collections").insert(colRow);
    
    // 2. Identify GL Accounts
    const { data: allAccountRows } = await db.from("accounts").select("*");
    const allAccounts = allAccountRows || [];
    const cashAccount = allAccounts.find((a: any) => a.code === "1000") || allAccounts.find((a: any) => a.type === "Asset" && !a.is_folder);
    const arAccount = allAccounts.find((a: any) => a.code === "105" && !a.is_folder)
      || allAccounts.find((a: any) => a.code === "1200")
      || allAccounts.find((a: any) => {
        const name = (a.name || '').toUpperCase();
        const sub = (a.sub_type || a.subtype || '').toUpperCase();
        return (name === 'ACCOUNTS RECEIVABLE' || sub === 'ACCOUNTS RECEIVABLE') && !a.is_folder;
      });

    let jeId = null;

    if (!cashAccount || !arAccount) {
      console.warn("Critical GL Accounts missing. Skipping Journal Entry creation, but saving Collection.");
    } else {
        jeId = generateId("JE");
        
        const journalEntry = {
          id: jeId,
          transaction_date: collectionDate,
          posted_at: now,
          description: `Collection: ${collection.notes} (${collection.customer_name})`,
          reference_number: collection.reference_number,
          transaction_type: "Collection",
          entity_id: collection.customer_id,
          project_number: collection.project_number,
          
          lines: [
            {
              id: generateId("JL"),
              account_id: cashAccount.id,
              account_name: cashAccount.name,
              description: `Cash received from ${collection.customer_name}`,
              debit: collection.amount,
              credit: 0
            },
            {
              id: generateId("JL"),
              account_id: arAccount.id,
              account_name: arAccount.name,
              description: "AR Cleared",
              debit: 0,
              credit: collection.amount
            }
          ],
          total_amount: collection.amount,
          status: "Posted",
          created_by: user_id,
          created_at: now,
          updated_at: now
        };
        
        await saveJournalEntry(journalEntry);
        
        cashAccount.balance = (cashAccount.balance || 0) + collection.amount;
        await saveAccount(cashAccount);
        
        arAccount.balance = (arAccount.balance || 0) - collection.amount;
        await saveAccount(arAccount);
        
        console.log(`Created Journal Entry ${jeId} for Collection`);
    }
    
    // 3. Update E-Voucher
    const updatedEVoucher = {
      ...evoucher,
      status: "Posted",
      posted_to_ledger: true,
      ledger_entry_id: collectionId,
      ledger_entry_type: "collection",
      journal_entry_id: jeId,
      posted_at: now,
      posted_by: user_id,
      posted_by_name: user_name,
      updated_at: now,
    };
    
    await saveEvoucherLocal(updatedEVoucher);
    
    console.log(`Posted Collection E-Voucher ${evoucher.voucher_number} (COL: ${collectionId})`);
    
    return {
      collection,
      evoucher: updatedEVoucher,
      journal_entry_id: jeId
    };
}

// ==================== INVOICES (Billings as Documents) ====================

export async function getInvoices(c: Context) {
  try {
    const projectNumber = c.req.query("projectNumber");
    
    let query = db.from("invoices").select("*");
    if (projectNumber) {
      query = query.eq("project_number", projectNumber);
    }
    const { data: invoiceRows } = await query;
    let billings = invoiceRows || [];

    const { projectMap, bookingToProjectMap, bookingCustomerMap, projectIdToNumber, bookingServiceTypeMap } = await buildProjectLookupMaps();
    billings = enrichRecords(billings, projectMap, bookingToProjectMap, bookingCustomerMap, projectIdToNumber, bookingServiceTypeMap);
    
    // Linkage Hardening Phase 3: Self-heal invoices missing booking_ids
    const invoicesMissingBookingIds = billings.filter((inv: any) => !inv.booking_ids || (Array.isArray(inv.booking_ids) && inv.booking_ids.length === 0));
    
    if (invoicesMissingBookingIds.length > 0) {
      console.log(`Linkage Hardening: Self-healing ${invoicesMissingBookingIds.length} invoices missing booking_ids...`);
      try {
        const { data: allBillingItems } = await db.from("billing_line_items").select("*");
        
        const billingItemById = new Map<string, any>();
        const billingItemsByInvoiceNum = new Map<string, any[]>();
        for (const item of (allBillingItems || [])) {
          const itemId = item.id;
          if (itemId) billingItemById.set(itemId, item);
          const invNum = item.invoice_number;
          if (invNum) {
            if (!billingItemsByInvoiceNum.has(invNum)) billingItemsByInvoiceNum.set(invNum, []);
            billingItemsByInvoiceNum.get(invNum)!.push(item);
          }
        }
        
        const savePromises: Promise<any>[] = [];
        
        for (const inv of invoicesMissingBookingIds) {
          const items: any[] = [];
          
          if (inv.billing_item_ids && Array.isArray(inv.billing_item_ids)) {
            for (const itemId of inv.billing_item_ids) {
              const item = billingItemById.get(itemId);
              if (item) items.push(item);
            }
          }
          
          if (items.length === 0 && inv.invoice_number) {
            const matched = billingItemsByInvoiceNum.get(inv.invoice_number) || [];
            items.push(...matched);
          }
          
          if (items.length > 0) {
            const bookingIds = [...new Set(items.map((b: any) => b.booking_id || "").filter(Boolean))];
            const serviceTypes = [...new Set(items.map((b: any) => b.service_type || "").filter(Boolean))];
            
            if (bookingIds.length > 0) {
              inv.booking_ids = bookingIds;
              inv.service_types = serviceTypes;
              
              savePromises.push(
                db.from("invoices").update({ booking_ids: bookingIds, service_types: serviceTypes }).eq("id", inv.id)
              );
            }
          }
        }
        
        if (savePromises.length > 0) {
          Promise.allSettled(savePromises).then(() =>
            console.log(`Persisted booking_ids for ${savePromises.length} legacy invoices`)
          ).catch(err => console.error("Error persisting invoice linkage patches:", err));
        }
      } catch (err) {
        console.error("Error during invoice linkage self-healing:", err);
      }
    }

    billings.sort((a: any, b: any) => {
      const dateA = a.created_at || "";
      const dateB = b.created_at || "";
      return dateB.localeCompare(dateA);
    });
    
    console.log(`Fetched ${billings.length} invoices${projectNumber ? ` for project ${projectNumber}` : ""} (enriched)`);
    return c.json({ success: true, data: billings });
  } catch (error) {
    console.error("Error fetching invoices:", error);
    return errorResponse(c, String(error));
  }
}

export async function getInvoiceById(c: Context) {
  try {
    const id = c.req.param("id");
    const { data: invoice } = await db.from("invoices").select("*").eq("id", id).maybeSingle();
    
    if (!invoice) {
      return c.json({ success: false, error: "Invoice not found" }, 404);
    }
    
    return c.json({ success: true, data: invoice });
  } catch (error) {
    console.error("Error fetching invoice:", error);
    return errorResponse(c, String(error));
  }
}

export async function createInvoice(c: Context) {
  try {
    const body = await c.req.json();
    const invoiceNumber = await generateInvoiceNumber();
    const now = new Date().toISOString();
    const id = generateId("INV");
    
    const invoice: any = {
      ...body,
      id,
      invoice_number: invoiceNumber,
      status: body.status || "posted",
      created_at: now,
      updated_at: now,
    };
    
    // Mark referenced billing items as "billed"
    const billingItemIds: string[] = body.billing_item_ids || [];
    const fetchedBillingItems: any[] = [];
    if (billingItemIds.length > 0) {
      for (const itemId of billingItemIds) {
        try {
          const { data: existing } = await db.from("billing_line_items").select("*").eq("id", itemId).maybeSingle();
          if (existing && !existing.invoice_number) {
            await db.from("billing_line_items").update({
              status: "billed",
              invoice_id: id,
              invoice_number: invoiceNumber,
              updated_at: now,
            }).eq("id", itemId);
            fetchedBillingItems.push(existing);
          } else if (existing) {
            fetchedBillingItems.push(existing);
          }
        } catch (itemErr) {
          console.error(`Failed to mark billing item ${itemId} as billed:`, itemErr);
        }
      }
      console.log(`Marked ${billingItemIds.length} billing item(s) as billed for invoice ${invoiceNumber}`);
    }

    // Linkage Hardening Phase 1: Derive booking lineage
    if (fetchedBillingItems.length > 0) {
      const derivedBookingIds = [...new Set(
        fetchedBillingItems.map(b => b.booking_id || "").filter(Boolean)
      )];
      const derivedServiceTypes = [...new Set(
        fetchedBillingItems.map(b => b.service_type || "").filter(Boolean)
      )];
      invoice.booking_ids = derivedBookingIds;
      invoice.service_types = derivedServiceTypes;
      console.log(`Invoice ${invoiceNumber} linked to ${derivedBookingIds.length} booking(s)`);
    }

    // --- Journal Entry: DR AR / CR Revenue ---
    const revenueAccountId = body.revenue_account_id;
    const totalAmount = Number(body.total_amount) || 0;
    let jeId: string | null = null;
    let txnId: string | null = null;

    if (revenueAccountId && totalAmount > 0) {
      const { data: allAccountRows } = await db.from("accounts").select("*");
      const allAccounts = allAccountRows || [];
      const arAccount = allAccounts.find((a: any) => a.code === "105" && !a.is_folder)
        || allAccounts.find((a: any) => a.code === "1200")
        || allAccounts.find((a: any) => {
          const name = (a.name || '').toUpperCase();
          const sub = (a.sub_type || a.subtype || '').toUpperCase();
          return (name === 'ACCOUNTS RECEIVABLE' || sub === 'ACCOUNTS RECEIVABLE') && !a.is_folder;
        });
      const revenueAccount = await getAccount(revenueAccountId);

      if (!arAccount || !revenueAccount) {
        console.warn(`GL accounts missing for invoice JE. Skipping JE, but invoice saved.`);
      } else {
        jeId = generateId("JE");

        const journalEntry = {
          id: jeId,
          transaction_date: body.invoice_date || now,
          posted_at: now,
          description: `Invoice ${invoiceNumber}: ${body.customer_name || "Customer"}`,
          reference_number: invoiceNumber,
          transaction_type: "Invoice",
          entity_id: body.customer_id || null,
          project_number: body.project_number || null,
          lines: [
            {
              id: generateId("JL"),
              account_id: arAccount.id,
              account_name: arAccount.name,
              description: `AR for Invoice ${invoiceNumber}`,
              debit: totalAmount,
              credit: 0
            },
            {
              id: generateId("JL"),
              account_id: revenueAccountId,
              account_name: revenueAccount.name,
              description: `Revenue recognized - Invoice ${invoiceNumber}`,
              debit: 0,
              credit: totalAmount
            }
          ],
          total_amount: totalAmount,
          status: "Posted",
          created_by: body.user_id || null,
          created_at: now,
          updated_at: now
        };

        await saveJournalEntry(journalEntry);

        arAccount.balance = (arAccount.balance || 0) + totalAmount;
        await saveAccount(arAccount);

        revenueAccount.balance = (revenueAccount.balance || 0) + totalAmount;
        await saveAccount(revenueAccount);

        console.log(`Created Journal Entry ${jeId} for Invoice ${invoiceNumber}`);

        // Create Transaction
        txnId = generateId("TXN");
        const transaction = {
          id: txnId,
          date: body.invoice_date || now,
          description: `Invoice ${invoiceNumber}: ${body.customer_name || "Customer"}`,
          amount: totalAmount,
          status: "posted",
          evoucher_id: null,
          debit_account_id: arAccount.id,
          credit_account_id: revenueAccountId,
          journal_entry_id: jeId,
          created_at: now,
          updated_at: now
        };

        await saveTransaction(transaction);
        console.log(`Created Transaction ${txnId} for Invoice ${invoiceNumber}`);
      }
    }

    if (jeId) invoice.journal_entry_id = jeId;
    // Store draft_transaction_id as extra data (not in invoice table, but we keep for response)

    // Persist final invoice
    const invoiceRow = pick(invoice, INVOICE_COLS);
    await db.from("invoices").insert(invoiceRow);
    
    // Include txn id in response
    if (txnId) invoice.draft_transaction_id = txnId;

    console.log(`Created invoice ${invoiceNumber} (${id})${jeId ? ` [JE: ${jeId}]` : ' [No JE]'}`);
    return c.json({ success: true, data: invoice });
  } catch (error) {
    console.error("Error creating invoice:", error);
    return errorResponse(c, String(error));
  }
}

// ==================== BILLING ITEMS (The Atoms) ====================

export async function getBillings(c: Context) {
  try {
    const { data: billingRows } = await db.from("billing_line_items").select("*");
    let billings = billingRows || [];

    // Deduplicate by id
    const seen = new Set<string>();
    billings = billings.filter((b: any) => {
      const id = b.id;
      if (seen.has(id)) return false;
      seen.add(id);
      return true;
    });

    const { projectMap, bookingToProjectMap, bookingCustomerMap, projectIdToNumber, bookingServiceTypeMap } = await buildProjectLookupMaps();
    billings = enrichRecords(billings, projectMap, bookingToProjectMap, bookingCustomerMap, projectIdToNumber, bookingServiceTypeMap);
    
    billings.sort((a: any, b: any) => {
      const dateA = a.created_at || "";
      const dateB = b.created_at || "";
      return dateB.localeCompare(dateA);
    });
    
    console.log(`Fetched ${billings.length} billing items (enriched)`);
    return c.json({ success: true, data: billings });
  } catch (error) {
    console.error("Error fetching billing items:", error);
    return errorResponse(c, String(error));
  }
}

export async function createBillingItem(c: Context) {
  try {
    const body = await c.req.json();
    const now = new Date().toISOString();
    const id = body.id || generateId("BIL");
    
    const billingItem = {
      ...body,
      id,
      created_at: now,
      updated_at: now,
    };
    
    const row = pick(billingItem, BILLING_LINE_ITEM_COLS);
    await db.from("billing_line_items").insert(row);
    
    console.log(`Created billing item ${id}`);
    return c.json({ success: true, data: billingItem });
  } catch (error) {
    console.error("Error creating billing item:", error);
    return errorResponse(c, String(error));
  }
}

export async function batchUpsertBillings(c: Context) {
  try {
    const { items } = await c.req.json();
    
    if (!items || !Array.isArray(items)) {
      return c.json({ success: false, error: "items array is required" }, 400);
    }
    
    const now = new Date().toISOString();
    const results: any[] = [];
    
    for (const item of items) {
      const id = item.id || generateId("BIL");
      const billingItem = {
        ...item,
        id,
        updated_at: now,
        created_at: item.created_at || now,
      };
      
      const row = pick(billingItem, BILLING_LINE_ITEM_COLS);
      await db.from("billing_line_items").upsert(row, { onConflict: "id" });
      results.push(billingItem);
    }
    
    console.log(`Batch upserted ${results.length} billing items`);
    return c.json({ success: true, data: results, count: results.length });
  } catch (error) {
    console.error("Error batch upserting billings:", error);
    return errorResponse(c, String(error));
  }
}

export async function importQuotationCharges(c: Context) {
  try {
    const { quotation_id, project_number, booking_id, charges } = await c.req.json();
    
    if (!charges || !Array.isArray(charges)) {
      return c.json({ success: false, error: "charges array is required" }, 400);
    }
    
    const now = new Date().toISOString();
    const results: any[] = [];
    
    for (const charge of charges) {
      const id = generateId("BIL");
      const billingItem = {
        id,
        project_number,
        booking_id,
        description: charge.description || charge.name,
        amount: charge.amount || charge.selling_price || 0,
        currency: charge.currency || "PHP",
        category: charge.category,
        status: "draft",
        created_at: now,
        updated_at: now,
      };
      
      const row = pick(billingItem, BILLING_LINE_ITEM_COLS);
      await db.from("billing_line_items").insert(row);
      results.push(billingItem);
    }
    
    console.log(`Imported ${results.length} quotation charges as billing items`);
    return c.json({ success: true, data: results, count: results.length });
  } catch (error) {
    console.error("Error importing quotation charges:", error);
    return errorResponse(c, String(error));
  }
}

// ==================== COLLECTION OPERATIONS ====================

export async function deleteCollection(c: Context) {
  try {
    const id = c.req.param("id");
    
    const { data: collection } = await db.from("collections").select("id").eq("id", id).maybeSingle();
    if (!collection) {
      return c.json({ success: false, error: "Collection not found" }, 404);
    }
    
    await db.from("collections").delete().eq("id", id);
    
    console.log(`Deleted collection ${id}`);
    return c.json({ success: true, message: "Collection deleted successfully" });
  } catch (error) {
    console.error("Error deleting collection:", error);
    return errorResponse(c, String(error));
  }
}

export async function postEVoucherToCollections(c: Context) {
  try {
    const evoucherId = c.req.param("id");
    const body = await c.req.json();
    const { user_id, user_name } = body;
    
    if (!user_id || !user_name) {
      return c.json({ success: false, error: "user_id and user_name are required" }, 400);
    }
    
    const result = await processCollectionPosting(evoucherId, user_id, user_name);
    
    return c.json({ 
      success: true, 
      data: result,
      message: `Collection posted successfully` 
    });
  } catch (error) {
    console.error("Error posting E-Voucher to collections:", error);
    return errorResponse(c, String(error));
  }
}
