import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert } from 'react-native';
import { Camera, Edit3, Image as ImageIcon, Plus, Upload, X } from 'lucide-react-native';

import { AppScreen, Stack } from '@/components/finpilot/app-screen';
import { Card, SectionHeader } from '@/components/finpilot/card';
import { Button, Field, SegmentedControl } from '@/components/finpilot/controls';
import { DocumentCard } from '@/components/finpilot/list-cards';
import { Body, H1, Muted } from '@/components/finpilot/text';
import { VStack } from '@/components/ui/gluestack';
import { useFinPilot } from '@/context/finpilot-context';
import { useLanguage } from '@/context/language-context';
import { useUnsavedChangesGuard } from '@/hooks/use-unsaved-changes-guard';
import { categoryLabelKey } from '@/i18n';
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
  const { state, pickAndAddDocument, importPhotoAndAddDocument, scanAndAddDocument, addManualDocument } = useFinPilot();
  const { t } = useLanguage();
  const [selectedCategory, setSelectedCategory] = useState<Category | 'All'>('All');
  const [query, setQuery] = useState('');
  const [isPicking, setIsPicking] = useState(false);
  const [isImportingPhoto, setIsImportingPhoto] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [isSavingManual, setIsSavingManual] = useState(false);
  const [showManualForm, setShowManualForm] = useState(false);
  const [manualForm, setManualForm] = useState<ManualDocumentForm>(emptyManualForm);
  const hasUnsavedManualForm =
    showManualForm &&
    Boolean(
      manualForm.title ||
        manualForm.provider ||
        manualForm.amount ||
        manualForm.notes ||
        manualForm.tags ||
        manualForm.documentDate !== emptyManualForm.documentDate ||
        manualForm.category !== emptyManualForm.category,
    );

  useUnsavedChangesGuard(hasUnsavedManualForm);

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
    } catch {
      Alert.alert(t('documents.uploadErrorTitle'), t('documents.uploadErrorBody'));
    } finally {
      setIsPicking(false);
    }
  };

  const scan = async () => {
    setIsScanning(true);
    try {
      const document = await scanAndAddDocument();
      if (document) {
        router.push(`/document/${document.id}`);
      }
    } catch {
      Alert.alert(t('documents.scanErrorTitle'), t('documents.scanErrorBody'));
    } finally {
      setIsScanning(false);
    }
  };

  const importPhoto = async () => {
    setIsImportingPhoto(true);
    try {
      const document = await importPhotoAndAddDocument();
      if (document) {
        router.push(`/document/${document.id}`);
      }
    } catch {
      Alert.alert(t('documents.photoErrorTitle'), t('documents.photoErrorBody'));
    } finally {
      setIsImportingPhoto(false);
    }
  };

  const toggleManualForm = () => {
    if (showManualForm && hasUnsavedManualForm) {
      Alert.alert(t('forms.discardTitle'), t('documents.discardManualBody'), [
        { text: t('forms.keepEditing'), style: 'cancel' },
        {
          text: t('forms.discard'),
          style: 'destructive',
          onPress: () => {
            setManualForm(emptyManualForm);
            setShowManualForm(false);
          },
        },
      ]);
      return;
    }

    setShowManualForm((current) => !current);
  };

  const addManual = async () => {
    if (isSavingManual) {
      return;
    }

    const amount = manualForm.amount ? Number(manualForm.amount.replace(',', '.')) : undefined;
    if (!manualForm.title.trim()) {
      Alert.alert(t('documents.missingTitleTitle'), t('documents.missingTitleBody'));
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

    setIsSavingManual(true);
    try {
      await addManualDocument(input);
      setManualForm(emptyManualForm);
      setShowManualForm(false);
    } catch {
      Alert.alert(t('documents.saveErrorTitle'), t('documents.saveErrorBody'));
    } finally {
      setIsSavingManual(false);
    }
  };

  return (
    <AppScreen>
      <Stack gap={4}>
        <Muted>{t('documents.eyebrow')}</Muted>
        <H1>{t('documents.title')}</H1>
        <Body>{t('documents.body')}</Body>
      </Stack>

      <VStack className="gap-2.5">
        <Button
          onPress={upload}
          icon={Upload}
          disabled={isPicking || isImportingPhoto || isScanning || isSavingManual}>
          {isPicking ? t('documents.openingPicker') : t('documents.uploadAction')}
        </Button>
        <Button
          variant="secondary"
          onPress={importPhoto}
          icon={ImageIcon}
          disabled={isPicking || isImportingPhoto || isScanning || isSavingManual}>
          {isImportingPhoto ? t('documents.openingPhoto') : t('documents.photoAction')}
        </Button>
        <Button
          variant="secondary"
          onPress={scan}
          icon={Camera}
          disabled={isPicking || isImportingPhoto || isScanning || isSavingManual}>
          {isScanning ? t('documents.openingCamera') : t('documents.scanAction')}
        </Button>
        <Button
          variant="secondary"
          icon={showManualForm ? X : Edit3}
          onPress={toggleManualForm}
          disabled={isPicking || isImportingPhoto || isScanning || isSavingManual}>
          {showManualForm ? t('documents.closeManualForm') : t('documents.manualRecord')}
        </Button>
      </VStack>

      {showManualForm ? (
        <Card>
          <Stack>
            <Field
              label={t('documents.titleField')}
              value={manualForm.title}
              onChangeText={(title) => setManualForm((current) => ({ ...current, title }))}
              placeholder={t('documents.titlePlaceholder')}
            />
            <Field
              label={t('documents.provider')}
              value={manualForm.provider}
              onChangeText={(provider) => setManualForm((current) => ({ ...current, provider }))}
              placeholder={t('documents.providerPlaceholder')}
            />
            <Field
              label={t('documents.amount')}
              value={manualForm.amount}
              onChangeText={(amount) => setManualForm((current) => ({ ...current, amount }))}
              keyboardType="decimal-pad"
              placeholder="699"
            />
            <Field
              label={t('documents.documentDate')}
              value={manualForm.documentDate}
              onChangeText={(documentDate) => setManualForm((current) => ({ ...current, documentDate }))}
              placeholder="YYYY-MM-DD"
            />
            <Stack gap={8}>
              <Muted>{t('documents.category')}</Muted>
              <SegmentedControl
                values={CATEGORIES}
                selected={manualForm.category}
                onSelect={(category) => setManualForm((current) => ({ ...current, category }))}
                getLabel={(category) => t(categoryLabelKey(category))}
              />
            </Stack>
            <Field
              label={t('documents.tags')}
              value={manualForm.tags}
              onChangeText={(tags) => setManualForm((current) => ({ ...current, tags }))}
              placeholder={t('documents.tagsPlaceholder')}
            />
            <Field
              label={t('documents.notes')}
              value={manualForm.notes}
              onChangeText={(notes) => setManualForm((current) => ({ ...current, notes }))}
              multiline
              placeholder={t('documents.notesPlaceholder')}
            />
            <Button onPress={addManual} icon={Plus} disabled={isSavingManual}>
              {isSavingManual ? t('documents.saving') : t('documents.addManual')}
            </Button>
          </Stack>
        </Card>
      ) : null}

      <Field
        label={t('documents.search')}
        value={query}
        onChangeText={setQuery}
        placeholder={t('documents.searchPlaceholder')}
      />
      <Stack gap={8}>
        <Muted>{t('documents.filter')}</Muted>
        <SegmentedControl
          values={['All', ...CATEGORIES]}
          selected={selectedCategory}
          onSelect={(category) => setSelectedCategory(category)}
          getLabel={(category) => (category === 'All' ? t('expenses.all') : t(categoryLabelKey(category)))}
        />
      </Stack>

      <SectionHeader
        title={t(documents.length === 1 ? 'documents.countOne' : 'documents.count', { count: documents.length })}
      />
      <Stack>
        {documents.length === 0 ? (
          <Card>
            <Muted>{t('documents.empty')}</Muted>
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
