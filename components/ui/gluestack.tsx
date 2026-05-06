import { cn } from '@gluestack-ui/utils/nativewind-utils';
import { ComponentType, PropsWithChildren } from 'react';
import {
  Pressable as RNPressable,
  PressableProps,
  Text as RNText,
  TextInput,
  TextInputProps,
  TextProps,
  View,
  ViewProps,
} from 'react-native';

import { getFinTheme } from '@/constants/finpilot';
import { useThemeMode } from '@/context/theme-mode-context';

type ClassNameProp = {
  className?: string;
};

type IconComponent = ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;

export function Box({ className, ...props }: ViewProps & ClassNameProp) {
  return <View className={cn(className)} {...props} />;
}

export function VStack({ className, ...props }: ViewProps & ClassNameProp) {
  return <View className={cn('flex-col gap-3', className)} {...props} />;
}

export function HStack({ className, ...props }: ViewProps & ClassNameProp) {
  return <View className={cn('flex-row items-center gap-3', className)} {...props} />;
}

export function Card({ className, ...props }: ViewProps & ClassNameProp) {
  return (
    <View
      className={cn(
        'rounded-fin border border-fin-border bg-fin-surface p-3.5 shadow-sm shadow-black/10',
        className,
      )}
      {...props}
    />
  );
}

export function Text({ className, ...props }: TextProps & ClassNameProp) {
  return <RNText className={cn('text-[15px] leading-[22px] text-fin-text', className)} {...props} />;
}

export function Heading({ className, size = 'md', ...props }: TextProps & ClassNameProp & { size?: 'sm' | 'md' | 'lg' }) {
  const sizeClass =
    size === 'lg'
      ? 'text-[30px] leading-9 font-extrabold'
      : size === 'sm'
        ? 'text-[18px] leading-6 font-bold'
        : 'text-[22px] leading-7 font-extrabold';

  return <RNText className={cn('text-fin-text', sizeClass, className)} {...props} />;
}

export function MutedText({ className, ...props }: TextProps & ClassNameProp) {
  return <RNText className={cn('text-[13px] leading-[19px] text-fin-muted', className)} {...props} />;
}

export function Label({ className, ...props }: TextProps & ClassNameProp) {
  return <RNText className={cn('text-[13px] font-bold leading-[18px] text-fin-text', className)} {...props} />;
}

export function Button({
  className,
  variant = 'primary',
  icon: Icon,
  children,
  disabled,
  ...props
}: PropsWithChildren<
  PressableProps &
    ClassNameProp & {
      variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
      icon?: IconComponent;
    }
>) {
  const variantClass =
    variant === 'secondary'
      ? 'border border-fin-border bg-fin-surfaceAlt'
      : variant === 'danger'
        ? 'bg-fin-danger'
        : variant === 'ghost'
          ? 'bg-transparent'
          : 'bg-fin-primary';
  const { resolvedMode } = useThemeMode();
  const theme = getFinTheme(resolvedMode);
  const iconColor = variant === 'secondary' || variant === 'ghost' ? theme.primary : theme.textOnPrimary;

  return (
    <RNPressable
      accessibilityRole="button"
      disabled={disabled}
      className={cn(
        'min-h-12 flex-row items-center justify-center gap-2 rounded-fin px-3.5',
        variantClass,
        disabled && 'opacity-50',
        className,
      )}
      {...props}>
      {Icon ? <Icon size={18} color={iconColor} strokeWidth={2.4} /> : null}
      {children}
    </RNPressable>
  );
}

export function ButtonText({
  className,
  variant = 'primary',
  ...props
}: TextProps & ClassNameProp & { variant?: 'primary' | 'secondary' | 'danger' | 'ghost' }) {
  const toneClass = variant === 'secondary' || variant === 'ghost' ? 'text-fin-primary' : 'text-fin-textOnPrimary';

  return <RNText className={cn('text-center text-[15px] font-extrabold leading-[22px]', toneClass, className)} {...props} />;
}

export function Input({ className, ...props }: TextInputProps & ClassNameProp) {
  return (
    <TextInput
      placeholderTextColor="#8A948B"
      className={cn(
        'min-h-[46px] rounded-fin border border-fin-border bg-fin-surface px-3 py-2.5 text-[15px] text-fin-text',
        className,
      )}
      {...props}
    />
  );
}

export function Textarea({ className, ...props }: TextInputProps & ClassNameProp) {
  return (
    <TextInput
      multiline
      placeholderTextColor="#8A948B"
      textAlignVertical="top"
      className={cn(
        'min-h-[92px] rounded-fin border border-fin-border bg-fin-surface px-3 py-2.5 text-[15px] text-fin-text',
        className,
      )}
      {...props}
    />
  );
}

export function Pressable({ className, ...props }: PressableProps & ClassNameProp) {
  return <RNPressable className={cn(className)} {...props} />;
}

export function Badge({ className, ...props }: ViewProps & ClassNameProp) {
  return <View className={cn('self-start rounded-fin border px-2 py-1', className)} {...props} />;
}
