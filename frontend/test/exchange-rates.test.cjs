const assert = require('node:assert/strict');
const test = require('node:test');
const { readFileSync } = require('node:fs');
const loadTypescript = require('./load-typescript.cjs');

const payload = () => ({
  result: 'success',
  base_code: 'PEN',
  time_last_update_unix: 1_779_494_400,
  time_next_update_unix: 1_779_580_800,
  rates: { PEN: 1, USD: 0.27, EUR: 0.24, BRL: 1.4 },
});

function loadApi(fetch, timers = {}) {
  return loadTypescript('src/services/exchange-rates.api.ts', {
    globals: { fetch, AbortController, setTimeout, clearTimeout, SyntaxError, ...timers },
  });
}

test('validates provider data and exposes only required currencies and millisecond dates', () => {
  const api = loadApi();
  const result = api.parseExchangeRates(payload());
  assert.equal(result.base, 'PEN');
  assert.equal(result.rates.USD, 0.27);
  assert.equal(result.updatedAt, payload().time_last_update_unix * 1000);
  assert.equal(Object.keys(result.rates).length, 3);
});

test('rejects wrong base, missing rates, invalid dates, and unsafe numbers', () => {
  const api = loadApi();
  const invalidValues = [
    null,
    [],
    {},
    { ...payload(), result: 'error' },
    { ...payload(), base_code: 'USD' },
    { ...payload(), time_last_update_unix: -1 },
    { ...payload(), time_next_update_unix: payload().time_last_update_unix },
    { ...payload(), time_next_update_unix: 1e20 },
    { ...payload(), rates: { ...payload().rates, PEN: 2 } },
    ...[undefined, 0, -1, '0.27', NaN, Infinity, Number.MAX_VALUE].map((USD) => ({
      ...payload(),
      rates: { ...payload().rates, USD },
    })),
  ];
  for (const value of invalidValues) {
    assert.throws(() => api.parseExchangeRates(value), { code: 'invalidResponse' });
  }
});

test('fetches directly from the external provider without authorization, session, or cookies', async () => {
  let request;
  const api = loadApi(async (url, options) => {
    request = { url, options };
    return { ok: true, json: async () => payload() };
  });
  assert.equal((await api.getExchangeRates()).rates.BRL, 1.4);
  assert.equal(request.url, 'https://open.er-api.com/v6/latest/PEN');
  assert.equal(request.options.credentials, 'omit');
  assert.equal(request.options.referrerPolicy, 'no-referrer');
  assert.deepEqual(Object.keys(request.options.headers), ['Accept']);
});

test('maps rate limiting, HTTP failures, invalid JSON, and network failures', async () => {
  for (const [status, code] of [
    [429, 'rateLimit'],
    [500, 'unavailable'],
  ]) {
    const api = loadApi(async () => ({ ok: false, status }));
    await assert.rejects(api.getExchangeRates(), { code });
  }
  const malformed = loadApi(async () => ({
    ok: true,
    json: async () => {
      throw new SyntaxError();
    },
  }));
  await assert.rejects(malformed.getExchangeRates(), { code: 'invalidResponse' });
  const offline = loadApi(async () => {
    throw new TypeError('offline');
  });
  await assert.rejects(offline.getExchangeRates(), { code: 'network' });
});

function pendingFetch(_url, { signal }) {
  return new Promise((_resolve, reject) => {
    if (signal.aborted) reject(signal.reason);
    else signal.addEventListener('abort', () => reject(signal.reason), { once: true });
  });
}

test('aborts timed-out requests and clears the timer', async () => {
  let expire;
  let cleared = false;
  const api = loadApi(pendingFetch, {
    setTimeout: (callback, delay) => {
      assert.equal(delay, 10_000);
      expire = callback;
      return 1;
    },
    clearTimeout: () => {
      cleared = true;
    },
  });
  const request = api.getExchangeRates();
  expire();
  await assert.rejects(request, { code: 'timeout' });
  assert.equal(cleared, true);
});

test('honors cancellation before and during requests', async () => {
  const api = loadApi(pendingFetch);
  const before = new AbortController();
  before.abort();
  await assert.rejects(api.getExchangeRates(before.signal), { name: 'AbortError' });
  const during = new AbortController();
  const request = api.getExchangeRates(during.signal);
  during.abort();
  await assert.rejects(request, { name: 'AbortError' });
});

const conversion = loadTypescript('src/modules/currency/conversion.ts');

test('all three languages provide matching converter messages', () => {
  const messages = ['es', 'en', 'pt'].map(
    (language) => JSON.parse(readFileSync(`src/locales/${language}.json`, 'utf8')).currency
  );
  for (const translated of messages.slice(1)) {
    assert.deepEqual(Object.keys(translated).sort(), Object.keys(messages[0]).sort());
    assert.deepEqual(Object.keys(translated.errors).sort(), Object.keys(messages[0].errors).sort());
    assert.deepEqual(Object.keys(translated.currencies).sort(), ['BRL', 'EUR', 'USD']);
  }
});

test('parses zero, decimal point/comma and the maximum amount', () => {
  for (const [input, expected] of [
    ['0', 0],
    [' 12.50 ', 12.5],
    ['12,50', 12.5],
    ['1000000', 1_000_000],
  ]) {
    assert.equal(conversion.parseConversionAmount(input), expected);
  }
});

test('rejects empty, negative, exponent, mixed separators, extra decimals and over-limit amounts', () => {
  for (const input of ['', ' ', '-1', '1e3', 'abc', '1,000.00', '1.001', '1000000.01']) {
    assert.equal(conversion.parseConversionAmount(input), null);
  }
});

test('converts locally without rounding intermediary values and rejects invalid arguments', () => {
  assert.equal(conversion.convertAmount(100, 0.27), 27);
  assert.equal(conversion.convertAmount(0, 0.27), 0);
  assert.equal(conversion.convertAmount(1.25, 0.27), 0.3375);
  for (const [amount, rate] of [
    [-1, 1],
    [Infinity, 1],
    [1, 0],
    [1, NaN],
    [1_000_001, 1],
  ]) {
    assert.throws(() => conversion.convertAmount(amount, rate), { name: 'RangeError' });
  }
});
