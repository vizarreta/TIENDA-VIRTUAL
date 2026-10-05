const CENTS_PER_UNIT = 100;
// Prisma Int is stored as a signed 32-bit value.
const MAX_ORDER_TOTAL_CENTS = 2_147_483_647;
export const ORDER_CURRENCY = 'PEN';

export interface OrderPricingItem {
  productId: number;
  quantity: number;
  product: { name: string; price: number };
}

export interface PricedOrderItem {
  productId: number;
  productName: string;
  unitPriceCents: number;
  quantity: number;
}

export interface OrderPricing {
  totalCents: number;
  items: PricedOrderItem[];
}

export class OrderPricingError extends Error {
  constructor(public readonly code: 'EMPTY_CART' | 'INVALID_ORDER') {
    super(code);
    this.name = 'OrderPricingError';
  }
}

/**
 * @param cartItems Instantanea de productos y cantidades, sin acceso a la base de datos.
 * @returns Lineas e importe en centimos, calculados en O(n).
 * @throws {OrderPricingError} Si el carrito esta vacio o sus importes no son representables.
 */
export function calculateOrderPricing(cartItems: readonly OrderPricingItem[]): OrderPricing {
  if (!cartItems.length) throw new OrderPricingError('EMPTY_CART');
  const items = cartItems.map((item): PricedOrderItem => {
    const unitPriceCents = Math.round(item.product.price * CENTS_PER_UNIT);
    if (
      !Number.isSafeInteger(unitPriceCents) ||
      unitPriceCents <= 0 ||
      !Number.isSafeInteger(item.quantity) ||
      item.quantity < 1
    ) {
      throw new OrderPricingError('INVALID_ORDER');
    }
    return {
      productId: item.productId,
      productName: item.product.name,
      unitPriceCents,
      quantity: item.quantity,
    };
  });
  const totalCents = items.reduce((total, item) => total + item.unitPriceCents * item.quantity, 0);
  if (!Number.isSafeInteger(totalCents) || totalCents > MAX_ORDER_TOTAL_CENTS) {
    throw new OrderPricingError('INVALID_ORDER');
  }
  return { items, totalCents };
}
