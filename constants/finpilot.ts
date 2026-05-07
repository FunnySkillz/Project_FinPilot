import { vars } from 'nativewind';

import type { ThemeModeResolved } from '@/types/finpilot';

export const finTheme = {
  light: {
    background: '#F6F7F2',
    surface: '#FFFFFF',
    surfaceAlt: '#EEF3EE',
    border: '#D8DED5',
    text: '#13201A',
    muted: '#667368',
    primary: '#257061',
    primaryDark: '#174A40',
    amber: '#B7791F',
    danger: '#B33A3A',
    safe: '#2F855A',
    blue: '#2B6CB0',
    textOnPrimary: '#FFFFFF',
  },
  dark: {
    background: '#101714',
    surface: '#18231F',
    surfaceAlt: '#22312B',
    border: '#34453E',
    text: '#EAF1EC',
    muted: '#A5B3AA',
    primary: '#62B39D',
    primaryDark: '#9BD6C6',
    amber: '#E3B75C',
    danger: '#F07D7D',
    safe: '#74D39B',
    blue: '#7BA9E6',
    textOnPrimary: '#0E1814',
  },
  radii: {
    card: 8,
    control: 8,
  },
  spacing: {
    screen: 16,
    stack: 12,
  },
} as const;

export type FinPilotColorTokens = (typeof finTheme)[ThemeModeResolved];

export const FinPilotColors = finTheme.light;

export function getFinTheme(mode: ThemeModeResolved): FinPilotColorTokens {
  return finTheme[mode];
}

export function getFinThemeVars(mode: ThemeModeResolved) {
  const colors = getFinTheme(mode);

  return vars({
    '--color-fin-background': colors.background,
    '--color-fin-surface': colors.surface,
    '--color-fin-surface-alt': colors.surfaceAlt,
    '--color-fin-border': colors.border,
    '--color-fin-text': colors.text,
    '--color-fin-muted': colors.muted,
    '--color-fin-primary': colors.primary,
    '--color-fin-primary-dark': colors.primaryDark,
    '--color-fin-amber': colors.amber,
    '--color-fin-danger': colors.danger,
    '--color-fin-safe': colors.safe,
    '--color-fin-blue': colors.blue,
    '--color-fin-text-on-primary': colors.textOnPrimary,
  });
}

export const shadowClass = 'shadow-sm shadow-black/10';
