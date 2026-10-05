export const EXCHANGE_RATES_URL = 'https://open.er-api.com/v6/latest/PEN';
export const EXCHANGE_TIMEOUT_MS = 10_000;
const MAX_SUPPORTED_RATE = 1_000_000;
export const TARGET_CURRENCIES = ['USD', 'EUR', 'BRL'] as const;
export type TargetCurrency = (typeof TARGET_CURRENCIES)[number];
export type ExchangeErrorCode =
  'network' | 'timeout' | 'rateLimit' | 'unavailable' | 'invalidResponse';

export interface ExchangeRates {
  base: 'PEN';
  updatedAt: number;
  nextUpdateAt: number;
  rates: Record<TargetCurrency, number>;
}

export class ExchangeRatesError extends Error {
  constructor(public readonly code: ExchangeErrorCode) {
    super(code);
    this.name = 'ExchangeRatesError';
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isPositiveNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0;
}

function isTimestamp(value: unknown): value is number {
  return isPositiveNumber(value) && Number.isInteger(value) && value <= 8_640_000_000_000;
}

/** Validates untrusted provider JSON and returns only the fields used by the store. */
export function parseExchangeRates(value: unknown): ExchangeRates {
  if (
    !isRecord(value) ||
    value.result !== 'success' ||
    value.base_code !== 'PEN' ||
    !isTimestamp(value.time_last_update_unix) ||
    !isTimestamp(value.time_next_update_unix) ||
    value.time_next_update_unix <= value.time_last_update_unix ||
    !isRecord(value.rates) ||
    value.rates.PEN !== 1
  ) {
    throw new ExchangeRatesError('invalidResponse');
  }
  const rates = value.rates;
  if (
    !isPositiveNumber(rates.USD) ||
    !isPositiveNumber(rates.EUR) ||
    !isPositiveNumber(rates.BRL) ||
    rates.USD > MAX_SUPPORTED_RATE ||
    rates.EUR > MAX_SUPPORTED_RATE ||
    rates.BRL > MAX_SUPPORTED_RATE
  ) {
    throw new ExchangeRatesError('invalidResponse');
  }
  return {
    base: 'PEN',
    updatedAt: value.time_last_update_unix * 1000,
    nextUpdateAt: value.time_next_update_unix * 1000,
    rates: { USD: rates.USD, EUR: rates.EUR, BRL: rates.BRL },
  };
}

/** Fetches public PEN rates, with cancellation and a timeout, without store credentials. */
export async function getExchangeRates(signal?: AbortSignal): Promise<ExchangeRates> {
  const controller = new AbortController();
  const cancel = () => controller.abort();
  let timedOut = false;
  if (signal?.aborted) controller.abort();
  signal?.addEventListener('abort', cancel, { once: true });
  const timeout = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, EXCHANGE_TIMEOUT_MS);

  try {
    // The internal HTTP client adds session headers; external requests must never use it.
    const response = await fetch(EXCHANGE_RATES_URL, {
      signal: controller.signal,
      credentials: 'omit',
      referrerPolicy: 'no-referrer',
      headers: { Accept: 'application/json' },
    });
    if (!response.ok) {
      throw new ExchangeRatesError(response.status === 429 ? 'rateLimit' : 'unavailable');
    }
    const payload: unknown = await response.json();
    return parseExchangeRates(payload);
  } catch (error) {
    if (signal?.aborted) throw error;
    if (timedOut) throw new ExchangeRatesError('timeout');
    if (error instanceof ExchangeRatesError) throw error;
    if (error instanceof SyntaxError) throw new ExchangeRatesError('invalidResponse');
    throw new ExchangeRatesError('network');
  } finally {
    clearTimeout(timeout);
    signal?.removeEventListener('abort', cancel);
  }
}
