import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto } from './orders.dto';
import { OrderInventoryService } from './order-inventory.service';
import {
  calculateOrderPricing,
  OrderPricingError,
  ORDER_CURRENCY,
  OrderPricingItem,
  OrderPricing,
} from './order-pricing';
import {
  OrderStatus,
  canTransition,
  OrderStatusError,
} from './order-status';

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly inventory: OrderInventoryService
  ) {}

  /** @param userId Propietario autenticado. @returns Sus pedidos, del mas reciente al mas antiguo. */
  list(userId: string) {
    return this.prisma.order.findMany({
      where: { userId },
      include: { items: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * @param userId Propietario autenticado.
   * @param sessionId Sesion del carrito.
   * @param dto Datos de entrega y clave de idempotencia.
   * @returns Pedido confirmado en la base de datos, con pago pendiente.
   */
  async create(userId: string, sessionId: string, dto: CreateOrderDto) {
    return this.prisma.transaction(async (tx) => {
      const cart = await tx.cart.upsert({
        where: { sessionId },
        create: { sessionId },
        update: { updatedAt: new Date() },
      });
      const previous = await tx.order.findUnique({
        where: { userId_requestId: { userId, requestId: dto.requestId } },
        include: { items: true },
      });
      if (previous) return previous;
      const cartItems = await tx.cartItem.findMany({
        where: { cartId: cart.id },
        include: { product: true },
      });
      const pricing = this.priceOrder(cartItems);
      await this.inventory.reserve(tx, pricing.items);
      const order = await tx.order.create({
        data: {
          userId,
          requestId: dto.requestId,
          customerName: dto.customerName,
          shippingAddress: dto.shippingAddress,
          totalCents: pricing.totalCents,
          currency: ORDER_CURRENCY,
          status: OrderStatus.PENDING_PAYMENT,
          items: { create: pricing.items },
        },
        include: { items: true },
      });
      await tx.cartItem.deleteMany({ where: { cartId: cart.id } });
      return order;
    });
  }

  /** @param userId Propietario. @param id Pedido. @returns Cancelacion con restitucion unica. */
  async cancel(userId: string, id: string) {
    return this.transitionStatus(userId, id, OrderStatus.CANCELLED);
  }

  async transitionStatus(userId: string, id: string, targetStatus: OrderStatus) {
    return this.prisma.transaction(async (tx) => {
      const order = await tx.order.findFirst({ where: { id, userId }, include: { items: true } });
      if (!order) throw new NotFoundException('ORDER_NOT_FOUND');

      const currentStatus = order.status as OrderStatus;
      if (!canTransition(currentStatus, targetStatus)) {
        throw new BadRequestException(
          `Cannot transition from ${currentStatus} to ${targetStatus}`
        );
      }

      if (currentStatus === targetStatus) return order;

      const changed = await tx.order.updateMany({
        where: { id, userId, status: currentStatus },
        data: { status: targetStatus },
      });

      if (!changed.count) {
        const refreshed = await tx.order.findFirst({ where: { id, userId } });
        if (refreshed?.status === targetStatus) return refreshed;
        throw new BadRequestException('ORDER_STATUS_CHANGED_CONCURRENTLY');
      }

      if (targetStatus === OrderStatus.CANCELLED) {
        await this.inventory.restore(tx, order.items);
      }

      return tx.order.findFirst({ where: { id, userId }, include: { items: true } });
    });
  }

  async markAsPaid(userId: string, id: string) {
    return this.transitionStatus(userId, id, OrderStatus.PAID);
  }

  async markAsProcessing(userId: string, id: string) {
    return this.transitionStatus(userId, id, OrderStatus.PROCESSING);
  }

  async markAsShipped(userId: string, id: string) {
    return this.transitionStatus(userId, id, OrderStatus.SHIPPED);
  }

  async markAsDelivered(userId: string, id: string) {
    return this.transitionStatus(userId, id, OrderStatus.DELIVERED);
  }

  private priceOrder(items: readonly OrderPricingItem[]): OrderPricing {
    try {
      return calculateOrderPricing(items);
    } catch (error: unknown) {
      if (error instanceof OrderPricingError) throw new BadRequestException(error.code);
      throw error;
    }
  }
}
