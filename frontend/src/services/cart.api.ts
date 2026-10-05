import type { CartItem as SharedCartItem } from '@tienda-virtual/shared-types';
import { httpClient } from './http-client';
import { PaginatedResponse } from './common.types';

export type CartItem = SharedCartItem;
export type { PaginatedResponse } from './common.types';

export interface CartSnapshot {
  items: CartItem[];
}
type MutationResult = { success: boolean };

function unwrap<T>(promise: Promise<{ data: T }>): Promise<T> {
  return promise.then((response) => response.data);
}

/** @returns Carrito de la sesion actual, sin inventar campos ausentes en la API. */
export const getCart = () => unwrap(httpClient.get<PaginatedResponse<CartItem>>('/cart'));
/** @param productId Producto activo. @param quantity Cantidad entera positiva. */
export const addToCart = (productId: number, quantity: number) =>
  unwrap(httpClient.post<CartItem[]>('/cart', { productId, quantity }));
export const removeFromCart = (cartItemId: number) =>
  unwrap(httpClient.delete<MutationResult>(`/cart/${cartItemId}`));
export const updateCartQuantity = (cartItemId: number, quantity: number) =>
  unwrap(httpClient.patch<CartItem[]>(`/cart/${cartItemId}`, { quantity }));
export const clearCart = () => unwrap(httpClient.delete<MutationResult>('/cart/clear'));
