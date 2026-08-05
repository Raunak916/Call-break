// The default bot: simple card-counting heuristics. The interface lives in
// baseBot.js so harder profiles (aggressive, defensive, ML) can be added later.

import { beats } from '../cards.js';
import { TRUMP_SUIT } from '../../config.js';
import { cheapest, cheapestDump, wantToWin } from './baseBot.js';

function countSuit(hand, suit) {
  return hand.filter((c) => c.s === suit).length;
}

/**
 * Estimate how many tricks this hand is worth.
 * - Non-trump suits: score high cards, discounted by position.
 * - Trumps: big trumps count fully; low trumps gain value from length
 *   (being able to over-trump a running suit is what wins tricks).
 * - A little personality noise keeps bots from all bidding identically.
 */
export function estimateBid(ctx, rng = Math.random) {
  const bySuit = {};
  for (const c of ctx.hand) (bySuit[c.s] ??= []).push(c);

  let strength = 0;
  for (const [suit, cards] of Object.entries(bySuit)) {
    const sorted = [...cards].sort((a, b) => b.r - a.r);
    if (suit === TRUMP_SUIT) {
      strength += sorted.filter((c) => c.r >= 11).length; // J+ win outright
      const lows = sorted.filter((c) => c.r < 11);
      if (lows.length) strength += 0.5; // your best low trump
      strength += Math.max(0, lows.length - 1) * 0.25; // extra trumps
    } else {
      for (let i = 0; i < sorted.length; i++) {
        const c = sorted[i];
        if (c.r === 14) strength += 1.0; // ace
        else if (c.r === 13 && i === 0) strength += 0.7; // K if highest in suit
        else if (c.r === 12 && i < 2) strength += 0.4; // Q if top-2
        else if (c.r === 11 && i < 3) strength += 0.2; // J if top-3
      }
      strength += Math.max(0, sorted.length - 3) * 0.1; // long suit: shed low safely
    }
  }

  const noise = (rng() * 2 - 1) * 0.3;
  return Math.max(0, Math.min(13, Math.round(strength + noise)));
}

/** Which suit is best to lead from: long and high, never trump voluntarily. */
function chooseLead(ctx) {
  const { hand } = ctx;
  const nontrump = hand.filter((c) => c.s !== TRUMP_SUIT);
  if (!nontrump.length) return cheapest(hand); // only trumps left

  const singletonAce = nontrump.find((c) => c.r === 14 && countSuit(hand, c.s) === 1);
  if (singletonAce) return singletonAce; // bank a sure trick

  let bestSuit = null;
  let bestScore = -Infinity;
  for (const s of new Set(nontrump.map((c) => c.s))) {
    const cards = hand.filter((c) => c.s === s);
    const score = cards.length * 2 + cards.filter((c) => c.r >= 12).length;
    if (score > bestScore) {
      bestScore = score;
      bestSuit = s;
    }
  }
  // Lead the top of that suit — if it wins, establish the rest of the suit.
  return [...hand.filter((c) => c.s === bestSuit)].sort((a, b) => b.r - a.r)[0];
}

/** Pick a card to play. Always legal: honors the follow-suit rule. */
export function choosePlay(ctx) {
  const { hand, ledSuit } = ctx;
  if (!ledSuit) return chooseLead(ctx);

  const suitCards = hand.filter((c) => c.s === ledSuit);
  if (suitCards.length) {
    // Must follow suit. Beat the trick cheaply if it's worth winning,
    // otherwise dump the lowest of the suit.
    const beaters = suitCards.filter((c) => beats(c, ctx.currentBest, ledSuit));
    if (beaters.length && wantToWin(ctx)) return cheapest(beaters);
    return cheapest(suitCards);
  }

  // Can't follow — may trump. Only burn a trump to win if it's worthwhile.
  if (wantToWin(ctx) && ctx.currentBest) {
    const trumpBeaters = hand
      .filter((c) => c.s === TRUMP_SUIT)
      .filter((c) => beats(c, ctx.currentBest, ledSuit));
    if (trumpBeaters.length) return cheapest(trumpBeaters);
  }
  return cheapestDump(hand);
}

/** Factory for a bot with its own RNG (so a simulation is reproducible). */
export function createHeuristicBot({ rng = Math.random } = {}) {
  return {
    chooseBid(ctx) {
      return estimateBid(ctx, rng);
    },
    choosePlay(ctx) {
      return choosePlay(ctx);
    },
    delayMs(ctx) {
      return ctx.ledSuit == null && ctx.trickCards.length === 0
        ? 600 + rng() * 600 // bidding, faster
        : 1100 + rng() * 1300; // plays, more human
    },
  };
}
