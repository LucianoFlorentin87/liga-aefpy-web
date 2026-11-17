import assert from 'node:assert/strict';
import { test } from 'node:test';
import { isValidEfhubSearch } from '../src/lib/efhub-search';

test('eFHUB accepts player names including the reported del piero search', () => {
  for (const name of ['del piero', 'Neymar', 'Kylian Mbappé', 'Vinícius Júnior', 'Jose\u0301', "O'Neill", 'N’Golo Kanté', 'Heung-Min Son', 'A. Del Piero', '選手', 'Ronaldo 9']) {
    assert.equal(isValidEfhubSearch(name), true, name);
  }
});

test('eFHUB rejects oversized names, controls and non-name input', () => {
  for (const name of ['', 'a', 'a'.repeat(81), 'del\npiero', '<script>', 'https://example.com', 'player?x=1', 'player\\name']) {
    assert.equal(isValidEfhubSearch(name), false, name);
  }
  assert.equal(isValidEfhubSearch('a'.repeat(80)), true);
});
