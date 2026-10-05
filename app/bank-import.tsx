import { canExtractWithCloud } from '@/utils/ai-permissions';
import { useEffect, useRef, useState } from 'react';
import { Alert, Platform } from 'react-native';
import { router } from 'expo-router';
import { usePreventRemove } from '@react-navigation/native';
import { AppScreen, Stack } from '@/components/finpilot/app-screen';
import { Card } from '@/components/finpilot/card';
import { Button, Field, SegmentedControl } from '@/components/finpilot/controls';
import { Body, H1, Muted } from '@/components/finpilot/text';
import { useFinPilot } from '@/context/finpilot-context';
import { useLanguage } from '@/context/language-context';
import { categoryLabelKey, cadenceLabelKey, kindLabelKey, type TranslationKey } from '@/i18n';
import {
  BankImportError,
  extractBankTransactions,
  selectBankFile,
  type BankFile,
} from '@/services/bank-import-service';
import {
  draftExpense,
  possibleDuplicate,
  transactionDraft,
  validDraft,
  type TransactionDraft,
} from '@/utils/bank-import';
import { CADENCES, CATEGORIES, EXPENSE_KINDS } from '@/utils/finance';
import { formatCurrency } from '@/utils/formatters';

export default function BankImportScreen() {
  const { state, addExpenses } = useFinPilot();
  const { language, locale, t } = useLanguage();
  const [file, setFile] = useState<BankFile | null>(null);
  const [drafts, setDrafts] = useState<TransactionDraft[]>([]);
  const [index, setIndex] = useState(0);
  const [busy, setBusy] = useState(false);
  const lock = useRef(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const [discard, setDiscard] = useState(false);
  const ai = state.settings.ai;
  const cloudReady = canExtractWithCloud(ai);
  const currency = state.settings.currency;
  const draft = drafts[index];
  const confirmed = drafts.filter((item) => item.decision === 'confirmed');
  const summary = drafts.length > 0 && index === drafts.length;

  usePreventRemove(!done && !discard && (drafts.length > 0 || busy), () => {
    if (lock.current) return;
    if (Platform.OS === 'web') {
      if (window.confirm(t('forms.discardBody'))) setDiscard(true);
    } else {
      Alert.alert(t('forms.discardTitle'), t('forms.discardBody'), [
        { text: t('forms.keepEditing'), style: 'cancel' },
        { text: t('forms.discard'), style: 'destructive', onPress: () => setDiscard(true) },
      ]);
    }
  });
  useEffect(() => {
    if (done) router.dismissTo('/(tabs)');
    else if (discard) router.back();
  }, [done, discard]);

  const select = async (source: 'file' | 'photo' | 'paste') => {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setError('');
    try {
      const picked = await selectBankFile(source);
      if (picked) setFile(picked);
    } catch (e) {
      setError(e instanceof BankImportError ? t(('bankImport.' + e.message) as TranslationKey) : t('bankImport.error'));
    } finally {
      lock.current = false;
      setBusy(false);
    }
  };
  const extract = async () => {
    if (!file || lock.current || !cloudReady) return;
    lock.current = true;
    setBusy(true);
    setError('');
    try {
      const result = await extractBankTransactions(file, language, ai, true);
      if (!Array.isArray(result.transactions)) throw new Error('Invalid response');
      if (!result.transactions.length) setError(t('bankImport.empty'));
      else {
        setDrafts(result.transactions.map(transactionDraft));
        setIndex(0);
      }
    } catch (e) {
      setError(e instanceof BankImportError ? t(('bankImport.' + e.message) as TranslationKey) : t('bankImport.error'));
    } finally {
      lock.current = false;
      setBusy(false);
    }
  };
  const edit = (patch: Partial<TransactionDraft>) => {
    setDrafts((current) => current.map((item, i) => (i === index ? { ...item, ...patch, decision: 'pending' } : item)));
    setError('');
  };
  const decide = (decision: 'confirmed' | 'skipped') => {
    if (decision === 'confirmed' && !validDraft(draft, currency)) {
      setError(t('bankImport.validation'));
      return;
    }
    setDrafts((current) => current.map((item, i) => (i === index ? { ...item, decision } : item)));
    setError('');
    setIndex(index + 1);
  };
  const save = async () => {
    if (lock.current) return;
    const invalid = drafts.findIndex(
      (item) => item.decision === 'pending' || (item.decision === 'confirmed' && !validDraft(item, currency)),
    );
    if (invalid >= 0) {
      setIndex(invalid);
      setError(t('bankImport.validation'));
      return;
    }
    lock.current = true;
    setBusy(true);
    setError('');
    try {
      if (confirmed.length) await addExpenses(confirmed.map(draftExpense));
      setDone(true);
    } catch {
      setError(t('bankImport.savedError'));
    } finally {
      lock.current = false;
      setBusy(false);
    }
  };
  const duplicate =
    draft &&
    possibleDuplicate(draft, [
      ...state.expenses,
      ...drafts.filter((item, i) => i !== index && item.decision === 'confirmed').map(draftExpense),
    ]);

  return (
    <AppScreen key={index} nativeHeader>
      <H1>{t('bankImport.title')}</H1>
      {error ? (
        <Card>
          <Body>{error}</Body>
        </Card>
      ) : null}
      {!drafts.length ? (
        <>
          <Body>{t('bankImport.intro')}</Body>
          <Card>
            <Stack>
              <Button disabled={busy} onPress={() => select('file')}>
                {t('bankImport.file')}
              </Button>
              <Button variant="secondary" disabled={busy} onPress={() => select('photo')}>
                {t('bankImport.photo')}
              </Button>
              <Button variant="secondary" disabled={busy} onPress={() => select('paste')}>
                {t('bankImport.paste')}
              </Button>
              <Muted>{t('bankImport.limit')}</Muted>
            </Stack>
          </Card>
          {file ? (
            <Card>
              <Stack>
                <Body>{file.name}</Body>
                <Body>{t('bankImport.privacy')}</Body>
                {!cloudReady ? (
                  <>
                    <Muted>{t('bankImport.setup')}</Muted>
                    <Button variant="secondary" onPress={() => router.push('/(tabs)/settings/ai')}>
                      {t('bankImport.settings')}
                    </Button>
                  </>
                ) : null}
                <Button disabled={busy || !cloudReady} onPress={extract}>
                  {t(busy ? 'bankImport.reading' : 'bankImport.upload')}
                </Button>
              </Stack>
            </Card>
          ) : null}
        </>
      ) : summary ? (
        <Card>
          <Stack>
            <H1>{t('bankImport.summary')}</H1>
            <Body>
              {t('bankImport.counts', { confirmed: confirmed.length, skipped: drafts.length - confirmed.length })}
            </Body>
            {confirmed.map((item, i) => (
              <Body key={i}>
                {item.name} · {formatCurrency(draftExpense(item).amount, currency, locale)} · {item.date}
              </Body>
            ))}
            <Button disabled={busy} onPress={save}>
              {busy
                ? t('expenses.saving')
                : confirmed.length
                  ? t('bankImport.save', { count: confirmed.length })
                  : t('bankImport.finish')}
            </Button>
            <Button
              variant="secondary"
              disabled={busy}
              onPress={() => {
                setIndex(0);
                setError('');
              }}
            >
              {t('bankImport.review')}
            </Button>
          </Stack>
        </Card>
      ) : draft ? (
        <>
          <Body>{t('bankImport.step', { current: index + 1, total: drafts.length })}</Body>
          <Muted>{file?.name}</Muted>
          {duplicate ? (
            <Card>
              <Body>{t('bankImport.duplicate')}</Body>
            </Card>
          ) : null}
          <Card>
            <Stack>
              <Muted>{t('bankImport.source')}</Muted>
              <Body>{draft.source}</Body>
              <Field label={t('expenses.name')} value={draft.name} onChangeText={(name) => edit({ name })} />
              <Field
                label={t('expenses.merchant')}
                value={draft.merchant}
                onChangeText={(merchant) => edit({ merchant })}
              />
              <Field
                label={t('expenses.amount')}
                value={draft.amount}
                keyboardType="decimal-pad"
                onChangeText={(amount) => edit({ amount })}
              />
              <Field
                label={t('expenses.date')}
                value={draft.date}
                placeholder="YYYY-MM-DD"
                onChangeText={(date) => edit({ date })}
              />
              <Field
                label={t('bankImport.currency')}
                value={draft.currency}
                autoCapitalize="characters"
                maxLength={3}
                onChangeText={(value) => edit({ currency: value.toUpperCase() })}
              />
              <Muted>{t('bankImport.currencyNote', { currency })}</Muted>
              <Muted>{t('bankImport.direction')}</Muted>
              <SegmentedControl
                values={['debit', 'credit', 'unknown']}
                selected={draft.direction}
                onSelect={(direction) => edit({ direction })}
                getLabel={(value) => t(('bankImport.' + value) as TranslationKey)}
              />
              {draft.direction !== 'debit' ? <Muted>{t('bankImport.directionNote')}</Muted> : null}
              <Muted>{t('expenses.category')}</Muted>
              <SegmentedControl
                values={CATEGORIES}
                selected={draft.category}
                onSelect={(category) => edit({ category })}
                getLabel={(value) => t(categoryLabelKey(value))}
              />
              <Muted>{t('expenses.kind')}</Muted>
              <SegmentedControl
                values={EXPENSE_KINDS}
                selected={draft.kind}
                onSelect={(kind) => edit({ kind })}
                getLabel={(value) => t(kindLabelKey(value))}
              />
              {draft.kind === 'recurring' ? (
                <SegmentedControl
                  values={CADENCES}
                  selected={draft.cadence}
                  onSelect={(cadence) => edit({ cadence })}
                  getLabel={(value) => t(cadenceLabelKey(value))}
                />
              ) : null}
              <Button onPress={() => decide('confirmed')}>{t('bankImport.confirm')}</Button>
              <Button variant="secondary" onPress={() => decide('skipped')}>
                {t('bankImport.skip')}
              </Button>
              {index > 0 ? (
                <Button
                  variant="ghost"
                  onPress={() => {
                    setIndex(index - 1);
                    setError('');
                  }}
                >
                  {t('bankImport.back')}
                </Button>
              ) : null}
            </Stack>
          </Card>
        </>
      ) : null}
    </AppScreen>
  );
}
