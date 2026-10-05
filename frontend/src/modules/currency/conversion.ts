export const MAX_CONVERSION_AMOUNT = 1_000_000;
export const DEFAULT_CONVERSION_AMOUNT = '100';
const AMOUNT_PATTERN = /^\d+(?:[.,]\d{1,2})?$/;

/** Parses a nonnegative amount with at most two decimals; invalid input returns null. */
export function parseConversionAmount(input: string): number | null {
  const normalized = input.trim();
  if (!AMOUNT_PATTERN.test(normalized)) return null;
  const amount = Number(normalized.replace(',', '.'));
  return Number.isFinite(amount) && amount <= MAX_CONVERSION_AMOUNT ? amount : null;
}

/** Calculates an estimate; accounting and order totals remain in PEN on the backend. */
export function convertAmount(amount: number, rate: number): number {
  if (
    !Number.isFinite(amount) ||
    amount < 0 ||
    amount > MAX_CONVERSION_AMOUNT ||
    !Number.isFinite(rate) ||
    rate <= 0 ||
    !Number.isFinite(amount * rate)
  ) {
    throw new RangeError('Invalid conversion amount or rate');
  }
  return amount * rate;
}
