import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { Product } from '@tienda-virtual/shared-types';
import { formatCurrency } from '../utils/formatCurrency';
import ProductImage from './ProductImage';

export default function ProductCard({
  product,
  onAddToCart,
  disabled = false,
}: {
  product: Product;
  onAddToCart: (id: number) => void;
  disabled?: boolean;
}) {
  const { t, i18n } = useTranslation('productCard');
  const category = typeof product.category === 'string' ? product.category : product.category?.name;
  return (
    <article className="bg-white rounded-lg border overflow-hidden flex flex-col h-full">
      <Link to={`/products/${product.id}`} aria-label={`${t('details')}: ${product.name}`}>
        <ProductImage
          src={product.image}
          name={product.name}
          className="w-full h-48 object-cover"
        />
      </Link>
      <div className="p-4 flex flex-col flex-1 gap-3">
        <span className="text-xs text-gray-500">{category}</span>
        <h2 className="font-bold text-lg break-words">
          <Link to={`/products/${product.id}`} className="hover:underline">
            {product.name}
          </Link>
        </h2>
        <p className="text-sm text-gray-600 line-clamp-2 flex-1">{product.description}</p>
        <div className="flex flex-wrap justify-between items-center gap-2">
          <span className="font-bold text-xl">
            {formatCurrency(product.price, i18n.resolvedLanguage)}
          </span>
          <span className={`text-xs ${product.stock > 0 ? 'text-green-700' : 'text-red-700'}`}>
            {product.stock > 0 ? t('stock', { count: product.stock }) : t('outOfStock')}
          </span>
        </div>
        <button
          onClick={() => onAddToCart(product.id)}
          disabled={disabled || product.stock <= 0}
          className="w-full py-2.5 px-3 rounded bg-indigo-600 hover:bg-indigo-700 text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {t('addToCart')}
        </button>
      </div>
    </article>
  );
}
