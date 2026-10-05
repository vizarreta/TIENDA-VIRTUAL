const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { randomUUID, randomBytes } = require('node:crypto');
const { mkdtempSync, mkdirSync, openSync, closeSync } = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
require('reflect-metadata');

const tempRoot = path.resolve('test/.tmp');
mkdirSync(tempRoot, { recursive: true });
const directory = mkdtempSync(path.join(tempRoot, 'run-'));
// Prisma's Windows engine needs the SQLite file to exist before db push.
closeSync(openSync(path.join(directory, 'test.db'), 'wx'));
process.env.DATABASE_URL = 'file:../test/.tmp/' + path.basename(directory) + '/test.db';
process.env.JWT_SECRET = randomBytes(48).toString('hex');
const { NestFactory } = require('@nestjs/core');
const { JwtService } = require('@nestjs/jwt');
const { AppModule } = require('../src/app.module');
const { PrismaService } = require('../src/prisma/prisma.service');
const { createValidationPipe } = require('../src/validation');
const { jwtSecret, trustedRole } = require('../src/auth/auth.config');
const { SupabaseJwtStrategy } = require('../src/auth/supabase-jwt.strategy');
const { RolesGuard } = require('../src/auth/roles.guard');
let app, prisma, base, customer, other, admin;
const password = 'Regression-test-123!';

