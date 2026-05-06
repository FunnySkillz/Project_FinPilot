import { Alert } from 'react-native';
import { RotateCcw, Trash2 } from 'lucide-react-native';
import { useState } from 'react';

import { AppScreen, Stack } from '@/components/finpilot/app-screen';
import { Card } from '@/components/finpilot/card';
import { Button } from '@/components/finpilot/controls';
import { Body, H1, Muted } from '@/components/finpilot/text';
import { useFinPilot } from '@/context/finpilot-context';
import { useLanguage } from '@/context/language-context';

export default function DataSettingsScreen() {
  const { resetWithSamples, resetEmpty } = useFinPilot();
  const { t } = useLanguage();
  const [isBusy, setIsBusy] = useState(false);

  const runReset = async (operation: () => Promise<void>) => {
    setIsBusy(true);
    try {
      await operation();
    } catch {
      Alert.alert(t('shell.initError'), t('settings.data.note'));
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <AppScreen nativeHeader>
      <Stack gap={4}>
        <Muted>{t('settings.data.title')}</Muted>
        <H1>{t('settings.data.title')}</H1>
        <Body>{t('settings.data.note')}</Body>
      </Stack>

      <Card>
        <Stack>
          <Button
            variant="secondary"
            icon={RotateCcw}
            disabled={isBusy}
            onPress={() => {
              Alert.alert(t('settings.data.resetTitle'), t('settings.data.resetBody'), [
                { text: t('common.cancel'), style: 'cancel' },
                { text: t('common.reset'), onPress: () => runReset(resetWithSamples) },
              ]);
            }}>
            {isBusy ? t('common.loading') : t('settings.data.resetSamples')}
          </Button>
          <Button
            variant="danger"
            icon={Trash2}
            disabled={isBusy}
            onPress={() => {
              Alert.alert(t('settings.data.clearTitle'), t('settings.data.clearBody'), [
                { text: t('common.cancel'), style: 'cancel' },
                { text: t('common.clear'), style: 'destructive', onPress: () => runReset(resetEmpty) },
              ]);
            }}>
            {t('settings.data.clearRecords')}
          </Button>
        </Stack>
      </Card>
    </AppScreen>
  );
}
