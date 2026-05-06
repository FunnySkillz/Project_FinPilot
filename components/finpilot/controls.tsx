import { ComponentType, PropsWithChildren } from 'react';
import { ScrollView, TextInputProps } from 'react-native';

import { Body, Label, Muted } from '@/components/finpilot/text';
import {
  Button as GlueButton,
  ButtonText,
  Input,
  Pressable,
  Textarea,
  VStack,
} from '@/components/ui/gluestack';

type IconComponent = ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;

type ButtonProps = PropsWithChildren<{
  onPress: () => void;
  icon?: IconComponent;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  disabled?: boolean;
}>;

export function Button({ children, onPress, icon, variant = 'primary', disabled = false }: ButtonProps) {
  return (
    <GlueButton disabled={disabled} onPress={onPress} icon={icon} variant={variant}>
      <ButtonText variant={variant}>{children}</ButtonText>
    </GlueButton>
  );
}

export function Field({
  label,
  helper,
  ...props
}: TextInputProps & {
  label: string;
  helper?: string;
}) {
  return (
    <VStack className="gap-1.5">
      <Label>{label}</Label>
      {props.multiline ? <Textarea {...props} /> : <Input {...props} />}
      {helper ? <Muted>{helper}</Muted> : null}
    </VStack>
  );
}

export function SegmentedControl<T extends string>({
  values,
  selected,
  onSelect,
  getLabel,
}: {
  values: T[];
  selected: T;
  onSelect: (value: T) => void;
  getLabel?: (value: T) => string;
}) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-2 py-0.5">
      {values.map((value) => {
        const active = selected === value;
        const label = getLabel ? getLabel(value) : value;

        return (
          <Pressable
            key={value}
            onPress={() => onSelect(value)}
            className={`min-h-[38px] rounded-fin border px-3 py-2 ${
              active ? 'border-fin-primary bg-fin-primary' : 'border-fin-border bg-fin-surface'
            }`}>
            <Body className={`text-[13px] font-bold ${active ? 'text-fin-textOnPrimary' : 'text-fin-text'}`}>
              {label}
            </Body>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}
