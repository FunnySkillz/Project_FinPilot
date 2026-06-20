import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Alert, Linking } from 'react-native';
import { ArrowLeft, ExternalLink, Save, Trash2 } from 'lucide-react-native';

import { AppScreen, Stack } from '@/components/finpilot/app-screen';
import { CategoryBadge, ConfidenceBadge } from '@/components/finpilot/badges';
import { Card, SectionHeader } from '@/components/finpilot/card';
import { Button, Field, SegmentedControl } from '@/components/finpilot/controls';
import { Body, H1, Muted } from '@/components/finpilot/text';
import { Box, HStack } from '@/components/ui/gluestack';
import { useFinPilot } from '@/context/finpilot-context';
import { useLanguage } from '@/context/language-context';
import { useUnsavedChangesGuard } from '@/hooks/use-unsaved-changes-guard';
import { categoryLabelKey } from '@/i18n';
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
  const { locale, t } = useLanguage();
  const canGoBack = typeof router.canGoBack === 'function' ? router.canGoBack() : false;
  const document = useMemo(
    () => state.documents.find((item) => item.id === params.id),
    [params.id, state.documents],
  );
  const [form, setForm] = useState<DocumentForm | null>(document ? formFromDocument(document) : null);
  const [bypassGuard, setBypassGuard] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const hasUnsavedChanges =
    Boolean(document && form) && JSON.stringify(form) !== JSON.stringify(formFromDocument(document as FinancialDocument));

  useUnsavedChangesGuard(!bypassGuard && hasUnsavedChanges);

  useEffect(() => {
    setForm(document ? formFromDocument(document) : null);
  }, [document]);

  useEffect(() => {
    if (document && form && JSON.stringify(form) === JSON.stringify(formFromDocument(document))) {
      setBypassGuard(false);
    }
  }, [document, form]);

  if (!document || !form) {
    return (
      <AppScreen nativeHeader>
        <Card>
          <Body>{t('documentDetail.notFound')}</Body>
          <Button onPress={() => (canGoBack ? router.back() : router.replace('/(tabs)/documents'))} icon={ArrowLeft}>
            {t('documentDetail.goBack')}
          </Button>
        </Card>
      </AppScreen>
    );
  }

  const save = async () => {
    if (isSaving) {
      return;
    }

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

    setIsSaving(true);
    try {
      await updateDocument(document.id, input);
      setBypassGuard(true);
      Alert.alert(t('documentDetail.saveSuccessTitle'), t('documentDetail.saveSuccessBody'));
    } catch {
      Alert.alert(t('documents.saveErrorTitle'), t('documentDetail.saveErrorBody'));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AppScreen nativeHeader>
      <Stack gap={4}>
        <Muted>{t('documentDetail.eyebrow')}</Muted>
        <H1>{document.title}</H1>
        <HStack className="flex-wrap gap-2">
          <CategoryBadge category={document.category} />
          {document.analysis ? <ConfidenceBadge confidence={document.analysis.confidence} /> : null}
        </HStack>
      </Stack>

      <Card>
        <Stack>
          <HStack className="justify-between">
            <Muted>{t('documents.provider')}</Muted>
            <Body className="shrink text-right font-extrabold">{document.provider ?? t('common.notSet')}</Body>
          </HStack>
          <HStack className="justify-between">
            <Muted>{t('documents.amount')}</Muted>
            <Body className="shrink text-right font-extrabold">
              {document.amount ? formatCurrency(document.amount, state.settings.currency, locale) : t('common.notSet')}
            </Body>
          </HStack>
          <HStack className="justify-between">
            <Muted>{t('documents.documentDate')}</Muted>
            <Body className="shrink text-right font-extrabold">{formatDate(document.documentDate, locale)}</Body>
          </HStack>
          <HStack className="justify-between">
            <Muted>{t('documentDetail.file')}</Muted>
            <Body className="shrink text-right font-extrabold">{document.fileName ?? t('documents.manualRecord')}</Body>
          </HStack>
          {document.fileUri ? (
            <Button variant="secondary" icon={ExternalLink} onPress={() => Linking.openURL(document.fileUri!)}>
              {t('documentDetail.openOriginal')}
            </Button>
          ) : null}
        </Stack>
      </Card>

      {document.analysis ? (
        <Card className="border-fin-primary">
          <Stack>
            <SectionHeader title={t('documentDetail.analysis')} />
            <Body>{document.analysis.summary}</Body>
            <Box className="gap-1.5 rounded-fin bg-fin-surfaceAlt p-2.5">
              <Muted>{t('common.relevantExcerpt')}</Muted>
              <Body>{document.analysis.excerpt}</Body>
            </Box>
            <Muted>
              {t('documentDetail.coveredSignals', {
                value: document.analysis.coveredRisks.join(', ') || t('documentDetail.noneDetected'),
              })}
            </Muted>
            <Muted>
              {t('documentDetail.warnings', {
                value: document.analysis.exclusions.join(', ') || t('documentDetail.noWarnings'),
              })}
            </Muted>
          </Stack>
        </Card>
      ) : null}

      <Card>
        <Stack>
          <SectionHeader title={t('documentDetail.correctMetadata')} />
          <Field
            label={t('documents.titleField')}
            value={form.title}
            onChangeText={(title) => setForm((current) => current && { ...current, title })}
          />
          <Field
            label={t('documents.provider')}
            value={form.provider}
            onChangeText={(provider) => setForm((current) => current && { ...current, provider })}
          />
          <Field
            label={t('documents.amount')}
            value={form.amount}
            onChangeText={(amount) => setForm((current) => current && { ...current, amount })}
            keyboardType="decimal-pad"
          />
          <Field
            label={t('documents.documentDate')}
            value={form.documentDate}
            onChangeText={(documentDate) => setForm((current) => current && { ...current, documentDate })}
            placeholder="YYYY-MM-DD"
          />
          <Stack gap={8}>
            <Muted>{t('documents.category')}</Muted>
            <SegmentedControl
              values={CATEGORIES}
              selected={form.category}
              onSelect={(category) => setForm((current) => current && { ...current, category })}
              getLabel={(category) => t(categoryLabelKey(category))}
            />
          </Stack>
          <Field
            label={t('documents.tags')}
            value={form.tags}
            onChangeText={(tags) => setForm((current) => current && { ...current, tags })}
          />
          <Field
            label={t('documents.notes')}
            value={form.notes}
            onChangeText={(notes) => setForm((current) => current && { ...current, notes })}
            multiline
          />
          <Button onPress={save} icon={Save} disabled={isSaving || isDeleting}>
            {isSaving ? t('documents.saving') : t('documentDetail.saveDocument')}
          </Button>
          <Button
            variant="danger"
            icon={Trash2}
            disabled={isSaving || isDeleting}
            onPress={() => {
              Alert.alert(t('documentDetail.deleteTitle'), t('documentDetail.deleteBody'), [
                { text: t('common.cancel'), style: 'cancel' },
                {
                  text: t('common.delete'),
                  style: 'destructive',
                  onPress: async () => {
                    setIsDeleting(true);
                    try {
                      setBypassGuard(true);
                      await deleteDocument(document.id);
                      if (canGoBack) {
                        router.back();
                      } else {
                        router.replace('/(tabs)/documents');
                      }
                    } catch {
                      setBypassGuard(false);
                      Alert.alert(t('documentDetail.deleteErrorTitle'), t('documentDetail.deleteErrorBody'));
                    } finally {
                      setIsDeleting(false);
                    }
                  },
                },
              ]);
            }}>
            {isDeleting ? t('documentDetail.deleting') : t('documentDetail.deleteDocument')}
          </Button>
        </Stack>
      </Card>
    </AppScreen>
  );
}
