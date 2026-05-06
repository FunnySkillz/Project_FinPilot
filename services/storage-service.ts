import AsyncStorage from '@react-native-async-storage/async-storage';

import { seedState } from '@/data/seed-data';
import { languagePreferenceService } from '@/services/language-preference';
import { themePreferenceService } from '@/services/theme-preference';
import type { AppLanguage, AppSettings, FinPilotState, ThemeMode } from '@/types/finpilot';

const STORAGE_KEY = 'finpilot.state.v1';
export const CURRENT_STATE_VERSION = 2;

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
  };
}

function normalizeState(state: Partial<FinPilotState> | null): FinPilotState {
  if (!state) {
    return createEmptyState();
  }

  return {
    version: CURRENT_STATE_VERSION,
    expenses: state.expenses ?? [],
    documents: state.documents ?? [],
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
      return normalizeState(JSON.parse(stored) as Partial<FinPilotState>);
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

  async completeOnboarding(settings: Partial<AppSettings>, useSampleData: boolean): Promise<FinPilotState> {
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
    await this.saveState(next);
    return next;
  },
};
