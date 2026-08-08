// Pure UNO game state machine. No sockets, no timers — just state mutations.

import { createDeck, shuffle, isWild, isStackCard, WILD_COLOR } from './cards.js';
import { HAND_SIZE, DRAW2_PENALTY, WILD_DRAW4_PENALTY } from './config.js';
import { validatePlayCard, validateDrawCard, validateCallUno, validateChooseColor } from './validate.js';

export class GameError extends Error {
  constructor(code, message = code) {
    super(message);
    this.name = 'GameError';
    this.code = code;
  }
}

function createPlayer(seat) {
  return {
    seat,
    name: '',
    isBot: false,
    botControlled: false,
    playerId: null,
    socketId: null,
    connected: false,
    disconnectedAt: null,
    rejoinGraceUntil: null,
    disconnectedPlayerId: null,
    ready: false,
    hand: [],
    calledUno: false,
  };
}

/** Fresh lobby state with empty seats. */
export function createState({ totalRounds = 1, numSeats = 4 } = {}) {
  return {
    phase: 'lobby',
    gameType: 'uno',
    round: 0,
    totalRounds,
    players: Array.from({ length: numSeats }, (_, seat) => createPlayer(seat)),
    drawPile: [],
    discardPile: [],
    currentColor: null,
    currentPlayerSeat: 0,
    direction: 1,
    stack: { type: null, count: 0 },
    lastAction: null,
    version: 0,
  };
}

/**
 * Start a new round: shuffle, deal 7 cards each, flip a numbered card
 * to begin the discard pile.
 */
export function startRound(state, rng = Math.random) {
  if (state.phase !== 'lobby' && state.phase !== 'roundEnd') {
    throw new GameError('WRONG_PHASE', 'Cannot start a round now');
  }
  if (state.phase === 'lobby') state.round = 1;
  else state.round += 1;

  const deck = shuffle(createDeck(), rng);

  for (const player of state.players) {
    player.hand = deck.splice(0, HAND_SIZE);
    player.calledUno = false;
  }

  // Flip cards until we get a numbered card for the initial discard.
  let startCard;
  const remaining = [];
  for (const card of deck) {
    if (!startCard && card.type === 'number') {
      startCard = card;
    } else {
      remaining.push(card);
    }
  }
  if (!startCard) startCard = remaining.shift();

  state.drawPile = remaining;
  state.discardPile = [startCard];
  state.currentColor = startCard.color;
  state.direction = 1;
  state.stack = { type: null, count: 0 };
  state.lastAction = null;
  state.currentPlayerSeat = 0;

  applyStartCardEffect(state, startCard);

  state.phase = 'playing';
  state.version += 1;
  return state;
}

function applyStartCardEffect(state, card) {
  switch (card.type) {
    case 'skip':
      advanceTurn(state);
      break;
    case 'reverse':
      state.direction = -1;
      if (state.players.length === 2) advanceTurn(state);
      break;
    case 'draw2':
      drawCards(state, nextSeat(state), DRAW2_PENALTY);
      advanceTurn(state);
      break;
  }
}

/** Play a card from hand. Effects are applied; turn advances for most cards. */
export function applyPlayCard(state, seat, card) {
  const check = validatePlayCard(state, seat, card);
  if (!check.ok) throw new GameError(check.error);

  const player = state.players[seat];
  const playedCard = player.hand.find((c) => c.id === card.id);

  // Remove from hand, add to discard.
  player.hand = player.hand.filter((c) => c.id !== card.id);
  state.discardPile.push(playedCard);
  player.calledUno = false;

  // Handle stacking: if stacking same type, grow the stack and advance.
  if (state.stack.type && playedCard.type === state.stack.type) {
    state.stack.count += playedCard.type === 'draw2' ? DRAW2_PENALTY : WILD_DRAW4_PENALTY;
    state.lastAction = { type: 'stack', seat, card: playedCard };
    advanceTurn(state);
    state.version += 1;
    return state;
  }

  // Clear any active stack.
  state.stack = { type: null, count: 0 };

  // Set color for wild cards.
  if (isWild(playedCard)) {
    state.currentColor = WILD_COLOR;
  } else {
    state.currentColor = playedCard.color;
  }

  state.lastAction = { type: 'play', seat, card: playedCard };

  // Apply card effects and advance turn.
  switch (playedCard.type) {
    case 'skip':
      advanceTurn(state); // skip next player
      advanceTurn(state); // land on the one after
      break;
    case 'reverse':
      state.direction *= -1;
      if (state.players.length === 2) {
        // Reverse acts as skip in 2-player.
        advanceTurn(state);
        advanceTurn(state);
      } else {
        advanceTurn(state); // advance in new direction
      }
      break;
    case 'draw2':
      state.stack = { type: 'draw2', count: DRAW2_PENALTY };
      advanceTurn(state); // next player must stack or draw
      break;
    case 'wild_draw4':
      state.stack = { type: 'wild_draw4', count: WILD_DRAW4_PENALTY };
      advanceTurn(state);
      break;
    case 'wild':
      // No advance — player must choose color first.
      break;
    default: // number
      advanceTurn(state);
      break;
  }

  state.version += 1;
  return state;
}

/** Draw cards. If a stack is active, draws the accumulated penalty. */
export function applyDrawCard(state, seat) {
  const check = validateDrawCard(state, seat);
  if (!check.ok) throw new GameError(check.error);

  if (state.stack.type) {
    // Stack penalty: draw accumulated count, lose turn.
    drawCards(state, seat, state.stack.count);
    state.lastAction = { type: 'drawPenalty', seat, count: state.stack.count };
    state.stack = { type: null, count: 0 };
    advanceTurn(state);
  } else {
    // Normal draw: 1 card, turn advances.
    drawCards(state, seat, 1);
    state.lastAction = { type: 'draw', seat };
    advanceTurn(state);
  }

  state.version += 1;
  return state;
}

/** Call UNO (must have exactly 1 card). */
export function applyCallUno(state, seat) {
  const check = validateCallUno(state, seat);
  if (!check.ok) throw new GameError(check.error);
  state.players[seat].calledUno = true;
  state.lastAction = { type: 'callUno', seat };
  state.version += 1;
  return state;
}

/** Choose a color after playing a Wild card. */
export function applyChooseColor(state, seat, color) {
  const check = validateChooseColor(state, seat, color);
  if (!check.ok) throw new GameError(check.error);
  state.currentColor = color;
  state.lastAction = { type: 'chooseColor', seat, color };
  advanceTurn(state);
  state.version += 1;
  return state;
}

// ---------- Helpers ----------

function advanceTurn(state) {
  const n = state.players.length;
  state.currentPlayerSeat = ((state.currentPlayerSeat + state.direction) % n + n) % n;
}

function nextSeat(state) {
  const n = state.players.length;
  return ((state.currentPlayerSeat + state.direction) % n + n) % n;
}

function drawCards(state, seat, count) {
  for (let i = 0; i < count; i++) {
    if (state.drawPile.length === 0) reshuffleDiscard(state);
    if (state.drawPile.length === 0) break;
    state.players[seat].hand.push(state.drawPile.pop());
  }
}

function reshuffleDiscard(state) {
  const top = state.discardPile.pop();
  const rest = [...state.discardPile];
  state.drawPile = shuffle(rest);
  state.discardPile = [top];
}
