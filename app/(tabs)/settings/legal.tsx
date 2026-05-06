import { AppScreen, Stack } from '@/components/finpilot/app-screen';
import { Card } from '@/components/finpilot/card';
import { Body, H1, Muted } from '@/components/finpilot/text';
import { useLanguage } from '@/context/language-context';

export default function LegalScreen() {
  const { t } = useLanguage();

  return (
    <AppScreen nativeHeader>
      <Stack gap={4}>
        <Muted>{t('settings.legal.title')}</Muted>
        <H1>{t('settings.legal.title')}</H1>
        <Body>{t('settings.legal.body')}</Body>
      </Stack>

      <Card className="border-fin-amber">
        <Stack>
          <Body className="font-extrabold">{t('settings.legal.title')}</Body>
          <Muted>{t('legal.disclaimer')}</Muted>
        </Stack>
      </Card>
    </AppScreen>
  );
}

