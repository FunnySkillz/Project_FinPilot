import { vars } from 'nativewind';

export const finTheme = {
  colors: {
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

export const FinPilotColors = finTheme.colors;

export const finThemeVars = vars({
  '--color-fin-background': finTheme.colors.background,
  '--color-fin-surface': finTheme.colors.surface,
  '--color-fin-surface-alt': finTheme.colors.surfaceAlt,
  '--color-fin-border': finTheme.colors.border,
  '--color-fin-text': finTheme.colors.text,
  '--color-fin-muted': finTheme.colors.muted,
  '--color-fin-primary': finTheme.colors.primary,
  '--color-fin-primary-dark': finTheme.colors.primaryDark,
  '--color-fin-amber': finTheme.colors.amber,
  '--color-fin-danger': finTheme.colors.danger,
  '--color-fin-safe': finTheme.colors.safe,
  '--color-fin-blue': finTheme.colors.blue,
});

export const shadowClass = 'shadow-sm shadow-black/10';

