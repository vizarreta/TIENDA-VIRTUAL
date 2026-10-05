import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { useExchangeRates } from '../modules/currency/useExchangeRates';
import {
  convertAmount,
  DEFAULT_CONVERSION_AMOUNT,
  MAX_CONVERSION_AMOUNT,
  parseConversionAmount,
} from '../modules/currency/conversion';
import {
  ExchangeRatesError,
  TARGET_CURRENCIES,
  TargetCurrency,
} from '../services/exchange-rates.api';
import { formatCurrency } from '../utils/formatCurrency';

/** Displays an independent currency estimate using a public, read-only external service. */
export default function CurrencyConverter() {
  const { t, i18n } = useTranslation('currency');
  const [input, setInput] = useState(DEFAULT_CONVERSION_AMOUNT);
  const [currency, setCurrency] = useState<TargetCurrency>('USD');
  const { data, error, isPending, isFetching, isOutdated, refetch } = useExchangeRates();
  const amount = parseConversionAmount(input);
  const language = i18n.resolvedLanguage || 'es';
  const invalidAmount = amount === null;
  const estimate = data && amount !== null ? convertAmount(amount, data.rates[currency]) : null;
  const errorCode = error instanceof ExchangeRatesError ? error.code : 'network';

  return (
    <section className="mx-auto max-w-3xl px-4 py-8 sm:px-6" aria-labelledby="currency-title">
      <Link to="/" className="text-sm text-indigo-700 underline underline-offset-4">
        {t('back')}
      </Link>
      <h1 id="currency-title" className="mt-6 text-2xl font-bold text-gray-900">
        {t('title')}
      </h1>
      <p className="mt-2 text-sm text-gray-600">{t('disclaimer')}</p>
      <div className="mt-8 grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="conversion-amount" className="block text-sm font-medium text-gray-700">
            {t('amount')}
          </label>
          <input
            id="conversion-amount"
            type="text"
            inputMode="decimal"
            value={input}
            maxLength={16}
            onChange={(event) => setInput(event.target.value)}
            aria-invalid={invalidAmount}
            aria-describedby={invalidAmount ? 'conversion-error' : undefined}
            className="mt-2 w-full rounded border border-gray-300 px-3 py-3 focus:ring-2 focus:ring-indigo-500"
          />
          {invalidAmount && (
            <p id="conversion-error" role="alert" className="mt-2 text-sm text-red-700">
              {t('invalidAmount', { max: formatCurrency(MAX_CONVERSION_AMOUNT, language) })}
            </p>
          )}
        </div>
        <div>
          <label htmlFor="conversion-currency" className="block text-sm font-medium text-gray-700">
            {t('target')}
          </label>
          <select
            id="conversion-currency"
            value={currency}
            onChange={(event) => setCurrency(event.target.value as TargetCurrency)}
            className="mt-2 w-full rounded border border-gray-300 bg-white px-3 py-3 focus:ring-2 focus:ring-indigo-500"
          >
            {TARGET_CURRENCIES.map((code) => (
              <option key={code} value={code}>
                {t(`currencies.${code}`)}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div
        className="mt-8 min-h-36 border-y border-gray-200 py-6"
        aria-live="polite"
        aria-busy={isFetching}
      >
        {isPending && <p role="status">{t(isFetching ? 'loading' : 'offline')}</p>}
        {error && (
          <div role="alert" className="text-sm text-red-700">
            <p>{t(`errors.${errorCode}`)}</p>
            {data && <p className="mt-1">{t('cached')}</p>}
            <button
              type="button"
              disabled={isFetching}
              onClick={() => void refetch()}
              className="mt-3 rounded border border-red-300 px-4 py-2 font-medium disabled:opacity-50"
            >
              {t(isFetching ? 'loading' : 'retry')}
            </button>
          </div>
        )}
        {data && (
          <>
            <p className="text-sm text-gray-600">{t('estimate')}</p>
            <output
              htmlFor="conversion-amount conversion-currency"
              className="mt-2 block break-words text-3xl font-semibold text-emerald-800 tabular-nums"
            >
              {estimate === null ? t('noAmount') : formatCurrency(estimate, language, currency)}
            </output>
            <p className="mt-3 text-sm text-gray-600">
              {t('updated', {
                date: new Intl.DateTimeFormat(language, {
                  dateStyle: 'medium',
                  timeStyle: 'short',
                }).format(data.updatedAt),
              })}
            </p>
            {isOutdated && <p className="mt-2 text-sm text-amber-800">{t('stale')}</p>}
          </>
        )}
      </div>
      <a
        href="https://www.exchangerate-api.com"
        target="_blank"
        rel="noopener noreferrer"
        className="mt-4 inline-block text-sm text-gray-600 underline underline-offset-4"
      >
        Rates By Exchange Rate API
      </a>
    </section>
  );
}
