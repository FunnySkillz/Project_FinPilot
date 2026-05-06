import { useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';

import { AppScreen, Stack } from '@/components/finpilot/app-screen';
import { Card } from '@/components/finpilot/card';
import { Button } from '@/components/finpilot/controls';
import { Body, H1, Muted } from '@/components/finpilot/text';

export default function NotFoundScreen() {
  const router = useRouter();

  return (
    <AppScreen>
      <Card>
        <Stack>
          <Muted>FinPilot</Muted>
          <H1>Route not found</H1>
          <Body>This local screen is not available. Return to the cockpit and keep moving.</Body>
          <Button icon={ArrowLeft} onPress={() => router.replace('/(tabs)')}>
            Back to dashboard
          </Button>
        </Stack>
      </Card>
    </AppScreen>
  );
}
