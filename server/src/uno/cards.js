// UNO deck composition and card utilities.
// Standard 108-card deck: 76 number cards, 24 action cards, 8 wild cards.

export const COLORS = ['red', 'blue', 'green', 'yellow'];
export const WILD_COLOR = 'wild';

export const NUMBER_VALUES = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
export const ACTION_TYPES = ['skip', 'reverse', 'draw2'];
export const WILD_TYPES = ['wild', 'wild_draw4'];

/**
 * Create a full 108-card UNO deck.
 * Each card: { id, color, type, value }
 *   id     — unique string for equality checks
 *   color  — 'red'|'blue'|'green'|'yellow'|'wild'
 *   type   — 'number'|'skip'|'reverse'|'draw2'|'wild'|'wild_draw4'
 *   value  — for number cards: 0-9; undefined for action/wild cards
 */
export function createDeck() {
  const cards = [];
  let id = 0;

  for (const color of COLORS) {
    // Number cards: one 0, two each of 1-9
    for (const value of NUMBER_VALUES) {
      const copies = value === 0 ? 1 : 2;
      for (let c = 0; c < copies; c++) {
        cards.push({ id: String(id++), color, type: 'number', value });
      }
    }

    // Action cards: two each of skip, reverse, draw2
    for (const type of ACTION_TYPES) {
      for (let c = 0; c < 2; c++) {
        cards.push({ id: String(id++), color, type });
      }
    }
  }

  // Wild cards: four wild, four wild_draw4
  for (const type of WILD_TYPES) {
    for (let c = 0; c < 4; c++) {
      cards.push({ id: String(id++), color: WILD_COLOR, type });
    }
  }

  return cards;
}

/**
 * Fisher-Yates shuffle (in-place, returns the array).
 * Accepts an optional seeded RNG for deterministic tests.
 */
export function shuffle(deck, rng = Math.random) {
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

/** String key for card identity comparisons. */
export function cardKey(card) {
  return `${card.color}:${card.type}:${card.value ?? ''}`;
}

/** Is this a wild card (can be played anytime, chooses color)? */
export function isWild(card) {
  return card.color === WILD_COLOR;
}

/** Is this a stacking penalty card (Draw Two or Wild Draw Four)? */
export function isStackCard(card) {
  return card.type === 'draw2' || card.type === 'wild_draw4';
}

/** Does this card match the current discard (by color, number, or symbol)? */
export function matchesDiscard(card, topCard, currentColor) {
  if (isWild(card)) return true;
  if (card.color === currentColor) return true;
  if (card.type === topCard.type && card.type !== 'number') return true;
  if (card.type === 'number' && topCard.type === 'number' && card.value === topCard.value) return true;
  return false;
}

/** Seeded PRNG (mulberry32) for deterministic test shuffles. */
export function mulberry32(seed) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
