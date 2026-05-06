import { MaterialIcons } from '@expo/vector-icons';
import { PropsWithChildren } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, TextInputProps, View } from 'react-native';

import { Body, Label, Muted } from '@/components/finpilot/text';
import { FinPilotColors } from '@/constants/finpilot';

type ButtonProps = PropsWithChildren<{
  onPress: () => void;
  icon?: keyof typeof MaterialIcons.glyphMap;
  variant?: 'primary' | 'secondary' | 'danger';
  disabled?: boolean;
}>;

export function Button({ children, onPress, icon, variant = 'primary', disabled = false }: ButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        variant === 'secondary' && styles.secondaryButton,
        variant === 'danger' && styles.dangerButton,
        disabled && styles.disabled,
        pressed && !disabled && styles.pressed,
      ]}>
      {icon ? (
        <MaterialIcons
          name={icon}
          size={18}
          color={variant === 'secondary' ? FinPilotColors.primary : '#FFFFFF'}
        />
      ) : null}
      <Body
        style={[
          styles.buttonText,
          variant === 'secondary' && styles.secondaryButtonText,
          disabled && styles.disabledText,
        ]}>
        {children}
      </Body>
    </Pressable>
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
    <View style={styles.field}>
      <Label>{label}</Label>
      <TextInput
        placeholderTextColor="#8A948B"
        style={[styles.input, props.multiline && styles.multilineInput, props.style]}
        {...props}
      />
      {helper ? <Muted>{helper}</Muted> : null}
    </View>
  );
}

export function SegmentedControl<T extends string>({
  values,
  selected,
  onSelect,
}: {
  values: T[];
  selected: T;
  onSelect: (value: T) => void;
}) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
      {values.map((value) => {
        const active = selected === value;

        return (
          <Pressable
            key={value}
            onPress={() => onSelect(value)}
            style={[styles.chip, active && styles.activeChip]}>
            <Body style={[styles.chipText, active && styles.activeChipText]}>{value}</Body>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    backgroundColor: FinPilotColors.primary,
    borderRadius: 8,
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    minHeight: 48,
    paddingHorizontal: 14,
  },
  secondaryButton: {
    backgroundColor: FinPilotColors.surfaceAlt,
    borderColor: FinPilotColors.border,
    borderWidth: 1,
  },
  dangerButton: {
    backgroundColor: FinPilotColors.danger,
  },
  disabled: {
    opacity: 0.5,
  },
  pressed: {
    opacity: 0.82,
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: '800',
    textAlign: 'center',
  },
  secondaryButtonText: {
    color: FinPilotColors.primary,
  },
  disabledText: {
    color: '#FFFFFF',
  },
  field: {
    gap: 6,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderColor: FinPilotColors.border,
    borderRadius: 8,
    borderWidth: 1,
    color: FinPilotColors.text,
    fontSize: 15,
    minHeight: 46,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  multilineInput: {
    minHeight: 92,
    textAlignVertical: 'top',
  },
  chips: {
    gap: 8,
    paddingVertical: 2,
  },
  chip: {
    backgroundColor: '#FFFFFF',
    borderColor: FinPilotColors.border,
    borderRadius: 8,
    borderWidth: 1,
    minHeight: 38,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  activeChip: {
    backgroundColor: FinPilotColors.primary,
    borderColor: FinPilotColors.primary,
  },
  chipText: {
    color: FinPilotColors.text,
    fontSize: 13,
    fontWeight: '700',
  },
  activeChipText: {
    color: '#FFFFFF',
  },
});

