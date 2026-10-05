import { BadRequestException, Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';

interface InventoryItem {
  productId: number;
  quantity: number;
}

@Injectable()
export class OrderInventoryService {
  /**
   * @param transaction Transaccion del pedido; esta clase nunca abre otra transaccion.
   * @param items Cantidades ya validadas por el calculo del pedido.
   * @returns Promesa sin valor; rechaza si no puede reservar todas las unidades.
   */
  async reserve(
    transaction: Prisma.TransactionClient,
    items: readonly InventoryItem[]
  ): Promise<void> {
    for (const item of items) {
      const updated = await transaction.product.updateMany({
        where: { id: item.productId, isActive: true, stock: { gte: item.quantity } },
        data: { stock: { decrement: item.quantity } },
      });
      if (updated.count !== 1) throw new BadRequestException('INSUFFICIENT_STOCK');
    }
  }

  /**
   * @param transaction Transaccion que cambio el pedido a cancelado.
   * @param items Lineas del pedido; los productos eliminados no se recrean.
   * @returns Promesa que finaliza al restituir existencias.
   */
  async restore(
    transaction: Prisma.TransactionClient,
    items: readonly InventoryItem[]
  ): Promise<void> {
    for (const item of items) {
      await transaction.product.updateMany({
        where: { id: item.productId },
        data: { stock: { increment: item.quantity } },
      });
    }
  }
}
