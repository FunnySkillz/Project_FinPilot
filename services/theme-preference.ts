import type { ThemeMode } from '@/types/finpilot';

let memoryPreference: ThemeMode | null = null;

export const themePreferenceService = {
  load(saved?: ThemeMode): ThemeMode {
    if (saved) {
      memoryPreference = saved;
      return memoryPreference;
    }

    if (memoryPreference) {
      return memoryPreference;
    }

    memoryPreference = saved ?? 'system';
    return memoryPreference;
  },

  save(next: ThemeMode) {
    memoryPreference = next;
  },
};
