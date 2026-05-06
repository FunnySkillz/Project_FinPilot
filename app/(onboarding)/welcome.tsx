import { useRef, useState } from 'react';
import { Alert } from 'react-native';

import { AppScreen, Stack } from '@/components/finpilot/app-screen';
import { Card } from '@/components/finpilot/card';
import { Button, Field, SegmentedControl } from '@/components/finpilot/controls';
import { Body, H1, Muted } from '@/components/finpilot/text';
import { Pressable } from '@/components/ui/gluestack';
import { useFinPilot } from '@/context/finpilot-context';
import { useLanguage } from '@/context/language-context';
import type { AppLanguage, ThemeMode } from '@/types/finpilot';

function getThemeLabelKey(value: ThemeMode) {
  if (value === 'light') {
    return 'theme.light';
  }
  if (value === 'dark') {
    return 'theme.dark';
  }
  return 'theme.system';
}

export default function WelcomeScreen() {
  const { completeOnboarding } = useFinPilot();
  const { t, language, setLanguage } = useLanguage();
  const [monthlyIncome, setMonthlyIncome] = useState('4200');
  const [emergencyBufferGoal, setEmergencyBufferGoal] = useState('8000');
  const [themeMode, setThemeMode] = useState<ThemeMode>('system');
  const [useSampleData, setUseSampleData] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const inFlightRef = useRef(false);

  const submit = async () => {
    if (inFlightRef.current) {
      return;
    }

    const income = Number(monthlyIncome.replace(',', '.'));
    const buffer = Number(emergencyBufferGoal.replace(',', '.'));
    if (!Number.isFinite(income) || income <= 0 || !Number.isFinite(buffer) || buffer <= 0) {
      Alert.alert(t('onboarding.validation'));
      return;
    }

    inFlightRef.current = true;
    setIsSaving(true);
    try {
      await completeOnboarding({
        monthlyIncome: income,
        emergencyBufferGoal: buffer,
        language,
        themeMode,
        useSampleData,
      });
    } finally {
      setIsSaving(false);
      inFlightRef.current = false;
    }
  };

  return (
    <AppScreen>
      <Stack gap={4}>
        <Muted>{t('onboarding.eyebrow')}</Muted>
        <H1>{t('onboarding.title')}</H1>
        <Body>{t('onboarding.body')}</Body>
      </Stack>

      <Card>
        <Stack>
          <Field
            label={t('onboarding.income')}
            value={monthlyIncome}
            onChangeText={setMonthlyIncome}
            keyboardType="decimal-pad"
          />
          <Field
            label={t('onboarding.buffer')}
            value={emergencyBufferGoal}
            onChangeText={setEmergencyBufferGoal}
            keyboardType="decimal-pad"
          />
          <Stack gap={8}>
            <Muted>{t('onboarding.language')}</Muted>
            <SegmentedControl
              values={['en', 'de'] as AppLanguage[]}
              selected={language}
              onSelect={(next) => setLanguage(next)}
              getLabel={(value) => t(value === 'en' ? 'language.en' : 'language.de')}
            />
          </Stack>
          <Stack gap={8}>
            <Muted>{t('onboarding.theme')}</Muted>
            <SegmentedControl
              values={['system', 'light', 'dark'] as ThemeMode[]}
              selected={themeMode}
              onSelect={setThemeMode}
              getLabel={(value) => t(getThemeLabelKey(value))}
            />
          </Stack>
          <Pressable
            accessibilityRole="checkbox"
            accessibilityState={{ checked: useSampleData }}
            onPress={() => setUseSampleData((current) => !current)}
            className={`rounded-fin border p-3 ${
              useSampleData ? 'border-fin-primary bg-fin-surfaceAlt' : 'border-fin-border bg-fin-surface'
            }`}>
            <Body className="font-extrabold">{t('onboarding.samples')}</Body>
          </Pressable>
          <Button onPress={submit} disabled={isSaving}>
            {isSaving ? t('common.loading') : t('onboarding.start')}
          </Button>
        </Stack>
      </Card>
    </AppScreen>
  );
}
