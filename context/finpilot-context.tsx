import {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import { analysisService } from '@/services/analysis-service';
import { assistantService } from '@/services/assistant-service';
import { documentService } from '@/services/document-service';
import { purchaseService } from '@/services/purchase-service';
import { storageService } from '@/services/storage-service';
import type {
  AiQuestion,
  AppSettings,
  DocumentInput,
  Expense,
  ExpenseInput,
  FinancialDocument,
  FinPilotState,
  PurchaseDecision,
  PurchaseInput,
} from '@/types/finpilot';
import { newId } from '@/utils/finance';

type FinPilotContextValue = {
  state: FinPilotState;
  isLoading: boolean;
  error?: string;
  addExpense: (input: ExpenseInput) => Promise<void>;
  updateExpense: (id: string, patch: Partial<ExpenseInput>) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;
  addManualDocument: (input: DocumentInput) => Promise<void>;
  pickAndAddDocument: () => Promise<FinancialDocument | null>;
  updateDocument: (id: string, patch: Partial<DocumentInput>) => Promise<void>;
  deleteDocument: (id: string) => Promise<void>;
  answerQuestion: (question: string) => Promise<AiQuestion>;
  evaluatePurchase: (input: PurchaseInput) => Promise<PurchaseDecision>;
  updateSettings: (patch: Partial<AppSettings>) => Promise<void>;
  resetWithSamples: () => Promise<void>;
  resetEmpty: () => Promise<void>;
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
  const baseDocument: FinancialDocument = {
    id: newId('doc'),
    ...input,
    tags: input.tags ?? [],
    createdAt: now,
    updatedAt: now,
  };
  const extractedText = analysisService.buildPlaceholderText(baseDocument);
  const documentWithText = { ...baseDocument, extractedText };

  return {
    ...documentWithText,
    analysis: analysisService.analyzeDocument(documentWithText),
  };
}

export function FinPilotProvider({ children }: PropsWithChildren) {
  const [state, setState] = useState<FinPilotState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | undefined>();

  useEffect(() => {
    let mounted = true;

    storageService
      .loadState()
      .then((loadedState) => {
        if (mounted) {
          setState(loadedState);
        }
      })
      .catch(() => {
        if (mounted) {
          setError('FinPilot could not load local data.');
        }
      })
      .finally(() => {
        if (mounted) {
          setIsLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, []);

  const commit = useCallback(
    async (updater: (current: FinPilotState) => FinPilotState) => {
      if (!state) {
        return;
      }

      const next = updater(state);
      setState(next);
      await storageService.saveState(next);
    },
    [state],
  );

  const value = useMemo<FinPilotContextValue | undefined>(() => {
    if (!state) {
      return undefined;
    }

    return {
      state,
      isLoading,
      error,
      addExpense: async (input) => {
        await commit((current) => ({
          ...current,
          expenses: [createExpense(input), ...current.expenses],
        }));
      },
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
        const document = createManualDocument(input);
        await commit((current) => ({
          ...current,
          documents: [document, ...current.documents],
        }));
      },
      pickAndAddDocument: async () => {
        const document = await documentService.pickDocument();

        if (document) {
          await commit((current) => ({
            ...current,
            documents: [document, ...current.documents],
          }));
        }

        return document;
      },
      updateDocument: async (id, patch) => {
        await commit((current) => ({
          ...current,
          documents: current.documents.map((document) => {
            if (document.id !== id) {
              return document;
            }

            const updated = {
              ...document,
              ...patch,
              updatedAt: new Date().toISOString(),
            };
            const documentWithText = {
              ...updated,
              extractedText: updated.extractedText ?? analysisService.buildPlaceholderText(updated),
            };

            return {
              ...documentWithText,
              analysis: analysisService.analyzeDocument(documentWithText),
            };
          }),
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
        const answer = assistantService.answerQuestion(question, state.documents);
        await commit((current) => ({
          ...current,
          questions: [answer, ...current.questions],
        }));
        return answer;
      },
      evaluatePurchase: async (input) => {
        const decision = purchaseService.evaluate(input, state.expenses, state.settings.emergencyBufferGoal);
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
          },
        }));
      },
      resetWithSamples: async () => {
        const seeded = await storageService.resetWithSamples();
        setState(seeded);
      },
      resetEmpty: async () => {
        const empty = await storageService.resetEmpty(state.settings);
        setState(empty);
      },
    };
  }, [commit, error, isLoading, state]);

  if (!value) {
    return null;
  }

  return <FinPilotContext.Provider value={value}>{children}</FinPilotContext.Provider>;
}

export function useFinPilot() {
  const context = useContext(FinPilotContext);

  if (!context) {
    throw new Error('useFinPilot must be used inside FinPilotProvider');
  }

  return context;
}

