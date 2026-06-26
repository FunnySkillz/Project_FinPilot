import AsyncStorage from '@react-native-async-storage/async-storage';

import { seedState } from '@/data/seed-data';
import { languagePreferenceService } from '@/services/language-preference';
import { themePreferenceService } from '@/services/theme-preference';
import type {
  AppLanguage,
  AiConnectionCheck,
  AiOcrMode,
  AiSettings,
  AppSettings,
  Category,
  DocumentAnalysis,
  Expense,
  ExpenseCadence,
  ExpenseInput,
  ExpenseKind,
  FinPilotState,
  PaymentMethod,
  ThemeMode,
} from '@/types/finpilot';
import { CATEGORIES, newId } from '@/utils/finance';

const STORAGE_KEY = 'finpilot.state.v1';
export const CURRENT_STATE_VERSION = 4;

const PAYMENT_METHODS: PaymentMethod[] = [
  'cash',
  'debit-card',
  'credit-card',
  'bank-transfer',
  'paypal',
  'apple-pay',
  'other',
];

type LegacyExpenseKind = ExpenseKind | 'fixed' | 'variable';
type LegacyExpenseCadence = ExpenseCadence | 'one-time';
type StoredExpense = Partial<Omit<Expense, 'cadence' | 'kind' | 'paymentMethod' | 'tags'>> & {
  cadence?: unknown;
  kind?: unknown;
  paymentMethod?: unknown;
  tags?: unknown;
};

const DEFAULT_AI_SETTINGS: AiSettings = {
  cloudEnabled: false,
  cloudDocumentConsent: false,
  ocrMode: 'hybrid',
};

function cloneSeedState(): FinPilotState {
  const seeded = JSON.parse(JSON.stringify(seedState)) as FinPilotState;
  return {
    ...seeded,
    version: CURRENT_STATE_VERSION,
    settings: normalizeSettings(seeded.settings, true),
  };
}

function isLanguage(value: unknown): value is AppLanguage {
  return value === 'en' || value === 'de';
}

function isThemeMode(value: unknown): value is ThemeMode {
  return value === 'system' || value === 'light' || value === 'dark';
}

function isAiOcrMode(value: unknown): value is AiOcrMode {
  return value === 'hybrid' || value === 'native' || value === 'cloud' || value === 'off';
}

function isAiConnectionCheck(value: unknown): value is AiConnectionCheck {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const check = value as Partial<AiConnectionCheck>;
  return (
    (check.status === 'unknown' || check.status === 'connected' || check.status === 'error') &&
    typeof check.checkedAt === 'string'
  );
}

function isCategory(value: unknown): value is Category {
  return typeof value === 'string' && CATEGORIES.includes(value as Category);
}

function isExpenseCadence(value: unknown): value is ExpenseCadence {
  return value === 'monthly' || value === 'yearly';
}

function isPaymentMethod(value: unknown): value is PaymentMethod {
  return typeof value === 'string' && PAYMENT_METHODS.includes(value as PaymentMethod);
}

function getLegacyExpenseKind(value: unknown): LegacyExpenseKind | undefined {
  if (value === 'recurring' || value === 'one-off' || value === 'fixed' || value === 'variable') {
    return value;
  }

  return undefined;
}

function getLegacyExpenseCadence(value: unknown): LegacyExpenseCadence | undefined {
  if (value === 'monthly' || value === 'yearly' || value === 'one-time') {
    return value;
  }

  return undefined;
}

