import { useState } from 'react';
import { ShieldCheck } from 'lucide-react-native';

import { AppScreen, Stack } from '@/components/finpilot/app-screen';
import { Card } from '@/components/finpilot/card';
import { Button, Field } from '@/components/finpilot/controls';
import { Body, H1, Muted } from '@/components/finpilot/text';
import { useAppLock } from '@/context/app-lock-context';
import { useLanguage } from '@/context/language-context';

export function AppLockGate() {
  const { t } = useLanguage();
  const { authenticateWithBiometrics, unlockWithPin, isAuthenticating, pinAvailable, authError } = useAppLock();
  const [pin, setPin] = useState('');

  return (
    <AppScreen>
      <Stack gap={4}>
        <Muted>{t('security.appLock')}</Muted>
        <H1>{t('security.unlockTitle')}</H1>
        <Body>{t('security.unlockBody')}</Body>
      </Stack>

      <Card>
        <Stack>
          <Button onPress={authenticateWithBiometrics} icon={ShieldCheck} disabled={isAuthenticating}>
            {isAuthenticating ? t('common.loading') : t('security.unlockWithBiometrics')}
          </Button>
          {pinAvailable ? (
            <>
              <Field
                label={t('security.pin')}
                value={pin}
                onChangeText={setPin}
                keyboardType="number-pad"
                secureTextEntry
                maxLength={6}
              />
              <Button
                variant="secondary"
                onPress={async () => {
                  const unlocked = await unlockWithPin(pin);
                  if (unlocked) {
                    setPin('');
                  }
                }}>
                {t('security.unlockWithPin')}
              </Button>
            </>
          ) : null}
          {authError ? <Muted>{authError}</Muted> : null}
        </Stack>
      </Card>
    </AppScreen>
  );
}

