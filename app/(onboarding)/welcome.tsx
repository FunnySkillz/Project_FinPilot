import { ArrowLeft, ArrowRight, Check, Database } from 'lucide-react-native';
import { useMemo, useRef, useState } from 'react';
import { Alert } from 'react-native';

import { AppScreen, Stack } from '@/components/finpilot/app-screen';
import { Card } from '@/components/finpilot/card';
import { Button, Field, SegmentedControl } from '@/components/finpilot/controls';
import { Body, H1, H2, Muted } from '@/components/finpilot/text';
import { Box, HStack, Pressable, VStack } from '@/components/ui/gluestack';
import { useFinPilot } from '@/context/finpilot-context';
import { useLanguage } from '@/context/language-context';
import { useThemeMode } from '@/context/theme-mode-context';
import { getFinTheme } from '@/constants/finpilot';
import { translate } from '@/i18n';
import type { AppLanguage, Category, ExpenseInput, PaymentMethod, ThemeMode } from '@/types/finpilot';
import { formatCurrency } from '@/utils/formatters';

type OnboardingStep = 'profile' | 'housing' | 'car' | 'everyday' | 'review';
type CarChoice = 'no' | 'yes';
type MoneyFieldKey =
  | 'rent'
  | 'electricity'
  | 'heating'
  | 'homeInsurance'
  | 'internet'
  | 'carPayment'
  | 'carInsurance'
  | 'fuel'
  | 'groceries'
  | 'subscriptions'
  | 'hobbies'
  | 'health'
  | 'other';

type MoneyField = {
  key: MoneyFieldKey;
  labelKey: OnboardingTextKey;
  placeholder: string;
  category: Category;
  merchant?: string;
  paymentMethod?: PaymentMethod;
  tags: string[];
};

type OnboardingTextKey =
  | 'onboarding.step.profile'
  | 'onboarding.step.housing'
  | 'onboarding.step.car'
  | 'onboarding.step.everyday'
  | 'onboarding.step.review'
  | 'onboarding.housing.rent'
  | 'onboarding.housing.electricity'
  | 'onboarding.housing.heating'
  | 'onboarding.housing.homeInsurance'
  | 'onboarding.housing.internet'
  | 'onboarding.car.hasCar'
  | 'onboarding.car.no'
  | 'onboarding.car.yes'
  | 'onboarding.car.payment'
  | 'onboarding.car.insurance'
  | 'onboarding.car.fuel'
  | 'onboarding.everyday.groceries'
  | 'onboarding.everyday.subscriptions'
  | 'onboarding.everyday.hobbies'
  | 'onboarding.everyday.health'
  | 'onboarding.everyday.other';

const STEPS: OnboardingStep[] = ['profile', 'housing', 'car', 'everyday', 'review'];

const HOUSING_FIELDS: MoneyField[] = [
  {
    key: 'rent',
    labelKey: 'onboarding.housing.rent',
    placeholder: '1200',
    category: 'Housing',
    merchant: 'Landlord',
    paymentMethod: 'bank-transfer',
    tags: ['housing', 'rent', 'fixed'],
  },
  {
    key: 'electricity',
    labelKey: 'onboarding.housing.electricity',
    placeholder: '85',
    category: 'Housing',
    paymentMethod: 'bank-transfer',
    tags: ['housing', 'electricity', 'utility'],
  },
  {
    key: 'heating',
    labelKey: 'onboarding.housing.heating',
    placeholder: '95',
    category: 'Housing',
    paymentMethod: 'bank-transfer',
    tags: ['housing', 'heating', 'utility'],
  },
  {
    key: 'homeInsurance',
    labelKey: 'onboarding.housing.homeInsurance',
    placeholder: '18',
    category: 'Insurance',
    paymentMethod: 'bank-transfer',
    tags: ['housing', 'insurance', 'contract'],
  },
  {
    key: 'internet',
    labelKey: 'onboarding.housing.internet',
    placeholder: '45',
    category: 'Subscriptions',
    paymentMethod: 'bank-transfer',
    tags: ['internet', 'subscription', 'contract'],
  },
];

const CAR_FIELDS: MoneyField[] = [
  {
    key: 'carPayment',
    labelKey: 'onboarding.car.payment',
    placeholder: '280',
    category: 'Car',
    paymentMethod: 'bank-transfer',
    tags: ['car', 'financing', 'fixed'],
  },
  {
    key: 'carInsurance',
    labelKey: 'onboarding.car.insurance',
    placeholder: '95',
    category: 'Insurance',
    paymentMethod: 'bank-transfer',
    tags: ['car', 'insurance', 'contract'],
  },
  {
    key: 'fuel',
    labelKey: 'onboarding.car.fuel',
    placeholder: '180',
    category: 'Car',
    paymentMethod: 'debit-card',
    tags: ['car', 'fuel'],
  },
];

