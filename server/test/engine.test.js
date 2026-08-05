import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  createState,
  startRound,
  applyBid,
  applyPlay,
  nextRound,
  rematch,
  computeStandings,
  GameError,
} from '../src/game/engine.js';
import { mulberry32, createDeck, cardKey } from '../src/game/cards.js';

/** Fill a seat's hand with the given cards plus filler, avoiding a banned suit. */
function makeHand(specs, bannedSuit = null) {
  const required = specs.map(([s, r]) => ({ s, r }));
  const taken = new Set(required.map(cardKey));
  const filler = [];
  for (const c of createDeck()) {
    if (taken.has(cardKey(c))) continue;
    if (bannedSuit && c.s === bannedSuit) continue;
    if (filler.length >= 13 - required.length) break;
    filler.push(c);
  }
  return [...required, ...filler];
}

/** The simplest legal card to play: follow suit if possible, else anything. */
function pickLegalCard(state, seat) {
  const hand = state.players[seat].hand;
  const ledSuit = state.play.ledSuit;
  if (ledSuit) {
    const follow = hand.filter((c) => c.s === ledSuit);
    if (follow.length) return follow[0];
  }
  return hand[0];
}

test('round 1 bidding order is seats 0,1,2,3 and advances per bid', () => {
  const state = createState();
  startRound(state, mulberry32(1));
  assert.equal(state.phase, 'bidding');
  assert.deepEqual(state.bidding.bidOrder, [0, 1, 2, 3]);
  assert.equal(state.bidding.currentSeat, 0);

  applyBid(state, 0, 2);
  assert.equal(state.bidding.currentSeat, 1);
  assert.equal(state.bidding.bids[0], 2);
});

test('highest bidder leads; ties go to earliest in bidding order', () => {
  const state = createState();
  startRound(state, mulberry32(2));
  applyBid(state, 0, 2);
  applyBid(state, 1, 3);
  applyBid(state, 2, 1);
  applyBid(state, 3, 3); // tie with seat 1, but seat 1 is earlier in order
  assert.equal(state.phase, 'playing');
  assert.equal(state.play.currentPlayerSeat, 1);
  assert.equal(state.play.leaderSeat, 1);
});

test('bid validation rejects wrong phase, wrong turn, bad values', () => {
  const state = createState();
  startRound(state, mulberry32(3));
  assert.throws(() => applyBid(state, 1, 2), (e) => e instanceof GameError && e.code === 'NOT_YOUR_TURN');
  assert.throws(() => applyBid(state, 0, 14), (e) => e.code === 'INVALID_BID');
  assert.throws(() => applyBid(state, 0, -1), (e) => e.code === 'INVALID_BID');
  applyBid(state, 0, 2);
  applyBid(state, 1, 2);
  applyBid(state, 2, 2);
  applyBid(state, 3, 2);
  assert.throws(() => applyBid(state, 0, 3), (e) => e.code === 'WRONG_PHASE');
});

test('trump wins a trick and its winner leads the next trick', () => {
  const state = createState();
  startRound(state, mulberry32(4));
  state.players[0].hand = makeHand([['H', 2]]);
  state.players[1].hand = makeHand([['S', 14]], 'H'); // no hearts -> may trump
  state.players[2].hand = makeHand([['C', 3]], 'H'); // no hearts
  state.players[3].hand = makeHand([['H', 3]]);

  applyBid(state, 0, 1);
  applyBid(state, 1, 1);
  applyBid(state, 2, 1);
  applyBid(state, 3, 1);

  applyPlay(state, 0, { s: 'H', r: 2 }); // lead H2
  applyPlay(state, 1, { s: 'S', r: 14 }); // trump
  applyPlay(state, 2, { s: 'C', r: 3 }); // void dump
  applyPlay(state, 3, { s: 'H', r: 3 }); // hearts outranked by trump

  assert.equal(state.players[1].tricksWon, 1);
  assert.equal(state.play.lastTrick.winnerSeat, 1);
  assert.equal(state.play.trickNumber, 2);
  assert.equal(state.play.currentPlayerSeat, 1);
  assert.equal(state.play.leaderSeat, 1);
});

test('follow-suit is enforced; playing off-suit while holding the led suit is illegal', () => {
  const state = createState();
  startRound(state, mulberry32(5));
  state.players[0].hand = makeHand([['H', 9]]);
  state.players[1].hand = makeHand([['H', 5], ['C', 2]]);

  applyBid(state, 0, 1);
  applyBid(state, 1, 1);
  applyBid(state, 2, 1);
  applyBid(state, 3, 1);

  applyPlay(state, 0, { s: 'H', r: 9 }); // leads hearts
  assert.equal(state.play.currentPlayerSeat, 1);

  // seat 1 holds hearts but tries to play a club
  assert.throws(
    () => applyPlay(state, 1, { s: 'C', r: 2 }),
    (e) => e instanceof GameError && e.code === 'MUST_FOLLOW_SUIT',
  );
  // playing a heart is fine
  applyPlay(state, 1, { s: 'H', r: 5 });
});

