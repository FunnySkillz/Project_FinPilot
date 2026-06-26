import { File } from 'expo-file-system';

import { translate } from '@/i18n';
import { aiGatewayService } from '@/services/ai-gateway-service';
import { analysisService } from '@/services/analysis-service';
import type { AiSettings, AppLanguage, FinancialDocument } from '@/types/finpilot';

async function runNativeOcr() {
  return undefined as string | undefined;
}

function placeholder(document: FinancialDocument, language: AppLanguage, warning?: string) {
  const extractedText = analysisService.buildPlaceholderText(document, language);
  const analysis = analysisService.analyzeDocument({ ...document, extractedText }, language);

  return {
    extractedText,
    analysis: warning ? { ...analysis, warnings: [...analysis.warnings, warning] } : analysis,
  };
}

function canUseCloud(ai: AiSettings) {
  return ai.cloudEnabled && ai.cloudDocumentConsent && (ai.ocrMode === 'cloud' || ai.ocrMode === 'hybrid');
}

async function analyzeWithCloud(document: FinancialDocument, language: AppLanguage) {
  if (!document.fileUri || !document.mimeType) {
    throw new Error('Document file is missing.');
  }

  const fileData = await new File(document.fileUri).base64();
  return aiGatewayService.analyzeDocument({
    fileData,
    fileName: document.fileName,
    mimeType: document.mimeType,
    language,
    metadata: {
      title: document.title,
      category: document.category,
      provider: document.provider,
      amount: document.amount,
      documentDate: document.documentDate,
      notes: document.notes,
      tags: document.tags,
    },
  });
}

export const ocrService = {
  async analyzeDocument(document: FinancialDocument, language: AppLanguage, ai: AiSettings) {
    if (ai.ocrMode === 'off') {
      return placeholder(document, language, translate(language, 'ai.warning.ocrOff'));
    }

    if (ai.ocrMode === 'native' || ai.ocrMode === 'hybrid') {
      const nativeText = await runNativeOcr();
      if (nativeText) {
        const documentWithText = { ...document, extractedText: nativeText };
        return {
          extractedText: nativeText,
          analysis: {
            ...analysisService.analyzeDocument(documentWithText, language),
            source: 'native-ocr' as const,
            warnings: [translate(language, 'ai.warning.nativeReview')],
          },
        };
      }
    }

    if (canUseCloud(ai)) {
      try {
        const cloudResult = await analyzeWithCloud(document, language);
        return {
          extractedText: cloudResult.extractedText,
          analysis: {
            ...cloudResult.analysis,
            source: 'cloud-ai' as const,
            needsReview: true,
          },
        };
      } catch {
        return placeholder(document, language, translate(language, 'ai.warning.cloudFallback'));
      }
    }

    return placeholder(
      document,
      language,
      ai.ocrMode === 'cloud' ? translate(language, 'ai.warning.cloudDisabled') : translate(language, 'ai.warning.nativeUnavailable'),
    );
  },
};
