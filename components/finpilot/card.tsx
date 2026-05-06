import { MaterialIcons } from '@expo/vector-icons';
import { PropsWithChildren } from 'react';
import { Pressable, StyleSheet, View, ViewProps } from 'react-native';

import { Body, H2, Muted } from '@/components/finpilot/text';
import { FinPilotColors, shadow } from '@/constants/finpilot';

type CardProps = PropsWithChildren<
  ViewProps & {
    compact?: boolean;
  }
>;

export function Card({ children, style, compact = false, ...props }: CardProps) {
  return (
    <View style={[styles.card, compact && styles.compact, style]} {...props}>
      {children}
    </View>
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
  return (
    <Card style={[styles.metric, tone !== 'default' && styles[tone]]}>
      <Muted>{label}</Muted>
      <Body style={styles.metricValue}>{value}</Body>
      {helper ? <Muted>{helper}</Muted> : null}
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
  return (
    <View style={styles.sectionHeader}>
      <H2>{title}</H2>
      {actionLabel && onAction ? (
        <Pressable onPress={onAction} style={styles.headerAction}>
          <Body style={styles.headerActionText}>{actionLabel}</Body>
          <MaterialIcons name="chevron-right" size={18} color={FinPilotColors.primary} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: FinPilotColors.surface,
    borderColor: FinPilotColors.border,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    gap: 10,
    padding: 14,
    ...shadow,
  },
  compact: {
    padding: 10,
  },
  metric: {
    flex: 1,
    minWidth: 150,
  },
  metricValue: {
    color: FinPilotColors.text,
    fontSize: 24,
    fontWeight: '800',
    lineHeight: 30,
  },
  safe: {
    borderColor: '#B7DFC8',
  },
  warning: {
    borderColor: '#E9D49D',
  },
  danger: {
    borderColor: '#E7B1B1',
  },
  sectionHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  headerAction: {
    alignItems: 'center',
    flexDirection: 'row',
    minHeight: 34,
  },
  headerActionText: {
    color: FinPilotColors.primary,
    fontWeight: '700',
  },
});

