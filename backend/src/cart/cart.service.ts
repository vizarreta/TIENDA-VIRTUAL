import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CartService {
  constructor(private prisma: PrismaService) {}

  // Busca o crea un carrito para la sesión dada
  private async getOrCreateCart(sessionId: string) {
    let cart = await this.prisma.cart.findFirst({
      where: { sessionId },
    });

    if (!cart) {
      cart = await this.prisma.cart.create({
        data: { sessionId },
      });
    }

    return cart;
  }

  async getCart(sessionId: string) {
    const cart = await this.getOrCreateCart(sessionId);

    const items = await this.prisma.cartItem.findMany({
      where: { cartId: cart.id },
      include: {
        product: {
          include: { category: true },
        },
      },
    });

    // Transformar para compatibilidad con el frontend
    return items.map((item) => ({
      id: Number(item.id),
      quantity: item.quantity,
      productId: Number(item.productId),
      product: {
        id: Number(item.product.id),
        name: item.product.name,
        description: item.product.description,
        price: Number(item.product.price),
        image: item.product.image,
        stock: item.product.stock,
        category: item.product.category?.name || 'Sin categoría',
      },
    }));
  }

  async addToCart(sessionId: string, productId: number, quantity: number) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${productId} not found`);
    }

    if (product.stock < quantity) {
      throw new BadRequestException('Not enough stock available');
    }

    const cart = await this.getOrCreateCart(sessionId);

    // Buscar si ya existe el producto en el carrito
    const existingItem = await this.prisma.cartItem.findFirst({
      where: { cartId: cart.id, productId },
    });

    if (existingItem) {
      const newQuantity = existingItem.quantity + quantity;
      if (product.stock < newQuantity) {
        throw new BadRequestException('Not enough stock available');
      }
      await this.prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: newQuantity },
      });
    } else {
      await this.prisma.cartItem.create({
        data: {
          cartId: cart.id,
          productId,
          quantity,
        },
      });
    }

    return this.getCart(sessionId);
  }

  async removeFromCart(sessionId: string, cartItemId: number) {
    const cart = await this.getOrCreateCart(sessionId);

    const cartItem = await this.prisma.cartItem.findUnique({
      where: { id: cartItemId },
    });

    if (!cartItem || cartItem.cartId !== cart.id) {
      throw new NotFoundException('Cart item not found in this session');
    }

    await this.prisma.cartItem.delete({
      where: { id: cartItemId },
    });

    return { success: true };
  }

  async updateQuantity(sessionId: string, cartItemId: number, quantity: number) {
    const cart = await this.getOrCreateCart(sessionId);

    const cartItem = await this.prisma.cartItem.findUnique({
      where: { id: cartItemId },
      include: { product: true },
    });

    if (!cartItem || cartItem.cartId !== cart.id) {
      throw new NotFoundException('Cart item not found in this session');
    }

    if (cartItem.product.stock < quantity) {
      throw new BadRequestException('Not enough stock available');
    }

    await this.prisma.cartItem.update({
      where: { id: cartItemId },
      data: { quantity },
    });

    return this.getCart(sessionId);
  }

  async clearCart(sessionId: string) {
    const cart = await this.getOrCreateCart(sessionId);

    await this.prisma.cartItem.deleteMany({
      where: { cartId: cart.id },
    });

    return { success: true };
  }

  async getCartTotal(sessionId: string) {
    const items = await this.getCart(sessionId);
    return items.reduce((total, item) => total + (item.quantity * item.product.price), 0);
  }
}
