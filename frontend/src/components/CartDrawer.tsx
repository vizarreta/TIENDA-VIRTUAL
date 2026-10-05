import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useCart } from '../context/CartContext';
import { formatCurrency } from '../utils/formatCurrency';
import ProductImage from './ProductImage';

export default function CartDrawer({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { t, i18n } = useTranslation('cartDrawer');
  const {
    cartItems,
    cartTotal,
    loading,
    busy,
    error,
    removeFromCart,
    updateQuantity,
    clearCart,
    refreshCart,
  } = useCart();
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    if (isOpen && !dialog.current?.open) dialog.current?.showModal();
    if (!isOpen && dialog.current?.open) dialog.current.close();
  }, [isOpen]);
  return (
    <dialog
      ref={dialog}
      aria-labelledby="cart-title"
      onCancel={onClose}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      className="fixed inset-y-0 left-auto right-0 m-0 h-dvh max-h-none w-full max-w-sm p-0 backdrop:bg-black/50 shadow-2xl"
    >
      <div className="flex flex-col h-full bg-white">
        <div className="p-5 border-b flex items-center justify-between gap-3">
          <h2 id="cart-title" className="text-xl font-bold">
            {t('title')}
          </h2>
          <button onClick={onClose} title={t('close')} aria-label={t('close')} className="p-2">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-5">
          {error && (
            <div role="alert" className="mb-4 text-red-700">
              {t(`common:errors.${error}`)}{' '}
              <button onClick={() => void refreshCart()} className="underline">
                {t('common:retry')}
              </button>
            </div>
          )}
          {loading && (
            <p role="status" className="text-sm text-gray-600">
              {t('updating')}
            </p>
          )}
          {!loading && !cartItems.length && (
            <p className="py-12 text-center text-gray-600">{t('empty')}</p>
          )}
          <ul className="divide-y">
            {cartItems.map((item) => (
              <li key={item.id} className="py-4">
                <div className="flex gap-3">
                  <ProductImage
                    src={item.product?.image}
                    name={item.product?.name || t('fallbackProductName')}
                    className="w-16 h-16 object-cover rounded"
                  />
                  <div className="min-w-0 flex-1">
                    <h3 className="font-medium break-words">
                      {item.product?.name || t('fallbackProductName')}
                    </h3>
                    <p className="text-gray-600">
                      {formatCurrency(item.product?.price || 0, i18n.resolvedLanguage)}
                    </p>
                  </div>
                </div>
                <div className="flex justify-between items-center mt-3 gap-3">
                  <div className="flex items-center border rounded">
                    <button
                      className="w-9 h-9 disabled:opacity-40"
                      disabled={busy || loading || item.quantity <= 1}
                      aria-label={t('decreaseQuantity', { product: item.product?.name })}
                      onClick={() => void updateQuantity(item.id, item.quantity - 1)}
                    >
                      -
                    </button>
                    <span className="min-w-9 text-center tabular-nums">{item.quantity}</span>
                    <button
                      className="w-9 h-9 disabled:opacity-40"
                      disabled={busy || loading || item.quantity >= (item.product?.stock || 0)}
                      aria-label={t('increaseQuantity', { product: item.product?.name })}
                      onClick={() => void updateQuantity(item.id, item.quantity + 1)}
                    >
                      +
                    </button>
                  </div>
                  <button
                    disabled={busy || loading}
                    onClick={() => void removeFromCart(item.id)}
                    className="text-red-700 text-sm disabled:opacity-40"
                  >
                    {t('remove')}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
        {!!cartItems.length && (
          <div className="p-5 border-t space-y-3">
            <div className="flex justify-between font-bold">
              <span>{t('total')}</span>
              <span>{formatCurrency(cartTotal, i18n.resolvedLanguage)}</span>
            </div>
            <Link
              to="/checkout"
              onClick={(event) => {
                if (busy || loading) event.preventDefault();
                else onClose();
              }}
              aria-disabled={busy || loading}
              className="block text-center rounded bg-indigo-600 text-white py-3"
            >
              {t('checkout')}
            </Link>
            <button
              disabled={busy || loading}
              onClick={() => void clearCart()}
              className="w-full border rounded py-2 disabled:opacity-40"
            >
              {t('clearCart')}
            </button>
          </div>
        )}
      </div>
    </dialog>
  );
}
