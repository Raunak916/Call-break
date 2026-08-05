// The bot interface. A bot is an object with `chooseBid(ctx)` and
// `choosePlay(ctx)` (and `delayMs` for pacing, used by the room layer).
// `buildCtx` turns the live GameState into everything a bot may look at.

import { resolveTrick, cardKey } from '../cards.js';
import { TRUMP_SUIT } from '../../config.js';

/**
 * Build the context a bot sees from the authoritative state.
 * All information is public/observable: own hand, the trick so far, own
 * tricks won, and card counting from what has been played.
 */
export function buildCtx(state, seat) {
  const play = state.play;
  const trickCards = play ? play.trickCards : [];
  const winnerSeat = trickCards.length ? resolveTrick(trickCards, play.ledSuit) : null;
  const currentBest = winnerSeat != null ? trickCards.find((t) => t.seat === winnerSeat).card : null;
  const hand = state.players[seat].hand;

  // Card counting: how many cards of a suit remain unseen.
  // 13 total, minus what I hold, minus what's been played this round.
  const playedKeys = state.playedCards;
  const remaining = (suit) => {
    let n = 13;
    for (const c of hand) if (c.s === suit) n--;
    for (const key of playedKeys) if (key[0] === suit) n--;
    return n;
  };

  return {
    seat,
    hand,
    handSize: hand.length,
    bids: state.bidding ? state.bidding.bids : [null, null, null, null],
    tricksWon: state.players[seat].tricksWon,
    trickCards,
    currentBest,
    ledSuit: play ? play.ledSuit : null,
    trickNumber: play ? play.trickNumber : 1,
    remainingRounds: state.totalRounds - state.round,
    playedKeys,
    remaining,
    trumpSuit: TRUMP_SUIT,
    cardKey,
  };
}

/**
 * The one decision shared by every trick-taker: how hard to try to win.
 * Under nepal scoring extra tricks are good, so default to winning.
 * Pass instead when the bid is already fulfilled and winning would cost a
 * big trump with most of the hand still to play.
 */
export function wantToWin(ctx) {
  const bid = ctx.bids[ctx.seat];
  if (bid == null) return true;
  if (ctx.tricksWon >= bid) {
    const bigTrumps = ctx.hand.filter((c) => c.s === TRUMP_SUIT && c.r >= 13); // K or A
    if (bigTrumps.length && ctx.trickNumber <= 11) return false; // save the trump
  }
  return true;
}

/** Lowest-ranked card from a candidate set. */
export function cheapest(cards) {
  return [...cards].sort((a, b) => a.r - b.r)[0];
}

/** Best card to get rid of: lowest rank, non-trump preferred. */
export function cheapestDump(hand) {
  return [...hand].sort((a, b) => {
    if (a.r !== b.r) return a.r - b.r;
    return (a.s === TRUMP_SUIT ? 1 : 0) - (b.s === TRUMP_SUIT ? 1 : 0);
  })[0];
}
