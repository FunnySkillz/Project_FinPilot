import type { Category } from './finpilot';
export type BankTransaction = {
  name: string;
  merchant: string;
  amount: number | null;
  date: string;
  currency: string;
  category: Category;
  direction: 'debit' | 'credit' | 'unknown';
  source: string;
};
