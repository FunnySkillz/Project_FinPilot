import { useMemo, useState } from 'react';
import { Alert } from 'react-native';
import { Plus, Save, Trash2 } from 'lucide-react-native';

import { AppScreen, Stack } from '@/components/finpilot/app-screen';
import { Card, SectionHeader } from '@/components/finpilot/card';
import { Button, Field, SegmentedControl } from '@/components/finpilot/controls';
import { ExpenseCard } from '@/components/finpilot/list-cards';
import { Body, H1, Muted } from '@/components/finpilot/text';
import { Box, Pressable } from '@/components/ui/gluestack';
import { useFinPilot } from '@/context/finpilot-context';
import { useLanguage } from '@/context/language-context';
import { useUnsavedChangesGuard } from '@/hooks/use-unsaved-changes-guard';
import { categoryLabelKey } from '@/i18n';
import type { Category, Expense, ExpenseCadence, ExpenseInput, ExpenseKind, PaymentMethod } from '@/types/finpilot';
import { CADENCES, CATEGORIES, EXPENSE_KINDS, PAYMENT_METHODS, calculateFinanceSummary } from '@/utils/finance';
import { formatCurrency } from '@/utils/formatters';

type ExpenseKindFilter = ExpenseKind | 'all';
type PaymentMethodOption = PaymentMethod | 'none';

type ExpenseForm = {
  name: string;
  amount: string;
  kind: ExpenseKind;
  cadence: ExpenseCadence;
  category: Category;
  startDate: string;
  endDate: string;
  merchant: string;
  paymentMethod: PaymentMethodOption;
  tags: string;
  notes: string;
  linkedDocumentId?: string;
};

const PAYMENT_METHOD_OPTIONS: PaymentMethodOption[] = ['none', ...PAYMENT_METHODS];
const EXPENSE_KIND_FILTERS: ExpenseKindFilter[] = ['all', ...EXPENSE_KINDS];
const CATEGORY_FILTERS: (Category | 'All')[] = ['All', ...CATEGORIES];

function todayString() {
  return new Date().toISOString().slice(0, 10);
}

function createEmptyForm(kind: ExpenseKind = 'recurring'): ExpenseForm {
  return {
    name: '',
    amount: '',
    kind,
    cadence: 'monthly',
    category: 'Other',
    startDate: todayString(),
    endDate: '',
    merchant: '',
    paymentMethod: 'none',
    tags: '',
    notes: '',
  };
}

function formFromExpense(expense: Expense): ExpenseForm {
  return {
    name: expense.name,
    amount: String(expense.amount),
    kind: expense.kind,
    cadence: expense.cadence ?? 'monthly',
    category: expense.category,
    startDate: expense.startDate,
    endDate: expense.endDate ?? '',
    merchant: expense.merchant ?? '',
    paymentMethod: expense.paymentMethod ?? 'none',
    tags: expense.tags.join(', '),
    notes: expense.notes ?? '',
    linkedDocumentId: expense.linkedDocumentId,
  };
}

function parseTags(value: string) {
  return value
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean);
}

function paymentMethodLabelKey(paymentMethod: PaymentMethodOption) {
  return paymentMethod === 'none' ? 'expenses.payment.none' : (`expenses.payment.${paymentMethod}` as const);
}

function cadenceLabelKey(cadence: ExpenseCadence) {
  return `expenses.cadence.${cadence}` as const;
}

function kindLabelKey(kind: ExpenseKind) {
  return kind === 'recurring' ? 'expenses.recurring' : 'expenses.oneOff';
}

function matchesSearch(expense: Expense, query: string) {
  if (!query) {
    return true;
  }

  return [expense.name, expense.merchant, expense.notes, ...expense.tags]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
    .includes(query);
}

