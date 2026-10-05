/** Compatibility exports. New modules should import their domain API directly. */
export * from './products.api';
export * from './cart.api';
export * from './auth.api';
export * from './orders.api';
export { setAuthToken, resetCartSession } from './session-storage';
export { httpClient as default } from './http-client';
