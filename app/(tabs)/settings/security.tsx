import { useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { Lock, ShieldCheck, Unlock } from 'lucide-react-native';

import { AppScreen, Stack } from '@/components/finpilot/app-screen';
import { Card } from '@/components/finpilot/card';
import { Button, Field } from '@/components/finpilot/controls';
import { Body, H1, Muted } from '@/components/finpilot/text';
import { useAppLock } from '@/context/app-lock-context';
import { useFinPilot } from '@/context/finpilot-context';
import { useLanguage } from '@/context/language-context';
import { isValidPin, pinAuthService } from '@/services/pin-auth';

export default function SecurityScreen() {
  const { state } = useFinPilot();
  const { t } = useLanguage();
  const appLock = useAppLock();
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [isBusy, setIsBusy] = useState(false);
  const [message, setMessage] = useState<string | undefined>();

  useEffect(() => {
    appLock.refreshPinAvailability();
  }, [appLock.refreshPinAvailability]);

  const validateNewPin = () => {
    return isValidPin(newPin) && newPin === confirmPin;
  };

  const savePin = async () => {
    if (!validateNewPin()) {
      Alert.alert(t('security.pinError'));
      return false;
    }

    setIsBusy(true);
    try {
      if (appLock.pinAvailable) {
        const verified = await pinAuthService.verifyPinAsync(currentPin);
        if (!verified.success) {
          Alert.alert(t('security.wrongPin'));
          return false;
        }
      }

      await appLock.setPin(newPin);
      setCurrentPin('');
      setNewPin('');
      setConfirmPin('');
      setMessage(t('security.pinSaved'));
      return true;
    } finally {
      setIsBusy(false);
    }
  };

  const enable = async () => {
    setIsBusy(true);
    try {
      if (!appLock.pinAvailable) {
        const saved = await savePin();
        if (!saved) {
          return;
        }
      }
      await appLock.enableAppLock();
      setMessage(t('security.enabledMessage'));
    } catch (error) {
      Alert.alert(error instanceof Error ? error.message : t('security.pinError'));
    } finally {
      setIsBusy(false);
    }
  };

  const disable = async () => {
    setIsBusy(true);
    try {
      await appLock.disableAppLock();
      setMessage(t('security.disabledMessage'));
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <AppScreen nativeHeader>
      <Stack gap={4}>
        <Muted>{t('settings.security.title')}</Muted>
        <H1>{t('settings.security.title')}</H1>
        <Body>{t('settings.security.body')}</Body>
      </Stack>

      <Card>
        <Stack>
          <Body className="font-extrabold">
            {t('security.appLock')}: {state.settings.appLockEnabled ? t('security.enabled') : t('security.disabled')}
          </Body>
          <Muted>
            {appLock.pinAvailable ? t('security.pinSaved') : t('security.pinError')}
          </Muted>
          {appLock.pinAvailable ? (
            <Field
              label={t('security.currentPin')}
              value={currentPin}
              onChangeText={setCurrentPin}
              keyboardType="number-pad"
              secureTextEntry
              maxLength={6}
            />
          ) : null}
          <Field
            label={t('security.newPin')}
            value={newPin}
            onChangeText={setNewPin}
            keyboardType="number-pad"
            secureTextEntry
            maxLength={6}
          />
          <Field
            label={t('security.confirmPin')}
            value={confirmPin}
            onChangeText={setConfirmPin}
            keyboardType="number-pad"
            secureTextEntry
            maxLength={6}
          />
          <Button variant="secondary" icon={Lock} onPress={savePin} disabled={isBusy}>
            {t('security.setPin')}
          </Button>
          <Button icon={ShieldCheck} onPress={enable} disabled={isBusy || state.settings.appLockEnabled}>
            {t('security.enable')}
          </Button>
          <Button variant="danger" icon={Unlock} onPress={disable} disabled={isBusy}>
            {t('security.disable')}
          </Button>
          {message ? <Muted>{message}</Muted> : null}
          {appLock.authError ? <Muted>{appLock.authError}</Muted> : null}
        </Stack>
      </Card>
    </AppScreen>
  );
}
