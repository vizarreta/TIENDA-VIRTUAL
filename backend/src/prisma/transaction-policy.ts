export const TRANSACTION_POLICY = {
  maxRetries: 4,
  maxWaitMs: 10_000,
  timeoutMs: 10_000,
  retryDelayMs: 50,
} as const;

const RETRYABLE_CODES = new Set(['P2034', 'P1008', 'P2028', 'P2002']);

/** @returns true solo para conflictos conocidos; errores desconocidos no se ocultan. */
export function isRetryableTransactionError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    typeof error.code === 'string' &&
    RETRYABLE_CODES.has(error.code)
  );
}
