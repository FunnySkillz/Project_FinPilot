import type { AiSettings } from '@/types/finpilot';

export function hasCloudDocumentConsent(ai: AiSettings) {
  return ai.cloudEnabled && ai.cloudDocumentConsent;
}

export function canExtractWithCloud(ai: AiSettings) {
  return hasCloudDocumentConsent(ai) && (ai.ocrMode === 'cloud' || ai.ocrMode === 'hybrid');
}
