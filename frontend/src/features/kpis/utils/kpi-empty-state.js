const EMPTY_VALUES = new Set(['', 'NA', 'N/A', '--', '-', '—', '–']);

export const cleanKpiValue = (value) => String(value ?? '')
  .replace(/\u2003/g, ' ')
  .replace(/<br\s*\/?>/gi, ' ')
  .replace(/\s+/g, ' ')
  .trim();

export const isEmptyKpiValue = (value) => EMPTY_VALUES.has(cleanKpiValue(value).toUpperCase());

export const isKpiWithoutData = (row) => {
  const resultIsMissing = isEmptyKpiValue(row?.resultadoRaw);
  if (!resultIsMissing) return false;

  return [
    row?.objetivoRaw,
    row?.valorRealRaw,
    row?.parametrosRaw
  ].every(isEmptyKpiValue);
};
