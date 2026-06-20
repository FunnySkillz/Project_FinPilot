import { FileText } from 'lucide-react-native';

import { CategoryBadge, ConfidenceBadge, StatusBadge } from '@/components/finpilot/badges';
import { Card } from '@/components/finpilot/card';
import { Body, H2, Muted } from '@/components/finpilot/text';
import { Box, HStack, Pressable, VStack } from '@/components/ui/gluestack';
import { getFinTheme } from '@/constants/finpilot';
import { useLanguage } from '@/context/language-context';
import { useThemeMode } from '@/context/theme-mode-context';
import { purchaseTypeLabelKey } from '@/i18n';
import type { Expense, ExpenseCadence, FinancialDocument, PaymentMethod, PurchaseDecision } from '@/types/finpilot';
import { formatCurrency, formatDate } from '@/utils/formatters';

function paymentMethodLabelKey(paymentMethod: PaymentMethod) {
  return `expenses.payment.${paymentMethod}` as const;
}

function cadenceLabelKey(cadence: ExpenseCadence) {
  return `expenses.cadence.${cadence}` as const;
}

function notePreview(notes: string) {
  return notes.length > 120 ? `${notes.slice(0, 117)}...` : notes;
}

export function ExpenseCard({ expense, onPress }: { expense: Expense; onPress?: () => void }) {
  const { locale, t } = useLanguage();
  const { resolvedMode } = useThemeMode();
  const theme = getFinTheme(resolvedMode);
  const tagPreview = expense.tags.slice(0, 4);

  return (
    <Pressable onPress={onPress} disabled={!onPress}>
      <Card>
        <VStack>
          <HStack className="items-start justify-between">
            <Box className="flex-1">
              <H2>{expense.name}</H2>
              <Muted>
                {expense.kind === 'recurring' ? t('expenses.recurring') : t('expenses.oneOff')}
                {expense.kind === 'recurring' && expense.cadence ? ` | ${t(cadenceLabelKey(expense.cadence))}` : ''}
              </Muted>
            </Box>
            <Body className="font-extrabold">{formatCurrency(expense.amount, 'EUR', locale)}</Body>
          </HStack>
          <HStack className="flex-wrap gap-2">
            <Muted>
              {expense.kind === 'recurring' ? t('expenses.startDate') : t('expenses.date')}{' '}
              {formatDate(expense.startDate, locale)}
            </Muted>
            {expense.merchant ? <Muted>{expense.merchant}</Muted> : null}
            {expense.paymentMethod ? <Muted>{t(paymentMethodLabelKey(expense.paymentMethod))}</Muted> : null}
            {expense.linkedDocumentId ? <FileText size={16} color={theme.primary} /> : null}
          </HStack>
          <HStack className="flex-wrap gap-2">
            <CategoryBadge category={expense.category} />
            {expense.endDate ? <Muted>{t('expenses.deadline')} {formatDate(expense.endDate, locale)}</Muted> : null}
          </HStack>
          {tagPreview.length > 0 ? (
            <HStack className="flex-wrap gap-1.5">
              {tagPreview.map((tag) => (
                <Muted key={tag}>#{tag}</Muted>
              ))}
            </HStack>
          ) : null}
          {expense.notes ? <Muted>{notePreview(expense.notes)}</Muted> : null}
        </VStack>
      </Card>
    </Pressable>
  );
}

export function DocumentCard({ document, onPress }: { document: FinancialDocument; onPress?: () => void }) {
  const { t } = useLanguage();
  const { resolvedMode } = useThemeMode();
  const theme = getFinTheme(resolvedMode);

  return (
    <Pressable onPress={onPress} disabled={!onPress}>
      <Card>
        <VStack>
          <HStack className="items-start justify-between">
            <Box className="flex-1">
              <H2>{document.title}</H2>
              <Muted>
                {document.provider ?? t('documents.noProvider')} | {document.fileName ?? t('documents.manualRecord')}
              </Muted>
            </Box>
            <FileText size={24} color={theme.primary} />
          </HStack>
          <HStack className="flex-wrap gap-2">
            <CategoryBadge category={document.category} />
            {document.analysis ? <ConfidenceBadge confidence={document.analysis.confidence} /> : null}
          </HStack>
          {document.analysis?.summary ? <Muted>{document.analysis.summary}</Muted> : null}
        </VStack>
      </Card>
    </Pressable>
  );
}

export function PurchaseDecisionCard({ decision }: { decision: PurchaseDecision }) {
  const { locale, t } = useLanguage();

  return (
    <Card>
      <VStack>
        <HStack className="items-start justify-between">
          <Box className="flex-1">
            <H2>{decision.purchaseName}</H2>
            <Muted>
              {formatCurrency(decision.price, 'EUR', locale)} | {t(purchaseTypeLabelKey(decision.purchaseType))}
            </Muted>
          </Box>
          <StatusBadge status={decision.status} />
        </HStack>
        <Body>{decision.summary}</Body>
        <Muted>{decision.recommendation}</Muted>
      </VStack>
    </Card>
  );
}