const EVERYDAY_FIELDS: MoneyField[] = [
  {
    key: 'groceries',
    labelKey: 'onboarding.everyday.groceries',
    placeholder: '450',
    category: 'Food',
    paymentMethod: 'debit-card',
    tags: ['food', 'groceries', 'household'],
  },
  {
    key: 'subscriptions',
    labelKey: 'onboarding.everyday.subscriptions',
    placeholder: '40',
    category: 'Subscriptions',
    paymentMethod: 'credit-card',
    tags: ['subscription', 'fixed'],
  },
  {
    key: 'hobbies',
    labelKey: 'onboarding.everyday.hobbies',
    placeholder: '120',
    category: 'Other',
    paymentMethod: 'debit-card',
    tags: ['hobby', 'lifestyle'],
  },
  {
    key: 'health',
    labelKey: 'onboarding.everyday.health',
    placeholder: '45',
    category: 'Health',
    paymentMethod: 'debit-card',
    tags: ['health'],
  },
  {
    key: 'other',
    labelKey: 'onboarding.everyday.other',
    placeholder: '100',
    category: 'Other',
    paymentMethod: 'debit-card',
    tags: ['other'],
  },
];

const EMPTY_COSTS: Record<MoneyFieldKey, string> = {
  rent: '',
  electricity: '',
  heating: '',
  homeInsurance: '',
  internet: '',
  carPayment: '',
  carInsurance: '',
  fuel: '',
  groceries: '',
  subscriptions: '',
  hobbies: '',
  health: '',
  other: '',
};

function getThemeLabelKey(value: ThemeMode) {
  if (value === 'light') {
    return 'theme.light';
  }
  if (value === 'dark') {
    return 'theme.dark';
  }
  return 'theme.system';
}

function todayString() {
  return new Date().toISOString().slice(0, 10);
}

function parseMoney(value: string) {
  if (!value.trim()) {
    return undefined;
  }

  const parsed = Number(value.replace(',', '.'));
  return Number.isFinite(parsed) && parsed > 0 ? parsed : Number.NaN;
}

function normalizeTags(tags: string[]) {
  return Array.from(new Set(['setup', ...tags]));
}

function StepIndicator({
  steps,
  currentStep,
  getLabel,
}: {
  steps: OnboardingStep[];
  currentStep: OnboardingStep;
  getLabel: (step: OnboardingStep) => string;
}) {
  const currentIndex = steps.indexOf(currentStep);

  return (
    <HStack className="gap-2">
      {steps.map((step, index) => {
        const isActive = step === currentStep;
        const isDone = index < currentIndex;

        return (
          <Box
            key={step}
            accessibilityLabel={getLabel(step)}
            className={`h-2 flex-1 rounded-fin ${isActive || isDone ? 'bg-fin-primary' : 'bg-fin-border'}`}
          />
        );
      })}
    </HStack>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <HStack className="justify-between gap-3">
      <Muted className="shrink">{label}</Muted>
      <Body className="font-extrabold">{value}</Body>
    </HStack>
  );
}

