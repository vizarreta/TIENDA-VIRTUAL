import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    const products = await this.prisma.product.findMany({
      where: { isActive: true },
      include: { category: true },
      orderBy: { id: 'asc' },
    });

    // Transformar para mantener compatibilidad con el frontend
    return products.map(this.formatProduct);
  }

  async findOne(id: number) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: { category: true },
    });
    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }
    return this.formatProduct(product);
  }

  async findByCategory(category: string) {
    const products = await this.prisma.product.findMany({
      where: {
        isActive: true,
        category: { name: category },
      },
      include: { category: true },
    });
    return products.map(this.formatProduct);
  }

  async search(query: string) {
    const products = await this.prisma.product.findMany({
      where: {
        isActive: true,
        name: {
          contains: query,
          mode: 'insensitive',
        },
      },
      include: { category: true },
    });
    return products.map(this.formatProduct);
  }

  // Transforma el producto para mantener "category" como string (compatibilidad frontend)
  private formatProduct(product: any) {
    return {
      id: Number(product.id),
      name: product.name,
      description: product.description,
      price: Number(product.price),
      image: product.image,
      stock: product.stock,
      category: product.category?.name || 'Sin categoría',
      createdAt: product.createdAt,
    };
  }
}