function normalizeExpense(expense: StoredExpense, index: number): Expense {
  const legacyKind = getLegacyExpenseKind(expense.kind);
  const legacyCadence = getLegacyExpenseCadence(expense.cadence);
  const kind: ExpenseKind =
    legacyCadence === 'one-time' || legacyKind === 'one-off' ? 'one-off' : 'recurring';
  const cadence = kind === 'recurring' ? (isExpenseCadence(legacyCadence) ? legacyCadence : 'monthly') : undefined;
  const amount = typeof expense.amount === 'number' ? expense.amount : Number(expense.amount);
  const tags = Array.isArray(expense.tags)
    ? expense.tags.filter((tag): tag is string => typeof tag === 'string' && tag.trim().length > 0)
    : [];

  return {
    id: typeof expense.id === 'string' ? expense.id : `exp-migrated-${index}`,
    name: typeof expense.name === 'string' && expense.name.trim() ? expense.name : 'Untitled expense',
    amount: Number.isFinite(amount) ? amount : 0,
    ...(cadence ? { cadence } : {}),
    category: isCategory(expense.category) ? expense.category : 'Other',
    kind,
    startDate:
      typeof expense.startDate === 'string' && expense.startDate.trim()
        ? expense.startDate
        : new Date().toISOString().slice(0, 10),
    endDate: typeof expense.endDate === 'string' && expense.endDate.trim() ? expense.endDate : undefined,
    merchant:
      typeof expense.merchant === 'string' && expense.merchant.trim() ? expense.merchant : undefined,
    paymentMethod: isPaymentMethod(expense.paymentMethod) ? expense.paymentMethod : undefined,
    tags,
    notes: typeof expense.notes === 'string' && expense.notes.trim() ? expense.notes : undefined,
    linkedDocumentId:
      typeof expense.linkedDocumentId === 'string' && expense.linkedDocumentId.trim()
        ? expense.linkedDocumentId
        : undefined,
    createdAt: typeof expense.createdAt === 'string' ? expense.createdAt : new Date().toISOString(),
    updatedAt: typeof expense.updatedAt === 'string' ? expense.updatedAt : new Date().toISOString(),
  };
}

function createInitialExpense(input: ExpenseInput, index: number): Expense {
  const now = new Date().toISOString();

  return normalizeExpense(
    {
      id: newId(`setup-${index}`),
      ...input,
      createdAt: now,
      updatedAt: now,
    },
    index,
  );
}

function normalizeAiSettings(settings?: Partial<AiSettings>): AiSettings {
  return {
    cloudEnabled: Boolean(settings?.cloudEnabled),
    cloudDocumentConsent: Boolean(settings?.cloudDocumentConsent),
    ocrMode: isAiOcrMode(settings?.ocrMode) ? settings.ocrMode : DEFAULT_AI_SETTINGS.ocrMode,
    lastConnectionCheck: isAiConnectionCheck(settings?.lastConnectionCheck)
      ? settings.lastConnectionCheck
      : undefined,
  };
}

function normalizeAnalysis(analysis?: Partial<DocumentAnalysis>): DocumentAnalysis | undefined {
  if (!analysis?.summary || !analysis?.excerpt) {
    return undefined;
  }

  return {
    documentType: typeof analysis.documentType === 'string' ? analysis.documentType : 'Document',
    provider: typeof analysis.provider === 'string' ? analysis.provider : undefined,
    amount: typeof analysis.amount === 'number' ? analysis.amount : undefined,
    documentDate: typeof analysis.documentDate === 'string' ? analysis.documentDate : undefined,
    contractEndDate: typeof analysis.contractEndDate === 'string' ? analysis.contractEndDate : undefined,
    warrantyUntil: typeof analysis.warrantyUntil === 'string' ? analysis.warrantyUntil : undefined,
    summary: analysis.summary,
    coveredRisks: Array.isArray(analysis.coveredRisks) ? analysis.coveredRisks.filter(Boolean) : [],
    exclusions: Array.isArray(analysis.exclusions) ? analysis.exclusions.filter(Boolean) : [],
    warnings: Array.isArray(analysis.warnings) ? analysis.warnings.filter(Boolean) : [],
    excerpt: analysis.excerpt,
    confidence:
      analysis.confidence === 'high' || analysis.confidence === 'medium' || analysis.confidence === 'low'
        ? analysis.confidence
        : 'low',
    source:
      analysis.source === 'cloud-ai' || analysis.source === 'native-ocr' || analysis.source === 'placeholder'
        ? analysis.source
        : 'placeholder',
    requestId: typeof analysis.requestId === 'string' ? analysis.requestId : undefined,
    model: typeof analysis.model === 'string' ? analysis.model : undefined,
    needsReview: typeof analysis.needsReview === 'boolean' ? analysis.needsReview : true,
    generatedAt: typeof analysis.generatedAt === 'string' ? analysis.generatedAt : new Date().toISOString(),
  };
}

