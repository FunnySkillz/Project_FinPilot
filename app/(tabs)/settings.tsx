import { Alert, StyleSheet } from 'react-native';

import { AppScreen, Stack } from '@/components/finpilot/app-screen';
import { Card } from '@/components/finpilot/card';
import { Button, Field } from '@/components/finpilot/controls';
import { Body, H1, Muted } from '@/components/finpilot/text';
import { FinPilotColors } from '@/constants/finpilot';
import { useFinPilot } from '@/context/finpilot-context';
import { formatCurrency } from '@/utils/formatters';

export default function SettingsScreen() {
  const { state, updateSettings, resetWithSamples, resetEmpty } = useFinPilot();

  const updateNumberSetting = async (key: 'monthlyIncome' | 'emergencyBufferGoal', value: string) => {
    const parsed = Number(value.replace(',', '.'));
    if (!Number.isFinite(parsed) || parsed < 0) {
      return;
    }

    await updateSettings({ [key]: parsed });
  };

  return (
    <AppScreen>
      <Stack gap={4}>
        <Muted>Local MVP</Muted>
        <H1>Settings</H1>
        <Body>Control the assumptions that power the dashboard and purchase decisions.</Body>
      </Stack>

      <Card>
        <Stack>
          <Field
            label="Monthly income"
            defaultValue={String(state.settings.monthlyIncome)}
            onEndEditing={(event) => updateNumberSetting('monthlyIncome', event.nativeEvent.text)}
            keyboardType="decimal-pad"
            helper={`Current: ${formatCurrency(state.settings.monthlyIncome)}`}
          />
          <Field
            label="Emergency buffer target"
            defaultValue={String(state.settings.emergencyBufferGoal)}
            onEndEditing={(event) => updateNumberSetting('emergencyBufferGoal', event.nativeEvent.text)}
            keyboardType="decimal-pad"
            helper={`Current: ${formatCurrency(state.settings.emergencyBufferGoal)}`}
          />
        </Stack>
      </Card>

      <Card>
        <Stack>
          <Body style={styles.strong}>Data controls</Body>
          <Muted>
            Data is stored locally on this device through the app storage layer. Cloud sync, auth, and real OCR/AI APIs
            are intentionally outside this MVP pass.
          </Muted>
          <Button
            variant="secondary"
            icon="restart-alt"
            onPress={() => {
              Alert.alert('Reset samples', 'Reload the seeded FinPilot demo data?', [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Reset', onPress: resetWithSamples },
              ]);
            }}>
            Reset sample data
          </Button>
          <Button
            variant="danger"
            icon="delete"
            onPress={() => {
              Alert.alert('Clear local data', 'Remove all local records and keep only settings?', [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Clear', style: 'destructive', onPress: resetEmpty },
              ]);
            }}>
            Clear local records
          </Button>
        </Stack>
      </Card>

      <Card style={styles.disclaimer}>
        <Stack>
          <Body style={styles.strong}>Important disclaimer</Body>
          <Muted>
            FinPilot is not a lawyer, tax advisor, insurance broker, or financial advisor. It should say “Based on
            your uploaded documents...” and show uncertainty when the documents do not prove the answer.
          </Muted>
          <Muted>
            The current OCR and assistant behavior is a local placeholder. Real extraction and AI Q&A can later replace
            the service implementations without changing the screens.
          </Muted>
        </Stack>
      </Card>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  strong: {
    fontWeight: '800',
  },
  disclaimer: {
    borderColor: FinPilotColors.amber,
  },
});

