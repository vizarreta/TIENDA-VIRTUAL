import { notifyCatalogChanged } from '../modules/catalog/catalog-events';
import React, { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { SavedOrder } from '@tienda-virtual/shared-types';
import { cancelOrder, getOrders } from '../services/orders.api';
import { apiError } from '../utils/apiError';
import { formatCurrency } from '../utils/formatCurrency';

export default function Orders() {
  const { t, i18n } = useTranslation('orders');
  const location = useLocation();
  const [orders, setOrders] = useState<SavedOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const lock = useRef(false);
  const [refresh, setRefresh] = useState(0);
  useEffect(() => {
    let active = true;
    setLoading(true);
    getOrders()
      .then(({ data }) => {
        if (active) {
          setOrders(data);
          setError(null);
        }
      })
      .catch((err) => {
        if (active) setError(apiError(err));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [refresh]);
  const cancel = async (id: string) => {
    if (lock.current || !window.confirm(t('cancelConfirm'))) return;
    lock.current = true;
    setBusy(id);
    setError(null);
    try {
      const { data } = await cancelOrder(id);
      setOrders((items) => items.map((item) => (item.id === id ? data : item)));
      notifyCatalogChanged();
    } catch (err) {
      setError(apiError(err));
    } finally {
      lock.current = false;
      setBusy(null);
    }
  };
  return (
    <section className="max-w-4xl mx-auto p-4 sm:p-8">
      <Link to="/" className="text-indigo-700 underline">
        {t('common:back')}
      </Link>
      <h1 className="text-2xl font-bold my-6">{t('title')}</h1>
      {location.state?.created && (
        <p role="status" className="text-green-700 mb-4">
          {t('created')}
        </p>
      )}
      {error && (
        <p role="alert" className="text-red-700 mb-4">
          {t(`common:errors.${error}`)}{' '}
          <button onClick={() => setRefresh((value) => value + 1)} className="underline">
            {t('common:retry')}
          </button>
        </p>
      )}
      {loading ? (
        <p role="status">{t('common:loading')}</p>
      ) : !orders.length ? (
        <p>{t('empty')}</p>
      ) : (
        <div className="space-y-5">
          {orders.map((order) => (
            <article key={order.id} className="border bg-white rounded-lg p-5 space-y-4">
              <div className="flex flex-wrap justify-between gap-3">
                <div>
                  <h2 className="font-semibold break-all">
                    {t('number')} {order.id}
                  </h2>
                  <time className="text-sm text-gray-600">
                    {new Intl.DateTimeFormat(i18n.resolvedLanguage, {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    }).format(new Date(order.createdAt))}
                  </time>
                </div>
                <span className={order.status === 'cancelled' ? 'text-gray-600' : 'text-amber-800'}>
                  {t(order.status === 'cancelled' ? 'cancelled' : 'pendingPayment')}
                </span>
              </div>
              <ul className="divide-y">
                {order.items.map((item) => (
                  <li key={item.id} className="py-2 flex justify-between gap-4">
                    <span>
                      {item.productName} &times; {item.quantity}
                    </span>
                    <span className="shrink-0">
                      {formatCurrency(
                        (item.unitPriceCents * item.quantity) / 100,
                        i18n.resolvedLanguage,
                        order.currency
                      )}
                    </span>
                  </li>
                ))}
              </ul>
              <p className="font-semibold">
                {t('total')}:{' '}
                {formatCurrency(order.totalCents / 100, i18n.resolvedLanguage, order.currency)}
              </p>
              <p className="text-sm whitespace-pre-line break-words">
                {order.customerName}
                <br />
                {order.shippingAddress}
              </p>
              {order.status === 'pending_payment' && (
                <button
                  disabled={!!busy}
                  onClick={() => void cancel(order.id)}
                  className="text-red-700 border border-red-200 rounded px-3 py-2 disabled:opacity-50"
                >
                  {busy === order.id ? t('common:pending') : t('cancel')}
                </button>
              )}
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
