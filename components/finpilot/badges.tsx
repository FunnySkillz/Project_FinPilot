import { Badge, Text } from '@/components/ui/gluestack';
import { FinPilotColors } from '@/constants/finpilot';
import type { Category, Confidence, PurchaseStatus } from '@/types/finpilot';
import { categoryColor } from '@/utils/finance';

export function CategoryBadge({ category }: { category: Category }) {
  const color = categoryColor(category);

  return (
    <Badge style={{ borderColor: color }}>
      <Text className="text-xs font-extrabold leading-4" style={{ color }}>
        {category}
      </Text>
    </Badge>
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
    <Badge style={{ borderColor: color }}>
      <Text className="text-xs font-extrabold leading-4" style={{ color }}>
        {confidence} confidence
      </Text>
    </Badge>
  );
}

export function StatusBadge({ status }: { status: PurchaseStatus }) {
  const color =
    status === 'safe' ? FinPilotColors.safe : status === 'risky' ? FinPilotColors.amber : FinPilotColors.danger;

  return (
    <Badge className="bg-fin-surface" style={{ borderColor: color }}>
      <Text className="text-xs font-extrabold uppercase leading-4" style={{ color }}>
        {status}
      </Text>
    </Badge>
  );
}

