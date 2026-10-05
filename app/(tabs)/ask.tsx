import { useRef, useState } from 'react';
import { Alert } from 'react-native';
import { ChevronDown, ChevronUp, MessageCircleQuestion } from 'lucide-react-native';

import { AppScreen, Stack } from '@/components/finpilot/app-screen';
import { ConfidenceBadge } from '@/components/finpilot/badges';
import { Card, SectionHeader } from '@/components/finpilot/card';
import { Button, Field } from '@/components/finpilot/controls';
import { Body, H1, Muted } from '@/components/finpilot/text';
import { Box, HStack, Pressable } from '@/components/ui/gluestack';
import { useFinPilot } from '@/context/finpilot-context';
import { useLanguage } from '@/context/language-context';
import { getFinTheme } from '@/constants/finpilot';
import { useThemeMode } from '@/context/theme-mode-context';
import type { AiQuestion } from '@/types/finpilot';

const sampleQuestionKeys = ['ask.sample.coverage', 'ask.sample.warranty', 'ask.sample.insurance'] as const;

function answerSourceLabelKey(source: AiQuestion['source']) {
  return source === 'cloud-ai' ? 'ask.source.cloud' : 'ask.source.local';
}

function AnswerDetails({ answer }: { answer: AiQuestion }) {
  const { t } = useLanguage();
  return (
    <Stack>
      <HStack className="justify-between">
        <Body className="font-extrabold">{t('ask.answer')}</Body>
        <ConfidenceBadge confidence={answer.confidence} />
      </HStack>
      <Muted>{t(answerSourceLabelKey(answer.source))}</Muted>
      <Body>{answer.answer}</Body>
      <Box className="gap-1.5 rounded-fin bg-fin-surfaceAlt p-2.5">
        <Muted>{t('common.relevantExcerpt')}</Muted>
        <Body>{answer.excerpt}</Body>
      </Box>
      <Muted>
        {t('ask.basedOnDocument', {
          title: answer.documentTitle ?? t('ask.noMatchingDocument'),
        })}
      </Muted>
      <Body className="font-extrabold text-fin-primaryDark">{answer.recommendation}</Body>
      <Muted>{t('ask.disclaimer')}</Muted>
    </Stack>
  );
}

type SampleKey = (typeof sampleQuestionKeys)[number];

export default function AskScreen() {
  const { state, answerQuestion } = useFinPilot();
  const { t, language } = useLanguage();
  const { resolvedMode } = useThemeMode();
  const theme = getFinTheme(resolvedMode);
  const [question, setQuestion] = useState('');
  const [currentAnswer, setCurrentAnswer] = useState<AiQuestion | undefined>(state.questions[0]);
  const [isAsking, setIsAsking] = useState(false);
  const requestLock = useRef(false);
  const [openSample, setOpenSample] = useState<string>();
  const [pendingSample, setPendingSample] = useState<string>();
  const [sampleAnswers, setSampleAnswers] = useState<Record<string, AiQuestion>>({});
  const [sampleErrors, setSampleErrors] = useState<Record<string, boolean>>({});
  const [askError, setAskError] = useState(false);

  const ask = async (value = question) => {
    if (requestLock.current) return;
    const cleanQuestion = value.trim();
    if (!cleanQuestion) {
      Alert.alert(t('ask.validationTitle'), t('ask.validationBody'));
      return;
    }

    requestLock.current = true;
    setOpenSample(undefined);
    setCurrentAnswer(undefined);
    setAskError(false);
    setIsAsking(true);
    try {
      const answer = await answerQuestion(cleanQuestion);
      setCurrentAnswer(answer);
      setQuestion('');
    } catch {
      setAskError(true);
    } finally {
      requestLock.current = false;
      setIsAsking(false);
    }
  };

  const toggleSample = async (sampleKey: SampleKey) => {
    const key = language + ':' + sampleKey;
    if (openSample === key) {
      setOpenSample(undefined);
      return;
    }
    if (requestLock.current) return;
    setOpenSample(key);
    setCurrentAnswer(undefined);
    setAskError(false);
    if (sampleAnswers[key]) return;
    await loadSample(sampleKey, key);
  };

  const loadSample = async (sampleKey: SampleKey, key: string) => {
    if (requestLock.current) return;
    requestLock.current = true;
    setIsAsking(true);
    setPendingSample(key);
    setSampleErrors((current) => ({ ...current, [key]: false }));
    try {
      const answer = await answerQuestion(t(sampleKey));
      setSampleAnswers((current) => ({ ...current, [key]: answer }));
    } catch {
      setSampleErrors((current) => ({ ...current, [key]: true }));
    } finally {
      requestLock.current = false;
      setIsAsking(false);
      setPendingSample(undefined);
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
            {isAsking && !pendingSample ? t('ask.checking') : t('ask.askDocuments')}
          </Button>
          {askError ? <Body accessibilityRole="alert">{t('ask.error')}</Body> : null}
        </Stack>
      </Card>

      <Stack gap={8}>
        <Muted>{t('ask.tryOne')}</Muted>
        {sampleQuestionKeys.map((sampleKey) => {
          const sample = t(sampleKey);
          const key = language + ':' + sampleKey;
          const expanded = openSample === key;
          const loading = pendingSample === key;
          const disabled = isAsking && !expanded;
          const Chevron = expanded ? ChevronUp : ChevronDown;
          return (
            <Card key={sampleKey} className={expanded ? 'border-fin-primary' : ''}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={sample}
                accessibilityState={{ expanded, disabled, busy: loading }}
                disabled={disabled}
                onPress={() => toggleSample(sampleKey)}
                className="min-h-[44px] flex-row items-center gap-3"
              >
                <Body className={expanded ? 'flex-1 font-extrabold text-fin-primaryDark' : 'flex-1 font-bold'}>
                  {sample}
                </Body>
                <Chevron size={20} color={expanded ? theme.primary : theme.text} />
              </Pressable>
              {expanded ? (
                <Box className="border-t border-fin-border pt-3">
                  {loading ? <Muted accessibilityLiveRegion="polite">{t('ask.checking')}</Muted> : null}
                  {sampleErrors[key] ? (
                    <Stack>
                      <Body accessibilityRole="alert">{t('ask.error')}</Body>
                      <Button disabled={isAsking} variant="secondary" onPress={() => loadSample(sampleKey, key)}>
                        {t('common.retry')}
                      </Button>
                    </Stack>
                  ) : null}
                  {sampleAnswers[key] ? <AnswerDetails answer={sampleAnswers[key]} /> : null}
                </Box>
              ) : null}
            </Card>
          );
        })}
      </Stack>

      {currentAnswer ? (
        <Card className="border-fin-primary">
          <Body className="font-extrabold">{currentAnswer.question}</Body>
          <AnswerDetails answer={currentAnswer} />
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
