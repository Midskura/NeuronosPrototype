import type { Context } from "npm:hono";
import { db } from "./db.ts";

// ==================== Column whitelist for accounts ====================
const ACCOUNT_COLS = [
  "id", "code", "name", "type", "sub_type", "category", "sub_category",
  "description", "parent_id", "balance", "normal_balance", "is_active",
  "is_system", "sort_order", "created_at", "updated_at",
];

function pick(obj: Record<string, any>, cols: string[]): Record<string, any> {
  const result: Record<string, any> = {};
  for (const col of cols) {
    if (obj[col] !== undefined) result[col] = obj[col];
  }
  return result;
}

// ==================== Account Handlers ====================

export const getAccounts = async (c: Context) => {
  try {
    const { data: accounts, error } = await db.from("accounts").select("*").order("code");
    if (error) throw error;
    return c.json({ success: true, data: accounts || [] });
  } catch (error) {
    console.error("Error fetching accounts:", error);
    return c.json({ success: false, error: String(error) }, 500);
  }
};

export const saveAccount = async (c: Context) => {
  try {
    const account = await c.req.json();
    if (!account.id) {
      return c.json({ success: false, error: "Account ID is required" }, 400);
    }
    const row = pick(account, ACCOUNT_COLS);
    const { error } = await db.from("accounts").upsert(row, { onConflict: "id" });
    if (error) throw error;
    return c.json({ success: true, data: account });
  } catch (error) {
    return c.json({ success: false, error: String(error) }, 500);
  }
};

export const deleteAccount = async (c: Context) => {
  try {
    const id = c.req.param("id");
    const { error } = await db.from("accounts").delete().eq("id", id);
    if (error) throw error;
    return c.json({ success: true, message: "Account deleted" });
  } catch (error) {
    return c.json({ success: false, error: String(error) }, 500);
  }
};

// ==================== Transaction Handlers ====================

export const getTransactions = async (c: Context) => {
  try {
    const { data: txns, error } = await db.from("transactions").select("*").order("date", { ascending: false });
    if (error) throw error;
    return c.json({ success: true, data: txns || [] });
  } catch (error) {
    return c.json({ success: false, error: String(error) }, 500);
  }
};

export const saveTransaction = async (c: Context) => {
  try {
    const txn = await c.req.json();
    if (!txn.id) {
      return c.json({ success: false, error: "Transaction ID is required" }, 400);
    }
    const TXN_COLS = [
      "id", "date", "debit_account_id", "credit_account_id", "description",
      "reference", "amount", "type", "category", "journal_entry_id",
      "evoucher_id", "status", "is_reconciled", "created_by",
      "created_at", "updated_at",
    ];
    const row = pick(txn, TXN_COLS);
    const { error } = await db.from("transactions").upsert(row, { onConflict: "id" });
    if (error) throw error;
    return c.json({ success: true, data: txn });
  } catch (error) {
    return c.json({ success: false, error: String(error) }, 500);
  }
};

// ==================== View Settings Handlers ====================

export const getTransactionViewSettings = async (c: Context) => {
  try {
    const { data: row } = await db.from("settings").select("value").eq("key", "transaction-view").maybeSingle();
    const settings = row?.value || { visibleAccountIds: [] };
    return c.json({ success: true, data: settings });
  } catch (error) {
    return c.json({ success: false, error: String(error) }, 500);
  }
};

export const saveTransactionViewSettings = async (c: Context) => {
  try {
    const settings = await c.req.json();
    await db.from("settings").upsert({ key: "transaction-view", value: settings }, { onConflict: "key" });
    return c.json({ success: true, data: settings });
  } catch (error) {
    return c.json({ success: false, error: String(error) }, 500);
  }
};
