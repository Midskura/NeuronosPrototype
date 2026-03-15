import { supabase } from './supabase/client';
import { Account, AccountType } from '../types/accounting-core';
import { Transaction } from '../types/accounting';

console.log("Loading accounting-api.ts (Client Side - Direct Supabase)");

/**
 * Fetches all accounts from Supabase.
 */
export const getAccounts = async (): Promise<Account[]> => {
  try {
    const { data, error } = await supabase.from('accounts').select('*');
    if (error) throw new Error(error.message);
    
    // Sort logic: Code then Name
    return (data || []).sort((a: Account, b: Account) => {
        const codeA = a.code || "";
        const codeB = b.code || "";
        return codeA.localeCompare(codeB) || a.name.localeCompare(b.name);
    });
  } catch (error) {
    console.error('Failed to fetch accounts:', error);
    return [];
  }
};

/**
 * Saves or updates an account.
 */
export const saveAccount = async (account: Account): Promise<void> => {
  const { error } = await supabase.from('accounts').upsert(account, { onConflict: 'id' });
  if (error) throw new Error('Failed to save account: ' + error.message);
};

/**
 * Deletes an account.
 */
export const deleteAccount = async (id: string): Promise<void> => {
  const { error } = await supabase.from('accounts').delete().eq('id', id);
  if (error) throw new Error('Failed to delete account: ' + error.message);
};

/**
 * Seeds initial accounts if the table is empty. No-op if accounts already exist.
 * For full COA seeding, use the Supabase SQL Editor with the seed scripts.
 */
export const seedInitialAccounts = async (): Promise<void> => {
  // No-op: seeding is handled via Supabase SQL Editor
};

/**
 * Resets (deletes all) accounts from the chart of accounts.
 */
export const resetChartOfAccounts = async (): Promise<void> => {
  const { error } = await supabase.from('accounts').delete().neq('id', '');
  if (error) throw new Error('Failed to reset chart of accounts: ' + error.message);
};

/**
 * Fetches all transactions.
 */
export const getTransactions = async (): Promise<Transaction[]> => {
  try {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .order('date', { ascending: false });
    if (error) throw new Error(error.message);
    return data || [];
  } catch (error) {
    console.error('Failed to fetch transactions:', error);
    return [];
  }
};

/**
 * Saves a transaction and updates the account balance.
 */
export const saveTransaction = async (txn: Transaction): Promise<void> => {
  // 1. Save the transaction
  const { error } = await supabase.from('transactions').upsert(txn, { onConflict: 'id' });
  if (error) throw new Error('Failed to save transaction: ' + error.message);

  // 2. Update balances
  const accounts = await getAccounts();
  
  const updateBalance = async (id: string, delta: number) => {
    const acc = accounts.find(a => a.id === id);
    if (acc) {
      acc.balance = (acc.balance || 0) + delta;
      await saveAccount(acc);
    }
  };

  await updateBalance(txn.bank_account_id, -txn.amount);
  await updateBalance(txn.category_account_id, txn.amount);
};

// --- NEW: TRANSACTION VIEW SETTINGS ---

export interface TransactionViewSettings {
  visibleAccountIds: string[];
}

export const getTransactionViewSettings = async (): Promise<TransactionViewSettings> => {
  try {
    const { data, error } = await supabase
      .from('settings')
      .select('value')
      .eq('key', 'transaction-view')
      .maybeSingle();
    if (error) throw new Error(error.message);
    return (data?.value as TransactionViewSettings) || { visibleAccountIds: [] };
  } catch (error) {
    console.error('Failed to fetch transaction view settings:', error);
    return { visibleAccountIds: [] };
  }
};

export const saveTransactionViewSettings = async (settings: TransactionViewSettings): Promise<void> => {
  const { error } = await supabase
    .from('settings')
    .upsert({ key: 'transaction-view', value: settings, updated_at: new Date().toISOString() }, { onConflict: 'key' });
  if (error) throw new Error('Failed to save settings: ' + error.message);
};