function normalizeDocument(document: Partial<FinPilotState['documents'][number]>, index: number) {
  const now = new Date().toISOString();
  const tags = Array.isArray(document.tags)
    ? document.tags.filter((tag): tag is string => typeof tag === 'string' && tag.trim().length > 0)
    : [];

  return {
    id: typeof document.id === 'string' ? document.id : `doc-migrated-${index}`,
    title: typeof document.title === 'string' && document.title.trim() ? document.title : 'Untitled document',
    category: isCategory(document.category) ? document.category : 'Other',
    provider: typeof document.provider === 'string' && document.provider.trim() ? document.provider : undefined,
    fileUri: typeof document.fileUri === 'string' ? document.fileUri : undefined,
    fileName: typeof document.fileName === 'string' ? document.fileName : undefined,
    mimeType: typeof document.mimeType === 'string' ? document.mimeType : undefined,
    amount: typeof document.amount === 'number' ? document.amount : undefined,
    documentDate: typeof document.documentDate === 'string' ? document.documentDate : undefined,
    notes: typeof document.notes === 'string' && document.notes.trim() ? document.notes : undefined,
    tags,
    extractedText: typeof document.extractedText === 'string' ? document.extractedText : undefined,
    analysis: normalizeAnalysis(document.analysis),
    createdAt: typeof document.createdAt === 'string' ? document.createdAt : now,
    updatedAt: typeof document.updatedAt === 'string' ? document.updatedAt : now,
  };
}

export function createEmptyState(settings?: Partial<AppSettings>): FinPilotState {
  return {
    version: CURRENT_STATE_VERSION,
    expenses: [],
    documents: [],
    questions: [],
    purchaseDecisions: [],
    settings: normalizeSettings(settings, false),
  };
}

function normalizeSettings(settings?: Partial<AppSettings>, sampleDefault = false): AppSettings {
  return {
    monthlyIncome: settings?.monthlyIncome ?? 4200,
    emergencyBufferGoal: settings?.emergencyBufferGoal ?? 8000,
    currency: settings?.currency ?? 'EUR',
    samplesSeeded: settings?.samplesSeeded ?? sampleDefault,
    hasCompletedOnboarding: settings?.hasCompletedOnboarding ?? sampleDefault,
    language: languagePreferenceService.load(isLanguage(settings?.language) ? settings.language : undefined),
    themeMode: themePreferenceService.load(isThemeMode(settings?.themeMode) ? settings.themeMode : undefined),
    appLockEnabled: settings?.appLockEnabled ?? false,
    sampleDataEnabled: settings?.sampleDataEnabled ?? sampleDefault,
    ai: normalizeAiSettings(settings?.ai),
  };
}

function normalizeState(state: Partial<FinPilotState> | null): FinPilotState {
  if (!state) {
    return createEmptyState();
  }

  return {
    version: CURRENT_STATE_VERSION,
    expenses: (state.expenses ?? []).map((expense, index) => normalizeExpense(expense, index)),
    documents: (state.documents ?? []).map((document, index) => normalizeDocument(document, index)),
    questions: state.questions ?? [],
    purchaseDecisions: state.purchaseDecisions ?? [],
    settings: normalizeSettings(state.settings, (state.version ?? 1) < CURRENT_STATE_VERSION),
  };
}

export const storageService = {
  async loadState(): Promise<FinPilotState> {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    if (!stored) {
      const empty = createEmptyState();
      await this.saveState(empty);
      return empty;
    }

    try {
      const parsed = JSON.parse(stored) as Partial<FinPilotState>;
      const normalized = normalizeState(parsed);
      if ((parsed.version ?? 1) < CURRENT_STATE_VERSION) {
        await this.saveState(normalized);
      }
      return normalized;
    } catch {
      const seeded = cloneSeedState();
      await this.saveState(seeded);
      return seeded;
    }
  },

  async saveState(state: FinPilotState) {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  },

  async resetWithSamples() {
    const seeded = cloneSeedState();
    await this.saveState(seeded);
    return seeded;
  },

  async resetEmpty(settings?: Partial<AppSettings>): Promise<FinPilotState> {
    const empty = createEmptyState({
      ...settings,
      samplesSeeded: false,
      sampleDataEnabled: false,
      appLockEnabled: false,
    });
    await this.saveState(empty);
    return empty;
  },

  async completeOnboarding(
    settings: Partial<AppSettings>,
    useSampleData: boolean,
    initialExpenses: ExpenseInput[] = [],
  ): Promise<FinPilotState> {
    const next = useSampleData ? cloneSeedState() : createEmptyState();
    next.settings = normalizeSettings(
      {
        ...next.settings,
        ...settings,
        samplesSeeded: useSampleData,
        sampleDataEnabled: useSampleData,
        hasCompletedOnboarding: true,
        appLockEnabled: false,
      },
      useSampleData,
    );
    if (!useSampleData) {
      next.expenses = initialExpenses.map((expense, index) => createInitialExpense(expense, index));
    }
    await this.saveState(next);
    return next;
  },
};
