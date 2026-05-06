import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { AppScreen, Stack } from '@/components/finpilot/app-screen';
import { Card, MetricCard, SectionHeader } from '@/components/finpilot/card';
import { DocumentCard, ExpenseCard } from '@/components/finpilot/list-cards';
import { Body, H1, Muted } from '@/components/finpilot/text';
import { FinPilotColors } from '@/constants/finpilot';
import { useFinPilot } from '@/context/finpilot-context';
import { calculateFinanceSummary, categoryColor, categoryTotals, upcomingDeadlines } from '@/utils/finance';
import { formatCurrency, formatDate, percent } from '@/utils/formatters';

export default function DashboardScreen() {
  const router = useRouter();
  const { state } = useFinPilot();
  const summary = calculateFinanceSummary(state.expenses, state.settings.monthlyIncome);
  const categories = categoryTotals(state.expenses).slice(0, 5);
  const deadlines = upcomingDeadlines(state.expenses);
  const recentDocuments = [...state.documents]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 3);

  return (
    <AppScreen>
      <Stack gap={4}>
        <Muted>FinPilot</Muted>
        <H1>Your finance cockpit</H1>
        <Body>Know what you pay, what is covered, and what you can afford.</Body>
      </Stack>

      <View style={styles.metricGrid}>
        <MetricCard label="Fixed costs" value={formatCurrency(summary.fixedMonthly)} helper="per month" />
        <MetricCard label="Variable costs" value={formatCurrency(summary.variableMonthly)} helper="per month" />
        <MetricCard label="Total expenses" value={formatCurrency(summary.totalMonthly)} helper="monthly load" />
        <MetricCard
          label="Remaining"
          value={formatCurrency(summary.remainingMonthly)}
          helper="after recurring expenses"
          tone={summary.remainingMonthly > 1000 ? 'safe' : summary.remainingMonthly > 0 ? 'warning' : 'danger'}
        />
      </View>

      <Card style={summary.remainingMonthly < 600 ? styles.warningCard : undefined}>
        <Muted>Risk signal</Muted>
        <Body style={styles.strong}>
          {summary.remainingMonthly < 0
            ? 'Critical: recurring costs exceed monthly income.'
            : summary.remainingMonthly < 600
              ? 'Risky: your monthly flexibility is thin.'
              : 'Stable: recurring costs leave room for decisions.'}
        </Body>
        <Muted>
          Yearly recurring pressure: {formatCurrency(summary.yearlyRecurring)}. Emergency buffer target:{' '}
          {formatCurrency(state.settings.emergencyBufferGoal)}.
        </Muted>
      </Card>

      <Stack>
        <SectionHeader title="Top categories" />
        <Card>
          {categories.length === 0 ? (
            <Muted>No recurring expenses yet.</Muted>
          ) : (
            categories.map((item) => {
              const barWidth = percent(item.total, summary.totalMonthly);

              return (
                <View key={item.category} style={styles.categoryRow}>
                  <View style={styles.categoryHeader}>
                    <Body style={styles.strong}>{item.category}</Body>
                    <Muted>{formatCurrency(item.total)}</Muted>
                  </View>
                  <View style={styles.barTrack}>
                    <View
                      style={[
                        styles.barFill,
                        { width: `${barWidth}%`, backgroundColor: categoryColor(item.category) },
                      ]}
                    />
                  </View>
                </View>
              );
            })
          )}
        </Card>
      </Stack>

      <Stack>
        <SectionHeader title="Upcoming deadlines" actionLabel="Expenses" onAction={() => router.push('/expenses')} />
        {deadlines.length === 0 ? (
          <Card>
            <Muted>No upcoming contract deadlines found.</Muted>
          </Card>
        ) : (
          deadlines.map((expense) => (
            <Card compact key={expense.id}>
              <View style={styles.deadlineRow}>
                <View>
                  <Body style={styles.strong}>{expense.name}</Body>
                  <Muted>{expense.category}</Muted>
                </View>
                <Body style={styles.strong}>{formatDate(expense.endDate)}</Body>
              </View>
            </Card>
          ))
        )}
      </Stack>

      <Stack>
        <SectionHeader title="Recent documents" actionLabel="Vault" onAction={() => router.push('/documents')} />
        {recentDocuments.map((document) => (
          <DocumentCard
            key={document.id}
            document={document}
            onPress={() => router.push(`/document/${document.id}`)}
          />
        ))}
      </Stack>

      <Stack>
        <SectionHeader title="Recent expense" />
        {state.expenses[0] ? <ExpenseCard expense={state.expenses[0]} /> : <Muted>No expenses yet.</Muted>}
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
  strong: {
    fontWeight: '800',
  },
  warningCard: {
    borderColor: FinPilotColors.amber,
  },
  categoryRow: {
    gap: 6,
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  barTrack: {
    backgroundColor: FinPilotColors.surfaceAlt,
    borderRadius: 8,
    height: 10,
    overflow: 'hidden',
  },
  barFill: {
    borderRadius: 8,
    height: 10,
  },
  deadlineRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});

