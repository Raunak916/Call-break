import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  createState,
  startRound,
  applyBid,
  applyPlay,
  nextRound,
} from '../src/game/engine.js';
import { createHeuristicBot } from '../src/game/bots/heuristicBot.js';
import { buildCtx } from '../src/game/bots/baseBot.js';
import { mulberry32 } from '../src/game/cards.js';

/**
 * Drive a full game (5 rounds) with four heuristic bots.
 * Any illegal move surfaces as a GameError and fails the test — this is the
 * end-to-end proof that the engine's rules hold for real play.
 */
function simulateGame(seed) {
  const rng = mulberry32(seed);
  const state = createState({ totalRounds: 5 });
  const bots = Array.from({ length: 4 }, (_, i) =>
    createHeuristicBot({ rng: mulberry32(seed * 1000 + i) }),
  );

  startRound(state, rng);
  for (let round = 1; round <= state.totalRounds; round++) {
    while (state.phase === 'bidding') {
      const seat = state.bidding.currentSeat;
      const bid = bots[seat].chooseBid(buildCtx(state, seat));
      applyBid(state, seat, bid);
    }
    assert.equal(state.phase, 'playing', `round ${round} should be playing`);

    let guard = 0;
    while (state.phase === 'playing') {
      const seat = state.play.currentPlayerSeat;
      const card = bots[seat].choosePlay(buildCtx(state, seat));
      applyPlay(state, seat, card);
      if (++guard > 2000) throw new Error('stuck in play loop');
    }

    if (round < state.totalRounds) nextRound(state, rng);
  }
  return state;
}

test('simulation reaches gameOver with every round invariant intact', () => {
  for (const seed of [1, 2, 3, 5, 8, 13, 21]) {
    const state = simulateGame(seed);

    assert.equal(state.phase, 'gameOver', `seed ${seed}`);
    assert.equal(state.round, 5);

    // Every round: 13 tricks total, and each player's history is complete.
    for (let r = 0; r < 5; r++) {
      const tricks = state.players.map((p) => p.roundHistory[r].tricks);
      assert.equal(tricks.reduce((n, t) => n + t, 0), 13, `seed ${seed} round ${r + 1}`);
    }
    assert.ok(state.players.every((p) => p.roundHistory.length === 5));

    // Cumulative scores equal the manual sum of round scores.
    for (const p of state.players) {
      const manual = p.roundHistory.reduce((n, r) => n + r.score, 0);
      assert.equal(p.score, manual, `seed ${seed} seat ${p.seat}`);
    }

    // Bid is a real integer within 0..13 and total tricks across the game = 65.
    assert.ok(
      state.players.every((p) => p.roundHistory.every((r) => Number.isInteger(r.bid) && r.bid >= 0 && r.bid <= 13)),
      `seed ${seed}: every bid must be a real integer`,
    );
    assert.equal(state.players.reduce((n, p) => n + p.totalTricks, 0), 65, `seed ${seed}`);
  }
});

test('the same seed reproduces the same game (deterministic)', () => {
  const a = simulateGame(42);
  const b = simulateGame(42);
  assert.deepEqual(a.standings, b.standings);
  assert.deepEqual(
    a.players.map((p) => p.roundHistory),
    b.players.map((p) => p.roundHistory),
  );
});

test('a mix of bids is produced (bidding is not degenerate)', () => {
  const allBids = new Set();
  for (const seed of [1, 2, 3, 5, 8]) {
    const state = simulateGame(seed);
    for (const p of state.players) {
      for (const r of p.roundHistory) allBids.add(r.bid);
    }
  }
  assert.ok(allBids.size >= 4, `expected varied bids, got ${[...allBids].sort((a, b) => a - b)}`);
});
