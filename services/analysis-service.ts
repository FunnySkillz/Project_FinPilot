import { categoryLabelKey, translate } from '@/i18n';
import type { AppLanguage, Category, DocumentAnalysis, FinancialDocument } from '@/types/finpilot';

const insuranceCategories: Category[] = ['Insurance', 'Car'];

function inferDocumentType(document: Pick<FinancialDocument, 'title' | 'category'>, language: AppLanguage) {
  const title = document.title.toLowerCase();
  const category = translate(language, categoryLabelKey(document.category));

  if (title.includes('rechtsschutz') || title.includes('legal')) {
    return translate(language, 'analysis.type.legalProtection');
  }
  if (title.includes('invoice') || title.includes('receipt') || title.includes('rechnung') || title.includes('beleg')) {
    return translate(language, 'analysis.type.invoice');
  }
  if (title.includes('fine') || title.includes('penalty') || title.includes('bussgeld')) {
    return translate(language, 'analysis.type.penalty');
  }
  if (insuranceCategories.includes(document.category)) {
    return translate(language, 'analysis.type.contract', { category });
  }

  return translate(language, 'analysis.type.document', { category });
}

function inferCoverage(document: FinancialDocument, language: AppLanguage) {
  const text = `${document.title} ${document.provider ?? ''} ${document.notes ?? ''}`.toLowerCase();

  if (text.includes('rechtsschutz') || text.includes('legal')) {
    return {
      coveredRisks: [
        translate(language, 'analysis.coverage.legal.1'),
        translate(language, 'analysis.coverage.legal.2'),
        translate(language, 'analysis.coverage.legal.3'),
      ],
      exclusions: [
        translate(language, 'analysis.exclusion.legal.1'),
        translate(language, 'analysis.exclusion.legal.2'),
      ],
    };
  }

  if (document.category === 'Warranty') {
    return {
      coveredRisks: [translate(language, 'analysis.coverage.warranty.1')],
      exclusions: [translate(language, 'analysis.exclusion.warranty.1')],
    };
  }

  if (document.category === 'Car' || document.category === 'Insurance') {
    return {
      coveredRisks: [
        translate(language, 'analysis.coverage.contract.1'),
        translate(language, 'analysis.coverage.contract.2'),
      ],
      exclusions: [translate(language, 'analysis.exclusion.contract.1')],
    };
  }

  return {
    coveredRisks: [translate(language, 'analysis.coverage.generic.1')],
    exclusions: [translate(language, 'analysis.exclusion.generic.1')],
  };
}

export const analysisService = {
  analyzeDocument(document: FinancialDocument, language: AppLanguage = 'en'): DocumentAnalysis {
    const generatedAt = new Date().toISOString();
    const documentType = inferDocumentType(document, language);
    const coverage = inferCoverage(document, language);
    const amountText = document.amount ? translate(language, 'analysis.amount', { amount: document.amount }) : '';
    const providerText = document.provider ? `${document.provider} ` : '';
    const category = translate(language, categoryLabelKey(document.category));

    return {
      documentType,
      provider: document.provider,
      amount: document.amount,
      documentDate: document.documentDate,
      summary: translate(language, 'analysis.summary', {
        provider: providerText,
        documentType,
        amount: amountText,
      }),
      coveredRisks: coverage.coveredRisks,
      exclusions: coverage.exclusions,
      warnings: [translate(language, 'analysis.warning.placeholder')],
      excerpt:
        document.extractedText?.slice(0, 180) ||
        translate(language, 'analysis.excerpt', { title: document.title, category }),
      confidence: document.provider || document.amount ? 'medium' : 'low',
      source: 'placeholder',
      needsReview: true,
      generatedAt,
    };
  },

  buildPlaceholderText(document: FinancialDocument, language: AppLanguage = 'en') {
    const provider = document.provider ? `${document.provider}. ` : '';
    const amount = document.amount ? translate(language, 'analysis.placeholder.amount', { amount: document.amount }) : '';
    const date = document.documentDate ? translate(language, 'analysis.placeholder.date', { date: document.documentDate }) : '';
    const category = translate(language, categoryLabelKey(document.category));

    return `${provider}${document.title}. ${amount}${date}${translate(language, 'analysis.placeholder.category', { category })}`;
  },
};
