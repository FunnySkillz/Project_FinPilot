import { useState } from 'react';
import { Alert } from 'react-native';
import { ShieldCheck } from 'lucide-react-native';

import { AppScreen, Stack } from '@/components/finpilot/app-screen';
import { StatusBadge } from '@/components/finpilot/badges';
import { Card, MetricCard, SectionHeader } from '@/components/finpilot/card';
import { Button, Field, SegmentedControl } from '@/components/finpilot/controls';
import { PurchaseDecisionCard } from '@/components/finpilot/list-cards';
import { Body, H1, Muted } from '@/components/finpilot/text';
import { Box, HStack } from '@/components/ui/gluestack';
import { useFinPilot } from '@/context/finpilot-context';
import { useLanguage } from '@/context/language-context';
import type { PurchaseDecision, PurchasePriority, PurchaseType } from '@/types/finpilot';
import { calculateFinanceSummary } from '@/utils/finance';
import { formatCurrency } from '@/utils/formatters';

type PurchaseForm = {
  purchaseName: string;
  price: string;
  purchaseType: PurchaseType;
  priority: PurchasePriority;
  currentSavings: string;
  monthlyIncome: string;
  monthlyFinancingAmount: string;
};

export default function PurchaseScreen() {
  const { state, evaluatePurchase } = useFinPilot();
  const { locale, t } = useLanguage();
  const finance = calculateFinanceSummary(state.expenses, state.settings.monthlyIncome);
  const [form, setForm] = useState<PurchaseForm>({
    purchaseName: 'New wheels',
    price: '6000',
    purchaseType: 'one-time',
    priority: 'medium',
    currentSavings: '9000',
    monthlyIncome: String(state.settings.monthlyIncome),
    monthlyFinancingAmount: '500',
  });
  const [decision, setDecision] = useState<PurchaseDecision | undefined>(state.purchaseDecisions[0]);

  const submit = async () => {
    const price = Number(form.price.replace(',', '.'));
    const currentSavings = Number(form.currentSavings.replace(',', '.'));
    const monthlyIncome = Number(form.monthlyIncome.replace(',', '.'));
    const monthlyFinancingAmount = Number(form.monthlyFinancingAmount.replace(',', '.'));

    if (!form.purchaseName.trim() || price <= 0 || currentSavings < 0 || monthlyIncome <= 0) {
      Alert.alert('Missing information', 'Add a purchase name, price, savings, and monthly income.');
      return;
    }

    const result = await evaluatePurchase({
      purchaseName: form.purchaseName.trim(),
      price,
      purchaseType: form.purchaseType,
      priority: form.priority,
      currentSavings,
      monthlyIncome,
      monthlyFinancingAmount: Number.isFinite(monthlyFinancingAmount) ? monthlyFinancingAmount : undefined,
    });

    setDecision(result);
  };

  return (
    <AppScreen>
      <Stack gap={4}>
        <Muted>Personal CFO</Muted>
        <H1>Purchase Check</H1>
        <Body>Run emotional purchases through your real cost base before money leaves the account.</Body>
      </Stack>

      <Box className="flex-row flex-wrap gap-2.5">
        <MetricCard
          label={t('expenses.monthlyLoad')}
          value={formatCurrency(finance.recurringMonthlyLoad, state.settings.currency, locale)}
          helper="from recurring expenses"
        />
        <MetricCard label="Remaining cash flow" value={formatCurrency(finance.remainingMonthly, state.settings.currency, locale)} helper="monthly" />
      </Box>

      <Card>
        <Stack>
          <Field
            label="Purchase"
            value={form.purchaseName}
            onChangeText={(purchaseName) => setForm((current) => ({ ...current, purchaseName }))}
            placeholder="New wheels"
          />
          <Field
            label="Price"
            value={form.price}
            onChangeText={(price) => setForm((current) => ({ ...current, price }))}
            keyboardType="decimal-pad"
            placeholder="6000"
          />
          <Stack gap={8}>
            <Muted>Payment type</Muted>
            <SegmentedControl
              values={['one-time', 'financing']}
              selected={form.purchaseType}
              onSelect={(purchaseType) => setForm((current) => ({ ...current, purchaseType }))}
            />
          </Stack>
          {form.purchaseType === 'financing' ? (
            <Field
              label="Monthly financing amount"
              value={form.monthlyFinancingAmount}
              onChangeText={(monthlyFinancingAmount) =>
                setForm((current) => ({ ...current, monthlyFinancingAmount }))
              }
              keyboardType="decimal-pad"
              placeholder="500"
            />
          ) : null}
          <Stack gap={8}>
            <Muted>Priority</Muted>
            <SegmentedControl
              values={['low', 'medium', 'high']}
              selected={form.priority}
              onSelect={(priority) => setForm((current) => ({ ...current, priority }))}
            />
          </Stack>
          <Field
            label="Current savings"
            value={form.currentSavings}
            onChangeText={(currentSavings) => setForm((current) => ({ ...current, currentSavings }))}
            keyboardType="decimal-pad"
            placeholder="9000"
          />
          <Field
            label="Monthly income"
            value={form.monthlyIncome}
            onChangeText={(monthlyIncome) => setForm((current) => ({ ...current, monthlyIncome }))}
            keyboardType="decimal-pad"
            placeholder="4200"
          />
          <Button onPress={submit} icon={ShieldCheck}>
            Check purchase
          </Button>
        </Stack>
      </Card>

      {decision ? (
        <Card className="border-fin-primary">
          <HStack className="justify-between">
            <Body className="font-extrabold">Current verdict</Body>
            <StatusBadge status={decision.status} />
          </HStack>
          <Body>{decision.summary}</Body>
          <Box className="flex-row flex-wrap gap-2.5">
            <MetricCard label="Monthly impact" value={formatCurrency(decision.monthlyImpact, state.settings.currency, locale)} />
            <MetricCard label="Buffer after" value={formatCurrency(decision.bufferAfterPurchase, state.settings.currency, locale)} />
          </Box>
          <Body className="font-extrabold text-fin-primaryDark">{decision.recommendation}</Body>
        </Card>
      ) : null}

      <SectionHeader title="Previous checks" />
      <Stack>
        {state.purchaseDecisions.length === 0 ? (
          <Card>
            <Muted>No purchase checks yet.</Muted>
          </Card>
        ) : (
          state.purchaseDecisions.slice(0, 5).map((item) => <PurchaseDecisionCard key={item.id} decision={item} />)
        )}
      </Stack>
    </AppScreen>
  );
}
