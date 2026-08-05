// Pure card primitives: deck, shuffle, dealing, sorting, and trick resolution.
// No game state here — just building blocks the engine composes.

import { SUITS, TRUMP_SUIT, MIN_RANK, MAX_RANK } from '../config.js';

/** @returns {{s: string, r: number}[]} a fresh 52-card deck */
export function createDeck() {
  const deck = [];
  for (const s of SUITS) {
    for (let r = MIN_RANK; r <= MAX_RANK; r++) deck.push({ s, r });
  }
  return deck;
}

/** Deterministic PRNG for tests. Seeded shuffle must be reproducible. */
export function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a += 0x6d2b79f5;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Fisher–Yates shuffle. Mutates and returns the array. */
export function shuffle(arr, rng = Math.random) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Deal the deck round-robin: seat 0 gets card 0, seat 1 gets card 1, ...
 * Which cards each seat receives is random (the deck was shuffled first).
 */
export function dealHands(deck, numPlayers = 4, cardsPerHand = 13) {
  const hands = Array.from({ length: numPlayers }, () => []);
  for (let i = 0; i < deck.length; i++) {
    hands[i % numPlayers].push(deck[i]);
  }
  return hands;
}

/** Unique identity for a card, e.g. "S14". */
export function cardKey(card) {
  return `${card.s}${card.r}`;
}

// Display order: clubs, diamonds, hearts, then spades (trump) rightmost.
const DISPLAY_SUIT_ORDER = { C: 0, D: 1, H: 2, S: 3 };

/** Sort a hand for display: by suit, then rank descending (A high). */
export function sortHand(hand) {
  return [...hand].sort(
    (a, b) => DISPLAY_SUIT_ORDER[a.s] - DISPLAY_SUIT_ORDER[b.s] || b.r - a.r,
  );
}

/**
 * Does `card` beat `current` in a trick where `ledSuit` was led?
 * Exported so bots can reuse the same comparison for card-counting.
 */
export function beats(card, current, ledSuit) {
  if (!current) return true;
  // Trump beats everything non-trump.
  if (card.s === TRUMP_SUIT && current.s !== TRUMP_SUIT) return true;
  if (card.s !== TRUMP_SUIT && current.s === TRUMP_SUIT) return false;
  // Otherwise only a card of the led suit (or trump) is in contention.
  if (card.s === TRUMP_SUIT || card.s === ledSuit) return card.r > current.r;
  return false; // a void dump can never win
}

/**
 * Given the cards played in a trick, return the seat that wins it.
 * @param {{seat: number, card: {s:string, r:number}}[]} played
 * @param {string} ledSuit
 * @returns {number} winning seat
 */
export function resolveTrick(played, ledSuit) {
  let winner = played[0].seat;
  let bestCard = played[0].card;
  for (let i = 1; i < played.length; i++) {
    const { seat, card } = played[i];
    if (beats(card, bestCard, ledSuit)) {
      winner = seat;
      bestCard = card;
    }
  }
  return winner;
}
