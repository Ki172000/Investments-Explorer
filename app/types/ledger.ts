export type AccountType = 'ASSET' | 'LIABILITY' | 'EQUITY' | 'REVENUE' | 'EXPENSE';

export interface Account {
  id: string;
  code: string;         // e.g., "1100", "3100"
  name: string;
  type: AccountType;
  currency: string;
}

export interface JournalLine {
  id: string;
  accountId: string;
  accountCode: string;  // Enforced tracking
  debit: number;        // Cents
  credit: number;       // Cents
  description?: string;
}

export interface JournalEntry {
  id: string;
  date: string;
  reference: string;
  description: string;
  lines: JournalLine[];
  status: 'DRAFT' | 'POSTED';
}

// Global Standard Alternative Investment Chart of Accounts Definition
export const STANDARD_COA: Record<string, { name: string; type: AccountType }> = {
  // --- ASSETS (1000 - 1999) ---
  '1100': { name: 'Cash and Cash Equivalents', type: 'ASSET' },
  '1200': { name: 'Investments at Fair Value (PE/VC)', type: 'ASSET' },
  '1300': { name: 'Principal Bank Loans Receivable', type: 'ASSET' },
  '1400': { name: 'Accrued Interest Receivable', type: 'ASSET' },

  // --- LIABILITIES (2000 - 2999) ---
  '2100': { name: 'Management Fees Payable', type: 'LIABILITY' },
  '2200': { name: 'Accrued Fund Expenses', type: 'LIABILITY' },
  '2300': { name: 'Due to Affiliates / Brokers', type: 'LIABILITY' },

  // --- PARTNER EQUITY (3000 - 3999) ---
  '3100': { name: 'Partners Capital - LP Contributions', type: 'EQUITY' },
  '3200': { name: 'Partners Capital - GP Contributions', type: 'EQUITY' },
  '3300': { name: 'Unfunded Capital Commitments (Contra-Equity)', type: 'EQUITY' },

  // --- REVENUE / INVESTMENT GAINS (4000 - 4999) ---
  '4100': { name: 'Interest Income from Debt Assets', type: 'REVENUE' },
  '4200': { name: 'Net Realized Gain/Loss on Investments', type: 'REVENUE' },
  '4300': { name: 'Net Change in Unrealized Gain/Loss (FMV)', type: 'REVENUE' },

  // --- FUND EXPENSES (5000 - 5999) ---
  '5100': { name: 'Management Fees Expense', type: 'EXPENSE' },
  '5200': { name: 'Professional and Legal Fees', type: 'EXPENSE' },
  '5300': { name: 'Fund Administration Fees', type: 'EXPENSE' },
};