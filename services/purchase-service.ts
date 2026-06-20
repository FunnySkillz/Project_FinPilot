import { languageToLocaleMap, translate } from '@/i18n';
import type { AppLanguage, Expense, PurchaseDecision, PurchaseInput, PurchaseStatus } from '@/types/finpilot';
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

function buildRecommendation(
  status: PurchaseStatus,
  input: PurchaseInput,
  bufferAfterPurchase: number,
  language: AppLanguage,
) {
  if (status === 'safe') {
    return translate(language, 'purchase.recommendation.safe', {
      amount: formatCurrency(bufferAfterPurchase, 'EUR', languageToLocaleMap[language]),
    });
  }

  if (status === 'risky') {
    const months = Math.max(1, Math.ceil((input.price * 0.5) / Math.max(250, input.monthlyIncome * 0.12)));
    return translate(
      language,
      months === 1 ? 'purchase.recommendation.risky.one' : 'purchase.recommendation.risky.many',
      { months },
    );
  }

  const suggestedMonthlySaving = Math.max(250, Math.ceil(input.price / 4 / 50) * 50);
  return translate(language, 'purchase.recommendation.critical', {
    amount: formatCurrency(suggestedMonthlySaving, 'EUR', languageToLocaleMap[language]),
  });
}

export const purchaseService = {
  evaluate(
    input: PurchaseInput,
    expenses: Expense[],
    emergencyBufferGoal: number,
    language: AppLanguage,
  ): PurchaseDecision {
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
      summary: translate(language, `purchase.summary.${status}` as const),
      recommendation: buildRecommendation(status, input, bufferAfterPurchase, language),
      createdAt: new Date().toISOString(),
    };
  },
};
