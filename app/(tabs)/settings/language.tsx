import { AppScreen, Stack } from '@/components/finpilot/app-screen';
import { Card } from '@/components/finpilot/card';
import { SegmentedControl } from '@/components/finpilot/controls';
import { Body, H1, Muted } from '@/components/finpilot/text';
import { useLanguage } from '@/context/language-context';
import type { AppLanguage } from '@/types/finpilot';
import { formatCurrency } from '@/utils/formatters';

export default function LanguageScreen() {
  const { t, language, locale, setLanguage } = useLanguage();

  return (
    <AppScreen nativeHeader>
      <Stack gap={4}>
        <Muted>{t('settings.language.title')}</Muted>
        <H1>{t('settings.language.title')}</H1>
        <Body>{t('settings.language.body')}</Body>
      </Stack>

      <Card>
        <Stack>
          <SegmentedControl
            values={['en', 'de'] as AppLanguage[]}
            selected={language}
            onSelect={setLanguage}
            getLabel={(value) => t(value === 'en' ? 'language.en' : 'language.de')}
          />
          <Muted>
            {t('language.en')} / {t('language.de')}
          </Muted>
          <Body>{formatCurrency(1234.56, 'EUR', locale)}</Body>
        </Stack>
      </Card>
    </AppScreen>
  );
}
