import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createDeck, shuffle, cardKey, isWild, isStackCard, matchesDiscard, mulberry32 } from '../../src/uno/cards.js';

test('deck has 108 cards', () => {
  const deck = createDeck();
  assert.equal(deck.length, 108);
});

test('deck has correct card distribution', () => {
  const deck = createDeck();
  const colorCards = deck.filter((c) => c.color !== 'wild');
  const wildCards = deck.filter((c) => c.color === 'wild');
  assert.equal(colorCards.length, 100); // 25 per color × 4
  assert.equal(wildCards.length, 8);    // 4 wild + 4 wild_draw4
});

test('each color has one 0 and two of each 1-9', () => {
  const deck = createDeck();
  for (const color of ['red', 'blue', 'green', 'yellow']) {
    const colorDeck = deck.filter((c) => c.color === color && c.type === 'number');
    const zeros = colorDeck.filter((c) => c.value === 0);
    const ones = colorDeck.filter((c) => c.value === 1);
    assert.equal(zeros.length, 1, `${color} should have one 0`);
    assert.equal(ones.length, 2, `${color} should have two 1s`);
    for (let v = 2; v <= 9; v++) {
      assert.equal(colorDeck.filter((c) => c.value === v).length, 2, `${color} should have two ${v}s`);
    }
  }
});

test('each color has two skip, two reverse, two draw2', () => {
  const deck = createDeck();
  for (const color of ['red', 'blue', 'green', 'yellow']) {
    const actions = deck.filter((c) => c.color === color && ['skip', 'reverse', 'draw2'].includes(c.type));
    assert.equal(actions.length, 6, `${color} should have 6 action cards`);
  }
});

test('shuffle is deterministic with seeded RNG', () => {
  const a = shuffle(createDeck(), mulberry32(42));
  const b = shuffle(createDeck(), mulberry32(42));
  assert.deepEqual(a.map(cardKey), b.map(cardKey));
});

test('cardKey identifies card type (duplicates share keys)', () => {
  const deck = createDeck();
  const keys = new Set(deck.map(cardKey));
  // 108 cards but only ~55 unique types (duplicates share keys).
  assert.ok(keys.size < deck.length, 'duplicate cards share the same cardKey');
  assert.ok(keys.size > 0);
});

test('isWild identifies wild cards', () => {
  const deck = createDeck();
  const wilds = deck.filter(isWild);
  assert.equal(wilds.length, 8);
  assert.ok(wilds.every((c) => c.color === 'wild'));
});

test('isStackCard identifies draw2 and wild_draw4', () => {
  const deck = createDeck();
  const stackCards = deck.filter(isStackCard);
  assert.equal(stackCards.length, 12); // 8 draw2 + 4 wild_draw4
});

test('matchesDiscard checks color, number, and symbol', () => {
  const red5 = { color: 'red', type: 'number', value: 5 };
  const blue5 = { color: 'blue', type: 'number', value: 5 };
  const redSkip = { color: 'red', type: 'skip' };
  const blueSkip = { color: 'blue', type: 'skip' };
  const wild = { color: 'wild', type: 'wild' };

  assert.ok(matchesDiscard(red5, red5, 'red')); // same color
  assert.ok(matchesDiscard(blue5, red5, 'red')); // same number
  assert.ok(matchesDiscard(redSkip, red5, 'red')); // same color, different type
  assert.ok(matchesDiscard(blueSkip, redSkip, 'red')); // same symbol (skip)
  assert.ok(matchesDiscard(wild, red5, 'red')); // wild always matches
  assert.ok(!matchesDiscard(blueSkip, red5, 'red')); // no match
});
