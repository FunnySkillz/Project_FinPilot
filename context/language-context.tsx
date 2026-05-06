import { createContext, PropsWithChildren, useContext, useMemo } from 'react';

import { languageToLocaleMap, translate, type InterpolationValues, type TranslationKey } from '@/i18n';
import type { AppLanguage, AppLocale } from '@/types/finpilot';
import { useFinPilot } from '@/context/finpilot-context';
import { languagePreferenceService } from '@/services/language-preference';

type LanguageContextValue = {
  language: AppLanguage;
  locale: AppLocale;
  setLanguage: (next: AppLanguage) => Promise<void>;
  t: (key: TranslationKey, values?: InterpolationValues) => string;
};

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);

export function LanguageProvider({ children }: PropsWithChildren) {
  const { state, updateSettings } = useFinPilot();
  const language = state.settings.language;

  const value = useMemo<LanguageContextValue>(
    () => ({
      language,
      locale: languageToLocaleMap[language],
      setLanguage: async (next) => {
        languagePreferenceService.save(next);
        await updateSettings({ language: next });
      },
      t: (key, values) => translate(language, key, values),
    }),
    [language, updateSettings],
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);

  if (!context) {
    throw new Error('useLanguage must be used inside LanguageProvider');
  }

  return context;
}
