/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
    './constants/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        fin: {
          background: 'var(--color-fin-background)',
          surface: 'var(--color-fin-surface)',
          surfaceAlt: 'var(--color-fin-surface-alt)',
          border: 'var(--color-fin-border)',
          text: 'var(--color-fin-text)',
          muted: 'var(--color-fin-muted)',
          primary: 'var(--color-fin-primary)',
          primaryDark: 'var(--color-fin-primary-dark)',
          amber: 'var(--color-fin-amber)',
          danger: 'var(--color-fin-danger)',
          safe: 'var(--color-fin-safe)',
          blue: 'var(--color-fin-blue)',
          textOnPrimary: 'var(--color-fin-text-on-primary)',
        },
      },
      borderRadius: {
        fin: '8px',
      },
    },
  },
  plugins: [],
};
