import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { Product } from '@tienda-virtual/shared-types';
import { getProduct } from '../services/products.api';
import { useCart } from '../context/CartContext';
import { apiError } from '../utils/apiError';
import { formatCurrency } from '../utils/formatCurrency';
import ProductImage from './ProductImage';

export default function ProductDetail() {
  const { id } = useParams();
  const { t, i18n } = useTranslation('productCard');
  const [product, setProduct] = useState<Product | null>(null);
  const [error, setError] = useState<string | null>(null);
  const cart = useCart();
  useEffect(() => {
    let active = true;
    setProduct(null);
    setError(null);
    getProduct(Number(id))
      .then((data) => {
        if (active) setProduct(data);
      })
      .catch((err) => {
        if (active) setError(apiError(err));
      });
    return () => {
      active = false;
    };
  }, [id]);
  return (
    <section className="max-w-6xl mx-auto p-4 sm:p-8">
      <Link to="/" className="text-indigo-700 underline">
        {t('common:back')}
      </Link>
      {error ? (
        <p role="alert" className="text-red-700 mt-8">
          {t(`common:errors.${error}`)}
        </p>
      ) : !product ? (
        <p role="status">{t('common:loading')}</p>
      ) : (
        <div className="grid md:grid-cols-2 gap-8 mt-6">
          <ProductImage
            src={product.image}
            name={product.name}
            className="w-full aspect-square object-contain rounded-lg bg-white"
          />
          <div className="space-y-6">
            <h1 className="text-3xl font-bold break-words">{product.name}</h1>
            <p className="text-gray-700 whitespace-pre-line">
              {product.description || t('noDescription')}
            </p>
            <p className="text-2xl font-bold">
              {formatCurrency(product.price, i18n.resolvedLanguage)}
            </p>
            <p>{product.stock ? t('stock', { count: product.stock }) : t('outOfStock')}</p>
            {cart.error && (
              <p role="alert" className="text-red-700">
                {t(`common:errors.${cart.error}`)}
              </p>
            )}
            {cart.notice && (
              <p role="status" className="text-green-700">
                {t('added')}
              </p>
            )}
            <button
              disabled={cart.busy || cart.loading || product.stock < 1}
              onClick={() => void cart.addToCart(product.id)}
              className="bg-indigo-600 text-white rounded px-6 py-3 disabled:opacity-50"
            >
              {t('addToCart')}
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
