export type Category =
  | 'Housing'
  | 'Car'
  | 'Insurance'
  | 'Subscriptions'
  | 'Food'
  | 'Health'
  | 'Family'
  | 'Tax'
  | 'Warranty'
  | 'Fines'
  | 'Other';

export type ExpenseCadence = 'monthly' | 'yearly';
export type ExpenseKind = 'recurring' | 'one-off';
export type PaymentMethod =
  | 'cash'
  | 'debit-card'
  | 'credit-card'
  | 'bank-transfer'
  | 'paypal'
  | 'apple-pay'
  | 'other';
export type Confidence = 'low' | 'medium' | 'high';
export type PurchaseType = 'one-time' | 'financing';
export type PurchasePriority = 'low' | 'medium' | 'high';
export type PurchaseStatus = 'safe' | 'risky' | 'critical';
export type AppLanguage = 'en' | 'de';
export type AppLocale = 'en-AT' | 'de-AT';
export type ThemeMode = 'system' | 'light' | 'dark';
export type ThemeModeResolved = 'light' | 'dark';

export type Expense = {
  id: string;
  name: string;
  amount: number;
  cadence?: ExpenseCadence;
  category: Category;
  kind: ExpenseKind;
  startDate: string;
  endDate?: string;
  merchant?: string;
  paymentMethod?: PaymentMethod;
  tags: string[];
  notes?: string;
  linkedDocumentId?: string;
  createdAt: string;
  updatedAt: string;
};

export type DocumentAnalysis = {
  documentType: string;
  provider?: string;
  amount?: number;
  documentDate?: string;
  contractEndDate?: string;
  warrantyUntil?: string;
  summary: string;
  coveredRisks: string[];
  exclusions: string[];
  excerpt: string;
  confidence: Confidence;
  generatedAt: string;
};

export type FinancialDocument = {
  id: string;
  title: string;
  category: Category;
  provider?: string;
  fileUri?: string;
  fileName?: string;
  mimeType?: string;
  amount?: number;
  documentDate?: string;
  notes?: string;
  tags: string[];
  extractedText?: string;
  analysis?: DocumentAnalysis;
  createdAt: string;
  updatedAt: string;
};

export type AiQuestion = {
  id: string;
  question: string;
  answer: string;
  confidence: Confidence;
  documentId?: string;
  documentTitle?: string;
  excerpt: string;
  recommendation: string;
  createdAt: string;
};

export type PurchaseDecision = {
  id: string;
  purchaseName: string;
  price: number;
  purchaseType: PurchaseType;
  priority: PurchasePriority;
  currentSavings: number;
  monthlyIncome: number;
  monthlyFinancingAmount?: number;
  recurringMonthlyLoad: number;
  oneOffMonthlySpending: number;
  totalMonthlyPressure: number;
  fixedMonthlyCosts?: number;
  variableMonthlyCosts?: number;
  monthlyImpact: number;
  bufferAfterPurchase: number;
  status: PurchaseStatus;
  summary: string;
  recommendation: string;
  createdAt: string;
};

export type AppSettings = {
  monthlyIncome: number;
  emergencyBufferGoal: number;
  currency: 'EUR';
  samplesSeeded: boolean;
  hasCompletedOnboarding: boolean;
  language: AppLanguage;
  themeMode: ThemeMode;
  appLockEnabled: boolean;
  sampleDataEnabled: boolean;
};

export type FinPilotState = {
  expenses: Expense[];
  documents: FinancialDocument[];
  questions: AiQuestion[];
  purchaseDecisions: PurchaseDecision[];
  settings: AppSettings;
  version: number;
};

export type ExpenseInput = Omit<Expense, 'id' | 'createdAt' | 'updatedAt'>;

export type DocumentInput = Omit<
  FinancialDocument,
  'id' | 'createdAt' | 'updatedAt' | 'analysis' | 'extractedText'
>;

export type PurchaseInput = {
  purchaseName: string;
  price: number;
  purchaseType: PurchaseType;
  priority: PurchasePriority;
  currentSavings: number;
  monthlyIncome: number;
  monthlyFinancingAmount?: number;
};

export type OnboardingInput = {
  monthlyIncome: number;
  emergencyBufferGoal: number;
  language: AppLanguage;
  themeMode: ThemeMode;
  useSampleData: boolean;
};
