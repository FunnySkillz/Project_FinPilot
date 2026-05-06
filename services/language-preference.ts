import { detectDeviceLanguage } from '@/i18n';
import type { AppLanguage } from '@/types/finpilot';

let memoryPreference: AppLanguage | null = null;

export const languagePreferenceService = {
  load(saved?: AppLanguage): AppLanguage {
    if (saved) {
      memoryPreference = saved;
      return memoryPreference;
    }

    if (memoryPreference) {
      return memoryPreference;
    }

    memoryPreference = saved ?? detectDeviceLanguage();
    return memoryPreference;
  },

  save(next: AppLanguage) {
    memoryPreference = next;
  },
};