test('a card not in hand is rejected', () => {
  const state = createState();
  startRound(state, mulberry32(6));
  state.players[0].hand = makeHand([['H', 9]]);
  applyBid(state, 0, 1);
  applyBid(state, 1, 1);
  applyBid(state, 2, 1);
  applyBid(state, 3, 1);
  applyPlay(state, 0, { s: 'H', r: 9 });
  const absent = createDeck().find((c) => !state.players[1].hand.some((h) => cardKey(h) === cardKey(c)));
  assert.throws(
    () => applyPlay(state, 1, absent),
    (e) => e.code === 'CARD_NOT_IN_HAND',
  );
});

test('full game: 4 players x 5 rounds completes legally with consistent scores', () => {
  const state = createState({ totalRounds: 5 });
  const rng = mulberry32(99);

  startRound(state, rng);

  for (let round = 1; round <= state.totalRounds; round++) {
    // Bidding
    for (let i = 0; i < 4; i++) {
      const seat = state.bidding.currentSeat;
      applyBid(state, seat, (round + seat) % 5);
    }
    assert.equal(state.phase, 'playing');

    // Play 13 tricks
    let guard = 0;
    while (state.phase === 'playing') {
      const seat = state.play.currentPlayerSeat;
      applyPlay(state, seat, pickLegalCard(state, seat));
      if (++guard > 400) throw new Error('stuck in play loop');
    }

    // Round invariants
    const tricksSum = state.players.reduce((n, p) => n + p.tricksWon, 0);
    assert.equal(tricksSum, 13, `round ${round} tricks should total 13`);
    assert.equal(state.round, round);

    // Cumulative score equals the manual sum of round-history scores
    for (const p of state.players) {
      const manual = p.roundHistory.reduce((n, r) => n + r.score, 0);
      assert.equal(p.score, manual, `seat ${p.seat} cumulative score`);
    }

    if (round < state.totalRounds) {
      assert.equal(state.phase, 'roundEnd');
      nextRound(state, rng);
      assert.equal(state.phase, 'bidding');
      assert.equal(state.round, round + 1);
    } else {
      assert.equal(state.phase, 'gameOver');
    }
  }

  // Game-over invariants
  assert.equal(state.players.reduce((n, p) => n + p.totalTricks, 0), 13 * 5);
  const standings = state.standings;
  assert.equal(standings.length, 4);
  for (let i = 1; i < standings.length; i++) {
    assert.ok(standings[i - 1].score >= standings[i].score, 'standings sorted by score desc');
  }
  assert.equal(computeStandings(state).length, 4);
});

test('next round bids starting left of the previous winner', () => {
  const state = createState({ totalRounds: 2 });
  const rng = mulberry32(11);
  startRound(state, rng);
  for (let i = 0; i < 4; i++) {
    applyBid(state, state.bidding.currentSeat, 1);
  }
  let guard = 0;
  while (state.phase === 'playing') {
    applyPlay(state, state.play.currentPlayerSeat, pickLegalCard(state, state.play.currentPlayerSeat));
    if (++guard > 400) throw new Error('stuck');
  }
  assert.equal(state.phase, 'roundEnd');
  const winner = state.lastRoundWinnerSeat;

  nextRound(state, rng);
  const expected = [0, 1, 2, 3].map((i) => (winner + 1 + i) % 4);
  assert.deepEqual(state.bidding.bidOrder, expected);
  assert.equal(state.bidding.currentSeat, expected[0]);
});

test('rematch resets scores and starts round 1 fresh', () => {
  const state = createState({ totalRounds: 1 });
  const rng = mulberry32(21);
  startRound(state, rng);
  for (let i = 0; i < 4; i++) applyBid(state, state.bidding.currentSeat, 2);
  let guard = 0;
  while (state.phase === 'playing') {
    applyPlay(state, state.play.currentPlayerSeat, pickLegalCard(state, state.play.currentPlayerSeat));
    if (++guard > 400) throw new Error('stuck');
  }
  assert.equal(state.phase, 'gameOver');

  rematch(state, rng);
  assert.equal(state.phase, 'bidding');
  assert.equal(state.round, 1);
  assert.deepEqual(state.bidding.bidOrder, [0, 1, 2, 3]);
  for (const p of state.players) {
    assert.equal(p.score, 0);
    assert.equal(p.totalTricks, 0);
    assert.equal(p.roundHistory.length, 0);
    assert.equal(p.hand.length, 13);
  }
});
