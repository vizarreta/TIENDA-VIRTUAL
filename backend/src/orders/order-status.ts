export enum OrderStatus {
  PENDING_PAYMENT = 'pending_payment',
  PAID = 'paid',
  PROCESSING = 'processing',
  SHIPPED = 'shipped',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
}

export const VALID_STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  [OrderStatus.PENDING_PAYMENT]: [OrderStatus.PAID, OrderStatus.CANCELLED],
  [OrderStatus.PAID]: [OrderStatus.PROCESSING, OrderStatus.CANCELLED],
  [OrderStatus.PROCESSING]: [OrderStatus.SHIPPED, OrderStatus.CANCELLED],
  [OrderStatus.SHIPPED]: [OrderStatus.DELIVERED],
  [OrderStatus.DELIVERED]: [],
  [OrderStatus.CANCELLED]: [],
};

export function canTransition(from: OrderStatus, to: OrderStatus): boolean {
  return VALID_STATUS_TRANSITIONS[from]?.includes(to) ?? false;
}

export function getValidTransitions(from: OrderStatus): OrderStatus[] {
  return VALID_STATUS_TRANSITIONS[from] ?? [];
}

export class OrderStatusError extends Error {
  constructor(
    public readonly code: 'INVALID_STATUS_TRANSITION' | 'ORDER_NOT_FOUND',
    public readonly currentStatus: OrderStatus,
    public readonly targetStatus: OrderStatus,
  ) {
    super(`Cannot transition from ${currentStatus} to ${targetStatus}`);
    this.name = 'OrderStatusError';
  }
}