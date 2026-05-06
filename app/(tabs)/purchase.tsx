import { useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';

import { AppScreen, Stack } from '@/components/finpilot/app-screen';
import { StatusBadge } from '@/components/finpilot/badges';
import { Card, MetricCard, SectionHeader } from '@/components/finpilot/card';
import { Button, Field, SegmentedControl } from '@/components/finpilot/controls';
import { PurchaseDecisionCard } from '@/components/finpilot/list-cards';
import { Body, H1, Muted } from '@/components/finpilot/text';
import { FinPilotColors } from '@/constants/finpilot';
import { useFinPilot } from '@/context/finpilot-context';
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

      <View style={styles.metricGrid}>
        <MetricCard label="Current fixed costs" value={formatCurrency(finance.fixedMonthly)} helper="from expenses" />
        <MetricCard label="Remaining cash flow" value={formatCurrency(finance.remainingMonthly)} helper="monthly" />
      </View>

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
          <Button onPress={submit} icon="verified-user">
            Check purchase
          </Button>
        </Stack>
      </Card>

      {decision ? (
        <Card style={styles.resultCard}>
          <View style={styles.resultHeader}>
            <Body style={styles.strong}>Current verdict</Body>
            <StatusBadge status={decision.status} />
          </View>
          <Body>{decision.summary}</Body>
          <View style={styles.metricGrid}>
            <MetricCard label="Monthly impact" value={formatCurrency(decision.monthlyImpact)} />
            <MetricCard label="Buffer after" value={formatCurrency(decision.bufferAfterPurchase)} />
          </View>
          <Body style={styles.recommendation}>{decision.recommendation}</Body>
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

const styles = StyleSheet.create({
  metricGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  resultCard: {
    borderColor: FinPilotColors.primary,
  },
  resultHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  strong: {
    fontWeight: '800',
  },
  recommendation: {
    color: FinPilotColors.primaryDark,
    fontWeight: '800',
  },
});

