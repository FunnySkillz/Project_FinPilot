import { useRouter } from 'expo-router';

import { AppScreen, Stack } from '@/components/finpilot/app-screen';
import { Card, MetricCard, SectionHeader } from '@/components/finpilot/card';
import { DocumentCard, ExpenseCard } from '@/components/finpilot/list-cards';
import { Body, H1, Muted } from '@/components/finpilot/text';
import { Box, HStack, VStack } from '@/components/ui/gluestack';
import { useFinPilot } from '@/context/finpilot-context';
import { useLanguage } from '@/context/language-context';
import { categoryLabelKey } from '@/i18n';
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
        <Muted>{t('dashboard.eyebrow')}</Muted>
        <H1>{t('dashboard.title')}</H1>
        <Body>{t('dashboard.body')}</Body>
      </Stack>

      <Box className="flex-row flex-wrap gap-2.5">
        <MetricCard
          label={t('expenses.monthlyLoad')}
          value={formatCurrency(summary.recurringMonthlyLoad, state.settings.currency, locale)}
          helper={t('dashboard.metric.perMonth')}
        />
        <MetricCard
          label={t('expenses.oneOffMonthlySpending')}
          value={formatCurrency(summary.oneOffMonthlySpending, state.settings.currency, locale)}
          helper={t('dashboard.metric.currentMonth')}
        />
        <MetricCard
          label={t('expenses.totalMonthlyPressure')}
          value={formatCurrency(summary.totalMonthlyPressure, state.settings.currency, locale)}
          helper={t('dashboard.metric.estimated')}
        />
        <MetricCard
          label={t('dashboard.metric.remaining')}
          value={formatCurrency(summary.remainingMonthly, state.settings.currency, locale)}
          helper={t('dashboard.metric.afterMonthlyPressure')}
          tone={summary.remainingMonthly > 1000 ? 'safe' : summary.remainingMonthly > 0 ? 'warning' : 'danger'}
        />
      </Box>

      <Card className={summary.remainingMonthly < 600 ? 'border-fin-amber' : undefined}>
        <Muted>{t('dashboard.risk.title')}</Muted>
        <Body className="font-extrabold">
          {summary.remainingMonthly < 0
            ? t('dashboard.risk.critical')
            : summary.remainingMonthly < 600
              ? t('dashboard.risk.risky')
              : t('dashboard.risk.stable')}
        </Body>
        <Muted>
          {t('dashboard.risk.detail', {
            yearly: formatCurrency(summary.yearlyRecurring, state.settings.currency, locale),
            buffer: formatCurrency(state.settings.emergencyBufferGoal, state.settings.currency, locale),
          })}
        </Muted>
      </Card>

      <Stack>
        <SectionHeader title={t('dashboard.topCategories')} />
        <Card>
          {categories.length === 0 ? (
            <Muted>{t('dashboard.noRecurringExpenses')}</Muted>
          ) : (
            categories.map((item) => {
              const barWidth = percent(item.total, summary.totalMonthlyPressure);

              return (
                <VStack key={item.category} className="gap-1.5">
                  <HStack className="justify-between">
                    <Body className="font-extrabold">{t(categoryLabelKey(item.category))}</Body>
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
        <SectionHeader
          title={t('dashboard.upcomingDeadlines')}
          actionLabel={t('navigation.tabs.expenses')}
          onAction={() => router.push('/expenses')}
        />
        {deadlines.length === 0 ? (
          <Card>
            <Muted>{t('dashboard.noUpcomingDeadlines')}</Muted>
          </Card>
        ) : (
          deadlines.map((expense) => (
            <Card compact key={expense.id}>
              <HStack className="justify-between">
                <Box>
                  <Body className="font-extrabold">{expense.name}</Body>
                  <Muted>{t(categoryLabelKey(expense.category))}</Muted>
                </Box>
                <Body className="font-extrabold">{formatDate(expense.endDate, locale)}</Body>
              </HStack>
            </Card>
          ))
        )}
      </Stack>

      <Stack>
        <SectionHeader
          title={t('dashboard.recentDocuments')}
          actionLabel={t('dashboard.vault')}
          onAction={() => router.push('/documents')}
        />
        {recentDocuments.map((document) => (
          <DocumentCard
            key={document.id}
            document={document}
            onPress={() => router.push(`/document/${document.id}`)}
          />
        ))}
      </Stack>

      <Stack>
        <SectionHeader title={t('dashboard.recentExpense')} />
        {state.expenses[0] ? <ExpenseCard expense={state.expenses[0]} /> : <Muted>{t('dashboard.noExpenses')}</Muted>}
      </Stack>
    </AppScreen>
  );
}
