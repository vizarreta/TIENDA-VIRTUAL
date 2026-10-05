import { v4 as uuid } from 'uuid';

const STORAGE_KEYS = {
  accessToken: 'access_token',
  cartSession: 'x-session-id',
  checkoutRequest: 'checkout-request-id',
} as const;

export const CART_SESSION_CHANGED = 'cart-session-changed';

/** @returns {string | null} Token local; no realiza solicitudes de red. */
export function getAuthToken(): string | null {
  return localStorage.getItem(STORAGE_KEYS.accessToken);
}

/** @param token Token recibido del servidor, o null para cerrar la sesion. */
export function setAuthToken(token: string | null): void {
  if (token) localStorage.setItem(STORAGE_KEYS.accessToken, token);
  else localStorage.removeItem(STORAGE_KEYS.accessToken);
}

/** @returns {string} UUID persistente compartido por todos los clientes del carrito. */
export function getCartSessionId(): string {
  const existing = localStorage.getItem(STORAGE_KEYS.cartSession);
  if (existing) return existing;
  const sessionId = uuid();
  localStorage.setItem(STORAGE_KEYS.cartSession, sessionId);
  return sessionId;
}

/** @returns {string} Clave estable para reintentar un checkout sin duplicar pedidos. */
export function getCheckoutRequestId(): string {
  const existing = sessionStorage.getItem(STORAGE_KEYS.checkoutRequest);
  if (existing) return existing;
  const requestId = uuid();
  sessionStorage.setItem(STORAGE_KEYS.checkoutRequest, requestId);
  return requestId;
}

/** Invalida el intento de checkout cuando cambia el contenido del carrito. */
export function clearCheckoutRequest(): void {
  sessionStorage.removeItem(STORAGE_KEYS.checkoutRequest);
}

/** Aisla el siguiente usuario del carrito de la sesion anterior. */
export function resetCartSession(): void {
  localStorage.setItem(STORAGE_KEYS.cartSession, uuid());
  clearCheckoutRequest();
  window.dispatchEvent(new Event(CART_SESSION_CHANGED));
}
