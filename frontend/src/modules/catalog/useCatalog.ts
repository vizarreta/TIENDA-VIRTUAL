import { useEffect, useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useProducts } from '../../hooks/useProducts';
import { apiError } from '../../utils/apiError';
import { CATALOG_CHANGED } from './catalog-events';
import {
  CatalogFilters,
  DEFAULT_CATALOG_FILTERS,
  getCatalogCategories,
  hasInvalidPriceRange,
  selectCatalogProducts,
} from './catalog.selectors';

/**
 * @param language Idioma de ordenación del catálogo.
 * @returns Estado y acciones del catálogo, independientes de su presentación JSX.
 */
export function useCatalog(language = 'es') {
  const [filters, setFilters] = useState<CatalogFilters>({ ...DEFAULT_CATALOG_FILTERS });
  const [page, setPage] = useState(1);
  
  const query = useProducts({
    searchTerm: filters.search || undefined,
    categoryName: filters.category || undefined,
    minPrice: filters.minPrice ? Number(filters.minPrice) : undefined,
    maxPrice: filters.maxPrice ? Number(filters.maxPrice) : undefined,
    inStock: filters.inStock || undefined,
    sortBy: filters.sort === 'priceAsc' ? 'price' : filters.sort === 'priceDesc' ? 'price' : filters.sort === 'name' ? 'name' : 'id',
    sortOrder: filters.sort === 'priceDesc' ? 'desc' : 'asc',
    page,
    limit: 20,
  });
  
  const queryClient = useQueryClient();
  useEffect(() => {
    const refresh = () => {
      void queryClient.invalidateQueries({ queryKey: ['products'] });
    };
    window.addEventListener(CATALOG_CHANGED, refresh);
    return () => window.removeEventListener(CATALOG_CHANGED, refresh);
  }, [queryClient]);

  // Reset to page 1 when filters change
  const updateFilter = <Key extends keyof CatalogFilters>(key: Key, value: CatalogFilters[Key]) => {
    setFilters((current) => ({ ...current, [key]: value }));
    setPage(1);
  };
  
  const resetFilters = () => {
    setFilters({ ...DEFAULT_CATALOG_FILTERS });
    setPage(1);
  };

  const products = query.data?.items || [];
  const categories = useMemo(() => getCatalogCategories(products), [products]);
  const visible = useMemo(
    () => selectCatalogProducts(products, filters, language),
    [products, filters, language]
  );
  
  return {
    filters,
    categories,
    visible,
    updateFilter,
    resetFilters,
    invalidPrice: hasInvalidPriceRange(filters),
    loading: query.isPending,
    error: query.error ? apiError(query.error) : null,
    refresh: () => {
      void query.refetch();
    },
    // Pagination
    page,
    totalPages: query.data?.totalPages || 1,
    totalItems: query.data?.total || 0,
    setPage,
    hasNextPage: page < (query.data?.totalPages || 1),
    hasPrevPage: page > 1,
  };
}
