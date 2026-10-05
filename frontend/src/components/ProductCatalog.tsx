import React from 'react';
import { useTranslation } from 'react-i18next';
import ProductCard from './ProductCard';
import { useCart } from '../context/CartContext';
import { useCatalog } from '../modules/catalog/useCatalog';
import type { CatalogSort } from '../modules/catalog/catalog.selectors';

/** Vista del catálogo: delega la carga, los filtros y el orden al módulo catalog. */
export default function ProductCatalog() {
  const { t, i18n } = useTranslation('productCatalog');
  const cart = useCart();
  const {
    filters,
    categories,
    visible,
    invalidPrice,
    loading,
    error,
    updateFilter,
    resetFilters,
    refresh,
    page,
    totalPages,
    totalItems,
    setPage,
    hasNextPage,
    hasPrevPage,
  } = useCatalog(i18n.resolvedLanguage);
  const { search, category, minPrice: min, maxPrice: max, sort, inStock } = filters;
  
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <h1 className="text-2xl font-bold mb-5">{t('title')}</h1>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5 mb-4">
        <label className="sm:col-span-2 lg:col-span-2">
          <span className="sr-only">{t('searchPlaceholder')}</span>
          <input
            type="search"
            value={search}
            onChange={(e) => updateFilter('search', e.target.value)}
            placeholder={t('searchPlaceholder')}
            className="w-full border rounded p-2.5 h-full"
          />
        </label>
        <label className="text-sm">
          {t('category')}
          <select
            value={category}
            onChange={(e) => updateFilter('category', e.target.value)}
            className="w-full border rounded p-2 mt-1"
          >
            <option value="">{t('all')}</option>
            {categories.map((name) => (
              <option key={name}>{name}</option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          {t('minPrice')}
          <input
            type="number"
            min="0"
            step="0.01"
            value={min}
            onChange={(e) => updateFilter('minPrice', e.target.value)}
            className="w-full border rounded p-2 mt-1"
          />
        </label>
        <label className="text-sm">
          {t('maxPrice')}
          <input
            type="number"
            min="0"
            step="0.01"
            value={max}
            onChange={(e) => updateFilter('maxPrice', e.target.value)}
            className="w-full border rounded p-2 mt-1"
          />
        </label>
      </div>
      <div className="flex flex-wrap items-center gap-4 mb-6 text-sm">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={inStock}
            onChange={(e) => updateFilter('inStock', e.target.checked)}
          />
          {t('inStock')}
        </label>
        <label className="flex items-center gap-2">
          {t('sort')}
          <select
            value={sort}
            onChange={(e) => updateFilter('sort', e.target.value as CatalogSort)}
            className="border rounded p-2"
          >
            {['name', 'priceAsc', 'priceDesc'].map((value) => (
              <option key={value} value={value}>
                {t(value)}
              </option>
            ))}
          </select>
        </label>
        <button onClick={resetFilters} className="underline text-indigo-700">
          {t('reset')}
        </button>
      </div>
      {invalidPrice && (
        <p role="alert" className="text-red-700 mb-4">
          {t('invalidPrice')}
        </p>
      )}
      {cart.error && (
        <p role="alert" className="text-red-700 mb-4">
          {t(`common:errors.${cart.error}`)}{' '}
          <button className="underline" onClick={() => void cart.refreshCart()}>
            {t('common:retry')}
          </button>
        </p>
      )}
      {cart.notice && (
        <p role="status" className="text-green-700 mb-4">
          {t('productCard:added')}
        </p>
      )}
      {error ? (
        <p role="alert" className="py-8 text-red-700">
          {t(`common:errors.${error}`)}{' '}
          <button onClick={refresh} className="underline">
            {t('common:retry')}
          </button>
        </p>
      ) : loading ? (
        <p role="status" className="py-12">
          {t('common:loading')}
        </p>
      ) : visible.length ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {visible.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                disabled={cart.busy || cart.loading}
                onAddToCart={(id) => {
                  void cart.addToCart(id);
                }}
              />
            ))}
          </div>
          {totalPages > 1 && (
            <nav className="mt-6 flex items-center justify-between" aria-label="Pagination">
              <p className="text-sm text-gray-700">
                {t('paginationInfo', { 
                  start: (page - 1) * 20 + 1, 
                  end: Math.min(page * 20, totalItems),
                  total: totalItems 
                })}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage(page - 1)}
                  disabled={!hasPrevPage}
                  className="px-3 py-1 border rounded disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label={t('previousPage')}
                >
                  {t('previous')}
                </button>
                <span className="px-3 py-1 text-sm">
                  {t('pageOf', { current: page, total: totalPages })}
                </span>
                <button
                  onClick={() => setPage(page + 1)}
                  disabled={!hasNextPage}
                  className="px-3 py-1 border rounded disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label={t('nextPage')}
                >
                  {t('next')}
                </button>
              </div>
            </nav>
          )}
        </>
      ) : (
        <p className="py-12 text-gray-600">
          {search ? t('noProductsFound', { searchTerm: search }) : t('noProducts')}
        </p>
      )}
    </section>
  );
}
