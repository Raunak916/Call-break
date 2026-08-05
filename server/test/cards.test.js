import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  createDeck,
  mulberry32,
  shuffle,
  dealHands,
  cardKey,
  sortHand,
  resolveTrick,
} from '../src/game/cards.js';

test('deck has 52 unique cards, 13 of each suit', () => {
  const deck = createDeck();
  assert.equal(deck.length, 52);
  const keys = new Set(deck.map(cardKey));
  assert.equal(keys.size, 52);
  for (const s of ['S', 'H', 'D', 'C']) {
    assert.equal(deck.filter((c) => c.s === s).length, 13);
  }
});

test('seeded shuffle is deterministic; different seeds differ', () => {
  const a = shuffle(createDeck(), mulberry32(42)).map(cardKey);
  const b = shuffle(createDeck(), mulberry32(42)).map(cardKey);
  assert.deepEqual(a, b);
  const c = shuffle(createDeck(), mulberry32(43)).map(cardKey);
  assert.notDeepEqual(a, c);
});

test('deal gives each of 4 players 13 cards, covering the whole deck', () => {
  const deck = shuffle(createDeck(), mulberry32(7));
  const hands = dealHands(deck);
  assert.deepEqual(hands.map((h) => h.length), [13, 13, 13, 13]);
  const all = hands.flat().map(cardKey).sort();
  const deckKeys = deck.map(cardKey).sort();
  assert.deepEqual(all, deckKeys);
});

test('sortHand orders by suit and rank descending', () => {
  const hand = [{ s: 'S', r: 2 }, { s: 'C', r: 14 }, { s: 'H', r: 5 }, { s: 'C', r: 3 }];
  const sorted = sortHand(hand);
  assert.deepEqual(sorted.map(cardKey), ['C14', 'C3', 'H5', 'S2']);
});

test('resolveTrick: trump beats the led suit', () => {
  const played = [
    { seat: 0, card: { s: 'H', r: 9 } },
    { seat: 1, card: { s: 'S', r: 2 } },
  ];
  assert.equal(resolveTrick(played, 'H'), 1);
});

test('resolveTrick: highest trump wins', () => {
  const played = [
    { seat: 0, card: { s: 'S', r: 3 } },
    { seat: 2, card: { s: 'S', r: 14 } },
    { seat: 1, card: { s: 'H', r: 9 } },
  ];
  assert.equal(resolveTrick(played, 'H'), 2);
});

test('resolveTrick: no trump -> highest of led suit wins', () => {
  const played = [
    { seat: 3, card: { s: 'H', r: 5 } },
    { seat: 0, card: { s: 'H', r: 9 } },
    { seat: 1, card: { s: 'C', r: 2 } },
  ];
  assert.equal(resolveTrick(played, 'H'), 0);
});

test('resolveTrick: a void dump can never win', () => {
  const played = [
    { seat: 3, card: { s: 'H', r: 5 } },
    { seat: 0, card: { s: 'H', r: 9 } },
    { seat: 1, card: { s: 'C', r: 14 } }, // ace, but wrong suit
  ];
  assert.equal(resolveTrick(played, 'H'), 0);
});

test('resolveTrick: spades led are their own contest', () => {
  const played = [
    { seat: 0, card: { s: 'S', r: 2 } },
    { seat: 2, card: { s: 'S', r: 5 } },
  ];
  assert.equal(resolveTrick(played, 'S'), 2);
});
