import axios from 'axios';

export function apiError(error: unknown): string {
  if (!axios.isAxiosError(error) || !error.response) return 'network';
  const message = error.response.data?.message;
  const messages: Record<string, string> = {
    INSUFFICIENT_STOCK: 'stock',
    PRODUCT_UNAVAILABLE: 'unavailable',
    EMAIL_IN_USE: 'emailInUse',
    EMPTY_CART: 'emptyCart',
    INVALID_CREDENTIALS: 'credentials',
  };
  if (typeof message === 'string' && messages[message]) return messages[message];
  if (error.response.status === 401) return 'session';
  if (error.response.status === 403) return 'forbidden';
  if (error.response.status === 400) return 'invalid';
  return 'failed';
}
