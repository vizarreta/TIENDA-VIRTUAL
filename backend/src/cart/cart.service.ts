import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CartService {
  constructor(private prisma: PrismaService) {}

  async getCart(sessionId: string) {
    const items = await this.prisma.cartItem.findMany({
      where: { cart: { sessionId } },
      include: { product: { include: { category: true } } },
      orderBy: { id: 'asc' },
    });
    return items.map((item) => ({
      ...item,
      product: { ...item.product, category: item.product.category?.name || '' },
    }));
  }

  async addToCart(sessionId: string, productId: number, quantity = 1) {
    this.checkQuantity(quantity);
    await this.prisma.transaction(async (tx) => {
      // Acquire SQLite's write lock before reading quantities and stock.
      const cart = await tx.cart.upsert({
        where: { sessionId },
        create: { sessionId },
        update: { updatedAt: new Date() },
      });
      const product = await tx.product.findUnique({ where: { id: productId } });
      if (!product || !product.isActive) throw new NotFoundException('PRODUCT_UNAVAILABLE');
      const item = await tx.cartItem.upsert({
        where: { cartId_productId: { cartId: cart.id, productId } },
        create: { cartId: cart.id, productId, quantity },
        update: { quantity: { increment: quantity } },
      });
      if (item.quantity > product.stock) throw new BadRequestException('INSUFFICIENT_STOCK');
    });
    return this.getCart(sessionId);
  }

  async updateQuantity(sessionId: string, cartItemId: number, quantity: number) {
    this.checkQuantity(quantity);
    await this.prisma.transaction(async (tx) => {
      await tx.cart.updateMany({ where: { sessionId }, data: { updatedAt: new Date() } });
      const item = await tx.cartItem.findFirst({
        where: { id: cartItemId, cart: { sessionId } },
        include: { product: true },
      });
      if (!item) throw new NotFoundException('CART_ITEM_NOT_FOUND');
      if (!item.product.isActive) throw new BadRequestException('PRODUCT_UNAVAILABLE');
      if (quantity > item.product.stock) throw new BadRequestException('INSUFFICIENT_STOCK');
      await tx.cartItem.update({ where: { id: item.id }, data: { quantity } });
    });
    return this.getCart(sessionId);
  }

  async removeFromCart(sessionId: string, cartItemId: number) {
    const result = await this.prisma.cartItem.deleteMany({
      where: { id: cartItemId, cart: { sessionId } },
    });
    if (!result.count) throw new NotFoundException('CART_ITEM_NOT_FOUND');
    return { success: true };
  }

  async clearCart(sessionId: string) {
    await this.prisma.cartItem.deleteMany({ where: { cart: { sessionId } } });
    return { success: true };
  }

  async getCartTotal(sessionId: string) {
    const items = await this.getCart(sessionId);
    return (
      items.reduce(
        (total, item) => total + Math.round(item.product.price * 100) * item.quantity,
        0
      ) / 100
    );
  }

  private checkQuantity(quantity: number) {
    if (!Number.isSafeInteger(quantity) || quantity < 1)
      throw new BadRequestException('INVALID_QUANTITY');
  }
}
