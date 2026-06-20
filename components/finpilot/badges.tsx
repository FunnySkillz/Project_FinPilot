import { Badge, Text } from '@/components/ui/gluestack';
import { getFinTheme } from '@/constants/finpilot';
import { useLanguage } from '@/context/language-context';
import { useThemeMode } from '@/context/theme-mode-context';
import { categoryLabelKey, confidenceLabelKey, purchaseStatusLabelKey } from '@/i18n';
import type { Category, Confidence, PurchaseStatus } from '@/types/finpilot';
import { categoryColor } from '@/utils/finance';

export function CategoryBadge({ category }: { category: Category }) {
  const { t } = useLanguage();
  const color = categoryColor(category);

  return (
    <Badge style={{ borderColor: color }}>
      <Text className="text-xs font-extrabold leading-4" style={{ color }}>
        {t(categoryLabelKey(category))}
      </Text>
    </Badge>
  );
}

export function ConfidenceBadge({ confidence }: { confidence: Confidence }) {
  const { t } = useLanguage();
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
        {t(confidenceLabelKey(confidence))}
      </Text>
    </Badge>
  );
}

export function StatusBadge({ status }: { status: PurchaseStatus }) {
  const { t } = useLanguage();
  const { resolvedMode } = useThemeMode();
  const theme = getFinTheme(resolvedMode);
  const color =
    status === 'safe' ? theme.safe : status === 'risky' ? theme.amber : theme.danger;

  return (
    <Badge className="bg-fin-surface" style={{ borderColor: color }}>
      <Text className="text-xs font-extrabold uppercase leading-4" style={{ color }}>
        {t(purchaseStatusLabelKey(status))}
      </Text>
    </Badge>
  );
}
