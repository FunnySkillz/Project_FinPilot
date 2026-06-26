import Constants from 'expo-constants';

import type {
  AiConnectionCheck,
  AiProvider,
  AppLanguage,
  Confidence,
  DocumentAnalysis,
  FinancialDocument,
} from '@/types/finpilot';

type AnalyzeDocumentInput = {
  fileData: string;
  fileName?: string;
  mimeType: string;
  language: AppLanguage;
  metadata: Partial<
    Pick<FinancialDocument, 'title' | 'category' | 'provider' | 'amount' | 'documentDate' | 'notes' | 'tags'>
  >;
};

type AskInput = {
  question: string;
  language: AppLanguage;
  documents: Array<{
    id: string;
    title: string;
    category: string;
    provider?: string;
    summary?: string;
    excerpt?: string;
    extractedText?: string;
    tags: string[];
  }>;
};

type CloudAnswer = {
  answer: string;
  confidence: Confidence;
  documentId?: string;
  documentTitle?: string;
  excerpt: string;
  recommendation: string;
  requestId: string;
  model?: string;
};

export class AiGatewayError extends Error {
  status?: number;
  requestId?: string;

  constructor(message: string, options?: { status?: number; requestId?: string }) {
    super(message);
    this.name = 'AiGatewayError';
    this.status = options?.status;
    this.requestId = options?.requestId;
  }
}

const DEFAULT_TIMEOUT_MS = 30000;

function baseUrl() {
  return String(Constants.expoConfig?.extra?.aiBaseUrl ?? 'http://localhost:8787').replace(/\/$/, '');
}

async function requestJson<T>(path: string, init?: RequestInit & { timeoutMs?: number }): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), init?.timeoutMs ?? DEFAULT_TIMEOUT_MS);

  try {
    const response = await fetch(`${baseUrl()}${path}`, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...init?.headers,
      },
      signal: controller.signal,
    });
    const data = await response.json().catch(() => ({}));

    if (!response.ok || data.ok === false) {
      throw new AiGatewayError(data.error ?? 'AI service request failed.', {
        status: response.status,
        requestId: data.requestId,
      });
    }

    return data as T;
  } catch (error) {
    if (error instanceof AiGatewayError) {
      throw error;
    }
    throw new AiGatewayError(error instanceof Error ? error.message : 'AI service is unavailable.');
  } finally {
    clearTimeout(timeout);
  }
}

export const aiGatewayService = {
  async checkHealth(): Promise<AiConnectionCheck> {
    try {
      const response = await requestJson<{
        provider: AiProvider;
        configured: boolean;
        version?: string;
        model?: string;
        message?: string;
      }>('/health', { method: 'GET', timeoutMs: 8000 });

      return {
        status: response.provider === 'openai' && response.configured ? 'connected' : 'error',
        checkedAt: new Date().toISOString(),
        provider: response.provider,
        version: response.version,
        model: response.model,
        message: response.message,
      };
    } catch (error) {
      return {
        status: 'error',
        checkedAt: new Date().toISOString(),
        message: error instanceof Error ? error.message : 'AI service is unavailable.',
      };
    }
  },

  async analyzeDocument(input: AnalyzeDocumentInput): Promise<{
    extractedText?: string;
    analysis: DocumentAnalysis;
  }> {
    const response = await requestJson<{
      extractedText?: string;
      analysis: DocumentAnalysis;
    }>('/v1/documents/analyze', {
      method: 'POST',
      timeoutMs: 60000,
      body: JSON.stringify(input),
    });

    return response;
  },

  async answerQuestion(input: AskInput): Promise<CloudAnswer> {
    return requestJson<CloudAnswer>('/v1/ask', {
      method: 'POST',
      timeoutMs: 45000,
      body: JSON.stringify(input),
    });
  },
};
