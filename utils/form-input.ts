export function parseMoneyInput(value: string) {
  const cleaned = value.trim().replace(/[\s€]/g, '');
  if (cleaned.includes(',') && !/^(?:\d+|\d{1,3}(?:\.\d{3})+),\d{1,2}$/.test(cleaned)) return NaN;
  const normalized = cleaned.includes(',') ? cleaned.replace(/\./g, '').replace(',', '.') : cleaned;
  return /^(?:\d+)(?:\.\d{1,2})?$/.test(normalized) ? Number(normalized) : NaN;
}

export function parseTags(value: string) {
  return value
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean);
}
