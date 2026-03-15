
import { db } from "./db.ts";

// ==================== COA DEFINITIONS ====================

export interface COANode {
  code: string;
  name: string;
  type: "Asset" | "Liability" | "Equity" | "Income" | "Expense";
  subtype: string;
  normal_balance: "debit" | "credit";
  currency: "PHP" | "USD"; // Default to PHP for expenses usually, but allow flexibility
  is_folder: boolean;
  description?: string;
  children?: COANode[];
}

// Helper to create consistent IDs from Code
export function generateDeterministicId(code: string): string {
  // Replace dots and spaces with hyphens, lowercase
  const sanitized = code.replace(/[^a-zA-Z0-9]/g, "-").toLowerCase();
  return `acc-${sanitized}`;
}

// ==================== RECURSIVE SEEDING LOGIC ====================

export async function upsertAccount(node: COANode, parentId: string | null = null, depth: number = 0): Promise<void> {
  const id = generateDeterministicId(node.code);
  const now = new Date().toISOString();

  // Create account object
  const account = {
    id: id,
    code: node.code,
    name: node.name,
    type: node.type, // KEEP TITLE CASE (Asset, Liability, etc.)
    subtype: node.subtype,
    normal_balance: node.normal_balance,
    currency: node.currency,
    is_folder: node.is_folder,
    parent_account_id: parentId, // Use parent_account_id to match Account interface
    description: node.description || node.name,
    is_active: true,
    depth: depth,
    created_at: now,
    updated_at: now,
    balance: 0 // Initialize with zero balance
  };

  // Upsert to accounts table [RELATIONAL]
  const { data: existing } = await db.from("accounts").select("*").eq("id", id).maybeSingle();
  
  if (existing) {
    // Preserve dynamic fields
    account.balance = existing.balance;
    account.created_at = existing.created_at;
    console.log(`Updating account: ${node.code} - ${node.name}`);
  } else {
    console.log(`Creating account: ${node.code} - ${node.name}`);
  }
  
  const ACCOUNT_COLS = [
    "id", "code", "name", "type", "sub_type", "category", "sub_category",
    "description", "parent_id", "balance", "normal_balance", "is_active",
    "is_system", "sort_order", "created_at", "updated_at",
  ];
  // Map legacy field names to relational column names
  const row: Record<string, any> = {};
  for (const [key, value] of Object.entries(account)) {
    if (key === "parent_account_id") { row.parent_id = value; }
    else if (key === "subtype") { row.sub_type = value; }
    else if (ACCOUNT_COLS.includes(key)) { row[key] = value; }
  }
  await db.from("accounts").upsert(row, { onConflict: "id" });

  // Process Children
  if (node.children && node.children.length > 0) {
    for (const child of node.children) {
      await upsertAccount(child, id, depth + 1);
    }
  }
}
