import { ChevronRight } from 'lucide-react-native';
import { PropsWithChildren } from 'react';
import type { ViewProps } from 'react-native';

import { Body, H2, Muted } from '@/components/finpilot/text';
import { Box, Card as GlueCard, HStack, Pressable, VStack } from '@/components/ui/gluestack';
import { getFinTheme } from '@/constants/finpilot';
import { useThemeMode } from '@/context/theme-mode-context';

type CardProps = PropsWithChildren<
  ViewProps & {
    compact?: boolean;
    className?: string;
  }
>;

export function Card({ children, className, compact = false, ...props }: CardProps) {
  return (
    <GlueCard className={`${compact ? 'p-2.5' : ''} ${className ?? ''}`} {...props}>
      {children}
    </GlueCard>
  );
}

export function MetricCard({
  label,
  value,
  tone = 'default',
  helper,
}: {
  label: string;
  value: string;
  tone?: 'default' | 'safe' | 'warning' | 'danger';
  helper?: string;
}) {
  const toneClass =
    tone === 'safe'
      ? 'border-[#B7DFC8]'
      : tone === 'warning'
        ? 'border-[#E9D49D]'
        : tone === 'danger'
          ? 'border-[#E7B1B1]'
          : '';

  return (
    <Card className={`min-w-[150px] flex-1 ${toneClass}`}>
      <VStack>
        <Muted>{label}</Muted>
        <Body className="text-2xl font-extrabold leading-[30px]">{value}</Body>
        {helper ? <Muted>{helper}</Muted> : null}
      </VStack>
    </Card>
  );
}

export function SectionHeader({
  title,
  actionLabel,
  onAction,
}: {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  const { resolvedMode } = useThemeMode();
  const theme = getFinTheme(resolvedMode);

  return (
    <HStack className="justify-between">
      <H2>{title}</H2>
      {actionLabel && onAction ? (
        <Pressable onPress={onAction} className="min-h-[34px] flex-row items-center">
          <Body className="font-bold text-fin-primary">{actionLabel}</Body>
          <ChevronRight size={18} color={theme.primary} />
        </Pressable>
      ) : (
        <Box />
      )}
    </HStack>
  );
}
