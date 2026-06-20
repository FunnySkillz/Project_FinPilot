import { useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';

import { AppScreen, Stack } from '@/components/finpilot/app-screen';
import { Card } from '@/components/finpilot/card';
import { Button } from '@/components/finpilot/controls';
import { Body, H1, Muted } from '@/components/finpilot/text';
import { useLanguage } from '@/context/language-context';

export default function NotFoundScreen() {
  const router = useRouter();
  const { t } = useLanguage();

  return (
    <AppScreen>
      <Card>
        <Stack>
          <Muted>{t('app.name')}</Muted>
          <H1>{t('notFound.title')}</H1>
          <Body>{t('notFound.body')}</Body>
          <Button icon={ArrowLeft} onPress={() => router.replace('/(tabs)')}>
            {t('notFound.back')}
          </Button>
        </Stack>
      </Card>
    </AppScreen>
  );
}
