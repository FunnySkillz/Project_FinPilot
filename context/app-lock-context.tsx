import * as LocalAuthentication from 'expo-local-authentication';
import { createContext, PropsWithChildren, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';

import { useFinPilot } from '@/context/finpilot-context';
import { useLanguage } from '@/context/language-context';
import { pinAuthService } from '@/services/pin-auth';

type AppLockContextValue = {
  isUnlocked: boolean;
  isAuthenticating: boolean;
  pinAvailable: boolean;
  authError?: string;
  refreshPinAvailability: () => Promise<void>;
  authenticateWithBiometrics: () => Promise<boolean>;
  unlockWithPin: (pin: string) => Promise<boolean>;
  setPin: (pin: string) => Promise<void>;
  enableAppLock: () => Promise<void>;
  disableAppLock: () => Promise<void>;
  lockNow: () => void;
};

const AppLockContext = createContext<AppLockContextValue | undefined>(undefined);

export function AppLockProvider({ children }: PropsWithChildren) {
  const { state, updateSettings } = useFinPilot();
  const { t } = useLanguage();
  const [isUnlocked, setIsUnlocked] = useState(!state.settings.appLockEnabled);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [pinAvailable, setPinAvailable] = useState(false);
  const [authError, setAuthError] = useState<string | undefined>();
  const authInFlightRef = useRef(false);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);
  const shouldAuthenticateOnNextActiveRef = useRef(false);

  const refreshPinAvailability = useCallback(async () => {
    setPinAvailable(await pinAuthService.hasPinRecordAsync());
  }, []);

  const authenticateWithBiometrics = useCallback(async () => {
    if (authInFlightRef.current) {
      return false;
    }

    authInFlightRef.current = true;
    setIsAuthenticating(true);
    setAuthError(undefined);

    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      if (!hasHardware || !isEnrolled) {
        setAuthError(t('security.biometricsUnavailable'));
        return false;
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: t('security.biometricPrompt'),
        cancelLabel: t('common.cancel'),
        disableDeviceFallback: false,
      });

      if (result.success) {
        setIsUnlocked(true);
        setAuthError(undefined);
        return true;
      }

      setAuthError(t('security.biometricFailed'));
      return false;
    } catch {
      setAuthError(t('security.biometricFailed'));
      return false;
    } finally {
      authInFlightRef.current = false;
      setIsAuthenticating(false);
      await refreshPinAvailability();
    }
  }, [refreshPinAvailability, t]);

  const unlockWithPin = useCallback(async (pin: string) => {
    const result = await pinAuthService.verifyPinAsync(pin);
    if (result.success) {
      setIsUnlocked(true);
      setAuthError(undefined);
      return true;
    }

    setAuthError(
      result.lockedUntilEpochMs
        ? t('security.locked')
        : t('security.pinAttemptsLeft', { count: result.remainingAttempts }),
    );
    return false;
  }, [t]);

  const setPin = useCallback(
    async (pin: string) => {
      await pinAuthService.setPinAsync(pin);
      await refreshPinAvailability();
    },
    [refreshPinAvailability],
  );

  const enableAppLock = useCallback(async () => {
    const hasPin = await pinAuthService.hasPinRecordAsync();
    if (!hasPin) {
      throw new Error(t('security.pinRequired'));
    }

    await updateSettings({ appLockEnabled: true });
    setIsUnlocked(false);
  }, [t, updateSettings]);

  const disableAppLock = useCallback(async () => {
    await pinAuthService.clearPinAsync();
    await updateSettings({ appLockEnabled: false });
    await refreshPinAvailability();
    setIsUnlocked(true);
    setAuthError(undefined);
  }, [refreshPinAvailability, updateSettings]);

  const lockNow = useCallback(() => {
    if (state.settings.appLockEnabled && state.settings.hasCompletedOnboarding) {
      setIsUnlocked(false);
    }
  }, [state.settings.appLockEnabled, state.settings.hasCompletedOnboarding]);

  useEffect(() => {
    refreshPinAvailability();
  }, [refreshPinAvailability]);

  useEffect(() => {
    if (!state.settings.appLockEnabled || !state.settings.hasCompletedOnboarding) {
      setIsUnlocked(true);
      return;
    }

    setIsUnlocked(false);
    authenticateWithBiometrics();
  }, [authenticateWithBiometrics, state.settings.appLockEnabled, state.settings.hasCompletedOnboarding]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      const previousState = appStateRef.current;
      appStateRef.current = nextState;

      if (nextState === 'background') {
        shouldAuthenticateOnNextActiveRef.current = true;
        if (state.settings.appLockEnabled) {
          setIsUnlocked(false);
        }
        return;
      }

      if (previousState.match(/inactive|background/) && nextState === 'active') {
        if (!state.settings.appLockEnabled || !state.settings.hasCompletedOnboarding) {
          return;
        }
        if (!shouldAuthenticateOnNextActiveRef.current) {
          return;
        }

        shouldAuthenticateOnNextActiveRef.current = false;
        setIsUnlocked(false);
        authenticateWithBiometrics();
      }
    });

    return () => subscription.remove();
  }, [authenticateWithBiometrics, state.settings.appLockEnabled, state.settings.hasCompletedOnboarding]);

  const value = useMemo<AppLockContextValue>(
    () => ({
      isUnlocked,
      isAuthenticating,
      pinAvailable,
      authError,
      refreshPinAvailability,
      authenticateWithBiometrics,
      unlockWithPin,
      setPin,
      enableAppLock,
      disableAppLock,
      lockNow,
    }),
    [
      authError,
      authenticateWithBiometrics,
      disableAppLock,
      enableAppLock,
      isAuthenticating,
      isUnlocked,
      lockNow,
      pinAvailable,
      refreshPinAvailability,
      setPin,
      unlockWithPin,
    ],
  );

  return <AppLockContext.Provider value={value}>{children}</AppLockContext.Provider>;
}

export function useAppLock() {
  const context = useContext(AppLockContext);

  if (!context) {
    throw new Error('useAppLock must be used inside AppLockProvider');
  }

  return context;
}
