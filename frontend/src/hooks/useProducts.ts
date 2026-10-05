import { useQuery } from '@tanstack/react-query';
import { getProducts, searchProducts, getProduct, getProductsByCategory, type ProductsQuery, type PaginatedResponse, type CatalogProduct } from '../services/products.api';

export interface UseProductsOptions extends ProductsQuery {
  searchTerm?: string;
  categoryName?: string;
}

/** @returns Consulta cacheada del catálogo con paginación y filtros. */
export function useProducts(options: UseProductsOptions = {}) {
  const { searchTerm, categoryName, page = 1, limit = 20, ...filters } = options;
  
  const queryKey = searchTerm 
    ? ['products', 'search', searchTerm, page, limit]
    : categoryName
      ? ['products', 'category', categoryName, page, limit, filters]
      : ['products', 'list', page, limit, filters];

  const queryFn = searchTerm
    ? () => searchProducts(searchTerm, { page, limit })
    : categoryName
      ? () => getProductsByCategory(categoryName, { page, limit, ...filters })
      : () => getProducts({ page, limit, ...filters });

  return useQuery<PaginatedResponse<CatalogProduct>>({
    queryKey,
    queryFn,
    refetchOnMount: 'always',
    enabled: true,
  });
}

/** @param id Identificador de producto. @returns Consulta de su ficha pública. */
export function useProduct(id: number) {
  return useQuery({
    queryKey: ['product', id],
    queryFn: () => getProduct(id),
    enabled: !!id,
  });
}
