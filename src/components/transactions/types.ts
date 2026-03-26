import type { Transaction as DBTransaction, Currency } from "../../types/accounting";
import type { Account } from "../../types/accounting-core";

export type ReviewStatus = 'for_review' | 'categorized' | 'excluded';

export interface UI_Transaction extends DBTransaction {
  // Extended fields for the UI (some might be virtual/mocked for now)
  payee?: string;
  review_status: ReviewStatus;
  type: 'expense' | 'deposit' | 'check' | 'transfer';
  source_document_id?: string;
}

export interface BankAccountSummary extends Account {
  bankBalance: number; // Balance from bank feed
  neuronBalance: number; // Balance in Neuron ledger
  countForReview: number;
}
