import { test } from 'node:test';
import assert from 'node:assert/strict';
import { roundScore } from '../src/game/scoring.js';

test('delta: literal tricks minus bid', () => {
  assert.equal(roundScore(5, 3, 'delta'), -2);
  assert.equal(roundScore(2, 5, 'delta'), 3);
  assert.equal(roundScore(3, 3, 'delta'), 0);
});

test('nepal: make the call -> +tricks; miss -> -bid', () => {
  assert.equal(roundScore(3, 3, 'nepal'), 3); // exact
  assert.equal(roundScore(5, 7, 'nepal'), 7); // over-fulfill
  assert.equal(roundScore(5, 3, 'nepal'), -5); // fail the whole bid
  assert.equal(roundScore(0, 4, 'nepal'), 4); // bid 0 always pays
});

test('nepal-soft: make -> +tricks; miss -> -(shortfall)', () => {
  assert.equal(roundScore(3, 3, 'nepal-soft'), 3);
  assert.equal(roundScore(5, 3, 'nepal-soft'), -2);
  assert.equal(roundScore(5, 7, 'nepal-soft'), 7);
});

test('unknown variant throws', () => {
  assert.throws(() => roundScore(1, 1, 'bogus'), /Unknown scoring variant/);
});
