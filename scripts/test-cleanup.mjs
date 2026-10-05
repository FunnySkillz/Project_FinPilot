import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadTs } from './test-helpers.mjs';

const { parseTags, parseMoneyInput } = loadTs('utils/form-input.ts');
const { parseLocalDate, todayString } = loadTs('utils/dates.ts');
const { rankDocuments } = loadTs('utils/document-search.ts');
const { canExtractWithCloud, hasCloudDocumentConsent } = loadTs('utils/ai-permissions.ts');
const document = (id, patch = {}) => ({
  id,
  title: 'Contract',
  category: 'Other',
  tags: [],
  createdAt: '2026-01-01',
  updatedAt: '2026-01-01',
  ...patch,
});

test('shared form inputs retain optional/tag behavior and handle German amounts', () => {
  assert.deepEqual(parseTags(' rent, , groceries ,'), ['rent', 'groceries']);
  assert.equal(parseMoneyInput('1.234,56'), 1234.56);
  assert.equal(parseMoneyInput('0'), 0);
  assert.ok(Number.isNaN(parseMoneyInput('')));
  assert.ok(Number.isNaN(parseMoneyInput('garbage')));
});

test('calendar parsing preserves local day and rejects rolled-over dates', () => {
  const local = new Date(2026, 9, 5, 0, 1);
  assert.equal(todayString(local), '2026-10-05');
  const parsed = parseLocalDate('2026-10-05');
  assert.equal(parsed.getDate(), 5);
  assert.equal(parsed.getHours(), 0);
  assert.equal(parseLocalDate('2026-02-30'), null);
  assert.equal(parseLocalDate('bad-date'), null);
});

test('shared ranking covers Unicode, excerpts, categories and deterministic ties without mutation', () => {
  const docs = [
    document('old', { title: 'Österreich Garantie' }),
    document('new', { title: 'Österreich Garantie', updatedAt: '2026-09-01' }),
  ];
  assert.deepEqual(
    rankDocuments('Österreich', docs).map(({ document }) => document.id),
    ['new', 'old'],
  );
  assert.deepEqual(
    docs.map((item) => item.id),
    ['old', 'new'],
  );
  assert.equal(rankDocuments('warranty', [document('excerpt', { analysis: { excerpt: 'warranty' } })])[0].score, 1);
  assert.equal(rankDocuments('insurance', [document('category', { category: 'Insurance' })])[0].score, 1);
  assert.equal(rankDocuments('the and for', docs)[0].score, 0);
});

test('cloud extraction settings stay stricter than document-chat consent', () => {
  for (const mode of ['off', 'native', 'hybrid', 'cloud']) {
    const ai = { cloudEnabled: true, cloudDocumentConsent: true, ocrMode: mode };
    assert.equal(hasCloudDocumentConsent(ai), true);
    assert.equal(canExtractWithCloud(ai), ['hybrid', 'cloud'].includes(mode));
    assert.equal(canExtractWithCloud({ ...ai, cloudDocumentConsent: false }), false);
    assert.equal(canExtractWithCloud({ ...ai, cloudEnabled: false }), false);
  }
});

test('preferences come from persisted settings; new defaults do not inherit hidden mutable caches', async () => {
  let stored;
  const { createEmptyState, storageService } = loadTs('services/storage-service.ts', {
    '@react-native-async-storage/async-storage': {
      default: {
        getItem: async () => stored ?? null,
        setItem: async (_key, value) => {
          stored = value;
        },
      },
    },
  });
  const custom = createEmptyState({ language: 'de', themeMode: 'dark' });
  await storageService.saveState(custom);
  const restored = await storageService.loadState();
  assert.equal(restored.settings.language, 'de');
  assert.equal(restored.settings.themeMode, 'dark');
  assert.equal(createEmptyState().settings.themeMode, 'system');
  // Stored legacy expense values must still migrate after sharing helpers.
  stored = JSON.stringify({
    ...custom,
    version: 1,
    expenses: [
      { id: 'legacy', name: 'Rent', kind: 'fixed', cadence: 'monthly', paymentMethod: 'bank-transfer', amount: 900 },
    ],
  });
  const migrated = await storageService.loadState();
  assert.equal(migrated.expenses[0].kind, 'recurring');
  assert.equal(migrated.expenses[0].paymentMethod, 'bank-transfer');
});

