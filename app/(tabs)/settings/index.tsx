import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { ChevronRight, Database, Languages, Palette, Scale, Shield, type LucideIcon } from 'lucide-react-native';
import { useCallback, useRef } from 'react';

import { AppScreen, Stack } from '@/components/finpilot/app-screen';
import { Card } from '@/components/finpilot/card';
import { Field } from '@/components/finpilot/controls';
import { Body, H1, Muted } from '@/components/finpilot/text';
import { HStack, Pressable } from '@/components/ui/gluestack';
import { getFinTheme } from '@/constants/finpilot';
import { useFinPilot } from '@/context/finpilot-context';
import { useLanguage } from '@/context/language-context';
import { useThemeMode } from '@/context/theme-mode-context';
import { formatCurrency } from '@/utils/formatters';

type SettingsRoute = '/(tabs)/settings/appearance' | '/(tabs)/settings/language' | '/(tabs)/settings/security' | '/(tabs)/settings/legal' | '/(tabs)/settings/data';

function SettingsEntry({
  title,
  body,
  route,
  icon: Icon,
  onOpen,
  iconColor,
  mutedColor,
}: {
  title: string;
  body: string;
  route: SettingsRoute;
  icon: LucideIcon;
  onOpen: (route: SettingsRoute) => void;
  iconColor: string;
  mutedColor: string;
}) {
  return (
    <Pressable
      onPress={() => onOpen(route)}>
      <Card>
        <HStack className="justify-between">
          <HStack className="flex-1">
            <Icon size={20} color={iconColor} />
            <Stack gap={2}>
              <Body className="font-extrabold">{title}</Body>
              <Muted>{body}</Muted>
            </Stack>
          </HStack>
          <ChevronRight size={18} color={mutedColor} />
        </HStack>
      </Card>
    </Pressable>
  );
}

export default function SettingsIndexScreen() {
  const { t, locale } = useLanguage();
  const { state, updateSettings } = useFinPilot();
  const { resolvedMode } = useThemeMode();
  const theme = getFinTheme(resolvedMode);
  const router = useRouter();
  const isNavigatingRef = useRef(false);

  useFocusEffect(
    useCallback(() => {
      isNavigatingRef.current = false;
    }, []),
  );

  const openSettingsRoute = (route: SettingsRoute) => {
    if (isNavigatingRef.current) {
      return;
    }
    isNavigatingRef.current = true;
    router.push(route);
  };

  const updateNumberSetting = async (key: 'monthlyIncome' | 'emergencyBufferGoal', value: string) => {
    const parsed = Number(value.replace(',', '.'));
    if (!Number.isFinite(parsed) || parsed < 0) {
      return;
    }

    await updateSettings({ [key]: parsed });
  };

  return (
    <AppScreen nativeHeader>
      <Stack gap={4}>
        <Muted>{t('settings.eyebrow')}</Muted>
        <H1>{t('settings.title')}</H1>
        <Body>{t('settings.body')}</Body>
      </Stack>

      <Card>
        <Stack>
          <Body className="font-extrabold">{t('settings.finance.title')}</Body>
          <Field
            label={t('settings.finance.income')}
            defaultValue={String(state.settings.monthlyIncome)}
            onEndEditing={(event) => updateNumberSetting('monthlyIncome', event.nativeEvent.text)}
            keyboardType="decimal-pad"
            helper={t('settings.finance.current', {
              value: formatCurrency(state.settings.monthlyIncome, state.settings.currency, locale),
            })}
          />
          <Field
            label={t('settings.finance.buffer')}
            defaultValue={String(state.settings.emergencyBufferGoal)}
            onEndEditing={(event) => updateNumberSetting('emergencyBufferGoal', event.nativeEvent.text)}
            keyboardType="decimal-pad"
            helper={t('settings.finance.current', {
              value: formatCurrency(state.settings.emergencyBufferGoal, state.settings.currency, locale),
            })}
          />
        </Stack>
      </Card>

      <SettingsEntry
        icon={Palette}
        title={t('settings.appearance.title')}
        body={t('settings.appearance.body')}
        route="/(tabs)/settings/appearance"
        onOpen={openSettingsRoute}
        iconColor={theme.primary}
        mutedColor={theme.muted}
      />
      <SettingsEntry
        icon={Languages}
        title={t('settings.language.title')}
        body={t('settings.language.body')}
        route="/(tabs)/settings/language"
        onOpen={openSettingsRoute}
        iconColor={theme.primary}
        mutedColor={theme.muted}
      />
      <SettingsEntry
        icon={Shield}
        title={t('settings.security.title')}
        body={t('settings.security.body')}
        route="/(tabs)/settings/security"
        onOpen={openSettingsRoute}
        iconColor={theme.primary}
        mutedColor={theme.muted}
      />
      <SettingsEntry
        icon={Scale}
        title={t('settings.legal.title')}
        body={t('settings.legal.body')}
        route="/(tabs)/settings/legal"
        onOpen={openSettingsRoute}
        iconColor={theme.primary}
        mutedColor={theme.muted}
      />
      <SettingsEntry
        icon={Database}
        title={t('settings.data.title')}
        body={t('settings.data.body')}
        route="/(tabs)/settings/data"
        onOpen={openSettingsRoute}
        iconColor={theme.primary}
        mutedColor={theme.muted}
      />
    </AppScreen>
  );
}
