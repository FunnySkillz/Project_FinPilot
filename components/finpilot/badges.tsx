import { StyleSheet, View } from 'react-native';

import { Body } from '@/components/finpilot/text';
import { FinPilotColors } from '@/constants/finpilot';
import type { Category, Confidence, PurchaseStatus } from '@/types/finpilot';
import { categoryColor } from '@/utils/finance';

export function CategoryBadge({ category }: { category: Category }) {
  return (
    <View style={[styles.badge, { borderColor: categoryColor(category) }]}>
      <Body style={[styles.badgeText, { color: categoryColor(category) }]}>{category}</Body>
    </View>
  );
}

export function ConfidenceBadge({ confidence }: { confidence: Confidence }) {
  const color =
    confidence === 'high'
      ? FinPilotColors.safe
      : confidence === 'medium'
        ? FinPilotColors.amber
        : FinPilotColors.danger;

  return (
    <View style={[styles.badge, { borderColor: color }]}>
      <Body style={[styles.badgeText, { color }]}>{confidence} confidence</Body>
    </View>
  );
}

export function StatusBadge({ status }: { status: PurchaseStatus }) {
  const color =
    status === 'safe' ? FinPilotColors.safe : status === 'risky' ? FinPilotColors.amber : FinPilotColors.danger;

  return (
    <View style={[styles.badge, { borderColor: color, backgroundColor: '#FFFFFF' }]}>
      <Body style={[styles.badgeText, { color }]}>{status.toUpperCase()}</Body>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '800',
    lineHeight: 16,
  },
});