export default function WelcomeScreen() {
  const { completeOnboarding } = useFinPilot();
  const { t, locale, language, setLanguage } = useLanguage();
  const { resolvedMode } = useThemeMode();
  const theme = getFinTheme(resolvedMode);
  const [stepIndex, setStepIndex] = useState(0);
  const [selectedLanguage, setSelectedLanguage] = useState<AppLanguage>(language);
  const [monthlyIncome, setMonthlyIncome] = useState('');
  const [emergencyBufferGoal, setEmergencyBufferGoal] = useState('');
  const [themeMode, setThemeMode] = useState<ThemeMode>('system');
  const [carChoice, setCarChoice] = useState<CarChoice>('no');
  const [costs, setCosts] = useState<Record<MoneyFieldKey, string>>(EMPTY_COSTS);
  const [isSaving, setIsSaving] = useState(false);
  const inFlightRef = useRef(false);

  const currentStep = STEPS[stepIndex];
  const setupExpenses = useMemo(() => {
    const allFields = [...HOUSING_FIELDS, ...(carChoice === 'yes' ? CAR_FIELDS : []), ...EVERYDAY_FIELDS];

    return allFields.reduce<ExpenseInput[]>((items, field) => {
      const amount = parseMoney(costs[field.key]);
      if (!amount || Number.isNaN(amount)) {
        return items;
      }

      items.push({
        name: translate(selectedLanguage, field.labelKey),
        amount,
        kind: 'recurring',
        cadence: 'monthly',
        category: field.category,
        startDate: todayString(),
        merchant: field.merchant,
        paymentMethod: field.paymentMethod,
        tags: normalizeTags(field.tags),
      });

      return items;
    }, []);
  }, [carChoice, costs, selectedLanguage]);
  const monthlyExpenseTotal = setupExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  const parsedIncome = parseMoney(monthlyIncome);
  const remainingMonthly = parsedIncome && !Number.isNaN(parsedIncome) ? parsedIncome - monthlyExpenseTotal : 0;

  const updateCost = (key: MoneyFieldKey, value: string) => {
    setCosts((current) => ({ ...current, [key]: value }));
  };

  const validateProfile = () => {
    const income = parseMoney(monthlyIncome);
    const buffer = parseMoney(emergencyBufferGoal);

    if (!income || Number.isNaN(income) || !buffer || Number.isNaN(buffer)) {
      Alert.alert(t('onboarding.validation'));
      return false;
    }

    return true;
  };

  const validateCostFields = (fields: MoneyField[]) => {
    const hasInvalidField = fields.some((field) => Number.isNaN(parseMoney(costs[field.key])));
    if (hasInvalidField) {
      Alert.alert(t('onboarding.costValidation'));
      return false;
    }

    return true;
  };

  const goNext = () => {
    if (currentStep === 'profile' && !validateProfile()) {
      return;
    }
    if (currentStep === 'housing' && !validateCostFields(HOUSING_FIELDS)) {
      return;
    }
    if (currentStep === 'car' && carChoice === 'yes' && !validateCostFields(CAR_FIELDS)) {
      return;
    }
    if (currentStep === 'everyday' && !validateCostFields(EVERYDAY_FIELDS)) {
      return;
    }

    setStepIndex((current) => Math.min(current + 1, STEPS.length - 1));
  };

  const goBack = () => {
    setStepIndex((current) => Math.max(current - 1, 0));
  };

  const submit = async (useSampleData = false) => {
    if (inFlightRef.current || !validateProfile()) {
      return;
    }

    const housingIsValid = validateCostFields(HOUSING_FIELDS);
    const carIsValid = carChoice === 'no' || validateCostFields(CAR_FIELDS);
    const everydayIsValid = validateCostFields(EVERYDAY_FIELDS);
    if (!housingIsValid || !carIsValid || !everydayIsValid) {
      return;
    }

    const income = parseMoney(monthlyIncome);
    const buffer = parseMoney(emergencyBufferGoal);
    if (!income || !buffer || Number.isNaN(income) || Number.isNaN(buffer)) {
      return;
    }

    inFlightRef.current = true;
    setIsSaving(true);
    try {
      await completeOnboarding({
        monthlyIncome: income,
        emergencyBufferGoal: buffer,
        language: selectedLanguage,
        themeMode,
        useSampleData,
        initialExpenses: useSampleData ? undefined : setupExpenses,
      });
    } finally {
      setIsSaving(false);
      inFlightRef.current = false;
    }
  };

  const renderMoneyFields = (fields: MoneyField[]) => (
    <Stack>
      {fields.map((field) => (
        <Field
          key={field.key}
          label={t(field.labelKey)}
          value={costs[field.key]}
          onChangeText={(value) => updateCost(field.key, value)}
          keyboardType="decimal-pad"
          placeholder={field.placeholder}
        />
      ))}
    </Stack>
  );

  const stepLabel = (step: OnboardingStep) => t(`onboarding.step.${step}` as const);

  return (
    <AppScreen>
      <Stack gap={4}>
        <Muted>{t('onboarding.eyebrow')}</Muted>
        <H1>{t('onboarding.title')}</H1>
        <Body>{t('onboarding.body')}</Body>
      </Stack>

      <StepIndicator steps={STEPS} currentStep={currentStep} getLabel={stepLabel} />

      <Card>
        <Stack>
          <VStack className="gap-1">
            <Muted>
              {t('onboarding.stepCount', {
                current: stepIndex + 1,
                total: STEPS.length,
              })}
            </Muted>
            <H2>{stepLabel(currentStep)}</H2>
          </VStack>

          {currentStep === 'profile' ? (
            <Stack>
              <Field
                label={t('onboarding.income')}
                value={monthlyIncome}
                onChangeText={setMonthlyIncome}
                keyboardType="decimal-pad"
                placeholder="4200"
              />
              <Field
                label={t('onboarding.buffer')}
                value={emergencyBufferGoal}
                onChangeText={setEmergencyBufferGoal}
                keyboardType="decimal-pad"
                placeholder="8000"
              />
              <Stack gap={8}>
                <Muted>{t('onboarding.language')}</Muted>
                <SegmentedControl
                  values={['en', 'de'] as AppLanguage[]}
                  selected={selectedLanguage}
                  onSelect={(next) => {
                    setSelectedLanguage(next);
                    setLanguage(next);
                  }}
                  getLabel={(value) => t(value === 'en' ? 'language.en' : 'language.de')}
                />
              </Stack>
              <Stack gap={8}>
                <Muted>{t('onboarding.theme')}</Muted>
                <SegmentedControl
                  values={['system', 'light', 'dark'] as ThemeMode[]}
                  selected={themeMode}
                  onSelect={setThemeMode}
                  getLabel={(value) => t(getThemeLabelKey(value))}
                />
              </Stack>
            </Stack>
          ) : null}

          {currentStep === 'housing' ? renderMoneyFields(HOUSING_FIELDS) : null}

          {currentStep === 'car' ? (
            <Stack>
              <Stack gap={8}>
                <Muted>{t('onboarding.car.hasCar')}</Muted>
                <SegmentedControl
                  values={['no', 'yes'] as CarChoice[]}
                  selected={carChoice}
                  onSelect={setCarChoice}
                  getLabel={(value) => t(value === 'yes' ? 'onboarding.car.yes' : 'onboarding.car.no')}
                />
              </Stack>
              {carChoice === 'yes' ? renderMoneyFields(CAR_FIELDS) : null}
            </Stack>
          ) : null}

          {currentStep === 'everyday' ? renderMoneyFields(EVERYDAY_FIELDS) : null}

          {currentStep === 'review' ? (
            <Stack>
              <Stack gap={8}>
                <SummaryRow
                  label={t('onboarding.review.income')}
                  value={formatCurrency(Number(parsedIncome || 0), 'EUR', locale)}
                />
                <SummaryRow
                  label={t('onboarding.review.expenses')}
                  value={formatCurrency(monthlyExpenseTotal, 'EUR', locale)}
                />
                <SummaryRow
                  label={t('onboarding.review.remaining')}
                  value={formatCurrency(remainingMonthly, 'EUR', locale)}
                />
                <SummaryRow label={t('onboarding.review.records')} value={String(setupExpenses.length)} />
              </Stack>

              {setupExpenses.length === 0 ? (
                <Muted>{t('onboarding.review.empty')}</Muted>
              ) : (
                <Stack gap={8}>
                  {setupExpenses.slice(0, 6).map((expense) => (
                    <HStack key={`${expense.name}-${expense.amount}`} className="justify-between gap-3">
                      <Body className="shrink font-extrabold">{expense.name}</Body>
                      <Muted>{formatCurrency(expense.amount, 'EUR', locale)}</Muted>
                    </HStack>
                  ))}
                  {setupExpenses.length > 6 ? (
                    <Muted>{t('onboarding.review.more', { count: setupExpenses.length - 6 })}</Muted>
                  ) : null}
                </Stack>
              )}
            </Stack>
          ) : null}

          <HStack className="gap-2">
            {stepIndex > 0 ? (
              <Box className="flex-1">
                <Button variant="secondary" icon={ArrowLeft} onPress={goBack} disabled={isSaving}>
                  {t('onboarding.back')}
                </Button>
              </Box>
            ) : null}
            <Box className="flex-1">
              {currentStep === 'review' ? (
                <Button icon={Check} onPress={() => submit(false)} disabled={isSaving}>
                  {isSaving ? t('common.loading') : t('onboarding.start')}
                </Button>
              ) : (
                <Button icon={ArrowRight} onPress={goNext} disabled={isSaving}>
                  {t('onboarding.next')}
                </Button>
              )}
            </Box>
          </HStack>

          {currentStep === 'review' ? (
            <Pressable
              accessibilityRole="button"
              disabled={isSaving}
              onPress={() => submit(true)}
              className="min-h-11 flex-row items-center justify-center gap-2 rounded-fin border border-fin-border px-3 py-2">
              <Database size={17} color={theme.primary} strokeWidth={2.4} />
              <Body className="font-bold text-fin-primary">{t('onboarding.samples')}</Body>
            </Pressable>
          ) : null}
        </Stack>
      </Card>
    </AppScreen>
  );
}
