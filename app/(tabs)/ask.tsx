import { useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';

import { AppScreen, Stack } from '@/components/finpilot/app-screen';
import { ConfidenceBadge } from '@/components/finpilot/badges';
import { Card, SectionHeader } from '@/components/finpilot/card';
import { Button, Field } from '@/components/finpilot/controls';
import { Body, H1, Muted } from '@/components/finpilot/text';
import { FinPilotColors } from '@/constants/finpilot';
import { useFinPilot } from '@/context/finpilot-context';
import type { AiQuestion } from '@/types/finpilot';

const sampleQuestions = [
  'Do I have Rechtsschutz for a EUR 400 speeding fine?',
  'Do I still have warranty on my washing machine?',
  'Which insurance should I contact for this case?',
];

export default function AskScreen() {
  const { state, answerQuestion } = useFinPilot();
  const [question, setQuestion] = useState('');
  const [currentAnswer, setCurrentAnswer] = useState<AiQuestion | undefined>(state.questions[0]);
  const [isAsking, setIsAsking] = useState(false);

  const ask = async (value = question) => {
    const cleanQuestion = value.trim();
    if (!cleanQuestion) {
      Alert.alert('Ask something', 'Type a question about your uploaded documents.');
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
        <Muted>Grounded assistant</Muted>
        <H1>Ask FinPilot</H1>
        <Body>Answers stay tied to uploaded documents and call out uncertainty before you act.</Body>
      </Stack>

      <Card>
        <Stack>
          <Field
            label="Question"
            value={question}
            onChangeText={setQuestion}
            multiline
            placeholder="Do I have Rechtsschutz for a EUR 400 speeding fine?"
          />
          <Button onPress={() => ask()} icon="question-answer" disabled={isAsking}>
            {isAsking ? 'Checking documents' : 'Ask documents'}
          </Button>
        </Stack>
      </Card>

      <Stack gap={8}>
        <Muted>Try one</Muted>
        {sampleQuestions.map((sample) => (
          <Button key={sample} variant="secondary" icon="bolt" onPress={() => ask(sample)}>
            {sample}
          </Button>
        ))}
      </Stack>

      {currentAnswer ? (
        <Card style={styles.answerCard}>
          <View style={styles.answerHeader}>
            <Body style={styles.strong}>Answer</Body>
            <ConfidenceBadge confidence={currentAnswer.confidence} />
          </View>
          <Body>{currentAnswer.answer}</Body>
          <View style={styles.quoteBox}>
            <Muted>Relevant excerpt</Muted>
            <Body>{currentAnswer.excerpt}</Body>
          </View>
          <Muted>
            Based on document: {currentAnswer.documentTitle ?? 'No matching document'}.
          </Muted>
          <Body style={styles.recommendation}>{currentAnswer.recommendation}</Body>
        </Card>
      ) : null}

      <SectionHeader title="Question history" />
      <Stack>
        {state.questions.length === 0 ? (
          <Card>
            <Muted>No questions yet.</Muted>
          </Card>
        ) : (
          state.questions.slice(0, 6).map((item) => (
            <Card key={item.id} compact>
              <Body style={styles.strong}>{item.question}</Body>
              <Muted>{item.answer}</Muted>
            </Card>
          ))
        )}
      </Stack>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  answerCard: {
    borderColor: FinPilotColors.primary,
  },
  answerHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  quoteBox: {
    backgroundColor: FinPilotColors.surfaceAlt,
    borderRadius: 8,
    gap: 6,
    padding: 10,
  },
  strong: {
    fontWeight: '800',
  },
  recommendation: {
    color: FinPilotColors.primaryDark,
    fontWeight: '800',
  },
});

