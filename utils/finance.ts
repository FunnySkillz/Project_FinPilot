import type { Category, Expense, ExpenseCadence, ExpenseKind, PaymentMethod } from '@/types/finpilot';

export const CATEGORIES: Category[] = [
  'Housing',
  'Car',
  'Insurance',
  'Subscriptions',
  'Food',
  'Health',
  'Family',
  'Tax',
  'Warranty',
  'Fines',
  'Other',
];

export const CADENCES: ExpenseCadence[] = ['monthly', 'yearly'];
export const EXPENSE_KINDS: ExpenseKind[] = ['recurring', 'one-off'];
export const PAYMENT_METHODS: PaymentMethod[] = [
  'cash',
  'debit-card',
  'credit-card',
  'bank-transfer',
  'paypal',
  'apple-pay',
  'other',
];

function parseLocalDate(value?: string) {
  if (!value) {
    return null;
  }

  const dateParts = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (dateParts) {
    const [, year, month, day] = dateParts;
    return new Date(Number(year), Number(month) - 1, Number(day));
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function recurringMonthlyExpense(expense: Pick<Expense, 'amount' | 'cadence' | 'kind'>) {
  if (expense.kind !== 'recurring' || !expense.cadence) {
    return 0;
  }

  return expense.cadence === 'yearly' ? expense.amount / 12 : expense.amount;
}

export function isOneOffExpenseInMonth(
  expense: Pick<Expense, 'kind' | 'startDate'>,
  referenceDate = new Date(),
) {
  if (expense.kind !== 'one-off') {
    return false;
  }

  const date = parseLocalDate(expense.startDate);
  if (!date) {
    return false;
  }

  return date.getFullYear() === referenceDate.getFullYear() && date.getMonth() === referenceDate.getMonth();
}

export function oneOffSpendingForMonth(expenses: Expense[], referenceDate = new Date()) {
  return expenses
    .filter((expense) => isOneOffExpenseInMonth(expense, referenceDate))
    .reduce((sum, expense) => sum + expense.amount, 0);
}

export function calculateFinanceSummary(expenses: Expense[], monthlyIncome: number, referenceDate = new Date()) {
  const recurringMonthlyLoad = expenses.reduce((sum, expense) => sum + recurringMonthlyExpense(expense), 0);
  const oneOffMonthlySpending = oneOffSpendingForMonth(expenses, referenceDate);
  const totalMonthlyPressure = recurringMonthlyLoad + oneOffMonthlySpending;

  return {
    recurringMonthlyLoad,
    oneOffMonthlySpending,
    totalMonthlyPressure,
    remainingMonthly: monthlyIncome - totalMonthlyPressure,
    yearlyRecurring: recurringMonthlyLoad * 12,
  };
}

export function categoryTotals(expenses: Expense[], referenceDate = new Date()) {
  return CATEGORIES.map((category) => {
    const total = expenses
      .filter((expense) => expense.category === category)
      .reduce((sum, expense) => {
        if (expense.kind === 'recurring') {
          return sum + recurringMonthlyExpense(expense);
        }

        return isOneOffExpenseInMonth(expense, referenceDate) ? sum + expense.amount : sum;
      }, 0);

    return { category, total };
  })
    .filter((item) => item.total > 0)
    .sort((a, b) => b.total - a.total);
}

export function upcomingDeadlines(expenses: Expense[], limit = 5) {
  const today = new Date();

  return expenses
    .filter((expense) => expense.kind === 'recurring' && Boolean(expense.endDate))
    .map((expense) => ({
      expense,
      date: new Date(expense.endDate as string),
    }))
    .filter(({ date }) => !Number.isNaN(date.getTime()) && date >= today)
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .slice(0, limit)
    .map(({ expense }) => expense);
}

export function categoryColor(category: Category) {
  const colors: Record<Category, string> = {
    Housing: '#2B6CB0',
    Car: '#C05621',
    Insurance: '#257061',
    Subscriptions: '#6B46C1',
    Food: '#5F7F2E',
    Health: '#B83280',
    Family: '#B7791F',
    Tax: '#2D3748',
    Warranty: '#00838F',
    Fines: '#C53030',
    Other: '#718096',
  };

  return colors[category];
}

export function newId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}
