import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductsQueryDto, SearchProductsDto, PaginatedResult } from './dto/search-products.dto';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  categories() {
    return this.prisma.category.findMany({ orderBy: { name: 'asc' } });
  }

  async findAll(query: ProductsQueryDto): Promise<PaginatedResult<any>> {
    const { page = 1, limit = 20, categoryId, minPrice, maxPrice, inStock, sortBy = 'id', sortOrder = 'asc' } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.ProductWhereInput = {
      isActive: true,
      ...(categoryId && { categoryId }),
      ...(minPrice !== undefined && { price: { gte: minPrice } }),
      ...(maxPrice !== undefined && { price: { lte: maxPrice } }),
      ...(inStock && { stock: { gt: 0 } }),
    };

    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        include: { category: true },
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: limit,
      }),
      this.prisma.product.count({ where }),
    ]);

    return {
      items: products.map(this.formatProduct),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findAllAdmin(query: ProductsQueryDto): Promise<PaginatedResult<any>> {
    const { page = 1, limit = 20, categoryId, minPrice, maxPrice, inStock, sortBy = 'id', sortOrder = 'asc' } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.ProductWhereInput = {
      ...(categoryId && { categoryId }),
      ...(minPrice !== undefined && { price: { gte: minPrice } }),
      ...(maxPrice !== undefined && { price: { lte: maxPrice } }),
      ...(inStock && { stock: { gt: 0 } }),
    };

    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        include: { category: true },
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: limit,
      }),
      this.prisma.product.count({ where }),
    ]);

    return {
      items: products.map(this.formatProduct),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: number) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: { category: true },
    });
    if (!product || !product.isActive) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }
    return this.formatProduct(product);
  }

  async findByCategory(category: string, query: ProductsQueryDto): Promise<PaginatedResult<any>> {
    const { page = 1, limit = 20, minPrice, maxPrice, inStock, sortBy = 'id', sortOrder = 'asc' } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.ProductWhereInput = {
      isActive: true,
      category: { name: category },
      ...(minPrice !== undefined && { price: { gte: minPrice } }),
      ...(maxPrice !== undefined && { price: { lte: maxPrice } }),
      ...(inStock && { stock: { gt: 0 } }),
    };

    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        include: { category: true },
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: limit,
      }),
      this.prisma.product.count({ where }),
    ]);

    return {
      items: products.map(this.formatProduct),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async search(query: SearchProductsDto): Promise<PaginatedResult<any>> {
    const { page = 1, limit = 20, q, sortBy = 'id', sortOrder = 'asc' } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.ProductWhereInput = {
      isActive: true,
      OR: [{ name: { contains: q } }, { description: { contains: q } }],
    };

    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        include: { category: true },
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: limit,
      }),
      this.prisma.product.count({ where }),
    ]);

    return {
      items: products.map(this.formatProduct),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async create(dto: CreateProductDto) {
    const product = await this.writeProduct(() =>
      this.prisma.product.create({
        data: {
          name: dto.name,
          description: dto.description,
          price: dto.price,
          image: dto.image,
          stock: dto.stock,
          categoryId: dto.categoryId,
          isActive: dto.isActive,
        },
        include: { category: true },
      })
    );
    return this.formatProduct(product);
  }

  async update(id: number, dto: UpdateProductDto) {
    const product = await this.writeProduct(() =>
      this.prisma.product.update({
        where: { id },
        data: {
          name: dto.name,
          description: dto.description,
          price: dto.price,
          image: dto.image,
          stock: dto.stock,
          categoryId: dto.categoryId,
          isActive: dto.isActive,
        },
        include: { category: true },
      })
    );
    return this.formatProduct(product);
  }

  async delete(id: number) {
    await this.writeProduct(() => this.prisma.product.delete({ where: { id } }));
    return { message: 'Product deleted successfully' };
  }

  private async writeProduct<T>(operation: () => Promise<T>): Promise<T> {
    try {
      return await operation();
    } catch (error: unknown) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2003') throw new BadRequestException('INVALID_CATEGORY');
        if (error.code === 'P2025') throw new NotFoundException('PRODUCT_UNAVAILABLE');
      }
      throw error;
    }
  }

  private formatProduct(product: {
    id: number | bigint;
    name: string;
    description: string | null;
    price: number | string;
    image: string | null;
    stock: number;
    isActive: boolean;
    category: { name: string } | null;
    categoryId?: number | null;
    createdAt: Date;
  }) {
    return {
      id: Number(product.id),
      name: product.name,
      description: product.description,
      price: Number(product.price),
      image: product.image,
      stock: product.stock,
      isActive: product.isActive,
      category: product.category?.name || 'Sin categoría',
      categoryId: product.categoryId,
      createdAt: product.createdAt,
    };
  }
}
