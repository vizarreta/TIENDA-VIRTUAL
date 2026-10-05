import { notifyCatalogChanged } from '../modules/catalog/catalog-events';
import React, { useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getCheckoutRequestId, clearCheckoutRequest } from '../services/session-storage';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { createOrder } from '../services/orders.api';
import { apiError } from '../utils/apiError';
import { formatCurrency } from '../utils/formatCurrency';
import { checkoutSchema } from '../utils/validationSchemas';

export default function Checkout() {
  const { t, i18n } = useTranslation('orders');
  const { user } = useAuth();
  const cart = useCart();
  const navigate = useNavigate();
  const [name, setName] = useState(user?.fullName || '');
  const [address, setAddress] = useState('');
  const [nameError, setNameError] = useState<string | null>(null);
  const [addressError, setAddressError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lock = useRef(false);

  const validateField = (field: 'customerName' | 'shippingAddress', value: string) => {
    const result = checkoutSchema.shape[field].safeParse(value);
    return result.success ? null : result.error.issues[0].message;
  };

  const validateForm = () => {
    const nameErr = validateField('customerName', name);
    const addressErr = validateField('shippingAddress', address);
    setNameError(nameErr);
    setAddressError(addressErr);
    return !nameErr && !addressErr;
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (lock.current || cart.loading || cart.busy) return;
    if (!validateForm()) return;
    
    lock.current = true;
    setSaving(true);
    setError(null);
    const requestId = getCheckoutRequestId();
    try {
      await createOrder({ requestId, customerName: name, shippingAddress: address });
      clearCheckoutRequest();
      await cart.refreshCart();
      notifyCatalogChanged();
      navigate('/orders', { replace: true, state: { created: true } });
    } catch (err) {
      setError(apiError(err));
    } finally {
      lock.current = false;
      setSaving(false);
    }
  };
  return (
    <section className="max-w-3xl mx-auto p-4 sm:p-8">
      <Link to="/" className="text-indigo-700 underline">
        {t('common:back')}
      </Link>
      <h1 className="text-2xl font-bold my-6">{t('checkout')}</h1>
      {error && (
        <p role="alert" className="text-red-700 mb-4">
          {t(`common:errors.${error}`)}
        </p>
      )}
      {cart.error && (
        <p role="alert" className="text-red-700 mb-4">
          {t(`common:errors.${cart.error}`)}{' '}
          <button onClick={() => void cart.refreshCart()} className="underline">
            {t('common:retry')}
          </button>
        </p>
      )}
      {cart.loading ? (
        <p role="status">{t('common:loading')}</p>
      ) : !cart.cartItems.length ? (
        <p>{t('emptyCart')}</p>
      ) : (
        <form onSubmit={submit} className="space-y-6">
          <ul className="divide-y">
            {cart.cartItems.map((item) => (
              <li key={item.id} className="py-3 flex justify-between gap-4">
                <span className="break-words">
                  {item.product?.name} &times; {item.quantity}
                </span>
                <span className="shrink-0">
                  {formatCurrency(
                    (Math.round((item.product?.price || 0) * 100) * item.quantity) / 100,
                    i18n.resolvedLanguage
                  )}
                </span>
              </li>
            ))}
          </ul>
          <p className="flex justify-between text-xl font-bold">
            <span>{t('total')}</span>
            <span>{formatCurrency(cart.cartTotal, i18n.resolvedLanguage)}</span>
          </p>
          <label className="block">
            {t('name')}
            <input
              required
              minLength={2}
              maxLength={120}
              autoComplete="name"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setNameError(null);
              }}
              onBlur={() => {
                const err = validateField('customerName', name);
                if (err) setNameError(err);
              }}
              className={`block w-full border rounded p-3 mt-1 ${nameError ? 'border-red-500' : ''}`}
            />
            {nameError && <p className="text-red-700 text-sm mt-1">{t(nameError)}</p>}
          </label>
          <label className="block">
            {t('address')}
            <textarea
              required
              minLength={10}
              maxLength={500}
              autoComplete="street-address"
              value={address}
              onChange={(e) => {
                setAddress(e.target.value);
                setAddressError(null);
              }}
              onBlur={() => {
                const err = validateField('shippingAddress', address);
                if (err) setAddressError(err);
              }}
              className={`block w-full border rounded p-3 mt-1 ${addressError ? 'border-red-500' : ''}`}
              rows={3}
            />
            {addressError && <p className="text-red-700 text-sm mt-1">{t(addressError)}</p>}
          </label>
          <p className="p-4 bg-amber-50 text-amber-900 border-l-4 border-amber-400">
            {t('paymentNotice')}
          </p>
          <p className="text-sm text-gray-600">{t('stockNotice')}</p>
          <button
            disabled={saving || cart.busy || cart.loading || !!cart.error}
            className="bg-indigo-600 text-white px-6 py-3 rounded disabled:opacity-50"
          >
            {saving ? t('common:pending') : t('placeOrder')}
          </button>
        </form>
      )}
    </section>
  );
}