export default function ExpensesScreen() {
  const { state, addExpense, updateExpense, deleteExpense } = useFinPilot();
  const { locale, t } = useLanguage();
  const [selectedKind, setSelectedKind] = useState<ExpenseKindFilter>('all');
  const [selectedCategory, setSelectedCategory] = useState<Category | 'All'>('All');
  const [query, setQuery] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | undefined>();
  const [form, setForm] = useState<ExpenseForm>(() => createEmptyForm());
  const [isSaving, setIsSaving] = useState(false);
  const hasUnsavedChanges =
    showForm &&
    Boolean(
      editingId ||
        form.name ||
        form.amount ||
        form.merchant ||
        form.tags ||
        form.notes ||
        form.linkedDocumentId,
    );

  useUnsavedChangesGuard(hasUnsavedChanges);

  const filteredExpenses = useMemo(() => {
    const cleanQuery = query.trim().toLowerCase();

    return state.expenses.filter((expense) => {
      const matchesKind = selectedKind === 'all' || expense.kind === selectedKind;
      const matchesCategory = selectedCategory === 'All' || expense.category === selectedCategory;

      return matchesKind && matchesCategory && matchesSearch(expense, cleanQuery);
    });
  }, [query, selectedCategory, selectedKind, state.expenses]);
  const summary = calculateFinanceSummary(filteredExpenses, state.settings.monthlyIncome);

  const resetForm = (kind: ExpenseKind = 'recurring') => {
    setEditingId(undefined);
    setForm(createEmptyForm(kind));
  };

  const submit = async () => {
    if (isSaving) {
      return;
    }

    const amount = Number(form.amount.replace(',', '.'));
    const hasValidAmount = Number.isFinite(amount) && amount > 0;
    const hasDate = Boolean(form.startDate.trim());
    const hasCadence = Boolean(form.cadence);

    if (!form.name.trim() || !hasValidAmount || !form.category || !hasDate) {
      Alert.alert(t('expenses.validationTitle'), t('expenses.validationBody'));
      return;
    }

    if (form.kind === 'recurring' && !hasCadence) {
      Alert.alert(t('expenses.validationTitle'), t('expenses.validationRecurring'));
      return;
    }

    if (form.kind === 'one-off' && !hasDate) {
      Alert.alert(t('expenses.validationTitle'), t('expenses.validationOneOff'));
      return;
    }

    const input: ExpenseInput = {
      name: form.name.trim(),
      amount,
      kind: form.kind,
      ...(form.kind === 'recurring'
        ? { cadence: form.cadence, endDate: form.endDate || undefined }
        : { cadence: undefined, endDate: undefined }),
      category: form.category,
      startDate: form.startDate.trim(),
      merchant: form.merchant.trim() || undefined,
      paymentMethod: form.paymentMethod === 'none' ? undefined : form.paymentMethod,
      tags: parseTags(form.tags),
      notes: form.notes.trim() || undefined,
      linkedDocumentId: form.linkedDocumentId,
    };

    setIsSaving(true);
    try {
      if (editingId) {
        await updateExpense(editingId, input);
      } else {
        await addExpense(input);
      }

      resetForm();
      setShowForm(false);
    } catch {
      Alert.alert(t('expenses.saveErrorTitle'), t('expenses.saveErrorBody'));
    } finally {
      setIsSaving(false);
    }
  };

  const startEditing = (expense: Expense) => {
    setEditingId(expense.id);
    setForm(formFromExpense(expense));
    setShowForm(true);
  };

  const toggleForm = () => {
    if (!showForm) {
      resetForm(selectedKind === 'one-off' ? 'one-off' : 'recurring');
    } else {
      resetForm();
    }

    setShowForm((current) => !current);
  };

  return (
    <AppScreen>
      <Stack gap={4}>
        <Muted>{t('expenses.eyebrow')}</Muted>
        <H1>{t('expenses.title')}</H1>
        <Body>{t('expenses.body')}</Body>
      </Stack>

      <Box className="flex-row flex-wrap gap-2.5">
        <Card className="min-w-[150px] flex-1">
          <Muted>{t('expenses.monthlyLoad')}</Muted>
          <Body className="text-2xl font-extrabold leading-[30px]">
            {formatCurrency(summary.recurringMonthlyLoad, state.settings.currency, locale)}
          </Body>
        </Card>
        <Card className="min-w-[150px] flex-1">
          <Muted>{t('expenses.oneOffMonthlySpending')}</Muted>
          <Body className="text-2xl font-extrabold leading-[30px]">
            {formatCurrency(summary.oneOffMonthlySpending, state.settings.currency, locale)}
          </Body>
        </Card>
        <Card className="min-w-[150px] flex-1">
          <Muted>{t('expenses.records')}</Muted>
          <Body className="text-2xl font-extrabold leading-[30px]">{filteredExpenses.length}</Body>
        </Card>
      </Box>

      <SectionHeader
        title={t('expenses.expenseList')}
        actionLabel={showForm ? t('expenses.close') : t('expenses.add')}
        onAction={toggleForm}
      />

      {showForm ? (
        <Card>
          <Stack>
            <Stack gap={8}>
              <Muted>{t('expenses.kind')}</Muted>
              <SegmentedControl
                values={EXPENSE_KINDS}
                selected={form.kind}
                onSelect={(kind) =>
                  setForm((current) => ({
                    ...current,
                    kind,
                    endDate: kind === 'one-off' ? '' : current.endDate,
                  }))
                }
                getLabel={(kind) => t(kindLabelKey(kind))}
              />
            </Stack>
            <Field
              label={t('expenses.name')}
              value={form.name}
              onChangeText={(name) => setForm((current) => ({ ...current, name }))}
              placeholder={t('expenses.namePlaceholder')}
            />
            <Field
              label={t('expenses.amount')}
              value={form.amount}
              onChangeText={(amount) => setForm((current) => ({ ...current, amount }))}
              keyboardType="decimal-pad"
              placeholder="23"
            />
            <Stack gap={8}>
              <Muted>{t('expenses.category')}</Muted>
              <SegmentedControl
                values={CATEGORIES}
                selected={form.category}
                onSelect={(category) => setForm((current) => ({ ...current, category }))}
                getLabel={(category) => t(categoryLabelKey(category))}
              />
            </Stack>
            {form.kind === 'recurring' ? (
              <Stack gap={8}>
                <Muted>{t('expenses.cadence')}</Muted>
                <SegmentedControl
                  values={CADENCES}
                  selected={form.cadence}
                  onSelect={(cadence) => setForm((current) => ({ ...current, cadence }))}
                  getLabel={(cadence) => t(cadenceLabelKey(cadence))}
                />
              </Stack>
            ) : null}
            <Field
              label={form.kind === 'recurring' ? t('expenses.startDate') : t('expenses.date')}
              value={form.startDate}
              onChangeText={(startDate) => setForm((current) => ({ ...current, startDate }))}
              placeholder="YYYY-MM-DD"
            />
            {form.kind === 'recurring' ? (
              <Field
                label={t('expenses.endDate')}
                value={form.endDate}
                onChangeText={(endDate) => setForm((current) => ({ ...current, endDate }))}
                placeholder="YYYY-MM-DD"
              />
            ) : null}
            <Field
              label={t('expenses.merchant')}
              value={form.merchant}
              onChangeText={(merchant) => setForm((current) => ({ ...current, merchant }))}
              placeholder={t('expenses.merchantPlaceholder')}
            />
            <Stack gap={8}>
              <Muted>{t('expenses.paymentMethod')}</Muted>
              <SegmentedControl
                values={PAYMENT_METHOD_OPTIONS}
                selected={form.paymentMethod}
                onSelect={(paymentMethod) => setForm((current) => ({ ...current, paymentMethod }))}
                getLabel={(paymentMethod) => t(paymentMethodLabelKey(paymentMethod))}
              />
            </Stack>
            <Field
              label={t('expenses.tags')}
              value={form.tags}
              onChangeText={(tags) => setForm((current) => ({ ...current, tags }))}
              placeholder={t('expenses.tagsPlaceholder')}
              helper={t('expenses.tagsHelper')}
            />
            <Stack gap={8}>
              <Muted>{t('expenses.linkedDocument')}</Muted>
              <Box className="flex-row flex-wrap gap-2">
                <Pressable
                  onPress={() => setForm((current) => ({ ...current, linkedDocumentId: undefined }))}
                  className={`rounded-fin border px-2.5 py-2 ${
                    !form.linkedDocumentId ? 'border-fin-primary bg-fin-primary' : 'border-fin-border'
                  }`}>
                  <Body className={`text-xs ${!form.linkedDocumentId ? 'font-extrabold text-fin-textOnPrimary' : ''}`}>
                    {t('expenses.none')}
                  </Body>
                </Pressable>
                {state.documents.slice(0, 8).map((document) => {
                  const active = form.linkedDocumentId === document.id;
                  return (
                    <Pressable
                      key={document.id}
                      onPress={() => setForm((current) => ({ ...current, linkedDocumentId: document.id }))}
                      className={`rounded-fin border px-2.5 py-2 ${
                        active ? 'border-fin-primary bg-fin-primary' : 'border-fin-border'
                      }`}>
                      <Body className={`text-xs ${active ? 'font-extrabold text-fin-textOnPrimary' : ''}`}>
                        {document.title}
                      </Body>
                    </Pressable>
                  );
                })}
              </Box>
            </Stack>
            <Field
              label={t('expenses.notes')}
              value={form.notes}
              onChangeText={(notes) => setForm((current) => ({ ...current, notes }))}
              multiline
              placeholder={t('expenses.notesPlaceholder')}
            />
            <Button onPress={submit} icon={editingId ? Save : Plus} disabled={isSaving}>
              {isSaving ? t('expenses.saving') : editingId ? t('expenses.saveExpense') : t('expenses.addExpense')}
            </Button>
            {editingId ? (
              <Button
                variant="danger"
                icon={Trash2}
                disabled={isSaving}
                onPress={async () => {
                  setIsSaving(true);
                  try {
                    await deleteExpense(editingId);
                    resetForm();
                    setShowForm(false);
                  } catch {
                    Alert.alert(t('expenses.deleteErrorTitle'), t('expenses.deleteErrorBody'));
                  } finally {
                    setIsSaving(false);
                  }
                }}>
                {t('expenses.deleteExpense')}
              </Button>
            ) : null}
          </Stack>
        </Card>
      ) : null}

      <Field
        label={t('expenses.search')}
        value={query}
        onChangeText={setQuery}
        placeholder={t('expenses.searchPlaceholder')}
      />

      <Stack gap={8}>
        <Muted>{t('expenses.filterType')}</Muted>
        <SegmentedControl
          values={EXPENSE_KIND_FILTERS}
          selected={selectedKind}
          onSelect={(kind) => setSelectedKind(kind)}
          getLabel={(kind) => (kind === 'all' ? t('expenses.all') : t(kindLabelKey(kind)))}
        />
      </Stack>

      <Stack gap={8}>
        <Muted>{t('expenses.filterCategory')}</Muted>
        <SegmentedControl
          values={CATEGORY_FILTERS}
          selected={selectedCategory}
          onSelect={(category) => setSelectedCategory(category)}
          getLabel={(category) => (category === 'All' ? t('expenses.all') : t(categoryLabelKey(category)))}
        />
      </Stack>

      <Stack>
        {filteredExpenses.length === 0 ? (
          <Card>
            <Muted>{t('expenses.empty')}</Muted>
          </Card>
        ) : (
          filteredExpenses.map((expense) => (
            <ExpenseCard key={expense.id} expense={expense} onPress={() => startEditing(expense)} />
          ))
        )}
      </Stack>
    </AppScreen>
  );
}
