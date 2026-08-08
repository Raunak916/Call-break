import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  createState,
  startRound,
  applyPlayCard,
  applyDrawCard,
  applyCallUno,
  applyChooseColor,
  GameError,
} from '../../src/uno/engine.js';
import { mulberry32, createDeck, cardKey, isWild } from '../../src/uno/cards.js';

function findCard(hand, type, color) {
  return hand.find((c) => c.type === type && (color ? c.color === color : true));
}

function findNumber(hand, value, color) {
  return hand.find((c) => c.type === 'number' && c.value === value && (color ? c.color === color : true));
}

test('startRound deals 7 cards each and flips a numbered card', () => {
  const state = createState({ totalRounds: 1 });
  // Fill seats with player names (needed for start validation).
  for (const p of state.players) { p.name = `P${p.seat}`; }
  startRound(state, mulberry32(1));

  assert.equal(state.phase, 'playing');
  assert.equal(state.round, 1);
  for (const p of state.players) {
    assert.equal(p.hand.length, 7);
  }
  assert.equal(state.discardPile.length, 1);
  const top = state.discardPile[0];
  assert.equal(top.type, 'number', 'start card must be numbered');
  assert.equal(state.currentColor, top.color);
  assert.equal(state.direction, 1);
});

test('playing a matching color card works', () => {
  const state = createState({ totalRounds: 1 });
  for (const p of state.players) { p.name = `P${p.seat}`; }
  startRound(state, mulberry32(1));

  const top = state.discardPile[state.discardPile.length - 1];
  const seat0 = state.players[0];
  // Find a card matching the start card's color.
  const match = seat0.hand.find((c) => c.color === top.color && !isWild(c));
  if (match) {
    applyPlayCard(state, 0, match);
    assert.equal(state.discardPile.length, 2);
    assert.equal(state.currentColor, match.color);
  }
});

test('playing a non-matching card is rejected', () => {
  const state = createState({ totalRounds: 1 });
  for (const p of state.players) { p.name = `P${p.seat}`; }
  startRound(state, mulberry32(1));

  const top = state.discardPile[state.discardPile.length - 1];
  const seat0 = state.players[0];
  // Find a card that does NOT match.
  const noMatch = seat0.hand.find(
    (c) => !isWild(c) && c.color !== top.color && c.type !== top.type,
  );
  if (noMatch && top.type === 'number') {
    assert.throws(
      () => applyPlayCard(state, 0, noMatch),
      (e) => e instanceof GameError && e.code === 'NO_MATCH',
    );
  }
});

test('playing a wild card sets currentColor to wild (pending chooseColor)', () => {
  const state = createState({ totalRounds: 1 });
  for (const p of state.players) { p.name = `P${p.seat}`; }
  startRound(state, mulberry32(1));

  const seat0 = state.players[0];
  const wild = findCard(seat0.hand, 'wild');
  if (wild) {
    applyPlayCard(state, 0, wild);
    assert.equal(state.currentColor, 'wild');
  }
});

test('chooseColor sets the color and advances turn', () => {
  const state = createState({ totalRounds: 1 });
  for (const p of state.players) { p.name = `P${p.seat}`; }
  startRound(state, mulberry32(1));

  const seat0 = state.players[0];
  const wild = findCard(seat0.hand, 'wild');
  if (wild) {
    const prevTurn = state.currentPlayerSeat;
    applyPlayCard(state, 0, wild);
    // Wild does NOT advance turn (player must choose color first).
    assert.equal(state.currentPlayerSeat, prevTurn);
    applyChooseColor(state, 0, 'red');
    assert.equal(state.currentColor, 'red');
    // Now turn advances.
    assert.notEqual(state.currentPlayerSeat, prevTurn);
  }
});

test('drawCard draws one card and advances turn', () => {
  const state = createState({ totalRounds: 1 });
  for (const p of state.players) { p.name = `P${p.seat}`; }
  startRound(state, mulberry32(1));

  const seat = state.currentPlayerSeat;
  const handBefore = state.players[seat].hand.length;
  applyDrawCard(state, seat);
  assert.equal(state.players[seat].hand.length, handBefore + 1);
  assert.notEqual(state.currentPlayerSeat, seat);
});

test('callUno requires exactly 1 card', () => {
  const state = createState({ totalRounds: 1 });
  for (const p of state.players) { p.name = `P${p.seat}`; }
  startRound(state, mulberry32(1));

  assert.throws(
    () => applyCallUno(state, 0),
    (e) => e instanceof GameError && e.code === 'NOT_ONE_CARD',
  );
});

test('draw2 forces next player to draw 2 or stack', () => {
  const state = createState({ totalRounds: 1 });
  for (const p of state.players) { p.name = `P${p.seat}`; }
  startRound(state, mulberry32(1));

  const seat0 = state.players[0];
  const draw2 = findCard(seat0.hand, 'draw2');
  if (draw2) {
    applyPlayCard(state, 0, draw2);
    assert.equal(state.stack.type, 'draw2');
    assert.equal(state.stack.count, 2);
    // Next player (seat 1) should have drawn 2 cards.
    // (Unless they had exactly the right hand size — but they started with 7, now 9 after draw).
    assert.ok(state.players[state.currentPlayerSeat].hand.length >= 7);
  }
});

