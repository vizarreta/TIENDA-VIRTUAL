const { test } = require('node:test');
const assert = require('node:assert/strict');
const load = require('./load-typescript.cjs');
const selectors = load('src/modules/catalog/catalog.selectors.ts');
const products = Object.freeze([
  Object.freeze({ id: 1, name: 'Zapato', price: 40, stock: 2, category: 'Calzado' }),
  Object.freeze({
    id: 2,
    name: 'Audifonos',
    description: 'Bluetooth',
    price: 20,
    stock: 0,
    category: { name: 'Audio' },
  }),
  Object.freeze({ id: 3, name: 'Botin', price: 30, stock: 1, category: 'Calzado' }),
]);
const ids = (products) => Array.from(products, (product) => product.id);
const select = (filters) =>
  selectors.selectCatalogProducts(products, { ...selectors.DEFAULT_CATALOG_FILTERS, ...filters });

test('catalog filters combine without mutating the input', () => {
  assert.deepEqual(
    ids(select({ category: 'Calzado', minPrice: '25', maxPrice: '35', inStock: true })),
    [3]
  );
  assert.deepEqual(ids(select({ search: ' BLUETOOTH ' })), [2]);
  assert.deepEqual(ids(select({ search: 'missing' })), []);
  assert.deepEqual(ids(products), [1, 2, 3]);
});

test('catalog sorts by name and both price directions', () => {
  assert.deepEqual(ids(select({ sort: 'name' })), [2, 3, 1]);
  assert.deepEqual(ids(select({ sort: 'priceAsc' })), [2, 3, 1]);
  assert.deepEqual(ids(select({ sort: 'priceDesc' })), [1, 3, 2]);
  assert.deepEqual(Array.from(selectors.getCatalogCategories(products)), ['Audio', 'Calzado']);
});

test('catalog rejects invalid ranges and supports inclusive bounds', () => {
  for (const filters of [
    { minPrice: '50', maxPrice: '10' },
    { minPrice: '-1' },
    { maxPrice: 'NaN' },
  ]) {
    assert.equal(select(filters).length, 0);
  }
  assert.deepEqual(ids(select({ minPrice: '30', maxPrice: '30' })), [3]);
});

function memoryStorage() {
  const values = new Map();
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
    removeItem: (key) => values.delete(key),
  };
}
function sessionFixture() {
  const events = [];
  const storage = load('src/services/session-storage.ts', {
    globals: {
      localStorage: memoryStorage(),
      sessionStorage: memoryStorage(),
      Event,
      window: { dispatchEvent: (event) => events.push(event.type) },
    },
  });
  return { storage, events };
}

test('cart and checkout keys stay stable until explicitly invalidated', () => {
  const { storage, events } = sessionFixture();
  const cart = storage.getCartSessionId();
  const checkout = storage.getCheckoutRequestId();
  assert.equal(storage.getCartSessionId(), cart);
  assert.equal(storage.getCheckoutRequestId(), checkout);
  storage.clearCheckoutRequest();
  assert.notEqual(storage.getCheckoutRequestId(), checkout);
  storage.resetCartSession();
  assert.notEqual(storage.getCartSessionId(), cart);
  assert.deepEqual(events, [storage.CART_SESSION_CHANGED]);
});

test('local authentication can be set and cleared independently from HTTP', () => {
  const { storage } = sessionFixture();
  assert.equal(storage.getAuthToken(), null);
  storage.setAuthToken('test-token');
  assert.equal(storage.getAuthToken(), 'test-token');
  storage.setAuthToken(null);
  assert.equal(storage.getAuthToken(), null);
});

test('all APIs reuse session headers, preserve OAuth tokens and propagate errors', async () => {
  const { storage } = sessionFixture();
  storage.setAuthToken('local-test-token');
  const { httpClient } = load('src/services/http-client.ts', {
    imports: { './session-storage': storage },
  });
  assert.equal(httpClient.defaults.baseURL, '/api');
  const calls = [];
  httpClient.defaults.adapter = async (config) => {
    calls.push(config);
    return { data: [], status: 200, statusText: 'OK', headers: {}, config };
  };
  const loadApi = (domain) =>
    load(`src/services/${domain}.api.ts`, { imports: { './http-client': { httpClient } } });
  await loadApi('products').searchProducts('a & b');
  await loadApi('cart').addToCart(1, 2);
  await loadApi('orders').getOrders();
  await loadApi('auth').verifyOAuth('provider-test-token');
  assert.equal(calls.length, 4);
  assert.equal(calls[0].params.q, 'a & b');
  for (const config of calls)
    assert.equal(config.headers['x-session-id'], storage.getCartSessionId());
  assert.equal(calls[0].headers.Authorization, 'Bearer local-test-token');
  assert.equal(calls[3].headers.Authorization, 'Bearer provider-test-token');
  const failure = new Error('network unavailable');
  httpClient.defaults.adapter = async () => {
    throw failure;
  };
  await assert.rejects(loadApi('cart').getCart(), failure);
});

test('HTTP client uses the configured backend URL', () => {
  const { storage } = sessionFixture();
  const { httpClient } = load('src/services/http-client.ts', {
    imports: { './session-storage': storage },
    env: { VITE_API_URL: 'https://api.example.test/api' },
  });
  assert.equal(httpClient.defaults.baseURL, 'https://api.example.test/api');
});
