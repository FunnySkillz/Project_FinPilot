import { MaterialIcons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';

import { CategoryBadge, ConfidenceBadge, StatusBadge } from '@/components/finpilot/badges';
import { Card } from '@/components/finpilot/card';
import { Body, H2, Muted } from '@/components/finpilot/text';
import { FinPilotColors } from '@/constants/finpilot';
import type { Expense, FinancialDocument, PurchaseDecision } from '@/types/finpilot';
import { formatCurrency, formatDate } from '@/utils/formatters';

export function ExpenseCard({ expense, onPress }: { expense: Expense; onPress?: () => void }) {
  return (
    <Pressable onPress={onPress} disabled={!onPress}>
      <Card>
        <View style={styles.row}>
          <View style={styles.fill}>
            <H2>{expense.name}</H2>
            <Muted>
              {expense.cadence} · {expense.kind}
            </Muted>
          </View>
          <Body style={styles.amount}>{formatCurrency(expense.amount)}</Body>
        </View>
        <View style={styles.wrapRow}>
          <CategoryBadge category={expense.category} />
          {expense.endDate ? <Muted>Deadline {formatDate(expense.endDate)}</Muted> : null}
        </View>
        {expense.notes ? <Muted>{expense.notes}</Muted> : null}
      </Card>
    </Pressable>
  );
}

export function DocumentCard({ document, onPress }: { document: FinancialDocument; onPress?: () => void }) {
  return (
    <Pressable onPress={onPress} disabled={!onPress}>
      <Card>
        <View style={styles.row}>
          <View style={styles.fill}>
            <H2>{document.title}</H2>
            <Muted>
              {document.provider ?? 'No provider'} · {document.fileName ?? 'Manual record'}
            </Muted>
          </View>
          <MaterialIcons name="description" size={24} color={FinPilotColors.primary} />
        </View>
        <View style={styles.wrapRow}>
          <CategoryBadge category={document.category} />
          {document.analysis ? <ConfidenceBadge confidence={document.analysis.confidence} /> : null}
        </View>
        {document.analysis?.summary ? <Muted>{document.analysis.summary}</Muted> : null}
      </Card>
    </Pressable>
  );
}

export function PurchaseDecisionCard({ decision }: { decision: PurchaseDecision }) {
  return (
    <Card>
      <View style={styles.row}>
        <View style={styles.fill}>
          <H2>{decision.purchaseName}</H2>
          <Muted>
            {formatCurrency(decision.price)} · {decision.purchaseType}
          </Muted>
        </View>
        <StatusBadge status={decision.status} />
      </View>
      <Body>{decision.summary}</Body>
      <Muted>{decision.recommendation}</Muted>
    </Card>
  );
}

const styles = StyleSheet.create({
  row: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
  },
  wrapRow: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  fill: {
    flex: 1,
    gap: 2,
  },
  amount: {
    color: FinPilotColors.text,
    fontWeight: '800',
  },
});