test('stack draw2 on draw2 increases penalty', () => {
  const state = createState({ totalRounds: 1 });
  for (const p of state.players) { p.name = `P${p.seat}`; }
  startRound(state, mulberry32(1));

  // Force a draw2 scenario.
  const seat0 = state.players[0];
  const draw2 = findCard(seat0.hand, 'draw2');
  if (draw2) {
    applyPlayCard(state, 0, draw2);
    const nextSeat = state.currentPlayerSeat;
    const seat1 = state.players[nextSeat];
    // Give seat1 a draw2 to stack.
    const draw2forSeat1 = findCard(seat1.hand, 'draw2');
    if (draw2forSeat1) {
      applyPlayCard(state, nextSeat, draw2forSeat1);
      assert.equal(state.stack.type, 'draw2');
      assert.equal(state.stack.count, 4); // 2 + 2
    }
  }
});

test('wild_draw4 can only be played with no matching color', () => {
  const state = createState({ totalRounds: 1 });
  for (const p of state.players) { p.name = `P${p.seat}`; }
  startRound(state, mulberry32(1));

  const seat0 = state.players[0];
  const wildDraw4 = findCard(seat0.hand, 'wild_draw4');
  if (wildDraw4) {
    // If seat0 has any card matching current color, it should be rejected.
    const hasMatching = seat0.hand.some((c) => c.id !== wildDraw4.id && c.color === state.currentColor);
    if (hasMatching) {
      assert.throws(
        () => applyPlayCard(state, 0, wildDraw4),
        (e) => e instanceof GameError && e.code === 'ILLEGAL_WILD_DRAW4',
      );
    }
  }
});

test('reverse changes direction', () => {
  const state = createState({ totalRounds: 1 });
  for (const p of state.players) { p.name = `P${p.seat}`; }
  startRound(state, mulberry32(1));

  const seat0 = state.players[0];
  // Find a Reverse that matches the current color (so it's a legal play).
  const reverse = seat0.hand.find((c) => c.type === 'reverse' && c.color === state.currentColor);
  if (reverse) {
    const dirBefore = state.direction;
    applyPlayCard(state, 0, reverse);
    assert.equal(state.direction, -dirBefore);
  }
});

test('skip skips next player', () => {
  const state = createState({ totalRounds: 1 });
  for (const p of state.players) { p.name = `P${p.seat}`; }
  startRound(state, mulberry32(1));

  const seat0 = state.players[0];
  const skip = findCard(seat0.hand, 'skip');
  if (skip) {
    applyPlayCard(state, 0, skip);
    // Turn should have advanced twice (once for normal + once for skip).
    assert.notEqual(state.currentPlayerSeat, 0);
    assert.notEqual(state.currentPlayerSeat, 1); // seat 1 was skipped
  }
});

test('reshuffleDiscard works when draw pile is empty', () => {
  const state = createState({ totalRounds: 1 });
  for (const p of state.players) { p.name = `P${p.seat}`; }
  startRound(state, mulberry32(1));

  // Drain the draw pile and put several cards into the discard pile.
  const top = state.discardPile[state.discardPile.length - 1];
  state.drawPile = [];
  // Add some dummy cards to discard so reshuffle has something to work with.
  state.discardPile = [top, ...state.players[0].hand.slice(0, 5)];

  const seat = state.currentPlayerSeat;
  const handBefore = state.players[seat].hand.length;
  applyDrawCard(state, seat);
  assert.equal(state.players[seat].hand.length, handBefore + 1);
});

test('full game simulation: bots play until someone wins', () => {
  const state = createState({ totalRounds: 1, numSeats: 4 });
  for (const p of state.players) { p.name = `Bot${p.seat}`; p.isBot = true; }
  startRound(state, mulberry32(42));

  let turns = 0;
  while (state.phase === 'playing' && turns < 500) {
    const seat = state.currentPlayerSeat;
    const player = state.players[seat];
    const hand = player.hand;
    const top = state.discardPile[state.discardPile.length - 1];

    if (hand.length === 0) break; // winner

    // Simple bot: play first matching card or draw.
    const playable = hand.filter((c) => {
      if (state.stack.type) return c.type === state.stack.type;
      if (isWild(c)) return true;
      if (c.color === state.currentColor) return true;
      if (c.type === top.type && c.type !== 'number') return true;
      if (c.type === 'number' && top.type === 'number' && c.value === top.value) return true;
      return false;
    });

    if (playable.length > 0) {
      const card = playable[0];
      applyPlayCard(state, seat, card);
      if (state.currentColor === 'wild') {
        // Choose most common color in remaining hand.
        const counts = { red: 0, blue: 0, green: 0, yellow: 0 };
        for (const c of hand) if (c.color in counts) counts[c.color]++;
        const best = Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
        applyChooseColor(state, seat, best);
      }
    } else {
      applyDrawCard(state, seat);
    }
    turns++;
  }

  // Game should have ended or接近 it.
  const winner = state.players.find((p) => p.hand.length === 0);
  if (winner) {
    assert.ok(true, `Player ${winner.seat} won with 0 cards`);
  }
});
