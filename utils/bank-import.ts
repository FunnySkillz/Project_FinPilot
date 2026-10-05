import { parseMoneyInput } from '@/utils/form-input';
import { isValidDate } from '@/utils/dates';
import type { BankTransaction } from '@/types/bank-import';
import type { Expense, ExpenseCadence, ExpenseInput, ExpenseKind } from '@/types/finpilot';

export type TransactionDraft = Omit<BankTransaction, 'amount'> & {
  amount: string;
  kind: ExpenseKind;
  cadence: ExpenseCadence;
  decision: 'pending' | 'confirmed' | 'skipped';
};
export function transactionDraft(item: BankTransaction): TransactionDraft {
  return {
    ...item,
    amount: item.amount === null ? '' : String(item.amount),
    kind: 'one-off',
    cadence: 'monthly',
    decision: 'pending',
  };
}
export function validDraft(draft: TransactionDraft, currency: string) {
  const amount = parseMoneyInput(draft.amount);
  return (
    Boolean(draft.name.trim()) &&
    Number.isFinite(amount) &&
    amount > 0 &&
    isValidDate(draft.date) &&
    draft.direction === 'debit' &&
    draft.currency.toUpperCase() === currency.toUpperCase()
  );
}
export function draftExpense(draft: TransactionDraft): ExpenseInput {
  return {
    name: draft.name.trim(),
    merchant: draft.merchant.trim() || undefined,
    amount: parseMoneyInput(draft.amount),
    startDate: draft.date,
    category: draft.category,
    kind: draft.kind,
    cadence: draft.kind === 'recurring' ? draft.cadence : undefined,
    tags: [],
  };
}
export function possibleDuplicate(
  draft: TransactionDraft,
  expenses: Pick<Expense, 'name' | 'merchant' | 'amount' | 'startDate'>[],
) {
  const normalize = (s: string) => s.toLowerCase().replace(/[^\p{L}\p{N}]/gu, '');
  return expenses.some(
    (expense) =>
      expense.startDate === draft.date &&
      Math.abs(expense.amount - parseMoneyInput(draft.amount)) < 0.005 &&
      (normalize(expense.name) === normalize(draft.name) ||
        Boolean(draft.merchant && expense.merchant && normalize(expense.merchant) === normalize(draft.merchant))),
  );
}
