import type { Category, Expense, ExpenseCadence, ExpenseKind } from '@/types/finpilot';

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

export const CADENCES: ExpenseCadence[] = ['monthly', 'yearly', 'one-time'];
export const EXPENSE_KINDS: ExpenseKind[] = ['fixed', 'variable'];

export function normalizeMonthlyExpense(expense: Pick<Expense, 'amount' | 'cadence'>) {
  if (expense.cadence === 'yearly') {
    return expense.amount / 12;
  }

  if (expense.cadence === 'one-time') {
    return expense.amount;
  }

  return expense.amount;
}

export function monthlyRecurringExpense(expense: Pick<Expense, 'amount' | 'cadence'>) {
  if (expense.cadence === 'one-time') {
    return 0;
  }

  return normalizeMonthlyExpense(expense);
}

export function calculateFinanceSummary(expenses: Expense[], monthlyIncome: number) {
  const recurringExpenses = expenses.filter((expense) => expense.cadence !== 'one-time');
  const fixedMonthly = recurringExpenses
    .filter((expense) => expense.kind === 'fixed')
    .reduce((sum, expense) => sum + monthlyRecurringExpense(expense), 0);
  const variableMonthly = recurringExpenses
    .filter((expense) => expense.kind === 'variable')
    .reduce((sum, expense) => sum + monthlyRecurringExpense(expense), 0);
  const totalMonthly = fixedMonthly + variableMonthly;

  return {
    fixedMonthly,
    variableMonthly,
    totalMonthly,
    remainingMonthly: monthlyIncome - totalMonthly,
    yearlyRecurring: totalMonthly * 12,
  };
}

export function categoryTotals(expenses: Expense[]) {
  return CATEGORIES.map((category) => {
    const total = expenses
      .filter((expense) => expense.category === category)
      .reduce((sum, expense) => sum + monthlyRecurringExpense(expense), 0);

    return { category, total };
  })
    .filter((item) => item.total > 0)
    .sort((a, b) => b.total - a.total);
}

export function upcomingDeadlines(expenses: Expense[], limit = 5) {
  const today = new Date();

  return expenses
    .filter((expense) => Boolean(expense.endDate))
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

