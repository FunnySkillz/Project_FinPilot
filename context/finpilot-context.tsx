import { hasCloudDocumentConsent } from '@/utils/ai-permissions';
import { rankDocuments } from '@/utils/document-search';
import { createContext, PropsWithChildren, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { aiGatewayService } from '@/services/ai-gateway-service';
import { assistantService } from '@/services/assistant-service';
import { documentService } from '@/services/document-service';
import { ocrService } from '@/services/ocr-service';
import { purchaseService } from '@/services/purchase-service';
import { createEmptyState, storageService } from '@/services/storage-service';
import type {
  AiConnectionCheck,
  AiQuestion,
  AppSettingsPatch,
  DocumentInput,
  Expense,
  ExpenseInput,
  FinancialDocument,
  FinPilotState,
  OnboardingInput,
  PurchaseDecision,
  PurchaseInput,
  AppLanguage,
} from '@/types/finpilot';
import { newId } from '@/utils/finance';
import { pinAuthService } from '@/services/pin-auth';

type FinPilotContextValue = {
  state: FinPilotState;
  isLoading: boolean;
  error?: string;
  addExpense: (input: ExpenseInput) => Promise<void>;
  addExpenses: (inputs: ExpenseInput[]) => Promise<void>;
  updateExpense: (id: string, patch: Partial<ExpenseInput>) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;
  addManualDocument: (input: DocumentInput) => Promise<void>;
  pickAndAddDocument: () => Promise<FinancialDocument | null>;
  importPhotoAndAddDocument: () => Promise<FinancialDocument | null>;
  scanAndAddDocument: () => Promise<FinancialDocument | null>;
  updateDocument: (id: string, patch: Partial<DocumentInput>) => Promise<void>;
  deleteDocument: (id: string) => Promise<void>;
  answerQuestion: (question: string) => Promise<AiQuestion>;
  evaluatePurchase: (input: PurchaseInput) => Promise<PurchaseDecision>;
  updateSettings: (patch: AppSettingsPatch) => Promise<void>;
  testAiConnection: () => Promise<AiConnectionCheck>;
  reprocessDocuments: () => Promise<void>;
  completeOnboarding: (input: OnboardingInput) => Promise<void>;
  retryLoad: () => Promise<void>;
  resetWithSamples: () => Promise<void>;
  resetEmpty: () => Promise<void>;
  resetOnboarding: () => Promise<void>;
};

const FinPilotContext = createContext<FinPilotContextValue | undefined>(undefined);

function createExpense(input: ExpenseInput): Expense {
  const now = new Date().toISOString();

  return {
    id: newId('exp'),
    ...input,
    createdAt: now,
    updatedAt: now,
  };
}

function createManualDocument(input: DocumentInput): FinancialDocument {
  const now = new Date().toISOString();

  return {
    id: newId('doc'),
    ...input,
    tags: input.tags ?? [],
    createdAt: now,
    updatedAt: now,
  };
}

async function analyzeAndMergeDocument(
  document: FinancialDocument,
  language: AppLanguage,
  ai: FinPilotState['settings']['ai'],
) {
  const result = await ocrService.analyzeDocument(document, language, ai);
  const analysis = result.analysis;

  return {
    ...document,
    provider: document.provider ?? analysis.provider,
    amount: document.amount ?? analysis.amount,
    documentDate: document.documentDate ?? analysis.documentDate,
    extractedText: result.extractedText ?? document.extractedText,
    analysis,
    updatedAt: new Date().toISOString(),
  };
}

function selectDocumentsForQuestion(question: string, documents: FinancialDocument[]) {
  return {
    documents: rankDocuments(question, documents)
      .slice(0, 5)
      .map(({ document }) => ({
        id: document.id,
        title: document.title,
        category: document.category,
        provider: document.provider,
        summary: document.analysis?.summary,
        excerpt: document.analysis?.excerpt,
        extractedText: document.extractedText?.slice(0, 4000),
        tags: document.tags,
      })),
  };
}

export function FinPilotProvider({ children }: PropsWithChildren) {
  const [state, setState] = useState<FinPilotState>(() => createEmptyState());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | undefined>();

  const loadState = useCallback(async (isCurrent: () => boolean = () => true) => {
    setIsLoading(true);
    setError(undefined);
    try {
      const loadedState = await storageService.loadState();
      if (isCurrent()) setState(loadedState);
    } catch {
      if (isCurrent()) setError('FinPilot could not load local data.');
    } finally {
      if (isCurrent()) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    void loadState(() => mounted);
    return () => {
      mounted = false;
    };
  }, [loadState]);

  const commit = useCallback(
    async (updater: (current: FinPilotState) => FinPilotState) => {
      const next = updater(state);
      await storageService.saveState(next);
      setState(next);
    },
    [state],
  );

  const value = useMemo<FinPilotContextValue>(() => {
    const addExpenses = async (inputs: ExpenseInput[]) => {
      await commit((current) => ({ ...current, expenses: [...inputs.map(createExpense), ...current.expenses] }));
    };
    const addDocument = async (input: FinancialDocument) => {
      const document = await analyzeAndMergeDocument(input, state.settings.language, state.settings.ai);
      await commit((current) => ({ ...current, documents: [document, ...current.documents] }));
      return document;
    };
    const importDocument = async (pick: () => Promise<FinancialDocument | null>) => {
      const picked = await pick();
      return picked ? addDocument(picked) : null;
    };
    return {
      state,
      isLoading,
      error,
      addExpenses,
      addExpense: (input) => addExpenses([input]),
      updateExpense: async (id, patch) => {
        await commit((current) => ({
          ...current,
          expenses: current.expenses.map((expense) =>
            expense.id === id ? { ...expense, ...patch, updatedAt: new Date().toISOString() } : expense,
          ),
        }));
      },
      deleteExpense: async (id) => {
        await commit((current) => ({
          ...current,
          expenses: current.expenses.filter((expense) => expense.id !== id),
        }));
      },
      addManualDocument: async (input) => {
        await addDocument(createManualDocument(input));
      },
      pickAndAddDocument: () => importDocument(documentService.pickDocument),
      importPhotoAndAddDocument: () => importDocument(documentService.pickImage),
      scanAndAddDocument: () => importDocument(documentService.scanDocument),
      updateDocument: async (id, patch) => {
        const existing = state.documents.find((document) => document.id === id);

        if (!existing) {
          return;
        }

        const updated = await analyzeAndMergeDocument(
          {
            ...existing,
            ...patch,
            updatedAt: new Date().toISOString(),
          },
          state.settings.language,
          state.settings.ai,
        );

        await commit((current) => ({
          ...current,
          documents: current.documents.map((document) => (document.id === id ? updated : document)),
        }));
      },
      deleteDocument: async (id) => {
        await commit((current) => ({
          ...current,
          documents: current.documents.filter((document) => document.id !== id),
          expenses: current.expenses.map((expense) =>
            expense.linkedDocumentId === id ? { ...expense, linkedDocumentId: undefined } : expense,
          ),
        }));
      },
      answerQuestion: async (question) => {
        let answer = assistantService.answerQuestion(question, state.documents, state.settings.language);

        if (hasCloudDocumentConsent(state.settings.ai) && state.documents.length > 0) {
          try {
            const cloudAnswer = await aiGatewayService.answerQuestion({
              question,
              language: state.settings.language,
              ...selectDocumentsForQuestion(question, state.documents),
            });
            answer = {
              id: newId('q'),
              question,
              answer: cloudAnswer.answer,
              confidence: cloudAnswer.confidence,
              documentId: cloudAnswer.documentId,
              documentTitle: cloudAnswer.documentTitle,
              excerpt: cloudAnswer.excerpt,
              recommendation: cloudAnswer.recommendation,
              source: 'cloud-ai',
              requestId: cloudAnswer.requestId,
              model: cloudAnswer.model,
              createdAt: new Date().toISOString(),
            };
          } catch {
            answer = assistantService.answerQuestion(question, state.documents, state.settings.language);
          }
        }

        await commit((current) => ({
          ...current,
          questions: [answer, ...current.questions],
        }));
        return answer;
      },
      evaluatePurchase: async (input) => {
        const decision = purchaseService.evaluate(
          input,
          state.expenses,
          state.settings.emergencyBufferGoal,
          state.settings.language,
        );
        await commit((current) => ({
          ...current,
          purchaseDecisions: [decision, ...current.purchaseDecisions],
        }));
        return decision;
      },
      updateSettings: async (patch) => {
        await commit((current) => ({
          ...current,
          settings: {
            ...current.settings,
            ...patch,
            ai: patch.ai
              ? {
                  ...current.settings.ai,
                  ...patch.ai,
                }
              : current.settings.ai,
          },
        }));
      },
      testAiConnection: async () => {
        const check = await aiGatewayService.checkHealth();
        await commit((current) => ({
          ...current,
          settings: {
            ...current.settings,
            ai: {
              ...current.settings.ai,
              lastConnectionCheck: check,
            },
          },
        }));
        return check;
      },
      reprocessDocuments: async () => {
        const reprocessed = new Map<string, FinancialDocument>();

        for (const document of state.documents) {
          reprocessed.set(
            document.id,
            await analyzeAndMergeDocument(document, state.settings.language, state.settings.ai),
          );
        }

        await commit((current) => ({
          ...current,
          documents: current.documents.map((document) => reprocessed.get(document.id) ?? document),
        }));
      },
      completeOnboarding: async (input) => {
        const next = await storageService.completeOnboarding(
          {
            monthlyIncome: input.monthlyIncome,
            emergencyBufferGoal: input.emergencyBufferGoal,
            language: input.language,
            themeMode: input.themeMode,
          },
          input.useSampleData,
          input.initialExpenses,
        );
        setState(next);
      },
      retryLoad: () => loadState(),
      resetWithSamples: async () => {
        await pinAuthService.clearPinAsync();
        const seeded = await storageService.resetWithSamples();
        setState(seeded);
      },
      resetEmpty: async () => {
        await pinAuthService.clearPinAsync();
        const empty = await storageService.resetEmpty(state.settings);
        setState(empty);
      },
      resetOnboarding: async () => {
        await pinAuthService.clearPinAsync();
        const empty = await storageService.resetEmpty({
          ...state.settings,
          hasCompletedOnboarding: false,
        });
        setState(empty);
      },
    };
  }, [commit, error, isLoading, loadState, state]);

  return <FinPilotContext.Provider value={value}>{children}</FinPilotContext.Provider>;
}

export function useFinPilot() {
  const context = useContext(FinPilotContext);

  if (!context) {
    throw new Error('useFinPilot must be used inside FinPilotProvider');
  }

  return context;
}
