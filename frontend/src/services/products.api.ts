import type { Category, Product } from '@tienda-virtual/shared-types';
import { httpClient } from './http-client';
import { PaginatedResponse } from './common.types';

export type CatalogProduct = Product & { category: string };
export type ProductInput = Pick<Product, 'name' | 'price' | 'stock'> &
  Partial<Pick<Product, 'description' | 'image' | 'categoryId' | 'isActive'>>;
export type { PaginatedResponse } from './common.types';

export interface ProductsQuery {
  page?: number;
  limit?: number;
  categoryId?: number;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  sortBy?: 'name' | 'price' | 'createdAt' | 'id';
  sortOrder?: 'asc' | 'desc';
}

function unwrap<T>(promise: Promise<{ data: T }>): Promise<T> {
  return promise.then((response) => response.data);
}

/** @returns Productos públicos activos con paginación y filtros. */
export const getProducts = (params?: ProductsQuery) =>
  unwrap(httpClient.get<PaginatedResponse<CatalogProduct>>('/products', { params }));

/** @param query Texto de búsqueda. @returns Productos coincidentes con paginación. */
export const searchProducts = (query: string, params?: Omit<ProductsQuery, 'categoryId' | 'minPrice' | 'maxPrice' | 'inStock'>) =>
  unwrap(httpClient.get<PaginatedResponse<CatalogProduct>>('/products/search', { params: { q: query, ...params } }));

/** @param id Identificador del producto. @returns Ficha pública. */
export const getProduct = (id: number) => unwrap(httpClient.get<CatalogProduct>(`/products/${id}`));

/** @returns Productos por categoría con paginación y filtros. */
export const getProductsByCategory = (categoryName: string, params?: Omit<ProductsQuery, 'categoryId'>) =>
  unwrap(httpClient.get<PaginatedResponse<CatalogProduct>>(`/products/category/${encodeURIComponent(categoryName)}`, { params }));

export const getAdminProducts = (params?: ProductsQuery) =>
  unwrap(httpClient.get<PaginatedResponse<CatalogProduct>>('/products/admin', { params }));

export const getCategories = () => unwrap(httpClient.get<Category[]>('/products/categories'));

/** @param data Campos editables, sin identificadores ni fechas del servidor. */
export const createProduct = (data: ProductInput) =>
  unwrap(httpClient.post<CatalogProduct>('/products', data));

export const updateProduct = (id: number, data: Partial<ProductInput>) =>
  unwrap(httpClient.patch<CatalogProduct>(`/products/${id}`, data));

export const deleteProduct = (id: number) =>
  unwrap(httpClient.delete<{ message: string }>(`/products/${id}`));
