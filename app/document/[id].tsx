import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Alert, Linking, StyleSheet, View } from 'react-native';

import { AppScreen, Stack } from '@/components/finpilot/app-screen';
import { CategoryBadge, ConfidenceBadge } from '@/components/finpilot/badges';
import { Card, SectionHeader } from '@/components/finpilot/card';
import { Button, Field, SegmentedControl } from '@/components/finpilot/controls';
import { Body, H1, Muted } from '@/components/finpilot/text';
import { FinPilotColors } from '@/constants/finpilot';
import { useFinPilot } from '@/context/finpilot-context';
import type { Category, DocumentInput, FinancialDocument } from '@/types/finpilot';
import { CATEGORIES } from '@/utils/finance';
import { formatCurrency, formatDate } from '@/utils/formatters';

type DocumentForm = {
  title: string;
  provider: string;
  amount: string;
  documentDate: string;
  category: Category;
  notes: string;
  tags: string;
};

function formFromDocument(document: FinancialDocument): DocumentForm {
  return {
    title: document.title,
    provider: document.provider ?? '',
    amount: document.amount ? String(document.amount) : '',
    documentDate: document.documentDate ?? '',
    category: document.category,
    notes: document.notes ?? '',
    tags: document.tags.join(', '),
  };
}

export default function DocumentDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string }>();
  const { state, updateDocument, deleteDocument } = useFinPilot();
  const document = useMemo(
    () => state.documents.find((item) => item.id === params.id),
    [params.id, state.documents],
  );
  const [form, setForm] = useState<DocumentForm | null>(document ? formFromDocument(document) : null);

  useEffect(() => {
    setForm(document ? formFromDocument(document) : null);
  }, [document]);

  if (!document || !form) {
    return (
      <AppScreen>
        <Card>
          <Body>Document not found.</Body>
          <Button onPress={() => router.back()} icon="arrow-back">
            Go back
          </Button>
        </Card>
      </AppScreen>
    );
  }

  const save = async () => {
    const amount = form.amount ? Number(form.amount.replace(',', '.')) : undefined;
    const input: Partial<DocumentInput> = {
      title: form.title.trim() || document.title,
      provider: form.provider.trim() || undefined,
      amount: Number.isFinite(amount) ? amount : undefined,
      documentDate: form.documentDate || undefined,
      category: form.category,
      notes: form.notes.trim() || undefined,
      tags: form.tags
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean),
    };

    await updateDocument(document.id, input);
    Alert.alert('Saved', 'Document metadata and placeholder analysis were updated.');
  };

  return (
    <AppScreen>
      <Stack gap={4}>
        <Muted>Document detail</Muted>
        <H1>{document.title}</H1>
        <View style={styles.badges}>
          <CategoryBadge category={document.category} />
          {document.analysis ? <ConfidenceBadge confidence={document.analysis.confidence} /> : null}
        </View>
      </Stack>

      <Card>
        <Stack>
          <View style={styles.metaRow}>
            <Muted>Provider</Muted>
            <Body style={styles.strong}>{document.provider ?? 'Not set'}</Body>
          </View>
          <View style={styles.metaRow}>
            <Muted>Amount</Muted>
            <Body style={styles.strong}>{document.amount ? formatCurrency(document.amount) : 'Not set'}</Body>
          </View>
          <View style={styles.metaRow}>
            <Muted>Date</Muted>
            <Body style={styles.strong}>{formatDate(document.documentDate)}</Body>
          </View>
          <View style={styles.metaRow}>
            <Muted>File</Muted>
            <Body style={styles.strong}>{document.fileName ?? 'Manual record'}</Body>
          </View>
          {document.fileUri ? (
            <Button variant="secondary" icon="open-in-new" onPress={() => Linking.openURL(document.fileUri!)}>
              Open original file
            </Button>
          ) : null}
        </Stack>
      </Card>

      {document.analysis ? (
        <Card style={styles.analysisCard}>
          <Stack>
            <SectionHeader title="Placeholder analysis" />
            <Body>{document.analysis.summary}</Body>
            <View style={styles.quoteBox}>
              <Muted>Relevant excerpt</Muted>
              <Body>{document.analysis.excerpt}</Body>
            </View>
            <Muted>Covered signals: {document.analysis.coveredRisks.join(', ') || 'None detected'}</Muted>
            <Muted>Warnings: {document.analysis.exclusions.join(', ') || 'No warnings detected'}</Muted>
          </Stack>
        </Card>
      ) : null}

      <Card>
        <Stack>
          <SectionHeader title="Correct metadata" />
          <Field
            label="Title"
            value={form.title}
            onChangeText={(title) => setForm((current) => current && { ...current, title })}
          />
          <Field
            label="Provider"
            value={form.provider}
            onChangeText={(provider) => setForm((current) => current && { ...current, provider })}
          />
          <Field
            label="Amount"
            value={form.amount}
            onChangeText={(amount) => setForm((current) => current && { ...current, amount })}
            keyboardType="decimal-pad"
          />
          <Field
            label="Document date"
            value={form.documentDate}
            onChangeText={(documentDate) => setForm((current) => current && { ...current, documentDate })}
            placeholder="YYYY-MM-DD"
          />
          <Stack gap={8}>
            <Muted>Category</Muted>
            <SegmentedControl
              values={CATEGORIES}
              selected={form.category}
              onSelect={(category) => setForm((current) => current && { ...current, category })}
            />
          </Stack>
          <Field
            label="Tags"
            value={form.tags}
            onChangeText={(tags) => setForm((current) => current && { ...current, tags })}
          />
          <Field
            label="Notes"
            value={form.notes}
            onChangeText={(notes) => setForm((current) => current && { ...current, notes })}
            multiline
          />
          <Button onPress={save} icon="save">
            Save document
          </Button>
          <Button
            variant="danger"
            icon="delete"
            onPress={() => {
              Alert.alert('Delete document', 'Remove this document from the local vault?', [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Delete',
                  style: 'destructive',
                  onPress: async () => {
                    await deleteDocument(document.id);
                    router.back();
                  },
                },
              ]);
            }}>
            Delete document
          </Button>
        </Stack>
      </Card>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  badges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  metaRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  strong: {
    flexShrink: 1,
    fontWeight: '800',
    textAlign: 'right',
  },
  analysisCard: {
    borderColor: FinPilotColors.primary,
  },
  quoteBox: {
    backgroundColor: FinPilotColors.surfaceAlt,
    borderRadius: 8,
    gap: 6,
    padding: 10,
  },
});

