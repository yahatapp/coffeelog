import { test } from 'node:test';
import assert from 'node:assert/strict';
import { declarations, validateTokens, checkRepository } from './check-design-tokens.mjs';
const contract = { '--cl-text': { type: 'color', required: true } };
test('required tokens, reference chains, cycles and types', () => {
  assert.deepEqual(validateTokens(contract, new Map(), declarations('--ref: #123456; --cl-text: var(--ref);')), []);
  assert.match(validateTokens(contract, new Map(), new Map()).join(), /Undefined/);
  assert.match(validateTokens(contract, new Map(), declarations('--cl-text: var(--missing);')).join(), /Undefined/);
  assert.match(validateTokens(contract, new Map(), declarations('--cl-text: var(--ref); --ref: var(--cl-text);')).join(), /Circular/);
  assert.match(validateTokens(contract, new Map(), declarations('--cl-text: 1rem;')).join(), /Invalid color/);
});
test('both repository themes meet the public contract', () => assert.ok(checkRepository() > 0));
