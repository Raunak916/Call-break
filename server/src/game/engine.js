// Pure game state machine. Every function mutates and returns the state it's
// given (in-place, for simplicity) and knows nothing about sockets or timing.
// The Room layer drives this and handles everything outside the rules.

import { NUM_SEATS, DEFAULT_TOTAL_ROUNDS, SCORING_VARIANT } from '../config.js';
import { createDeck, shuffle, dealHands, cardKey, resolveTrick } from './cards.js';
import { computeRoundScores } from './scoring.js';
import { validateBid, validatePlay } from './validate.js';

/** Thrown on an illegal action. `code` maps to a user-facing error. */
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
    ready: false,
    score: 0,
    totalTricks: 0,
    roundHistory: [],
    bid: null,
    tricksWon: 0,
    hand: [],
  };
}

/** Fresh lobby state with four empty seats. */
export function createState({ totalRounds = DEFAULT_TOTAL_ROUNDS, scoringVariant = SCORING_VARIANT } = {}) {
  return {
    phase: 'lobby',
    round: 0,
    totalRounds,
    scoringVariant,
    players: Array.from({ length: NUM_SEATS }, (_, seat) => createPlayer(seat)),
    bidding: null,
    play: null,
    roundScores: null,
    standings: null,
    lastRoundWinnerSeat: null,
    deck: [],
    playedCards: new Set(),
    version: 0,
  };
}

/** Shuffle a fresh deck and deal; reset per-round fields on every player. */
export function deal(state, rng = Math.random) {
  const deck = shuffle(createDeck(), rng);
  const hands = dealHands(deck);
  for (const player of state.players) {
    player.hand = hands[player.seat];
    player.bid = null;
    player.tricksWon = 0;
  }
  state.deck = deck;
  state.playedCards = new Set();
  state.bidding = null;
  state.play = null;
  state.roundScores = null;
  state.standings = null;
  return state;
}

/** Order seats for bidding, starting one seat "left of" the previous winner. */
function biddingOrder(lastRoundWinnerSeat) {
  if (lastRoundWinnerSeat == null) return [0, 1, 2, 3];
  const start = (lastRoundWinnerSeat + 1) % NUM_SEATS;
  return [0, 1, 2, 3].map((i) => (start + i) % NUM_SEATS);
}

/**
 * Begin a fresh round's bidding. Requires phase 'lobby' (round 1) or
 * 'roundEnd' (subsequent rounds). Deals cards and sets the bidding order.
 * Bidding is simultaneous: every seat may bid at any time; `bidOrder` is
 * kept only to break ties for who leads trick 1.
 */
export function startRound(state, rng = Math.random) {
  if (state.phase !== 'lobby' && state.phase !== 'roundEnd') {
    throw new GameError('WRONG_PHASE', 'Cannot start a round now');
  }
  if (state.phase === 'lobby') state.round = 1;
  else state.round += 1;

  deal(state, rng);

  const order = biddingOrder(state.lastRoundWinnerSeat);
  state.phase = 'bidding';
  state.bidding = {
    bidOrder: order,
    bids: [null, null, null, null],
  };
  state.version += 1;
  return state;
}

/**
 * Record a bid. Any unbidden seat may bid; once all four have bid, play
 * begins. Throws GameError on invalid input.
 */
export function applyBid(state, seat, bid) {
  const check = validateBid(state, seat, bid);
  if (!check.ok) throw new GameError(check.error);

  state.bidding.bids[seat] = bid;
  state.players[seat].bid = bid;

  if (state.bidding.bids.every((b) => b != null)) {
    beginPlay(state);
  }
  state.version += 1;
  return state;
}

/** Highest bidder leads trick 1; ties go to the earliest in bidding order. */
function beginPlay(state) {
  const { bids, bidOrder } = state.bidding;
  const maxBid = Math.max(...bids);
  const leaderSeat = bidOrder.find((s) => bids[s] === maxBid);

  state.phase = 'playing';
  state.play = {
    trickNumber: 1,
    currentPlayerSeat: leaderSeat,
    leaderSeat,
    ledSuit: null,
    trickCards: [],
    lastTrick: null,
  };
}

/** Play a card. Throws GameError on invalid input; resolves tricks + rounds. */
export function applyPlay(state, seat, card) {
  const check = validatePlay(state, seat, card);
  if (!check.ok) throw new GameError(check.error);

  const player = state.players[seat];
  player.hand = player.hand.filter((c) => !(c.s === card.s && c.r === card.r));
  state.playedCards.add(cardKey(card));

  const play = state.play;
  play.trickCards.push({ seat, card });
  if (play.trickCards.length === 1) play.ledSuit = card.s;

  play.currentPlayerSeat = (seat + 1) % NUM_SEATS;

  if (play.trickCards.length === NUM_SEATS) {
    resolveCurrentTrick(state);
  }
  state.version += 1;
  return state;
}

/** Four cards are on the table: award the trick and advance or end the round. */
function resolveCurrentTrick(state) {
  const play = state.play;
  const winnerSeat = resolveTrick(play.trickCards, play.ledSuit);
  state.players[winnerSeat].tricksWon += 1;

  play.lastTrick = {
    leaderSeat: play.leaderSeat,
    cards: [...play.trickCards],
    winnerSeat,
    ledSuit: play.ledSuit,
  };
  play.trickCards = [];
  play.ledSuit = null;

  if (play.trickNumber < 13) {
    play.trickNumber += 1;
    play.currentPlayerSeat = winnerSeat;
    play.leaderSeat = winnerSeat;
  } else {
    endRound(state);
  }
}

/** All 13 tricks done: score the round, accumulate, decide next phase. */
function endRound(state) {
  const roundScores = computeRoundScores(state.players, state.scoringVariant);
  state.roundScores = roundScores;

  for (const player of state.players) {
    player.roundHistory.push({ bid: player.bid, tricks: player.tricksWon, score: roundScores[player.seat] });
    player.score += roundScores[player.seat];
    player.totalTricks += player.tricksWon;
  }

  state.lastRoundWinnerSeat = state.play.lastTrick.winnerSeat;

  if (state.round >= state.totalRounds) {
    state.phase = 'gameOver';
    state.standings = computeStandings(state);
  } else {
    state.phase = 'roundEnd';
  }
}

/** Host skips the round-end results and starts the next round immediately. */
export function nextRound(state, rng = Math.random) {
  if (state.phase !== 'roundEnd') throw new GameError('WRONG_PHASE', 'No round to advance');
  return startRound(state, rng);
}

/** Start a brand new game with the same players, scores reset. */
export function rematch(state, rng = Math.random) {
  if (state.phase !== 'gameOver') throw new GameError('WRONG_PHASE', 'Game is not over');
  for (const player of state.players) {
    player.score = 0;
    player.totalTricks = 0;
    player.roundHistory = [];
  }
  state.lastRoundWinnerSeat = null;
  state.round = 0;
  state.phase = 'lobby'; // startRound requires lobby/roundEnd
  return startRound(state, rng);
}

/** Ranked final standings: score, then total tricks, then best round, then seat. */
export function computeStandings(state) {
  return state.players
    .map((p) => ({
      seat: p.seat,
      name: p.name,
      score: p.score,
      totalTricks: p.totalTricks,
      bestRound: Math.max(0, ...p.roundHistory.map((r) => r.score)),
    }))
    .sort(
      (a, b) =>
        b.score - a.score ||
        b.totalTricks - a.totalTricks ||
        b.bestRound - a.bestRound ||
        a.seat - b.seat,
    );
}
