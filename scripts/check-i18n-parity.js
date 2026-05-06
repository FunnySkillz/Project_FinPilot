const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');

function extractKeys(file) {
  const text = fs.readFileSync(path.join(root, file), 'utf8');
  return [...text.matchAll(/'([^']+)':/g)].map((match) => match[1]).sort();
}

const enKeys = extractKeys('i18n/messages/en.ts');
const deKeys = extractKeys('i18n/messages/de.ts');

const missing = enKeys.filter((key) => !deKeys.includes(key));
const extra = deKeys.filter((key) => !enKeys.includes(key));

if (missing.length || extra.length) {
  console.error('i18n dictionary parity failed.');
  if (missing.length) {
    console.error(`Missing in German: ${missing.join(', ')}`);
  }
  if (extra.length) {
    console.error(`Extra in German: ${extra.join(', ')}`);
  }
  process.exit(1);
}

console.log('i18n dictionary parity passed.');

