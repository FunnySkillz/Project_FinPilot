import type { Expense, PurchaseDecision, PurchaseInput, PurchaseStatus } from '@/types/finpilot';
import { calculateFinanceSummary, newId } from '@/utils/finance';
import { formatCurrency } from '@/utils/formatters';

function statusFromRisk({
  bufferAfterPurchase,
  emergencyBufferGoal,
  remainingMonthly,
  monthlyImpact,
  priority,
}: {
  bufferAfterPurchase: number;
  emergencyBufferGoal: number;
  remainingMonthly: number;
  monthlyImpact: number;
  priority: PurchaseInput['priority'];
}): PurchaseStatus {
  if (bufferAfterPurchase < emergencyBufferGoal * 0.5 || remainingMonthly - monthlyImpact < 0) {
    return 'critical';
  }

  if (bufferAfterPurchase < emergencyBufferGoal || monthlyImpact > remainingMonthly * 0.5 || priority === 'low') {
    return 'risky';
  }

  return 'safe';
}

function buildRecommendation(status: PurchaseStatus, input: PurchaseInput, bufferAfterPurchase: number) {
  if (status === 'safe') {
    return `Safe enough for the current snapshot. Keep at least ${formatCurrency(
      bufferAfterPurchase,
    )} untouched after the purchase.`;
  }

  if (status === 'risky') {
    const months = Math.max(1, Math.ceil((input.price * 0.5) / Math.max(250, input.monthlyIncome * 0.12)));
    return `Risky. Delay by about ${months} month${months === 1 ? '' : 's'} or reduce the price before buying.`;
  }

  const suggestedMonthlySaving = Math.max(250, Math.ceil(input.price / 4 / 50) * 50);
  return `Critical. Delay the purchase and set aside about ${formatCurrency(
    suggestedMonthlySaving,
  )} per month before reconsidering.`;
}

export const purchaseService = {
  evaluate(input: PurchaseInput, expenses: Expense[], emergencyBufferGoal: number): PurchaseDecision {
    const summary = calculateFinanceSummary(expenses, input.monthlyIncome);
    const monthlyImpact =
      input.purchaseType === 'financing' ? input.monthlyFinancingAmount ?? input.price / 12 : input.price;
    const bufferAfterPurchase =
      input.purchaseType === 'one-time' ? input.currentSavings - input.price : input.currentSavings;
    const status = statusFromRisk({
      bufferAfterPurchase,
      emergencyBufferGoal,
      remainingMonthly: summary.remainingMonthly,
      monthlyImpact,
      priority: input.priority,
    });

    return {
      id: newId('purchase'),
      ...input,
      recurringMonthlyLoad: summary.recurringMonthlyLoad,
      oneOffMonthlySpending: summary.oneOffMonthlySpending,
      totalMonthlyPressure: summary.totalMonthlyPressure,
      monthlyImpact,
      bufferAfterPurchase,
      status,
      summary:
        status === 'safe'
          ? 'Safe: this fits the current budget snapshot.'
          : status === 'risky'
            ? 'Risky: this weakens your buffer or monthly flexibility.'
            : 'Critical: this would push your buffer or monthly cash flow below a safe level.',
      recommendation: buildRecommendation(status, input, bufferAfterPurchase),
      createdAt: new Date().toISOString(),
    };
  },
};
