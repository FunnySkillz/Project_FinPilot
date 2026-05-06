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
          <Button onPress={() => ask()} icon={MessageCircleQuestion} disabled={isAsking}>
            {isAsking ? 'Checking documents' : 'Ask documents'}
          </Button>
        </Stack>
      </Card>

      <Stack gap={8}>
        <Muted>Try one</Muted>
        {sampleQuestions.map((sample) => (
          <Button key={sample} variant="secondary" icon={Zap} onPress={() => ask(sample)}>
            {sample}
          </Button>
        ))}
      </Stack>

      {currentAnswer ? (
        <Card className="border-fin-primary">
          <HStack className="justify-between">
            <Body className="font-extrabold">Answer</Body>
            <ConfidenceBadge confidence={currentAnswer.confidence} />
          </HStack>
          <Body>{currentAnswer.answer}</Body>
          <Box className="gap-1.5 rounded-fin bg-fin-surfaceAlt p-2.5">
            <Muted>Relevant excerpt</Muted>
            <Body>{currentAnswer.excerpt}</Body>
          </Box>
          <Muted>
            Based on document: {currentAnswer.documentTitle ?? 'No matching document'}.
          </Muted>
          <Body className="font-extrabold text-fin-primaryDark">{currentAnswer.recommendation}</Body>
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
              <Body className="font-extrabold">{item.question}</Body>
              <Muted>{item.answer}</Muted>
            </Card>
          ))
        )}
      </Stack>
    </AppScreen>
  );
}
