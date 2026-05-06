import type { Category, DocumentAnalysis, FinancialDocument } from '@/types/finpilot';

const insuranceCategories: Category[] = ['Insurance', 'Car'];

function inferDocumentType(document: Pick<FinancialDocument, 'title' | 'category'>) {
  const title = document.title.toLowerCase();

  if (title.includes('rechtsschutz') || title.includes('legal')) {
    return 'Legal protection insurance';
  }
  if (title.includes('invoice') || title.includes('receipt')) {
    return 'Invoice or receipt';
  }
  if (title.includes('fine') || title.includes('penalty')) {
    return 'Penalty notice';
  }
  if (insuranceCategories.includes(document.category)) {
    return `${document.category} contract`;
  }

  return `${document.category} document`;
}

function inferCoverage(document: FinancialDocument) {
  const text = `${document.title} ${document.provider ?? ''} ${document.notes ?? ''}`.toLowerCase();

  if (text.includes('rechtsschutz') || text.includes('legal')) {
    return {
      coveredRisks: ['Private legal protection', 'Traffic legal protection signals', 'Initial legal review'],
      exclusions: ['Fines and administrative penalties may be excluded', 'Final coverage requires insurer confirmation'],
    };
  }

  if (document.category === 'Warranty') {
    return {
      coveredRisks: ['Warranty period may apply if the purchase date is valid'],
      exclusions: ['Accidental damage and wear are usually excluded'],
    };
  }

  if (document.category === 'Car' || document.category === 'Insurance') {
    return {
      coveredRisks: ['Recurring contract obligation detected', 'Potential insurance coverage area detected'],
      exclusions: ['Coverage limits and deductibles need the full policy wording'],
    };
  }

  return {
    coveredRisks: ['Relevant financial document stored in the vault'],
    exclusions: ['No coverage terms confirmed from placeholder extraction'],
  };
}

export const analysisService = {
  analyzeDocument(document: FinancialDocument): DocumentAnalysis {
    const generatedAt = new Date().toISOString();
    const documentType = inferDocumentType(document);
    const coverage = inferCoverage(document);
    const amountText = document.amount ? ` with an amount of EUR ${document.amount}` : '';
    const providerText = document.provider ? `${document.provider} ` : '';

    return {
      documentType,
      provider: document.provider,
      amount: document.amount,
      documentDate: document.documentDate,
      summary: `${providerText}${documentType}${amountText}. Placeholder OCR found enough structure to make this searchable, but the user should verify the extracted fields.`,
      coveredRisks: coverage.coveredRisks,
      exclusions: coverage.exclusions,
      excerpt:
        document.extractedText?.slice(0, 180) ||
        `${document.title} appears to be a ${document.category.toLowerCase()} document. Full OCR will replace this placeholder excerpt.`,
      confidence: document.provider || document.amount ? 'medium' : 'low',
      generatedAt,
    };
  },

  buildPlaceholderText(document: FinancialDocument) {
    const provider = document.provider ? `${document.provider}. ` : '';
    const amount = document.amount ? `Detected amount EUR ${document.amount}. ` : '';
    const date = document.documentDate ? `Document date ${document.documentDate}. ` : '';

    return `${provider}${document.title}. ${amount}${date}Category ${document.category}. Placeholder OCR text for local MVP.`;
  },
};

