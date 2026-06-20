import { AppScreen, Stack } from '@/components/finpilot/app-screen';
import { Card } from '@/components/finpilot/card';
import { SegmentedControl } from '@/components/finpilot/controls';
import { Body, H1, Muted } from '@/components/finpilot/text';
import { useLanguage } from '@/context/language-context';
import { useThemeMode } from '@/context/theme-mode-context';
import type { ThemeMode, ThemeModeResolved } from '@/types/finpilot';

function getThemeLabelKey(value: ThemeMode | ThemeModeResolved) {
  if (value === 'light') {
    return 'theme.light';
  }
  if (value === 'dark') {
    return 'theme.dark';
  }
  return 'theme.system';
}

export default function AppearanceScreen() {
  const { t } = useLanguage();
  const { mode, resolvedMode, setMode } = useThemeMode();

  return (
    <AppScreen nativeHeader>
      <Stack gap={4}>
        <Muted>{t('settings.appearance.title')}</Muted>
        <H1>{t('settings.appearance.title')}</H1>
        <Body>{t('settings.appearance.body')}</Body>
      </Stack>

      <Card>
        <Stack>
          <SegmentedControl
            values={['system', 'light', 'dark'] as ThemeMode[]}
            selected={mode}
            onSelect={setMode}
            getLabel={(value) => t(getThemeLabelKey(value))}
          />
          <Muted>
            {t('theme.system')}: {t(getThemeLabelKey(resolvedMode))}
          </Muted>
        </Stack>
      </Card>
    </AppScreen>
  );
}
