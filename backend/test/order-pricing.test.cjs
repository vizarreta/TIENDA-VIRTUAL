const { test } = require('node:test');
const assert = require('node:assert/strict');
const {
  calculateOrderPricing,
  OrderPricingError,
  ORDER_CURRENCY,
} = require('../src/orders/order-pricing');
const { isRetryableTransactionError } = require('../src/prisma/transaction-policy');
const { PrismaService } = require('../src/prisma/prisma.service');

const line = (price, quantity = 1) => ({
  productId: 1,
  quantity,
  product: { name: 'Example', price },
});

test('pricing returns immutable snapshots and exact cents', () => {
  const input = Object.freeze([Object.freeze(line(0.1, 3))]);
  const result = calculateOrderPricing(input);
  assert.equal(result.totalCents, 30);
  assert.equal(result.items[0].unitPriceCents, 10);
  assert.equal(result.items[0].productName, 'Example');
  assert.equal(ORDER_CURRENCY, 'PEN');
  result.items[0].quantity = 9;
  assert.equal(input[0].quantity, 3);
});

test('pricing rejects empty carts and unrepresentable totals', () => {
  assert.throws(
    () => calculateOrderPricing([]),
    (error) => error instanceof OrderPricingError && error.code === 'EMPTY_CART'
  );
  for (const price of [0, -1, NaN, Infinity, 21474836.48]) {
    assert.throws(() => calculateOrderPricing([line(price)]), /INVALID_ORDER/);
  }
  assert.equal(calculateOrderPricing([line(21474836.47)]).totalCents, 2147483647);
  assert.throws(() => calculateOrderPricing([line(21474836.47), line(0.01)]), /INVALID_ORDER/);
});

test('pricing rejects fractional, absent and negative quantities', () => {
  for (const quantity of [0, -1, 1.5, NaN, Infinity, null, '2']) {
    assert.throws(() => calculateOrderPricing([line(1, quantity)]), /INVALID_ORDER/);
  }
});

test('transaction error classification tolerates unknown errors', () => {
  for (const error of [null, undefined, 'P2034', {}, { code: 42 }, new Error('failure')]) {
    assert.equal(isRetryableTransactionError(error), false);
  }
  assert.equal(isRetryableTransactionError({ code: 'P2034' }), true);
});

test('transactions retry conflicts but propagate unrelated failures immediately', async () => {
  let calls = 0;
  const database = {
    $transaction: async (operation) => {
      if (++calls === 1) throw { code: 'P2034' };
      return operation({});
    },
  };
  assert.equal(
    await PrismaService.prototype.transaction.call(database, async () => 'committed'),
    'committed'
  );
  assert.equal(calls, 2);
  calls = 0;
  database.$transaction = async () => {
    calls++;
    throw null;
  };
  await assert.rejects(
    PrismaService.prototype.transaction.call(database, async () => undefined),
    (error) => error === null
  );
  assert.equal(calls, 1);
});
