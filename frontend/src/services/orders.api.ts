import type { CheckoutInput, SavedOrder } from '@tienda-virtual/shared-types';
import { httpClient } from './http-client';

/** @param data Checkout con requestId estable. @returns Pedido creado o ya existente. */
export const createOrder = (data: CheckoutInput) => httpClient.post<SavedOrder>('/orders', data);
export const getOrders = () => httpClient.get<SavedOrder[]>('/orders');
/** @param id Pedido del usuario actual. @returns Pedido cancelado sin doble restitucion. */
export const cancelOrder = (id: string) => httpClient.post<SavedOrder>(`/orders/${id}/cancel`);
