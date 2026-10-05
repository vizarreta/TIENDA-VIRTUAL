import { notifyCatalogChanged } from '../modules/catalog/catalog-events';
import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  getAdminProducts,
  getCategories,
  createProduct,
  updateProduct,
  deleteProduct,
} from '../services/products.api';
import { apiError } from '../utils/apiError';
import { formatCurrency } from '../utils/formatCurrency';
import ProductImage from './ProductImage';

import type { CatalogProduct as AdminProduct } from '../services/products.api';
const emptyForm = {
  name: '',
  description: '',
  price: 0.01,
  image: '',
  stock: 0,
  categoryId: 0,
  isActive: true,
};

export default function AdminPanel() {
  const { t, i18n } = useTranslation('admin');
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [categories, setCategories] = useState<{ id: number; name: string }[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const lock = useRef(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [refresh, setRefresh] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  useEffect(() => {
    let active = true;
    setLoading(true);
    Promise.all([getAdminProducts({ page, limit: 20 }), getCategories()])
      .then(([p, c]) => {
        if (active) {
          setProducts(p.items);
          setTotalPages(p.totalPages);
          setCategories(c);
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
  }, [refresh, page]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const data = { ...form, categoryId: form.categoryId || null };
      if (editing !== null) await updateProduct(editing, data);
      else await createProduct(data);
      setShowForm(false);
      setEditing(null);
      setNotice('saved');
      setRefresh((value) => value + 1);
      notifyCatalogChanged();
    } catch (err) {
      setError(apiError(err));
    } finally {
      lock.current = false;
      setBusy(false);
    }
  };
  const remove = async (id: number) => {
    if (lock.current || !window.confirm(t('confirmDelete'))) return;
    lock.current = true;
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      await deleteProduct(id);
      setRefresh((value) => value + 1);
      setNotice('deleted');
      notifyCatalogChanged();
    } catch (err) {
      setError(apiError(err));
    } finally {
      lock.current = false;
      setBusy(false);
    }
  };
  return (
    <section className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
        <h1 className="text-2xl font-bold">{t('title')}</h1>
        <button
          disabled={busy}
          onClick={() => {
            setForm(emptyForm);
            setEditing(null);
            setShowForm(true);
            setNotice(null);
          }}
          className="bg-indigo-600 text-white px-4 py-2 rounded disabled:opacity-50"
        >
          {t('new')}
        </button>
      </div>
      {error && (
        <p role="alert" className="text-red-700 mb-4">
          {t(`common:errors.${error}`)}{' '}
          <button onClick={() => setRefresh((value) => value + 1)} className="underline">
            {t('common:retry')}
          </button>
        </p>
      )}
      {notice && (
        <p role="status" className="text-green-700 mb-4">
          {t(notice)}
        </p>
      )}
      {showForm && (
        <form onSubmit={submit} className="border-y py-6 mb-6 space-y-4">
          <h2 className="text-xl font-semibold">{t(editing !== null ? 'edit' : 'new')}</h2>
          <fieldset disabled={busy} className="grid sm:grid-cols-2 gap-4">
            <label className="text-sm">
              {t('name')}
              <input
                required
                maxLength={200}
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="block w-full border rounded p-2 mt-1"
              />
            </label>
            <label className="text-sm">
              {t('category')}
              <select
                value={form.categoryId}
                onChange={(e) => setForm({ ...form, categoryId: Number(e.target.value) })}
                className="block w-full border rounded p-2 mt-1"
              >
                <option value={0}>{t('uncategorized')}</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm">
              {t('price')}
              <input
                required
                type="number"
                min="0.01"
                step="0.01"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
                className="block w-full border rounded p-2 mt-1"
              />
            </label>
            <label className="text-sm">
              {t('stock')}
              <input
                required
                type="number"
                min="0"
                step="1"
                value={form.stock}
                onChange={(e) => setForm({ ...form, stock: Number(e.target.value) })}
                className="block w-full border rounded p-2 mt-1"
              />
            </label>
            <label className="text-sm sm:col-span-2">
              {t('description')}
              <textarea
                rows={3}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="block w-full border rounded p-2 mt-1"
              />
            </label>
            <label className="text-sm sm:col-span-2">
              {t('imageUrl')}
              <input
                type="url"
                value={form.image}
                onChange={(e) => setForm({ ...form, image: e.target.value })}
                className="block w-full border rounded p-2 mt-1"
              />
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
              />
              {t('active')}
            </label>
          </fieldset>
          <div className="flex gap-3">
            <button
              disabled={busy}
              className="bg-green-700 text-white px-4 py-2 rounded disabled:opacity-50"
            >
              {busy ? t('common:pending') : t(editing !== null ? 'update' : 'create')}
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => setShowForm(false)}
              className="border px-4 py-2 rounded"
            >
              {t('common:cancel')}
            </button>
          </div>
        </form>
      )}
      {loading ? (
        <p role="status">{t('common:loading')}</p>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="border-b bg-gray-100">
                  {['image', 'name', 'category', 'price', 'stock', 'status', 'actions'].map((key) => (
                    <th key={key} scope="col" className="px-3 py-3 whitespace-nowrap">
                      {t(key)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr key={product.id} className="border-b">
                    <td className="p-3">
                      <ProductImage
                        src={product.image}
                        name={product.name}
                        className="w-16 h-16 object-cover rounded"
                      />
                    </td>
                    <td className="p-3 font-medium">{product.name}</td>
                    <td className="p-3">
                      {product.categoryId ? product.category : t('uncategorized')}
                    </td>
                    <td className="p-3 whitespace-nowrap">
                      {formatCurrency(product.price, i18n.resolvedLanguage)}
                    </td>
                    <td className="p-3">{product.stock}</td>
                    <td className="p-3">{t(product.isActive ? 'active' : 'inactive')}</td>
                    <td className="p-3">
                      <div className="flex gap-3">
                        <button
                          disabled={busy}
                          onClick={() => {
                            setEditing(product.id);
                            setForm({
                              name: product.name,
                              description: product.description || '',
                              price: product.price,
                              image: product.image || '',
                              stock: product.stock,
                              categoryId: product.categoryId || 0,
                              isActive: product.isActive,
                            });
                            setShowForm(true);
                          }}
                          className="text-indigo-700 underline"
                        >
                          {t('edit')}
                        </button>
                        <button
                          disabled={busy}
                          onClick={() => void remove(product.id)}
                          className="text-red-700 underline"
                        >
                          {t('remove')}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!products.length && <p className="py-8">{t('empty')}</p>}
          </div>
          {totalPages > 1 && (
            <nav className="mt-6 flex items-center justify-between" aria-label="Pagination">
              <p className="text-sm text-gray-700">
                {t('paginationInfo', { 
                  start: (page - 1) * 20 + 1, 
                  end: Math.min(page * 20, products.length + (page - 1) * 20),
                  total: totalPages * 20
                })}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage(page - 1)}
                  disabled={page === 1}
                  className="px-3 py-1 border rounded disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {t('previous')}
                </button>
                <span className="px-3 py-1 text-sm">
                  {t('pageOf', { current: page, total: totalPages })}
                </span>
                <button
                  onClick={() => setPage(page + 1)}
                  disabled={page === totalPages}
                  className="px-3 py-1 border rounded disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {t('next')}
                </button>
              </div>
            </nav>
          )}
        </>
      )}
    </section>
  );
}