function contextHarness() {
  const values = [];
  let cursor = 0;
  let pickerResult = document('import');
  let saveError = false;
  let analysisError = false;
  let analyses = 0;
  let loads = 0;
  let cloudInput;
  const saves = [];
  const effects = [];
  const state = {
    version: 4,
    expenses: [],
    documents: [],
    questions: [],
    purchaseDecisions: [],
    settings: {
      language: 'en',
      themeMode: 'system',
      ai: { cloudEnabled: false, cloudDocumentConsent: false, ocrMode: 'hybrid' },
    },
  };
  const react = {
    createContext: () => ({ Provider: 'test-context' }),
    useState: (initial) => {
      const index = cursor++;
      if (!(index in values)) values[index] = typeof initial === 'function' ? initial() : initial;
      return [
        values[index],
        (next) => {
          values[index] = typeof next === 'function' ? next(values[index]) : next;
        },
      ];
    },
    useCallback: (callback) => callback,
    useMemo: (factory) => factory(),
    useEffect: (effect) => {
      effects.push(effect);
    },
  };
  const pick = async () => pickerResult;
  const { FinPilotProvider } = loadTs('context/finpilot-context.tsx', {
    react,
    '@/services/storage-service': {
      createEmptyState: () => structuredClone(state),
      storageService: {
        saveState: async (next) => {
          if (saveError) throw new Error('disk');
          saves.push(structuredClone(next));
        },
        loadState: async () => {
          loads++;
          return structuredClone(state);
        },
      },
    },
    '@/services/document-service': { documentService: { pickDocument: pick, pickImage: pick, scanDocument: pick } },
    '@/services/ocr-service': {
      ocrService: {
        analyzeDocument: async () => {
          analyses++;
          if (analysisError) throw new Error('analysis');
          return { extractedText: 'text', analysis: {} };
        },
      },
    },
    '@/services/ai-gateway-service': {
      aiGatewayService: {
        answerQuestion: async (input) => {
          cloudInput = input;
          return { answer: 'cloud answer', confidence: 'low', excerpt: '', recommendation: '' };
        },
      },
    },
    '@/services/assistant-service': { assistantService: { answerQuestion: () => ({ id: 'local', answer: 'local' }) } },
    '@/services/purchase-service': { purchaseService: {} },
    '@/services/pin-auth': { pinAuthService: {} },
  });
  const render = () => {
    cursor = 0;
    return FinPilotProvider({ children: null }).props.value;
  };
  return {
    render,
    saves,
    effects,
    values,
    setPicker: (value) => {
      pickerResult = value;
    },
    failSave: (value) => {
      saveError = value;
    },
    failAnalysis: (value) => {
      analysisError = value;
    },
    get analyses() {
      return analyses;
    },
    get loads() {
      return loads;
    },
    get cloudInput() {
      return cloudInput;
    },
  };
}

test('all three document actions share cancel, analyze and persist semantics', async () => {
  const h = contextHarness();
  const actions = ['pickAndAddDocument', 'importPhotoAndAddDocument', 'scanAndAddDocument'];
  h.setPicker(null);
  for (const action of actions) assert.equal(await h.render()[action](), null);
  assert.equal(h.analyses, 0);
  assert.equal(h.saves.length, 0);
  for (const [index, action] of actions.entries()) {
    h.setPicker(document('doc-' + index));
    const added = await h.render()[action]();
    assert.equal(added.extractedText, 'text');
  }
  assert.equal(h.render().state.documents.length, 3);
  assert.equal(h.analyses, 3);
  assert.equal(h.saves.length, 3);
});

test('failed document analysis/save does not publish a partially imported document', async () => {
  const h = contextHarness();
  h.failAnalysis(true);
  await assert.rejects(() => h.render().pickAndAddDocument());
  assert.equal(h.saves.length, 0);
  h.failAnalysis(false);
  h.failSave(true);
  await assert.rejects(() => h.render().scanAndAddDocument());
  assert.equal(h.render().state.documents.length, 0);
  h.failSave(false);
  await h.render().scanAndAddDocument();
  assert.equal(h.render().state.documents.length, 1);
});

test('single and batch expense insertion share atomic persistence and retry behavior', async () => {
  const h = contextHarness();
  const expense = {
    name: 'Rent',
    amount: 900,
    kind: 'recurring',
    cadence: 'monthly',
    category: 'Housing',
    startDate: '2026-10-01',
    tags: [],
  };
  await h.render().addExpense(expense);
  h.failSave(true);
  await assert.rejects(() => h.render().addExpenses([expense, expense]));
  assert.equal(h.render().state.expenses.length, 1);
  h.failSave(false);
  await h.render().addExpenses([expense, expense]);
  assert.equal(h.render().state.expenses.length, 3);
  assert.equal(h.saves.length, 2);
});

test('cloud snippets use the shared ranker and keep payload limits', async () => {
  const h = contextHarness();
  await h.render().updateSettings({ ai: { cloudEnabled: true, cloudDocumentConsent: true } });
  h.values[0].documents = Array.from({ length: 7 }, (_, index) =>
    document(String(index), {
      title: 'warranty',
      extractedText: 'a'.repeat(5000),
      updatedAt: '2026-10-0' + (index + 1),
    }),
  );
  await h.render().answerQuestion('warranty');
  assert.equal(h.cloudInput.documents.length, 5);
  assert.equal(h.cloudInput.documents[0].id, '6');
  assert.equal(h.cloudInput.documents[0].extractedText.length, 4000);
});

test('initial load and retry share state loading; unmounted initial load does not publish', async () => {
  const h = contextHarness();
  h.render();
  const cleanup = h.effects[0]();
  cleanup();
  await Promise.resolve();
  assert.equal(h.loads, 1);
  assert.equal(h.render().isLoading, true);
  await h.render().retryLoad();
  assert.equal(h.loads, 2);
  assert.equal(h.render().isLoading, false);
});
