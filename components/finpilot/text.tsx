import { PropsWithChildren } from 'react';
import { StyleSheet, Text, TextProps } from 'react-native';

import { FinPilotColors } from '@/constants/finpilot';

type CopyProps = PropsWithChildren<TextProps>;

export function H1({ children, style, ...props }: CopyProps) {
  return (
    <Text style={[styles.h1, style]} {...props}>
      {children}
    </Text>
  );
}

export function H2({ children, style, ...props }: CopyProps) {
  return (
    <Text style={[styles.h2, style]} {...props}>
      {children}
    </Text>
  );
}

export function Body({ children, style, ...props }: CopyProps) {
  return (
    <Text style={[styles.body, style]} {...props}>
      {children}
    </Text>
  );
}

export function Label({ children, style, ...props }: CopyProps) {
  return (
    <Text style={[styles.label, style]} {...props}>
      {children}
    </Text>
  );
}

export function Muted({ children, style, ...props }: CopyProps) {
  return (
    <Text style={[styles.muted, style]} {...props}>
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  h1: {
    color: FinPilotColors.text,
    fontSize: 30,
    fontWeight: '800',
    lineHeight: 36,
  },
  h2: {
    color: FinPilotColors.text,
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 24,
  },
  body: {
    color: FinPilotColors.text,
    fontSize: 15,
    lineHeight: 22,
  },
  label: {
    color: FinPilotColors.text,
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 18,
  },
  muted: {
    color: FinPilotColors.muted,
    fontSize: 13,
    lineHeight: 19,
  },
});

