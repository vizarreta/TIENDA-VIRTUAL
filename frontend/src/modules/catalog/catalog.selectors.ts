import type { Product } from '@tienda-virtual/shared-types';

export type CatalogSort = 'name' | 'priceAsc' | 'priceDesc';
export interface CatalogFilters {
  search: string;
  category: string;
  minPrice: string;
  maxPrice: string;
  inStock: boolean;
  sort: CatalogSort;
}

export const DEFAULT_CATALOG_FILTERS: Readonly<CatalogFilters> = {
  search: '',
  category: '',
  minPrice: '',
  maxPrice: '',
  inStock: false,
  sort: 'name',
};

/** @returns Nombre normalizado tanto para categorias anidadas como serializadas. */
export function getCategoryName(product: Product): string {
  return typeof product.category === 'string' ? product.category : product.category?.name || '';
}

/** @returns Categorias unicas ordenadas; no modifica la coleccion recibida. */
export function getCatalogCategories(products: readonly Product[]): string[] {
  return [...new Set(products.map(getCategoryName).filter(Boolean))].sort();
}

/** @returns true para limites negativos, no finitos o un rango invertido. */
export function hasInvalidPriceRange({
  minPrice,
  maxPrice,
}: Pick<CatalogFilters, 'minPrice' | 'maxPrice'>): boolean {
  const minimum = minPrice === '' ? 0 : Number(minPrice);
  const maximum = maxPrice === '' ? Infinity : Number(maxPrice);
  return (
    !Number.isFinite(minimum) ||
    minimum < 0 ||
    (maxPrice !== '' && !Number.isFinite(maximum)) ||
    maximum < minimum
  );
}

/**
 * @param products Catalogo original, que nunca se modifica.
 * @param filters Criterios de filtrado y orden.
 * @param language Idioma para comparaciones textuales.
 * @returns Nueva lista filtrada en O(n) y ordenada en O(k log k).
 */
export function selectCatalogProducts(
  products: readonly Product[],
  filters: CatalogFilters,
  language = 'es'
): Product[] {
  if (hasInvalidPriceRange(filters)) return [];
  const query = filters.search.trim().toLocaleLowerCase(language);
  const minimum = filters.minPrice === '' ? 0 : Number(filters.minPrice);
  const maximum = filters.maxPrice === '' ? Infinity : Number(filters.maxPrice);
  const visible = products.filter((product) => {
    const text = `${product.name} ${product.description || ''}`.toLocaleLowerCase(language);
    return (
      text.includes(query) &&
      (!filters.category || getCategoryName(product) === filters.category) &&
      (!filters.inStock || product.stock > 0) &&
      product.price >= minimum &&
      product.price <= maximum
    );
  });
  const compareNames = new Intl.Collator(language).compare;
  return visible.sort((first, second) => {
    if (filters.sort === 'priceAsc') return first.price - second.price;
    if (filters.sort === 'priceDesc') return second.price - first.price;
    return compareNames(first.name, second.name);
  });
}
