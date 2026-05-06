import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';

import { AppScreen, Stack } from '@/components/finpilot/app-screen';
import { Card, SectionHeader } from '@/components/finpilot/card';
import { Button, Field, SegmentedControl } from '@/components/finpilot/controls';
import { DocumentCard } from '@/components/finpilot/list-cards';
import { Body, H1, Muted } from '@/components/finpilot/text';
import { useFinPilot } from '@/context/finpilot-context';
import type { Category, DocumentInput } from '@/types/finpilot';
import { CATEGORIES } from '@/utils/finance';

type ManualDocumentForm = {
  title: string;
  provider: string;
  amount: string;
  documentDate: string;
  category: Category;
  notes: string;
  tags: string;
};

const emptyManualForm: ManualDocumentForm = {
  title: '',
  provider: '',
  amount: '',
  documentDate: new Date().toISOString().slice(0, 10),
  category: 'Other',
  notes: '',
  tags: '',
};

export default function DocumentsScreen() {
  const router = useRouter();
  const { state, pickAndAddDocument, addManualDocument } = useFinPilot();
  const [selectedCategory, setSelectedCategory] = useState<Category | 'All'>('All');
  const [query, setQuery] = useState('');
  const [isPicking, setIsPicking] = useState(false);
  const [showManualForm, setShowManualForm] = useState(false);
  const [manualForm, setManualForm] = useState<ManualDocumentForm>(emptyManualForm);

  const documents = useMemo(() => {
    const queryText = query.trim().toLowerCase();

    return state.documents.filter((document) => {
      const matchesCategory = selectedCategory === 'All' || document.category === selectedCategory;
      const matchesQuery =
        !queryText ||
        [document.title, document.provider, document.notes, document.extractedText, ...(document.tags ?? [])]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
          .includes(queryText);

      return matchesCategory && matchesQuery;
    });
  }, [query, selectedCategory, state.documents]);

  const upload = async () => {
    setIsPicking(true);
    try {
      const document = await pickAndAddDocument();
      if (document) {
        router.push(`/document/${document.id}`);
      }
    } finally {
      setIsPicking(false);
    }
  };

  const addManual = async () => {
    const amount = manualForm.amount ? Number(manualForm.amount.replace(',', '.')) : undefined;
    if (!manualForm.title.trim()) {
      Alert.alert('Missing title', 'Add a document title first.');
      return;
    }

    const input: DocumentInput = {
      title: manualForm.title.trim(),
      provider: manualForm.provider.trim() || undefined,
      category: manualForm.category,
      amount: Number.isFinite(amount) ? amount : undefined,
      documentDate: manualForm.documentDate || undefined,
      notes: manualForm.notes.trim() || undefined,
      tags: manualForm.tags
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean),
    };

    await addManualDocument(input);
    setManualForm(emptyManualForm);
    setShowManualForm(false);
  };

  return (
    <AppScreen>
      <Stack gap={4}>
        <Muted>Document vault</Muted>
        <H1>Documents</H1>
        <Body>Upload PDFs or images, keep the metadata editable, and let FinPilot make them searchable.</Body>
      </Stack>

      <View style={styles.actions}>
        <Button onPress={upload} icon="upload-file" disabled={isPicking}>
          {isPicking ? 'Opening picker' : 'Upload PDF/image'}
        </Button>
        <Button
          variant="secondary"
          icon={showManualForm ? 'close' : 'edit-note'}
          onPress={() => setShowManualForm((current) => !current)}>
          {showManualForm ? 'Close manual form' : 'Manual record'}
        </Button>
      </View>

      {showManualForm ? (
        <Card>
          <Stack>
            <Field
              label="Title"
              value={manualForm.title}
              onChangeText={(title) => setManualForm((current) => ({ ...current, title }))}
              placeholder="Warranty receipt"
            />
            <Field
              label="Provider"
              value={manualForm.provider}
              onChangeText={(provider) => setManualForm((current) => ({ ...current, provider }))}
              placeholder="MediaMarkt"
            />
            <Field
              label="Amount"
              value={manualForm.amount}
              onChangeText={(amount) => setManualForm((current) => ({ ...current, amount }))}
              keyboardType="decimal-pad"
              placeholder="699"
            />
            <Field
              label="Document date"
              value={manualForm.documentDate}
              onChangeText={(documentDate) => setManualForm((current) => ({ ...current, documentDate }))}
              placeholder="YYYY-MM-DD"
            />
            <Stack gap={8}>
              <Muted>Category</Muted>
              <SegmentedControl
                values={CATEGORIES}
                selected={manualForm.category}
                onSelect={(category) => setManualForm((current) => ({ ...current, category }))}
              />
            </Stack>
            <Field
              label="Tags"
              value={manualForm.tags}
              onChangeText={(tags) => setManualForm((current) => ({ ...current, tags }))}
              placeholder="invoice, warranty, household"
            />
            <Field
              label="Notes"
              value={manualForm.notes}
              onChangeText={(notes) => setManualForm((current) => ({ ...current, notes }))}
              multiline
              placeholder="Anything useful for future questions"
            />
            <Button onPress={addManual} icon="add">
              Add manual document
            </Button>
          </Stack>
        </Card>
      ) : null}

      <Field label="Search vault" value={query} onChangeText={setQuery} placeholder="ARAG, warranty, fine..." />
      <Stack gap={8}>
        <Muted>Filter</Muted>
        <SegmentedControl
          values={['All', ...CATEGORIES]}
          selected={selectedCategory}
          onSelect={(category) => setSelectedCategory(category)}
        />
      </Stack>

      <SectionHeader title={`${documents.length} document${documents.length === 1 ? '' : 's'}`} />
      <Stack>
        {documents.length === 0 ? (
          <Card>
            <Muted>No documents match this view.</Muted>
          </Card>
        ) : (
          documents.map((document) => (
            <DocumentCard
              key={document.id}
              document={document}
              onPress={() => router.push(`/document/${document.id}`)}
            />
          ))
        )}
      </Stack>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  actions: {
    gap: 10,
  },
});

