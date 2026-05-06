import { FileText } from 'lucide-react-native';

import { CategoryBadge, ConfidenceBadge, StatusBadge } from '@/components/finpilot/badges';
import { Card } from '@/components/finpilot/card';
import { Body, H2, Muted } from '@/components/finpilot/text';
import { Box, HStack, Pressable, VStack } from '@/components/ui/gluestack';
import { getFinTheme } from '@/constants/finpilot';
import { useLanguage } from '@/context/language-context';
import { useThemeMode } from '@/context/theme-mode-context';
import type { Expense, FinancialDocument, PurchaseDecision } from '@/types/finpilot';
import { formatCurrency, formatDate } from '@/utils/formatters';

export function ExpenseCard({ expense, onPress }: { expense: Expense; onPress?: () => void }) {
  const { locale } = useLanguage();

  return (
    <Pressable onPress={onPress} disabled={!onPress}>
      <Card>
        <VStack>
          <HStack className="items-start justify-between">
            <Box className="flex-1">
              <H2>{expense.name}</H2>
              <Muted>
                {expense.cadence} | {expense.kind}
              </Muted>
            </Box>
            <Body className="font-extrabold">{formatCurrency(expense.amount, 'EUR', locale)}</Body>
          </HStack>
          <HStack className="flex-wrap gap-2">
            <CategoryBadge category={expense.category} />
            {expense.endDate ? <Muted>Deadline {formatDate(expense.endDate, locale)}</Muted> : null}
          </HStack>
          {expense.notes ? <Muted>{expense.notes}</Muted> : null}
        </VStack>
      </Card>
    </Pressable>
  );
}

export function DocumentCard({ document, onPress }: { document: FinancialDocument; onPress?: () => void }) {
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
                {document.provider ?? 'No provider'} | {document.fileName ?? 'Manual record'}
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
  const { locale } = useLanguage();

  return (
    <Card>
      <VStack>
        <HStack className="items-start justify-between">
          <Box className="flex-1">
            <H2>{decision.purchaseName}</H2>
            <Muted>
              {formatCurrency(decision.price, 'EUR', locale)} | {decision.purchaseType}
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
