import type { AiQuestion, FinancialDocument } from '@/types/finpilot';
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

function buildAnswer(question: string, document?: FinancialDocument, score = 0) {
  if (!document || score === 0) {
    return {
      answer:
        'Based on your uploaded documents, I could not confirm this yet. Add or tag the relevant contract, invoice, or policy so FinPilot can ground the answer.',
      confidence: 'low' as const,
      excerpt: 'No matching uploaded document was found for this question.',
      recommendation: 'Upload the relevant document or open the vault and improve the title, provider, tags, and notes.',
    };
  }

  const questionLower = question.toLowerCase();
  const isCoverageQuestion =
    questionLower.includes('cover') ||
    questionLower.includes('covered') ||
    questionLower.includes('insurance') ||
    questionLower.includes('rechtsschutz');
  const isWarrantyQuestion = questionLower.includes('warranty') || questionLower.includes('guarantee');
  const isAffordQuestion =
    questionLower.includes('afford') || questionLower.includes('buy') || questionLower.includes('pay');

  if (isCoverageQuestion) {
    return {
      answer: `Based on your uploaded documents, this seems related to ${document.title}. ${
        document.analysis?.summary ??
        'The document has placeholder extraction only, so the coverage signal should be verified.'
      }`,
      confidence: document.analysis?.confidence ?? ('medium' as const),
      excerpt:
        document.analysis?.excerpt ??
        document.extractedText ??
        'Relevant document found, but no OCR excerpt is available yet.',
      recommendation:
        'Do not treat this as final legal or insurance advice. Contact the provider and reference the exact policy or notice before acting.',
    };
  }

  if (isWarrantyQuestion) {
    return {
      answer: `Based on your uploaded documents, ${document.title} is the strongest match for warranty context. ${
        document.analysis?.warrantyUntil
          ? `The placeholder analysis points to warranty relevance until ${document.analysis.warrantyUntil}.`
          : 'The warranty period is not confirmed yet.'
      }`,
      confidence: document.analysis?.warrantyUntil ? ('high' as const) : ('medium' as const),
      excerpt:
        document.analysis?.excerpt ??
        document.extractedText ??
        'Relevant document found, but no OCR excerpt is available yet.',
      recommendation: 'Open the document detail and verify the purchase date and warranty terms before filing a claim.',
    };
  }

  if (isAffordQuestion) {
    return {
      answer:
        'Based on your uploaded documents and manually entered costs, this looks like a budget question. Use Purchase Check for the stronger answer because it calculates savings buffer and monthly impact.',
      confidence: 'medium' as const,
      excerpt: document.analysis?.excerpt ?? 'A related financial document was found.',
      recommendation: 'Run the purchase through Purchase Check with current savings and monthly income.',
    };
  }

  return {
    answer: `Based on your uploaded documents, ${document.title} is the best match. ${
      document.analysis?.summary ?? 'The document is searchable, but OCR is still a local placeholder.'
    }`,
    confidence: score >= 3 ? ('high' as const) : ('medium' as const),
    excerpt:
      document.analysis?.excerpt ??
      document.extractedText ??
      'Relevant document found, but no OCR excerpt is available yet.',
    recommendation: 'Review the matched document detail and verify extracted fields before making a decision.',
  };
}

export const assistantService = {
  answerQuestion(question: string, documents: FinancialDocument[]): AiQuestion {
    const match = chooseDocument(question, documents);
    const response = buildAnswer(question, match?.document, match?.score);

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
