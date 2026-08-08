// Validation rules for UNO player actions.
// Each returns { ok: true } or { ok: false, error: CODE }.

import { matchesDiscard, isStackCard, isWild, WILD_COLOR } from './cards.js';
import { HAND_SIZE, MIN_PLAYERS, MAX_PLAYERS } from './config.js';

function err(code) {
  return { ok: false, error: code };
}

/** Can this room start? (correct phase + player count). */
export function validateStart(state) {
  if (state.phase !== 'lobby') return err('WRONG_PHASE');
  const humans = state.players.filter((p) => p.name && !p.isBot);
  if (humans.length < MIN_PLAYERS) return err('NOT_ENOUGH_PLAYERS');
  if (state.players.filter((p) => p.name).length > MAX_PLAYERS) return err('TOO_MANY_PLAYERS');
  if (humans.length >= 2 && humans.some((p) => p.connected && !p.ready)) {
    return err('NOT_ALL_READY');
  }
  return { ok: true };
}

/** Validate playing a card from hand. */
export function validatePlayCard(state, seat, card) {
  if (state.phase !== 'playing') return err('WRONG_PHASE');
  if (state.currentPlayerSeat !== seat) return err('NOT_YOUR_TURN');
  if (!card || typeof card.id !== 'string') return err('INVALID_CARD');

  const player = state.players[seat];
  const inHand = player.hand.find((c) => c.id === card.id);
  if (!inHand) return err('CARD_NOT_IN_HAND');

  // Stack rule: if a stack is active, must stack same type or draw.
  const { stack } = state;
  if (stack.type) {
    if (inHand.type !== stack.type) return err('MUST_DRAW_OR_STACK');
  } else {
    // Normal play: must match color, number, or symbol — or be wild.
    if (!matchesDiscard(inHand, topCard(state), state.currentColor)) {
      return err('NO_MATCH');
    }
  }

  // Wild Draw Four legality: only if no card of current color in hand.
  if (inHand.type === 'wild_draw4' && !stack.type) {
    const hasMatchingColor = player.hand.some(
      (c) => c.id !== inHand.id && c.color === state.currentColor,
    );
    if (hasMatchingColor) return err('ILLEGAL_WILD_DRAW4');
  }

  return { ok: true };
}

/** Validate drawing a card. */
export function validateDrawCard(state, seat) {
  if (state.phase !== 'playing') return err('WRONG_PHASE');
  if (state.currentPlayerSeat !== seat) return err('NOT_YOUR_TURN');
  // Can always draw (even if you have a playable card — house choice).
  return { ok: true };
}

/** Validate calling UNO. */
export function validateCallUno(state, seat) {
  if (state.phase !== 'playing') return err('WRONG_PHASE');
  const player = state.players[seat];
  if (player.hand.length !== 1) return err('NOT_ONE_CARD');
  if (player.calledUno) return err('ALREADY_CALLED');
  return { ok: true };
}

/** Validate choosing a color after playing a Wild. */
export function validateChooseColor(state, seat, color) {
  if (state.phase !== 'playing') return err('WRONG_PHASE');
  if (state.currentPlayerSeat !== seat) return err('NOT_YOUR_TURN');
  if (!['red', 'blue', 'green', 'yellow'].includes(color)) return err('INVALID_COLOR');
  // Can only choose color if the last played card was a wild and color not yet set.
  const lastCard = state.discardPile[state.discardPile.length - 1];
  if (!lastCard || !isWild(lastCard)) return err('NO_COLOR_CHOICE');
  if (state.currentColor !== WILD_COLOR && state.currentColor !== null) return err('COLOR_ALREADY_CHOSEN');
  return { ok: true };
}

/** Helper: top card of the discard pile. */
function topCard(state) {
  return state.discardPile[state.discardPile.length - 1];
}
