import { useState } from 'react';
import { Alert, Switch } from 'react-native';
import { RefreshCcw, RotateCcw } from 'lucide-react-native';

import { AppScreen, Stack } from '@/components/finpilot/app-screen';
import { Card, SectionHeader } from '@/components/finpilot/card';
import { Button, SegmentedControl } from '@/components/finpilot/controls';
import { Body, H1, Muted } from '@/components/finpilot/text';
import { Box, HStack } from '@/components/ui/gluestack';
import { useFinPilot } from '@/context/finpilot-context';
import { useLanguage } from '@/context/language-context';
import type { AiConnectionCheck, AiOcrMode } from '@/types/finpilot';
import { formatDate } from '@/utils/formatters';

const OCR_MODES: AiOcrMode[] = ['hybrid', 'native', 'cloud', 'off'];

function ocrModeLabelKey(mode: AiOcrMode) {
  return `ai.ocr.${mode}` as const;
}

function statusLabelKey(status?: AiConnectionCheck['status']) {
  if (status === 'connected') {
    return 'settings.ai.status.connected';
  }
  if (status === 'error') {
    return 'settings.ai.status.error';
  }
  return 'settings.ai.status.unknown';
}

export default function AiConnectionSettingsScreen() {
  const { state, updateSettings, testAiConnection, reprocessDocuments } = useFinPilot();
  const { locale, t } = useLanguage();
  const [isTesting, setIsTesting] = useState(false);
  const [isReprocessing, setIsReprocessing] = useState(false);
  const ai = state.settings.ai;
  const check = ai.lastConnectionCheck;

  const setCloudEnabled = async (cloudEnabled: boolean) => {
    await updateSettings({ ai: { cloudEnabled } });
  };

  const setCloudConsent = async (cloudDocumentConsent: boolean) => {
    await updateSettings({ ai: { cloudDocumentConsent } });
  };

  const setOcrMode = async (ocrMode: AiOcrMode) => {
    await updateSettings({ ai: { ocrMode } });
  };

  const runTest = async () => {
    setIsTesting(true);
    try {
      const result = await testAiConnection();
      Alert.alert(t('settings.ai.testResultTitle'), t(statusLabelKey(result.status)));
    } finally {
      setIsTesting(false);
    }
  };

  const runReprocess = async () => {
    setIsReprocessing(true);
    try {
      await reprocessDocuments();
      Alert.alert(t('settings.ai.reprocessDoneTitle'), t('settings.ai.reprocessDoneBody'));
    } catch {
      Alert.alert(t('settings.ai.reprocessErrorTitle'), t('settings.ai.reprocessErrorBody'));
    } finally {
      setIsReprocessing(false);
    }
  };

  return (
    <AppScreen nativeHeader>
      <Stack gap={4}>
        <Muted>{t('settings.ai.eyebrow')}</Muted>
        <H1>{t('settings.ai.title')}</H1>
        <Body>{t('settings.ai.body')}</Body>
      </Stack>

      <Card>
        <Stack>
          <SectionHeader title={t('settings.ai.statusTitle')} />
          <HStack className="justify-between">
            <Muted>{t('settings.ai.status')}</Muted>
            <Body className="font-extrabold">{t(statusLabelKey(check?.status))}</Body>
          </HStack>
          <HStack className="justify-between">
            <Muted>{t('settings.ai.provider')}</Muted>
            <Body className="font-extrabold">{check?.provider ?? t('common.notSet')}</Body>
          </HStack>
          {check?.checkedAt ? (
            <Muted>{t('settings.ai.lastChecked', { value: formatDate(check.checkedAt, locale) })}</Muted>
          ) : null}
          {check?.message ? <Muted>{check.message}</Muted> : null}
          <Button icon={RefreshCcw} onPress={runTest} disabled={isTesting}>
            {isTesting ? t('settings.ai.testing') : t('settings.ai.testConnection')}
          </Button>
        </Stack>
      </Card>

      <Card>
        <Stack>
          <SectionHeader title={t('settings.ai.controlsTitle')} />
          <HStack className="items-center justify-between">
            <Box className="flex-1">
              <Body className="font-extrabold">{t('settings.ai.cloudEnabled')}</Body>
              <Muted>{t('settings.ai.cloudEnabledBody')}</Muted>
            </Box>
            <Switch value={ai.cloudEnabled} onValueChange={setCloudEnabled} />
          </HStack>
          <HStack className="items-center justify-between">
            <Box className="flex-1">
              <Body className="font-extrabold">{t('settings.ai.cloudConsent')}</Body>
              <Muted>{t('settings.ai.cloudConsentBody')}</Muted>
            </Box>
            <Switch
              value={ai.cloudDocumentConsent}
              onValueChange={setCloudConsent}
              disabled={!ai.cloudEnabled}
            />
          </HStack>
          <Stack gap={8}>
            <Muted>{t('settings.ai.ocrMode')}</Muted>
            <SegmentedControl
              values={OCR_MODES}
              selected={ai.ocrMode}
              onSelect={setOcrMode}
              getLabel={(mode) => t(ocrModeLabelKey(mode))}
            />
          </Stack>
        </Stack>
      </Card>

      <Card>
        <Stack>
          <SectionHeader title={t('settings.ai.documentTools')} />
          <Body>{t('settings.ai.documentToolsBody')}</Body>
          <Button variant="secondary" icon={RotateCcw} onPress={runReprocess} disabled={isReprocessing}>
            {isReprocessing ? t('settings.ai.reprocessing') : t('settings.ai.reprocessDocuments')}
          </Button>
        </Stack>
      </Card>

      <Card>
        <Stack>
          <SectionHeader title={t('settings.ai.disclaimerTitle')} />
          <Muted>{t('settings.ai.disclaimerBody')}</Muted>
        </Stack>
      </Card>
    </AppScreen>
  );
}
