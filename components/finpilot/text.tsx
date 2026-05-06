import { PropsWithChildren } from 'react';
import type { TextProps } from 'react-native';

import { Heading, Label as GlueLabel, MutedText, Text } from '@/components/ui/gluestack';

type CopyProps = PropsWithChildren<TextProps & { className?: string }>;

export function H1({ children, ...props }: CopyProps) {
  return (
    <Heading size="lg" {...props}>
      {children}
    </Heading>
  );
}

export function H2({ children, ...props }: CopyProps) {
  return (
    <Heading size="sm" {...props}>
      {children}
    </Heading>
  );
}

export function Body({ children, ...props }: CopyProps) {
  return <Text {...props}>{children}</Text>;
}

export function Label({ children, ...props }: CopyProps) {
  return <GlueLabel {...props}>{children}</GlueLabel>;
}

export function Muted({ children, ...props }: CopyProps) {
  return <MutedText {...props}>{children}</MutedText>;
}

