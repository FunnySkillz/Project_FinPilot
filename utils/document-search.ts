import type { FinancialDocument } from '@/types/finpilot';

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

function scoreDocument(terms: string[], document: FinancialDocument) {
  const corpus = [
    document.title,
    document.category,
    document.provider,
    document.notes,
    document.extractedText,
    document.analysis?.summary,
    document.analysis?.excerpt,
    ...(document.tags ?? []),
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  return terms.reduce((score, term) => score + (corpus.includes(term) ? 1 : 0), 0);
}

export function rankDocuments(question: string, documents: FinancialDocument[]) {
  const terms = tokenize(question);
  return documents
    .map((document) => ({ document, score: scoreDocument(terms, document) }))
    .sort((a, b) => b.score - a.score || b.document.updatedAt.localeCompare(a.document.updatedAt));
}
