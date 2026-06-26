import { useState } from 'react';
import { Alert } from 'react-native';
import { MessageCircleQuestion, Zap } from 'lucide-react-native';

import { AppScreen, Stack } from '@/components/finpilot/app-screen';
import { ConfidenceBadge } from '@/components/finpilot/badges';
import { Card, SectionHeader } from '@/components/finpilot/card';
import { Button, Field } from '@/components/finpilot/controls';
import { Body, H1, Muted } from '@/components/finpilot/text';
import { Box, HStack } from '@/components/ui/gluestack';
import { useFinPilot } from '@/context/finpilot-context';
import { useLanguage } from '@/context/language-context';
import type { AiQuestion } from '@/types/finpilot';

const sampleQuestionKeys = ['ask.sample.coverage', 'ask.sample.warranty', 'ask.sample.insurance'] as const;

function answerSourceLabelKey(source: AiQuestion['source']) {
  return source === 'cloud-ai' ? 'ask.source.cloud' : 'ask.source.local';
}

export default function AskScreen() {
  const { state, answerQuestion } = useFinPilot();
  const { t } = useLanguage();
  const [question, setQuestion] = useState('');
  const [currentAnswer, setCurrentAnswer] = useState<AiQuestion | undefined>(state.questions[0]);
  const [isAsking, setIsAsking] = useState(false);

  const ask = async (value = question) => {
    const cleanQuestion = value.trim();
    if (!cleanQuestion) {
      Alert.alert(t('ask.validationTitle'), t('ask.validationBody'));
      return;
    }

    setIsAsking(true);
    try {
      const answer = await answerQuestion(cleanQuestion);
      setCurrentAnswer(answer);
      setQuestion('');
    } finally {
      setIsAsking(false);
    }
  };

  return (
    <AppScreen>
      <Stack gap={4}>
        <Muted>{t('ask.eyebrow')}</Muted>
        <H1>{t('ask.title')}</H1>
        <Body>{t('ask.body')}</Body>
      </Stack>

      <Card>
        <Stack>
          <Field
            label={t('ask.question')}
            value={question}
            onChangeText={setQuestion}
            multiline
            placeholder={t('ask.placeholder')}
          />
          <Button onPress={() => ask()} icon={MessageCircleQuestion} disabled={isAsking}>
            {isAsking ? t('ask.checking') : t('ask.askDocuments')}
          </Button>
        </Stack>
      </Card>

      <Stack gap={8}>
        <Muted>{t('ask.tryOne')}</Muted>
        {sampleQuestionKeys.map((sampleKey) => {
          const sample = t(sampleKey);
          return (
          <Button key={sample} variant="secondary" icon={Zap} onPress={() => ask(sample)}>
            {sample}
          </Button>
          );
        })}
      </Stack>

      {currentAnswer ? (
        <Card className="border-fin-primary">
          <HStack className="justify-between">
            <Body className="font-extrabold">{t('ask.answer')}</Body>
            <ConfidenceBadge confidence={currentAnswer.confidence} />
          </HStack>
          <Muted>{t(answerSourceLabelKey(currentAnswer.source))}</Muted>
          <Body>{currentAnswer.answer}</Body>
          <Box className="gap-1.5 rounded-fin bg-fin-surfaceAlt p-2.5">
            <Muted>{t('common.relevantExcerpt')}</Muted>
            <Body>{currentAnswer.excerpt}</Body>
          </Box>
          <Muted>
            {t('ask.basedOnDocument', {
              title: currentAnswer.documentTitle ?? t('ask.noMatchingDocument'),
            })}
          </Muted>
          <Body className="font-extrabold text-fin-primaryDark">{currentAnswer.recommendation}</Body>
          <Muted>{t('ask.disclaimer')}</Muted>
        </Card>
      ) : null}

      <SectionHeader title={t('ask.questionHistory')} />
      <Stack>
        {state.questions.length === 0 ? (
          <Card>
            <Muted>{t('ask.empty')}</Muted>
          </Card>
        ) : (
          state.questions.slice(0, 6).map((item) => (
            <Card key={item.id} compact>
              <Body className="font-extrabold">{item.question}</Body>
              <Muted>{item.answer}</Muted>
            </Card>
          ))
        )}
      </Stack>
    </AppScreen>
  );
}
