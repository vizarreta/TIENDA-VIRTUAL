const { test } = require('node:test');
const assert = require('node:assert/strict');
const { plainToInstance } = require('class-transformer');
const { validate } = require('class-validator');
const { RegisterDto, LoginDto } = require('../src/auth/auth.dto');

const validRegistration = {
  email: 'alumno@example.com',
  fullName: 'María Pérez',
  password: 'Curso2026!',
};
test('registration DTO accepts valid normalized fields', async () => {
  const dto = plainToInstance(RegisterDto, {
    ...validRegistration,
    fullName: ' Mari\u0301a Pérez ',
  });
  assert.equal((await validate(dto)).length, 0);
  assert.equal(dto.fullName, 'María Pérez');
});
test('registration DTO rejects passwords without the required composition', async () => {
  for (const password of ['curso2026!', 'Curso!!!!', 'Curso2026', 'abc']) {
    assert.ok(
      (await validate(plainToInstance(RegisterDto, { ...validRegistration, password }))).some(
        (error) => error.property === 'password'
      )
    );
  }
});
test('registration DTO rejects invalid names and emails', async () => {
  for (const fullName of ['123', '---', 'Ana×', 'Ana\nPerez']) {
    assert.ok(
      (await validate(plainToInstance(RegisterDto, { ...validRegistration, fullName }))).some(
        (error) => error.property === 'fullName'
      )
    );
  }
  assert.ok(
    (
      await validate(plainToInstance(RegisterDto, { ...validRegistration, email: 'sin-arroba' }))
    ).some((error) => error.property === 'email')
  );
});
test('login requires a password but does not reapply the registration strength policy', async () => {
  assert.equal(
    (
      await validate(
        plainToInstance(LoginDto, { email: validRegistration.email, password: 'legacy' })
      )
    ).length,
    0
  );
  assert.ok(
    (await validate(plainToInstance(LoginDto, { email: validRegistration.email, password: '' })))
      .length > 0
  );
});
