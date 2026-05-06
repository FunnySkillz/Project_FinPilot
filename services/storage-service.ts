import AsyncStorage from '@react-native-async-storage/async-storage';

import { seedState } from '@/data/seed-data';
import type { AppSettings, FinPilotState } from '@/types/finpilot';

const STORAGE_KEY = 'finpilot.state.v1';

function cloneSeedState(): FinPilotState {
  return JSON.parse(JSON.stringify(seedState)) as FinPilotState;
}

function normalizeState(state: Partial<FinPilotState> | null): FinPilotState {
  if (!state) {
    return cloneSeedState();
  }

  return {
    version: state.version ?? 1,
    expenses: state.expenses ?? [],
    documents: state.documents ?? [],
    questions: state.questions ?? [],
    purchaseDecisions: state.purchaseDecisions ?? [],
    settings: {
      monthlyIncome: state.settings?.monthlyIncome ?? 4200,
      emergencyBufferGoal: state.settings?.emergencyBufferGoal ?? 8000,
      currency: state.settings?.currency ?? 'EUR',
      samplesSeeded: state.settings?.samplesSeeded ?? false,
    },
  };
}

export const storageService = {
  async loadState(): Promise<FinPilotState> {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    if (!stored) {
      const seeded = cloneSeedState();
      await this.saveState(seeded);
      return seeded;
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
    const empty: FinPilotState = {
      version: 1,
      expenses: [],
      documents: [],
      questions: [],
      purchaseDecisions: [],
      settings: {
        monthlyIncome: settings?.monthlyIncome ?? 4200,
        emergencyBufferGoal: settings?.emergencyBufferGoal ?? 8000,
        currency: 'EUR',
        samplesSeeded: false,
      },
    };
    await this.saveState(empty);
    return empty;
  },
};