async function request(route, { method = 'GET', token, session = randomUUID(), body } = {}) {
  const response = await fetch(base + route, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'x-session-id': session,
      ...(token ? { Authorization: 'Bearer ' + token } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  return { status: response.status, data: await response.json() };
}
async function product(stock = 50, price = 12.34) {
  return prisma.product.create({
    data: { name: 'Regression product', price, stock, isActive: true },
  });
}
before(async () => {
  try {
    execFileSync(
      process.execPath,
      [
        require.resolve('prisma/build/index.js'),
        'db',
        'push',
        '--skip-generate',
        '--schema',
        path.resolve('prisma/schema.prisma'),
      ],
      { env: process.env, stdio: 'pipe' }
    );
  } catch (error) {
    throw new Error(String(error.stdout) + '\n' + String(error.stderr));
  }
  app = await NestFactory.create(AppModule, { logger: false });
  app.setGlobalPrefix('api');
  app.useGlobalPipes(createValidationPipe());
  await app.listen(0, '127.0.0.1');
  base = (await app.getUrl()) + '/api';
  prisma = app.get(PrismaService);
  const first = await request('/auth/register', {
    method: 'POST',
    body: { email: 'one@example.test', password, fullName: 'Test One' },
  });
  assert.equal(first.status, 201);
  customer = first.data;
  other = (
    await request('/auth/register', {
      method: 'POST',
      body: { email: 'two@example.test', password, fullName: 'Test Two' },
    })
  ).data;
  const adminUser = await prisma.user.create({
    data: { email: 'admin@example.test', fullName: 'Test Admin', role: 'admin' },
  });
  admin = new JwtService({ secret: process.env.JWT_SECRET }).sign({ sub: adminUser.id });
});
after(async () => {
  await app?.close();
  await prisma?.$disconnect();
});

test('JWT configuration refuses missing and predictable keys', () => {
  for (const value of [undefined, '', 'super-secret-key', 'short']) {
    assert.throws(() => jwtSecret({ get: () => value }), /JWT_SECRET/);
  }
  assert.equal(jwtSecret({ get: () => process.env.JWT_SECRET }), process.env.JWT_SECRET);
});
test('user-controlled metadata never grants admin and roles match exactly', async () => {
  assert.equal(trustedRole({ role: 'not-admin' }), 'customer');
  const identity = await SupabaseJwtStrategy.prototype.validate({
    sub: randomUUID(),
    user_metadata: { role: 'admin' },
    app_metadata: {},
  });
  assert.equal(identity.role, 'customer');
  const guard = new RolesGuard({ getAllAndOverride: () => ['admin'] });
  const context = (role) => ({
    getHandler: () => {},
    getClass: () => {},
    switchToHttp: () => ({ getRequest: () => ({ user: { role } }) }),
  });
  assert.equal(guard.canActivate(context('not-admin')), false);
  assert.equal(guard.canActivate(context('admin')), true);
  const profile = await app
    .get(require('../src/users/users.service').UsersService)
    .createFromSupabase({
      id: randomUUID(),
      email: 'oauth@example.test',
      userMetadata: { role: 'admin' },
      appMetadata: {},
    });
  assert.equal(profile.role, 'customer');
});
test('session restoration returns a complete user, invalid login is 401', async () => {
  const me = await request('/auth/me', { token: customer.access_token });
  assert.equal(me.status, 200);
  assert.equal(me.data.id, customer.user.id);
  assert.equal(me.data.fullName, 'Test One');
  assert.equal(me.data.role, 'customer');
  assert.equal('password' in me.data, false);
  const wrong = await request('/auth/login', {
    method: 'POST',
    body: { email: 'one@example.test', password: 'wrong' },
  });
  assert.equal(wrong.status, 401);
  const forged = new JwtService({ secret: 'super-secret-key' }).sign({ sub: customer.user.id });
  assert.equal((await request('/auth/me', { token: forged })).status, 401);
});
test('registration rejects role injection and weak passwords', async () => {
  assert.equal(
    (
      await request('/auth/register', {
        method: 'POST',
        body: { email: 'bad@example.test', fullName: 'Bad', password, role: 'admin' },
      })
    ).status,
    400
  );
  assert.equal(
    (
      await request('/auth/register', {
        method: 'POST',
        body: { email: 'bad@example.test', fullName: 'Bad', password: 'x' },
      })
    ).status,
    400
  );
});
test('only admins can create products, isActive persists and can be changed', async () => {
  const body = {
    name: 'Inactive regression',
    price: 10,
    stock: 5,
    isActive: false,
    categoryId: null,
  };
  assert.equal((await request('/products', { method: 'POST', body })).status, 401);
  assert.equal(
    (await request('/products', { method: 'POST', token: customer.access_token, body })).status,
    403
  );
  const created = await request('/products', { method: 'POST', token: admin, body });
  assert.equal(created.status, 201);
  assert.equal(created.data.isActive, false);
  assert.equal((await request('/products/' + created.data.id)).status, 404);
  const updated = await request('/products/' + created.data.id, {
    method: 'PATCH',
    token: admin,
    body: { isActive: true },
  });
  assert.equal(updated.status, 200);
  assert.equal(updated.data.isActive, true);
  assert.equal(
    (
      await request('/products', {
        method: 'POST',
        token: admin,
        body: { ...body, isActive: 'false' },
      })
    ).status,
    400
  );
});
test('cart rejects fractions, invalid IDs and unavailable products', async () => {
  const p = await product();
  for (const quantity of [-1, 0, 1.5, null]) {
    assert.equal(
      (await request('/cart', { method: 'POST', body: { productId: p.id, quantity } })).status,
      400
    );
  }
  assert.equal(
    (await request('/cart/not-an-id', { method: 'PATCH', body: { quantity: 2 } })).status,
    400
  );
  await prisma.product.update({ where: { id: p.id }, data: { isActive: false } });
  assert.equal(
    (await request('/cart', { method: 'POST', body: { productId: p.id, quantity: 1 } })).status,
    404
  );
});
test('concurrent additions preserve every unit and enforce stock', async () => {
  const p = await product(8);
  const session = randomUUID();
  const results = await Promise.all(
    Array.from({ length: 8 }, () =>
      request('/cart', { method: 'POST', session, body: { productId: p.id, quantity: 1 } })
    )
  );
  for (const result of results) assert.equal(result.status, 201, JSON.stringify(result.data));
  const cart = await request('/cart', { session });
  assert.equal(cart.data.items.length, 1);
  assert.equal(cart.data.items[0].quantity, 8);
  assert.equal(
    (await request('/cart', { method: 'POST', session, body: { productId: p.id, quantity: 1 } }))
      .status,
    400
  );
  assert.equal(
    (await request('/cart/' + cart.data.items[0].id, { method: 'DELETE', session: randomUUID() }))
      .status,
    404
  );
});
test('checkout is atomic and duplicate submissions decrement stock once', async () => {
  const p = await product(4, 0.1);
  const session = randomUUID();
  await request('/cart', { method: 'POST', session, body: { productId: p.id, quantity: 3 } });
  const body = {
    requestId: randomUUID(),
    customerName: 'Test One',
    shippingAddress: 'Test Street 123, Test City',
  };
  const results = await Promise.all(
    [1, 2].map(() =>
      request('/orders', { method: 'POST', token: customer.access_token, session, body })
    )
  );
  for (const result of results) assert.equal(result.status, 201, JSON.stringify(result.data));
  assert.equal(results[0].data.id, results[1].data.id);
  assert.equal(results[0].data.totalCents, 30);
  assert.equal(results[0].data.status, 'pending_payment');
  assert.equal((await prisma.product.findUnique({ where: { id: p.id } })).stock, 1);
  assert.equal((await request('/cart', { session })).data.items.length, 0);
  const id = results[0].data.id;
  assert.equal(
    (await request('/orders/' + id + '/cancel', { method: 'POST', token: other.access_token }))
      .status,
    404
  );
  const cancels = await Promise.all(
    [1, 2].map(() =>
      request('/orders/' + id + '/cancel', { method: 'POST', token: customer.access_token })
    )
  );
  for (const result of cancels) assert.equal(result.data.status, 'cancelled');
  assert.equal((await prisma.product.findUnique({ where: { id: p.id } })).stock, 4);
});
test('failed checkout rolls back all stock and preserves the cart', async () => {
  const p = await product(3);
  const q = await product(1);
  const session = randomUUID();
  for (const id of [p.id, q.id])
    await request('/cart', { method: 'POST', session, body: { productId: id, quantity: 1 } });
  await prisma.product.update({ where: { id: q.id }, data: { stock: 0 } });
  const result = await request('/orders', {
    method: 'POST',
    token: customer.access_token,
    session,
    body: {
      requestId: randomUUID(),
      customerName: 'Test One',
      shippingAddress: 'Test Street 123, Test City',
    },
  });
  assert.equal(result.status, 400);
  assert.equal((await prisma.product.findUnique({ where: { id: p.id } })).stock, 3);
  assert.equal((await request('/cart', { session })).data.items.length, 2);
});
test('two carts cannot order the last unit twice', async () => {
  const p = await product(1);
  const sessions = [randomUUID(), randomUUID()];
  for (const session of sessions)
    await request('/cart', { method: 'POST', session, body: { productId: p.id, quantity: 1 } });
  const responses = await Promise.all(
    sessions.map((session) =>
      request('/orders', {
        method: 'POST',
        token: customer.access_token,
        session,
        body: {
          requestId: randomUUID(),
          customerName: 'Test One',
          shippingAddress: 'Test Street 123, Test City',
        },
      })
    )
  );
  assert.deepEqual(responses.map((r) => r.status).sort(), [201, 400]);
  assert.equal((await prisma.product.findUnique({ where: { id: p.id } })).stock, 0);
});

test('product updates reject null required fields and blank names without changing data', async () => {
  const p = await product();
  for (const body of [
    { name: null },
    { price: null },
    { stock: null },
    { isActive: null },
    { name: '   ' },
  ]) {
    const result = await request('/products/' + p.id, { method: 'PATCH', token: admin, body });
    assert.equal(result.status, 400, JSON.stringify({ body, result }));
  }
  assert.equal((await prisma.product.findUnique({ where: { id: p.id } })).name, p.name);
  const cleared = await request('/products/' + p.id, {
    method: 'PATCH',
    token: admin,
    body: { description: null, image: null, categoryId: null },
  });
  assert.equal(cleared.status, 200);
  assert.equal(cleared.data.description, null);
});

test('invalid product categories return 400 on create and update', async () => {
  const p = await product();
  assert.equal(
    (
      await request('/products', {
        method: 'POST',
        token: admin,
        body: { name: 'Bad category', price: 1, stock: 1, categoryId: 2147483647 },
      })
    ).status,
    400
  );
  assert.equal(
    (
      await request('/products/' + p.id, {
        method: 'PATCH',
        token: admin,
        body: { categoryId: 2147483647 },
      })
    ).status,
    400
  );
});

test('search validates q and finds active products by description', async () => {
  for (const route of [
    '/products/search',
    '/products/search?q=',
    '/products/search?q=%20%20',
    '/products/search?q=x&q=y',
  ]) {
    assert.equal((await request(route)).status, 400, route);
  }
  const p = await prisma.product.create({
    data: { name: 'Description search', description: 'unique-search-term', price: 1, stock: 1 },
  });
  const result = await request('/products/search?q=%20unique-search-term%20');
  assert.equal(result.status, 200);
  assert.deepEqual(
    result.data.map((row) => row.id),
    [p.id]
  );
  await prisma.product.update({ where: { id: p.id }, data: { isActive: false } });
  assert.deepEqual((await request('/products/search?q=unique-search-term')).data, []);
});

test('IDs and numeric input reject overflow and boolean coercion', async () => {
  const p = await product();
  for (const id of ['0', '-1', '2147483648', '999999999999999999999']) {
    assert.equal((await request('/products/' + id)).status, 400, id);
    assert.equal(
      (await request('/cart/' + id, { method: 'PATCH', body: { quantity: 1 } })).status,
      400,
      id
    );
  }
  for (const body of [
    { productId: p.id, quantity: true },
    { productId: true, quantity: 1 },
    { productId: p.id, quantity: 2147483648 },
  ]) {
    assert.equal(
      (await request('/cart', { method: 'POST', body })).status,
      400,
      JSON.stringify(body)
    );
  }
  for (const body of [{ stock: 2147483648 }, { price: 21474836.48 }]) {
    assert.equal(
      (await request('/products/' + p.id, { method: 'PATCH', token: admin, body })).status,
      400
    );
  }
});

test('public routes, admin product lifecycle and session isolation match their contracts', async () => {
  assert.equal((await request('/products')).status, 200);
  assert.equal((await request('/products/categories')).status, 200);
  assert.equal((await request('/products/admin')).status, 401);
  assert.equal((await request('/products/admin', { token: customer.access_token })).status, 403);
  assert.equal((await request('/products/admin', { token: admin })).status, 200);
  for (const session of ['', 'invalid-session']) {
    assert.equal((await request('/cart', { session })).status, 400);
  }
  const created = await request('/products', {
    method: 'POST',
    token: admin,
    body: { name: '  Lifecycle product  ', description: 'original', price: 3.5, stock: 4 },
  });
  assert.equal(created.status, 201);
  assert.equal(created.data.name, 'Lifecycle product');
  const route = '/products/' + created.data.id;
  const updated = await request(route, {
    method: 'PATCH',
    token: admin,
    body: { name: 'Renamed', price: 4.25, stock: 7 },
  });
  assert.equal(updated.status, 200, JSON.stringify(updated.data));
  assert.equal(updated.data.description, 'original');
  assert.equal(updated.data.price, 4.25);
  assert.equal(updated.data.stock, 7);
  const session = randomUUID();
  await request('/cart', { method: 'POST', session, body: { productId: created.data.id } });
  assert.equal((await request('/cart', { session })).data.items[0].quantity, 1);
  await request('/cart/clear', { method: 'DELETE', session: randomUUID() });
  assert.equal((await request('/cart', { session })).data.items.length, 1);
  await request('/cart/clear', { method: 'DELETE', session });
  assert.deepEqual((await request('/cart', { session })).data.items, []);
  assert.equal(
    (await request(route, { method: 'DELETE', token: customer.access_token })).status,
    403
  );
  assert.equal((await request(route, { method: 'DELETE', token: admin })).status, 200);
  assert.equal((await request(route)).status, 404);
  assert.equal(
    (await request(route, { method: 'PATCH', token: admin, body: { stock: 1 } })).status,
    404
  );
  assert.equal((await request(route, { method: 'DELETE', token: admin })).status, 404);
});

test('order listing is private and confirmed orders cannot be cancelled', async () => {
  assert.equal((await request('/orders')).status, 401);
  assert.equal((await request('/orders', { method: 'POST', body: {} })).status, 401);
  assert.equal(
    (await request('/orders/not-a-uuid/cancel', { method: 'POST', token: customer.access_token }))
      .status,
    400
  );
  const order = await prisma.order.create({
    data: {
      userId: customer.user.id,
      requestId: randomUUID(),
      customerName: 'Test One',
      shippingAddress: 'Test Street 123',
      totalCents: 100,
      status: 'paid',
    },
  });
  const own = await request('/orders', { token: customer.access_token });
  assert.equal(own.status, 200);
  assert.ok(own.data.some((row) => row.id === order.id));
  const others = await request('/orders', { token: other.access_token });
  assert.ok(others.data.every((row) => row.userId === other.user.id));
  assert.equal(
    (
      await request('/orders/' + order.id + '/cancel', {
        method: 'POST',
        token: customer.access_token,
      })
    ).status,
    400
  );
  assert.equal((await prisma.order.findUnique({ where: { id: order.id } })).status, 'paid');
});

test('OAuth email collisions return a conflict and never link a local account implicitly', async () => {
  const users = app.get(require('../src/users/users.service').UsersService);
  await assert.rejects(
    users.createFromSupabase({
      id: randomUUID(),
      email: customer.user.email,
      userMetadata: {},
      appMetadata: {},
    }),
    (error) => error.getStatus?.() === 409
  );
  assert.equal((await users.findById(customer.user.id)).supabaseId, null);
});
