import { useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';

import { AppScreen, Stack } from '@/components/finpilot/app-screen';
import { CategoryBadge } from '@/components/finpilot/badges';
import { Card, SectionHeader } from '@/components/finpilot/card';
import { Button, Field, SegmentedControl } from '@/components/finpilot/controls';
import { ExpenseCard } from '@/components/finpilot/list-cards';
import { Body, H1, Muted } from '@/components/finpilot/text';
import { FinPilotColors } from '@/constants/finpilot';
import { useFinPilot } from '@/context/finpilot-context';
import type { Category, Expense, ExpenseCadence, ExpenseInput, ExpenseKind } from '@/types/finpilot';
import { CADENCES, CATEGORIES, EXPENSE_KINDS, monthlyRecurringExpense } from '@/utils/finance';
import { formatCurrency } from '@/utils/formatters';

type ExpenseForm = {
  name: string;
  amount: string;
  cadence: ExpenseCadence;
  category: Category;
  kind: ExpenseKind;
  startDate: string;
  endDate: string;
  notes: string;
  linkedDocumentId?: string;
};

const emptyForm: ExpenseForm = {
  name: '',
  amount: '',
  cadence: 'monthly',
  category: 'Other',
  kind: 'fixed',
  startDate: new Date().toISOString().slice(0, 10),
  endDate: '',
  notes: '',
};

function formFromExpense(expense: Expense): ExpenseForm {
  return {
    name: expense.name,
    amount: String(expense.amount),
    cadence: expense.cadence,
    category: expense.category,
    kind: expense.kind,
    startDate: expense.startDate,
    endDate: expense.endDate ?? '',
    notes: expense.notes ?? '',
    linkedDocumentId: expense.linkedDocumentId,
  };
}

export default function ExpensesScreen() {
  const { state, addExpense, updateExpense, deleteExpense } = useFinPilot();
  const [selectedCategory, setSelectedCategory] = useState<Category | 'All'>('All');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | undefined>();
  const [form, setForm] = useState<ExpenseForm>(emptyForm);

  const filteredExpenses = useMemo(
    () =>
      selectedCategory === 'All'
        ? state.expenses
        : state.expenses.filter((expense) => expense.category === selectedCategory),
    [selectedCategory, state.expenses],
  );
  const monthlyTotal = filteredExpenses.reduce((sum, expense) => sum + monthlyRecurringExpense(expense), 0);

  const submit = async () => {
    const amount = Number(form.amount.replace(',', '.'));
    if (!form.name.trim() || !Number.isFinite(amount) || amount <= 0) {
      Alert.alert('Missing information', 'Add a name and a positive amount.');
      return;
    }

    const input: ExpenseInput = {
      name: form.name.trim(),
      amount,
      cadence: form.cadence,
      category: form.category,
      kind: form.kind,
      startDate: form.startDate || new Date().toISOString().slice(0, 10),
      endDate: form.endDate || undefined,
      notes: form.notes.trim() || undefined,
      linkedDocumentId: form.linkedDocumentId,
    };

    if (editingId) {
      await updateExpense(editingId, input);
    } else {
      await addExpense(input);
    }

    setEditingId(undefined);
    setForm(emptyForm);
    setShowForm(false);
  };

  const startEditing = (expense: Expense) => {
    setEditingId(expense.id);
    setForm(formFromExpense(expense));
    setShowForm(true);
  };

  return (
    <AppScreen>
      <Stack gap={4}>
        <Muted>Manual tracking</Muted>
        <H1>Expenses</H1>
        <Body>Track recurring pressure first. OCR and bank automation can plug into this model later.</Body>
      </Stack>

      <View style={styles.summaryRow}>
        <Card style={styles.summaryCard}>
          <Muted>Visible monthly load</Muted>
          <Body style={styles.summaryValue}>{formatCurrency(monthlyTotal)}</Body>
        </Card>
        <Card style={styles.summaryCard}>
          <Muted>Expense records</Muted>
          <Body style={styles.summaryValue}>{filteredExpenses.length}</Body>
        </Card>
      </View>

      <SectionHeader
        title="Expense list"
        actionLabel={showForm ? 'Close' : 'Add'}
        onAction={() => {
          setEditingId(undefined);
          setForm(emptyForm);
          setShowForm((current) => !current);
        }}
      />

      {showForm ? (
        <Card>
          <Stack>
            <Field
              label="Name"
              value={form.name}
              onChangeText={(name) => setForm((current) => ({ ...current, name }))}
              placeholder="ARAG Rechtsschutz"
            />
            <Field
              label="Amount"
              value={form.amount}
              onChangeText={(amount) => setForm((current) => ({ ...current, amount }))}
              keyboardType="decimal-pad"
              placeholder="23"
            />
            <Stack gap={8}>
              <Muted>Cadence</Muted>
              <SegmentedControl
                values={CADENCES}
                selected={form.cadence}
                onSelect={(cadence) => setForm((current) => ({ ...current, cadence }))}
              />
            </Stack>
            <Stack gap={8}>
              <Muted>Kind</Muted>
              <SegmentedControl
                values={EXPENSE_KINDS}
                selected={form.kind}
                onSelect={(kind) => setForm((current) => ({ ...current, kind }))}
              />
            </Stack>
            <Stack gap={8}>
              <Muted>Category</Muted>
              <SegmentedControl
                values={CATEGORIES}
                selected={form.category}
                onSelect={(category) => setForm((current) => ({ ...current, category }))}
              />
            </Stack>
            <Field
              label="Start date"
              value={form.startDate}
              onChangeText={(startDate) => setForm((current) => ({ ...current, startDate }))}
              placeholder="YYYY-MM-DD"
            />
            <Field
              label="End date or cancellation deadline"
              value={form.endDate}
              onChangeText={(endDate) => setForm((current) => ({ ...current, endDate }))}
              placeholder="YYYY-MM-DD"
            />
            <Field
              label="Notes"
              value={form.notes}
              onChangeText={(notes) => setForm((current) => ({ ...current, notes }))}
              multiline
              placeholder="Coverage notes, cancellation terms, or context"
            />
            <Stack gap={8}>
              <Muted>Linked document</Muted>
              <View style={styles.documentChips}>
                <Pressable
                  onPress={() => setForm((current) => ({ ...current, linkedDocumentId: undefined }))}
                  style={[styles.documentChip, !form.linkedDocumentId && styles.activeDocumentChip]}>
                  <Body style={!form.linkedDocumentId ? styles.activeDocumentText : styles.documentText}>None</Body>
                </Pressable>
                {state.documents.slice(0, 8).map((document) => {
                  const active = form.linkedDocumentId === document.id;
                  return (
                    <Pressable
                      key={document.id}
                      onPress={() => setForm((current) => ({ ...current, linkedDocumentId: document.id }))}
                      style={[styles.documentChip, active && styles.activeDocumentChip]}>
                      <Body style={active ? styles.activeDocumentText : styles.documentText}>{document.title}</Body>
                    </Pressable>
                  );
                })}
              </View>
            </Stack>
            <Button onPress={submit} icon={editingId ? 'save' : 'add'}>
              {editingId ? 'Save expense' : 'Add expense'}
            </Button>
            {editingId ? (
              <Button
                variant="danger"
                icon="delete"
                onPress={async () => {
                  await deleteExpense(editingId);
                  setEditingId(undefined);
                  setShowForm(false);
                  setForm(emptyForm);
                }}>
                Delete expense
              </Button>
            ) : null}
          </Stack>
        </Card>
      ) : null}

      <Stack gap={8}>
        <Muted>Filter</Muted>
        <SegmentedControl
          values={['All', ...CATEGORIES]}
          selected={selectedCategory}
          onSelect={(category) => setSelectedCategory(category)}
        />
      </Stack>

      <Stack>
        {filteredExpenses.length === 0 ? (
          <Card>
            <Muted>No expenses in this filter yet.</Muted>
          </Card>
        ) : (
          filteredExpenses.map((expense) => (
            <View key={expense.id} style={styles.expenseWrap}>
              <ExpenseCard expense={expense} onPress={() => startEditing(expense)} />
              <CategoryBadge category={expense.category} />
            </View>
          ))
        )}
      </Stack>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  summaryRow: {
    flexDirection: 'row',
    gap: 10,
  },
  summaryCard: {
    flex: 1,
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: '800',
    lineHeight: 30,
  },
  documentChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  documentChip: {
    borderColor: FinPilotColors.border,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  activeDocumentChip: {
    backgroundColor: FinPilotColors.primary,
    borderColor: FinPilotColors.primary,
  },
  documentText: {
    fontSize: 12,
  },
  activeDocumentText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  expenseWrap: {
    gap: 8,
  },
});

