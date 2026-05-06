import type { AppLanguage, AppLocale } from '@/types/finpilot';
import { enMessages } from '@/i18n/messages/en';
import { deMessages } from '@/i18n/messages/de';

export type TranslationKey = keyof typeof enMessages;
export type MessageCatalog = Record<TranslationKey, string>;
export type InterpolationValues = Record<string, string | number>;

export const languageToLocaleMap: Record<AppLanguage, AppLocale> = {
  en: 'en-AT',
  de: 'de-AT',
};

const catalogs: Record<AppLanguage, MessageCatalog> = {
  en: enMessages,
  de: deMessages,
};

export function detectDeviceLanguage(): AppLanguage {
  const locale = Intl.DateTimeFormat().resolvedOptions().locale.toLowerCase();
  return locale.startsWith('de') ? 'de' : 'en';
}

function interpolate(template: string, values?: InterpolationValues) {
  if (!values) {
    return template;
  }

  return Object.entries(values).reduce(
    (result, [key, value]) => result.replace(new RegExp(`{${key}}`, 'g'), String(value)),
    template,
  );
}

export function translate(language: AppLanguage, key: TranslationKey, values?: InterpolationValues) {
  const template = catalogs[language][key] ?? enMessages[key] ?? key;
  return interpolate(template, values);
}

