import type {
  AppLanguage,
  PaymentMethod,
  ExpenseCadence,
  ExpenseKind,
  DocumentAnalysisSource,
  ThemeMode,
  AppLocale,
  Category,
  Confidence,
  PurchasePriority,
  PurchaseStatus,
  PurchaseType,
} from '@/types/finpilot';
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

export function categoryLabelKey(category: Category): TranslationKey {
  return `category.${category}` as TranslationKey;
}

export function confidenceLabelKey(confidence: Confidence): TranslationKey {
  return `confidence.${confidence}` as TranslationKey;
}

export function purchaseStatusLabelKey(status: PurchaseStatus): TranslationKey {
  return `status.${status}` as TranslationKey;
}

export function purchaseTypeLabelKey(type: PurchaseType): TranslationKey {
  return `purchase.type.${type}` as TranslationKey;
}

export function purchasePriorityLabelKey(priority: PurchasePriority): TranslationKey {
  return `purchase.priority.${priority}` as TranslationKey;
}

export function paymentMethodLabelKey(value: PaymentMethod | 'none'): TranslationKey {
  return value === 'none' ? 'expenses.payment.none' : `expenses.payment.${value}`;
}
export function cadenceLabelKey(value: ExpenseCadence): TranslationKey {
  return `expenses.cadence.${value}`;
}
export function kindLabelKey(value: ExpenseKind): TranslationKey {
  return value === 'recurring' ? 'expenses.recurring' : 'expenses.oneOff';
}
export function analysisSourceLabelKey(value: DocumentAnalysisSource): TranslationKey {
  return `analysis.source.${value}`;
}
export function getThemeLabelKey(value: ThemeMode): TranslationKey {
  return `theme.${value}`;
}
