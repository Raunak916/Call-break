// UNO heuristic bot — picks legal moves using simple strategy.
// Follows the same interface as Call Break's heuristicBot: { delayMs, chooseAction }.

import { isWild, isStackCard, WILD_COLOR } from '../cards.js';

const BASE_DELAY = 800;
const VARIANCE = 600;

/**
 * Create a UNO bot profile. Accepts an optional seeded RNG for deterministic tests.
 */
export function createUnoBot({ rng = Math.random } = {}) {
  return {
    /** Random delay before acting (ms). */
    delayMs() {
      return BASE_DELAY + Math.floor(rng() * VARIANCE);
    },

    /**
     * Choose an action given the current state and the bot's seat.
     * Returns { type: 'play', card } or { type: 'draw' } or { type: 'chooseColor', color }
     * or { type: 'callUno' }.
     */
    chooseAction(state, seat) {
      const player = state.players[seat];
      const hand = player.hand;
      const topCard = state.discardPile[state.discardPile.length - 1];

      // Check if we need to call UNO (1 card left).
      if (hand.length === 1 && !player.calledUno) {
        return { type: 'callUno' };
      }

      // Stack rule: if a stack is active, try to stack or draw.
      if (state.stack.type) {
        const stackCards = hand.filter((c) => c.type === state.stack.type);
        if (stackCards.length > 0) {
          // Stack the card (prefer the one that keeps the same color if possible).
          const best = stackCards[0];
          return { type: 'play', card: best };
        }
        // Can't stack — draw the penalty.
        return { type: 'draw' };
      }

      // Normal play: find cards that match the current discard.
      const playable = hand.filter((c) => {
        if (isWild(c)) return true;
        if (c.color === state.currentColor) return true;
        if (c.type === topCard.type && c.type !== 'number') return true;
        if (c.type === 'number' && topCard.type === 'number' && c.value === topCard.value) return true;
        return false;
      });

      if (playable.length === 0) {
        return { type: 'draw' };
      }

      // Strategy: prefer non-wild cards that match color, then action cards, then wilds.
      const colorMatch = playable.filter((c) => !isWild(c) && c.color === state.currentColor);
      if (colorMatch.length > 0) {
        // Prefer action cards (skip, reverse, draw2) for strategic value.
        const actions = colorMatch.filter((c) => isStackCard(c) || c.type === 'skip' || c.type === 'reverse');
        if (actions.length > 0) return { type: 'play', card: actions[0] };
        return { type: 'play', card: colorMatch[0] };
      }

      // No color match — try number/type match with any color.
      const nonWild = playable.filter((c) => !isWild(c));
      if (nonWild.length > 0) {
        return { type: 'play', card: nonWild[0] };
      }

      // Only wilds left — play a wild and choose the most common color in hand.
      const wild = playable.find((c) => c.type === 'wild');
      if (wild) {
        return { type: 'play', card: wild };
      }

      // Wild Draw Four — only if truly no matching color (already validated by engine).
      const wildDraw4 = playable.find((c) => c.type === 'wild_draw4');
      if (wildDraw4) {
        return { type: 'play', card: wildDraw4 };
      }

      return { type: 'draw' };
    },

    /**
     * Choose a color for a Wild card. Picks the most common color in hand.
     */
    chooseColor(hand) {
      const counts = { red: 0, blue: 0, green: 0, yellow: 0 };
      for (const c of hand) {
        if (c.color in counts) counts[c.color]++;
      }
      let best = 'red';
      let bestCount = 0;
      for (const [color, count] of Object.entries(counts)) {
        if (count > bestCount) {
          best = color;
          bestCount = count;
        }
      }
      return best;
    },
  };
}
