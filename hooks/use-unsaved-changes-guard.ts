import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useCallback } from 'react';
import { Alert, BackHandler } from 'react-native';

import { useLanguage } from '@/context/language-context';

export function useUnsavedChangesGuard(hasUnsavedChanges: boolean) {
  const navigation = useNavigation();
  const { t } = useLanguage();

  useFocusEffect(
    useCallback(() => {
      const unsubscribe = navigation.addListener('beforeRemove', (event) => {
        if (!hasUnsavedChanges) {
          return;
        }

        event.preventDefault();
        Alert.alert(t('forms.discardTitle'), t('forms.discardBody'), [
          { text: t('forms.keepEditing'), style: 'cancel' },
          {
            text: t('forms.discard'),
            style: 'destructive',
            onPress: () => navigation.dispatch(event.data.action),
          },
        ]);
      });

      const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
        if (!hasUnsavedChanges) {
          return false;
        }

        Alert.alert(t('forms.discardTitle'), t('forms.discardBody'), [
          { text: t('forms.keepEditing'), style: 'cancel' },
          { text: t('forms.discard'), style: 'destructive', onPress: () => navigation.goBack() },
        ]);
        return true;
      });

      return () => {
        unsubscribe();
        subscription.remove();
      };
    }, [hasUnsavedChanges, navigation, t]),
  );
}
