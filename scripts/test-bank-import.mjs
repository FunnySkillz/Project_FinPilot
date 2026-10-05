import { Buffer } from 'node:buffer';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadTs } from './test-helpers.mjs';
import { bankFileContent, normalizeTransactions, MAX_FILE_BYTES } from '../server/bank-import.mjs';
const { transactionDraft, validDraft, draftExpense, possibleDuplicate } = loadTs('utils/bank-import.ts');
const { parseMoneyInput: parseBankAmount } = loadTs('utils/form-input.ts');
const { isValidDate: validBankDate } = loadTs('utils/dates.ts');
const transaction = {
  name: 'REWE',
  merchant: 'REWE',
  amount: 1234.56,
  date: '2026-10-01',
  currency: 'EUR',
  category: 'Food',
  direction: 'debit',
  source: 'REWE -1.234,56 EUR',
};

test('German amounts and invalid monetary inputs', () => {
  assert.equal(parseBankAmount('1.234,56'), 1234.56);
  assert.equal(parseBankAmount('12,50'), 12.5);
  assert.equal(parseBankAmount('12.50'), 12.5);
  for (const input of ['', '-12', 'abc', '1,2,3', 'Infinity', '12.345', '12.34,56'])
    assert.ok(Number.isNaN(parseBankAmount(input)), input);
});
test('real calendar dates required; unknown dates are not filled with today', () => {
  assert.ok(validBankDate('2024-02-29'));
  for (const value of ['2025-02-29', '2026-02-30', '', '01.10.2026', '2026-13-01'])
    assert.equal(validBankDate(value), false);
});
test('draft defaults and confirmation guards', () => {
  const draft = transactionDraft(transaction);
  assert.equal(draft.kind, 'one-off');
  assert.equal(draft.decision, 'pending');
  assert.ok(validDraft(draft, 'EUR'));
  for (const patch of [
    { direction: 'credit' },
    { direction: 'unknown' },
    { currency: 'USD' },
    { amount: '0' },
    { date: '' },
    { name: '' },
  ])
    assert.equal(validDraft({ ...draft, ...patch }, 'EUR'), false);
  assert.equal(draftExpense(draft).cadence, undefined);
  assert.equal(draftExpense({ ...draft, kind: 'recurring', cadence: 'yearly' }).cadence, 'yearly');
});
test('duplicates flagged without silently dropping transactions', () => {
  const draft = transactionDraft(transaction);
  const existing = [{ name: 'Rewe', amount: 1234.56, startDate: '2026-10-01' }];
  assert.equal(possibleDuplicate(draft, existing), true);
  assert.equal(possibleDuplicate({ ...draft, date: '2026-10-02' }, existing), false);
  assert.equal(possibleDuplicate({ ...draft, amount: '1' }, existing), false);
});
test('uploads require explicit consent, supported type, matching bytes and bounded size', () => {
  const pdf = {
    fileData: Buffer.from('%PDF-1.4 synthetic test').toString('base64'),
    mimeType: 'application/pdf',
    cloudConsent: true,
  };
  assert.equal(bankFileContent(pdf).type, 'input_file');
  assert.throws(() => bankFileContent({ ...pdf, cloudConsent: false }), { status: 403 });
  assert.throws(() => bankFileContent({ ...pdf, cloudConsent: undefined }), { status: 403 });
  assert.throws(() => bankFileContent({ ...pdf, mimeType: 'image/png' }), { status: 400 });
  assert.throws(() => bankFileContent({ ...pdf, fileData: 'A'.repeat(Math.ceil(MAX_FILE_BYTES / 3) * 4 + 4) }), {
    status: 413,
  });
  const png = {
    cloudConsent: true,
    mimeType: 'image/png',
    fileData: Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]).toString('base64'),
  };
  assert.equal(bankFileContent(png).type, 'input_image');
});
test('model output stays reviewable, missing or invalid values do not become expenses', () => {
  const result = normalizeTransactions({
    transactions: [{ ...transaction, amount: -4, category: 'made up', direction: 'something', date: null }],
  });
  assert.equal(result[0].amount, null);
  assert.equal(result[0].category, 'Other');
  assert.equal(result[0].direction, 'unknown');
  assert.equal(result[0].date, '');
  assert.equal(normalizeTransactions({ transactions: [] }).length, 0);
  assert.throws(() => normalizeTransactions({ error: 'too_many_transactions' }));
  assert.throws(() => normalizeTransactions({ transactions: Array(201).fill(transaction) }));
  assert.throws(() => normalizeTransactions({ transactions: [null] }));
});

let outboundCalls = 0;
const serviceExports = loadTs('services/bank-import-service.ts', {
  'react-native': { Platform: { OS: 'ios' } },
  'expo-document-picker': {},
  'expo-image-picker': {},
  'expo-clipboard': {},
  'expo-file-system': {},
  './ai-gateway-service': {
    aiGatewayService: {
      importTransactions: async (input) => {
        outboundCalls++;
        assert.equal(input.cloudConsent, true);
        return { transactions: [] };
      },
    },
  },
});
test('client never uploads without both settings consent and explicit file confirmation', async () => {
  const file = { uri: '', name: 'test.pdf', mimeType: 'application/pdf', base64: 'JVBERi0=' };
  const ai = { cloudEnabled: true, cloudDocumentConsent: true, ocrMode: 'hybrid' };
  for (const settings of [
    { ...ai, cloudEnabled: false },
    { ...ai, cloudDocumentConsent: false },
    { ...ai, ocrMode: 'native' },
    { ...ai, ocrMode: 'off' },
  ]) {
    await assert.rejects(() => serviceExports.extractBankTransactions(file, 'de', settings, true));
  }
  await assert.rejects(() => serviceExports.extractBankTransactions(file, 'de', ai, false));
  assert.equal(outboundCalls, 0);
  await serviceExports.extractBankTransactions(file, 'de', ai, true);
  assert.equal(outboundCalls, 1);
});
