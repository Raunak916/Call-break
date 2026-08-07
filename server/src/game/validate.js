// Validation rules for player actions. Each returns { ok: true } or
// { ok: false, error: <CODE> }. These are the exact rules from the plan;
// the socket layer maps the codes to friendly messages.

import { CARDS_PER_HAND } from '../config.js';

function err(code) {
  return { ok: false, error: code };
}

/** Validate a `game:bid` action. */
export function validateBid(state, seat, bid) {
  if (state.phase !== 'bidding') return err('WRONG_PHASE');
  if (state.bidding.bids[seat] != null) return err('ALREADY_BID');
  if (!Number.isInteger(bid) || bid < 0 || bid > CARDS_PER_HAND) return err('INVALID_BID');
  return { ok: true };
}

/** Validate a `game:play` action (card = { s, r }). */
export function validatePlay(state, seat, card) {
  if (state.phase !== 'playing') return err('WRONG_PHASE');
  if (state.play.currentPlayerSeat !== seat) return err('NOT_YOUR_TURN');

  if (!card || typeof card.s !== 'string' || !Number.isInteger(card.r)) {
    return err('INVALID_CARD');
  }
  const player = state.players[seat];
  if (!player.hand.some((c) => c.s === card.s && c.r === card.r)) {
    return err('CARD_NOT_IN_HAND');
  }

  const ledSuit = state.play.ledSuit;
  const hasLedSuit = player.hand.some((c) => c.s === ledSuit);
  if (ledSuit && hasLedSuit && card.s !== ledSuit) {
    return err('MUST_FOLLOW_SUIT');
  }
  return { ok: true };
}
