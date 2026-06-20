import { translate } from '@/i18n';
import type { AiQuestion, AppLanguage, FinancialDocument } from '@/types/finpilot';
import { newId } from '@/utils/finance';

const stopWords = new Set([
  'the',
  'and',
  'for',
  'with',
  'this',
  'that',
  'have',
  'does',
  'what',
  'which',
  'from',
  'your',
  'about',
]);

function tokenize(value: string) {
  return value
    .toLowerCase()
    .replace(/[^\p{L}0-9\s-]/gu, ' ')
    .split(/\s+/)
    .filter((word) => word.length > 2 && !stopWords.has(word));
}

function scoreDocument(question: string, document: FinancialDocument) {
  const terms = tokenize(question);
  const corpus = [
    document.title,
    document.category,
    document.provider,
    document.notes,
    document.extractedText,
    document.analysis?.summary,
    ...(document.tags ?? []),
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  return terms.reduce((score, term) => score + (corpus.includes(term) ? 1 : 0), 0);
}

function chooseDocument(question: string, documents: FinancialDocument[]) {
  return documents
    .map((document) => ({ document, score: scoreDocument(question, document) }))
    .sort((a, b) => b.score - a.score)[0];
}

function getSummary(language: AppLanguage, document: FinancialDocument, fallbackKey: Parameters<typeof translate>[1]) {
  return language === 'en' ? document.analysis?.summary ?? translate(language, fallbackKey) : translate(language, fallbackKey);
}

function buildAnswer(question: string, language: AppLanguage, document?: FinancialDocument, score = 0) {
  if (!document || score === 0) {
    return {
      answer: translate(language, 'ask.noMatch.answer'),
      confidence: 'low' as const,
      excerpt: translate(language, 'ask.noMatch.excerpt'),
      recommendation: translate(language, 'ask.noMatch.recommendation'),
    };
  }

  const questionLower = question.toLowerCase();
  const isCoverageQuestion =
    questionLower.includes('cover') ||
    questionLower.includes('covered') ||
    questionLower.includes('insurance') ||
    questionLower.includes('versicherung') ||
    questionLower.includes('gedeckt') ||
    questionLower.includes('deckt') ||
    questionLower.includes('rechtsschutz');
  const isWarrantyQuestion =
    questionLower.includes('warranty') || questionLower.includes('guarantee') || questionLower.includes('garantie');
  const isAffordQuestion =
    questionLower.includes('afford') ||
    questionLower.includes('buy') ||
    questionLower.includes('pay') ||
    questionLower.includes('leisten') ||
    questionLower.includes('kaufen') ||
    questionLower.includes('zahlen') ||
    questionLower.includes('bezahlen');

  if (isCoverageQuestion) {
    return {
      answer: translate(language, 'ask.coverage.answer', {
        title: document.title,
        summary: getSummary(language, document, 'ask.coverage.fallback'),
      }),
      confidence: document.analysis?.confidence ?? ('medium' as const),
      excerpt:
        document.analysis?.excerpt ??
        document.extractedText ??
        translate(language, 'ask.generic.excerptFallback'),
      recommendation: translate(language, 'ask.coverage.recommendation'),
    };
  }

  if (isWarrantyQuestion) {
    return {
      answer: document.analysis?.warrantyUntil
        ? translate(language, 'ask.warranty.answer.confirmed', {
            title: document.title,
            date: document.analysis.warrantyUntil,
          })
        : translate(language, 'ask.warranty.answer.unconfirmed', { title: document.title }),
      confidence: document.analysis?.warrantyUntil ? ('high' as const) : ('medium' as const),
      excerpt:
        document.analysis?.excerpt ??
        document.extractedText ??
        translate(language, 'ask.generic.excerptFallback'),
      recommendation: translate(language, 'ask.warranty.recommendation'),
    };
  }

  if (isAffordQuestion) {
    return {
      answer: translate(language, 'ask.afford.answer'),
      confidence: 'medium' as const,
      excerpt: document.analysis?.excerpt ?? translate(language, 'ask.afford.excerpt'),
      recommendation: translate(language, 'ask.afford.recommendation'),
    };
  }

  return {
    answer: translate(language, 'ask.generic.answer', {
      title: document.title,
      summary: getSummary(language, document, 'ask.generic.fallback'),
    }),
    confidence: score >= 3 ? ('high' as const) : ('medium' as const),
    excerpt:
      document.analysis?.excerpt ??
      document.extractedText ??
      translate(language, 'ask.generic.excerptFallback'),
    recommendation: translate(language, 'ask.generic.recommendation'),
  };
}

export const assistantService = {
  answerQuestion(question: string, documents: FinancialDocument[], language: AppLanguage): AiQuestion {
    const match = chooseDocument(question, documents);
    const response = buildAnswer(question, language, match?.document, match?.score);

    return {
      id: newId('q'),
      question,
      documentId: match?.score ? match.document.id : undefined,
      documentTitle: match?.score ? match.document.title : undefined,
      createdAt: new Date().toISOString(),
      ...response,
    };
  },
};
