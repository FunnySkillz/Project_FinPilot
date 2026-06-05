import { useRouter } from 'expo-router';

import { AppScreen, Stack } from '@/components/finpilot/app-screen';
import { Card, MetricCard, SectionHeader } from '@/components/finpilot/card';
import { DocumentCard, ExpenseCard } from '@/components/finpilot/list-cards';
import { Body, H1, Muted } from '@/components/finpilot/text';
import { Box, HStack, VStack } from '@/components/ui/gluestack';
import { useFinPilot } from '@/context/finpilot-context';
import { useLanguage } from '@/context/language-context';
import { calculateFinanceSummary, categoryColor, categoryTotals, upcomingDeadlines } from '@/utils/finance';
import { formatCurrency, formatDate, percent } from '@/utils/formatters';

export default function DashboardScreen() {
  const router = useRouter();
  const { state } = useFinPilot();
  const { locale, t } = useLanguage();
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

      <Box className="flex-row flex-wrap gap-2.5">
        <MetricCard
          label={t('expenses.monthlyLoad')}
          value={formatCurrency(summary.recurringMonthlyLoad, state.settings.currency, locale)}
          helper="per month"
        />
        <MetricCard
          label={t('expenses.oneOffMonthlySpending')}
          value={formatCurrency(summary.oneOffMonthlySpending, state.settings.currency, locale)}
          helper="current month"
        />
        <MetricCard
          label={t('expenses.totalMonthlyPressure')}
          value={formatCurrency(summary.totalMonthlyPressure, state.settings.currency, locale)}
          helper="estimated"
        />
        <MetricCard
          label="Remaining"
          value={formatCurrency(summary.remainingMonthly, state.settings.currency, locale)}
          helper="after monthly pressure"
          tone={summary.remainingMonthly > 1000 ? 'safe' : summary.remainingMonthly > 0 ? 'warning' : 'danger'}
        />
      </Box>

      <Card className={summary.remainingMonthly < 600 ? 'border-fin-amber' : undefined}>
        <Muted>Risk signal</Muted>
        <Body className="font-extrabold">
          {summary.remainingMonthly < 0
            ? 'Critical: monthly pressure exceeds monthly income.'
            : summary.remainingMonthly < 600
              ? 'Risky: your monthly flexibility is thin.'
              : 'Stable: your monthly pressure leaves room for decisions.'}
        </Body>
        <Muted>
          Yearly recurring baseline: {formatCurrency(summary.yearlyRecurring, state.settings.currency, locale)}. Emergency buffer target:{' '}
          {formatCurrency(state.settings.emergencyBufferGoal, state.settings.currency, locale)}.
        </Muted>
      </Card>

      <Stack>
        <SectionHeader title="Top categories" />
        <Card>
          {categories.length === 0 ? (
            <Muted>No recurring expenses yet.</Muted>
          ) : (
            categories.map((item) => {
              const barWidth = percent(item.total, summary.totalMonthlyPressure);

              return (
                <VStack key={item.category} className="gap-1.5">
                  <HStack className="justify-between">
                    <Body className="font-extrabold">{item.category}</Body>
                    <Muted>{formatCurrency(item.total, state.settings.currency, locale)}</Muted>
                  </HStack>
                  <Box className="h-2.5 overflow-hidden rounded-fin bg-fin-surfaceAlt">
                    <Box
                      className="h-2.5 rounded-fin"
                      style={{ width: `${barWidth}%`, backgroundColor: categoryColor(item.category) }}
                    />
                  </Box>
                </VStack>
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
              <HStack className="justify-between">
                <Box>
                  <Body className="font-extrabold">{expense.name}</Body>
                  <Muted>{expense.category}</Muted>
                </Box>
                <Body className="font-extrabold">{formatDate(expense.endDate, locale)}</Body>
              </HStack>
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
