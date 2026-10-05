const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const load = require('./load-typescript.cjs');
const { validate } = load('src/utils/validators.ts');

test('regex email accepts ordinary addresses and rejects invalid input', () => {
  for (const value of ['alumno@example.com', ' maria.perez+curso@example.org '])
    assert.equal(validate.email(value), true);
  for (const value of [
    '',
    'alumno',
    'a@@example.com',
    'a b@example.com',
    'a@b',
    'a'.repeat(250) + '@example.com',
  ])
    assert.equal(validate.email(value), false);
});
test('regex password enforces length, uppercase, digit and special character', () => {
  assert.equal(validate.password('Curso2026!'), true);
  for (const value of ['', 'abc', 'curso2026!', 'Curso!!!!', 'Curso2026', 'A1!' + 'a'.repeat(70)])
    assert.equal(validate.password(value), false);
});
test('regex name supports accents and rejects digits, symbols and blank names', () => {
  for (const value of ['María Pérez', "Ana O'Connor", 'João Silva', 'Jose\u0301 Pérez'])
    assert.equal(validate.fullName(value), true);
  for (const value of ['', ' ', 'A', '123', '---', 'Ana×', 'Ana÷', 'Ana\nPerez'])
    assert.equal(validate.fullName(value), false);
});
test('every language provides the same validation keys', () => {
  const languages = ['es', 'en', 'pt'].map((code) =>
    JSON.parse(readFileSync(`src/locales/${code}.json`, 'utf8'))
  );
  const keys = Object.keys(languages[0].validation).sort();
  for (const language of languages) {
    assert.deepEqual(Object.keys(language.validation).sort(), keys);
    for (const key of keys) assert.ok(language.validation[key].length > 0);
  }
});
