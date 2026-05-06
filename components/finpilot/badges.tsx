import { Badge, Text } from '@/components/ui/gluestack';
import { getFinTheme } from '@/constants/finpilot';
import { useThemeMode } from '@/context/theme-mode-context';
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
  const { resolvedMode } = useThemeMode();
  const theme = getFinTheme(resolvedMode);
  const color =
    confidence === 'high'
      ? theme.safe
      : confidence === 'medium'
        ? theme.amber
        : theme.danger;

  return (
    <Badge style={{ borderColor: color }}>
      <Text className="text-xs font-extrabold leading-4" style={{ color }}>
        {confidence} confidence
      </Text>
    </Badge>
  );
}

export function StatusBadge({ status }: { status: PurchaseStatus }) {
  const { resolvedMode } = useThemeMode();
  const theme = getFinTheme(resolvedMode);
  const color =
    status === 'safe' ? theme.safe : status === 'risky' ? theme.amber : theme.danger;

  return (
    <Badge className="bg-fin-surface" style={{ borderColor: color }}>
      <Text className="text-xs font-extrabold uppercase leading-4" style={{ color }}>
        {status}
      </Text>
    </Badge>
  );
}
