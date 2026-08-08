import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { Server } from 'socket.io';
import { io as ioc } from 'socket.io-client';
import { registerHandlers } from '../src/network/handlers.js';
import { RoomManager } from '../src/room/roomManager.js';
import { createHeuristicBot } from '../src/game/bots/heuristicBot.js';
import { mulberry32 } from '../src/game/cards.js';

/**
 * Scripted two-socket integration test for the socket layer (Phase 3).
 * Two real Socket.IO clients drive create/join/ready/start/bid/play against a
 * live in-process server, asserting the acks/error codes and per-viewer
 * snapshots a browser would rely on. Bots run with zero delay so the flow
 * stays fast; the heuristic engine keeps their moves legal.
 */

let io, manager, httpServer, baseUrl, sockets;

before(async () => {
  httpServer = createServer();
  io = new Server(httpServer, { cors: { origin: '*' } });
  manager = new RoomManager();
  registerHandlers(io, manager);
  await new Promise((resolve) => httpServer.listen(0, resolve));
  baseUrl = `http://127.0.0.1:${httpServer.address().port}`;
  sockets = [];
});

after(async () => {
  // Closing the client Manager (not just the socket) fully tears down the
  // transport, so a half-open ws socket can't keep the event loop alive.
  for (const s of sockets) {
    s.disconnect();
    s.io.disconnect();
  }
  // The server processes those disconnects asynchronously. A mid-game
  // disconnect creates a GRACE_PERIOD_MS (45s) grace timer, so let them land
  // BEFORE closing the rooms — close() clears all room timers.
  await new Promise((r) => setTimeout(r, 100));
  for (const room of manager.rooms.values()) room.close();
  await new Promise((resolve) => io.close(resolve));
});

/**
 * Connect a fresh client. Every room:state it ever receives is recorded in
 * `states` from the moment of connection, so a test can wait on snapshots
 * that were broadcast before its own acks resolved.
 */
function connect() {
  return new Promise((resolve, reject) => {
    const socket = ioc(baseUrl, { transports: ['websocket'], forceNew: true, timeout: 5000 });
    const states = [];
    socket.on('room:state', (s) => states.push(s));
    sockets.push(socket);
    socket.once('connect', () => resolve({ socket, states }));
    socket.once('connect_error', (err) => reject(new Error(`connect failed: ${err.message}`)));
  });
}

/**
 * Emit with ack; resolves with the ack payload ({ ok } or { error }).
 * Always pass an explicit payload slot: socket.io-client v4 only registers a
 * trailing function as the ack when there is also a data arg (a lone
 * `emit(event, fn)` silently drops the ack), so payload-less events get `{}`.
 */
function emitAck(socket, event, payload) {
  return new Promise((resolve) => socket.emit(event, payload ?? {}, resolve));
}

/**
 * Wait for a snapshot matching `predicate` (or one already recorded).
 * Snapshots arrive in order, so the LAST match is the most current view;
 * use that to avoid resolving against a stale earlier snapshot.
 */
function waitState(states, predicate = () => true, timeoutMs = 3000) {
  const hit = states.findLast(predicate);
  if (hit) return Promise.resolve(hit);
  return new Promise((resolve, reject) => {
    const deadline = Date.now() + timeoutMs;
    const iv = setInterval(() => {
      const h = states.findLast(predicate);
      if (h) {
        clearInterval(iv);
        resolve(h);
      } else if (Date.now() > deadline) {
        clearInterval(iv);
        reject(new Error('timed out waiting for room:state'));
      }
    }, 5);
  });
}

/** Bots that pick legal moves via the real heuristics but act instantly. */
function fastBots() {
  return Array.from({ length: 4 }, (_, i) => {
    const b = createHeuristicBot({ rng: mulberry32(1000 + i) });
    return { ...b, delayMs: () => 0 };
  });
}

/** Bots that never act on their own — used to isolate the shared-window close. */
function slowBots() {
  return Array.from({ length: 4 }, (_, i) => {
    const b = createHeuristicBot({ rng: mulberry32(2000 + i) });
    return { ...b, delayMs: () => 60_000 };
  });
}

/** Create a room with Alice as host and instant bots; returns socket + states + ack. */
async function createHostedRoom() {
  const { socket, states } = await connect();
  const ack = await emitAck(socket, 'room:create', { name: 'Alice' });
  assert.equal(ack.ok, true);
  manager.get(ack.roomCode).botProfiles = fastBots();
  return { a: socket, aStates: states, ...ack };
}

test('create + join: acks, and after start each viewer sees only their own hand', async () => {
  const { a, aStates, roomCode, seat, isHost, playerId } = await createHostedRoom();
  assert.equal(seat, 0);
  assert.equal(isHost, true);
  assert.ok(playerId);
  assert.match(roomCode, /^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{4}$/);

  const { socket: b, states: bStates } = await connect();
  const j = await emitAck(b, 'room:join', { code: roomCode, name: 'Bob' });
  assert.equal(j.ok, true);
  assert.equal(j.seat, 1);
  assert.equal(j.isHost, false);
  assert.ok(j.playerId);

  // Lobby snapshot: names public, hands empty until the deal.
  const lobby = await waitState(aStates, (s) => s.phase === 'lobby');
  assert.equal(lobby.you, 0);
  assert.equal(lobby.roomCode, roomCode);
  assert.equal(lobby.players[1].name, 'Bob');
  assert.equal(lobby.players[1].handCount, 0);

  // Ready up and start.
  await emitAck(a, 'room:ready', { ready: true });
  await emitAck(b, 'room:ready', { ready: true });
  const startAck = await emitAck(a, 'room:start');
  assert.equal(startAck.ok, true);

  // Alice's view: her 13 cards; everyone else is a hand count only.
  const aState = await waitState(aStates, (s) => s.phase === 'bidding');
  assert.equal(aState.round, 1);
  assert.equal(aState.totalRounds, 5);
  assert.deepEqual(aState.bidding.bidOrder, [0, 1, 2, 3]);
  // Bidding is simultaneous — the human seats may bid in any order and
  // haven't yet. (The instant bots may already have bid, so don't assert on them.)
  assert.equal(aState.bidding.bids[0], null);
  assert.equal(aState.bidding.bids[1], null);
  assert.equal(aState.players[0].hand.length, 13);
  assert.ok(Number.isInteger(aState.players[0].hand[0].r));
  assert.equal(aState.players[1].hand, null);
  assert.equal(aState.players[1].handCount, 13);
  assert.equal(aState.players[2].hand, null);
  assert.equal(aState.players[3].hand, null);
  assert.equal(aState.players[2].isBot, true); // empty seats filled with bots
  assert.equal(aState.players[2].name, 'Bot 3');

  // Bob's view: only his own hand is visible.
  const bState = await waitState(bStates, (s) => s.phase === 'bidding');
  assert.equal(bState.you, 1);
  assert.equal(bState.players[1].hand.length, 13);
  assert.equal(bState.players[0].hand, null);
  assert.equal(bState.players[0].handCount, 13);
});

test('error contract: room lookup, gating, wrong phase, turn and bid validation', async () => {
  // Join a room that does not exist.
  const { socket: c } = await connect();
  assert.deepEqual(await emitAck(c, 'room:join', { code: 'ZZZZ', name: 'Nemo' }), {
    error: 'ROOM_NOT_FOUND',
  });

  // Act without being in a room.
  const { socket: d } = await connect();
  assert.deepEqual(await emitAck(d, 'room:ready', { ready: true }), { error: 'NOT_IN_ROOM' });

  const { a, aStates, roomCode } = await createHostedRoom();
  const { socket: b } = await connect();
  await emitAck(b, 'room:join', { code: roomCode, name: 'Bob' });

  // Host cannot start before everyone connected is ready.
  assert.deepEqual(await emitAck(a, 'room:start'), { error: 'NOT_ALL_READY' });

  // Non-host cannot start.
  await emitAck(a, 'room:ready', { ready: true });
  assert.deepEqual(await emitAck(b, 'room:start'), { error: 'NOT_HOST' });

  // game:bid before the game starts.
  assert.deepEqual(await emitAck(a, 'game:bid', { bid: 2 }), { error: 'WRONG_PHASE' });

  // Start properly; bidding is simultaneous (any seat may bid).
  await emitAck(b, 'room:ready', { ready: true });
  assert.equal((await emitAck(a, 'room:start')).ok, true);
  const bidding = await waitState(aStates, (s) => s.phase === 'bidding');
  assert.deepEqual(bidding.bidding.bidOrder, [0, 1, 2, 3]);

  assert.deepEqual(await emitAck(a, 'game:bid', { bid: 14 }), { error: 'INVALID_BID' });
  assert.deepEqual(await emitAck(a, 'game:bid', { bid: -1 }), { error: 'INVALID_BID' });
  assert.deepEqual(await emitAck(a, 'game:bid', { bid: 2.5 }), { error: 'INVALID_BID' });

  // Alice bids; a second bid from her is rejected. Bob can still bid.
  assert.equal((await emitAck(a, 'game:bid', { bid: 13 })).ok, true);
  assert.deepEqual(await emitAck(a, 'game:bid', { bid: 1 }), { error: 'ALREADY_BID' });
});

test('bidding -> playing: legal play accepted, follow-suit is enforced', async () => {
  const { a, aStates, roomCode } = await createHostedRoom();
  const { socket: b, states: bStates } = await connect();
  await emitAck(b, 'room:join', { code: roomCode, name: 'Bob' });

  await emitAck(a, 'room:ready', { ready: true });
  await emitAck(b, 'room:ready', { ready: true });
  assert.equal((await emitAck(a, 'room:start')).ok, true);

  // Alice bids 13: a sure winner, and as the earliest max bidder she leads trick 1.
  await waitState(aStates, (s) => s.phase === 'bidding');
  assert.equal((await emitAck(a, 'game:bid', { bid: 13 })).ok, true);
  assert.equal((await emitAck(b, 'game:bid', { bid: 0 })).ok, true);
  // Bots bid instantly; wait until playing with Alice to lead.
  const playing = await waitState(
    aStates,
    (s) => s.phase === 'playing' && s.play.currentPlayerSeat === 0,
  );

  // Alice leads with a card from her hand.
  const lead = playing.players[0].hand[0];
  assert.equal((await emitAck(a, 'game:play', { card: lead })).ok, true);

  // Bob must follow suit if he has a card of the led suit.
  const bTurn = await waitState(
    bStates,
    (s) => s.play && s.play.trickCards.length === 1 && s.play.currentPlayerSeat === 1,
  );
  const ledSuit = bTurn.play.ledSuit;
  const bHand = bTurn.players[1].hand;
  const follows = bHand.filter((c) => c.s === ledSuit);

  if (follows.length) {
    const offSuit = bHand.find((c) => c.s !== ledSuit);
    assert.deepEqual(await emitAck(b, 'game:play', { card: offSuit }), {
      error: 'MUST_FOLLOW_SUIT',
    });
    assert.equal((await emitAck(b, 'game:play', { card: follows[0] })).ok, true);
  } else {
    // Void in the led suit: any card is legal.
    assert.equal((await emitAck(b, 'game:play', { card: bHand[0] })).ok, true);
  }
});

test('bidding: unbidden seats are auto-filled when the shared window expires', async () => {
  const { a, aStates, roomCode } = await createHostedRoom();
  const room = manager.get(roomCode);
  // Bots never act on their own; shorten the shared window so the test stays fast.
  room.botProfiles = slowBots();
  room.turnTimeoutMs = 150;

  assert.equal((await emitAck(a, 'room:ready', { ready: true })).ok, true);
  assert.equal((await emitAck(a, 'room:start')).ok, true);

  // While the window is open, nobody is bid yet — not even the bots.
  const bidding = await waitState(aStates, (s) => s.phase === 'bidding');
  assert.deepEqual(bidding.bidding.bids, [null, null, null, null]);

  // Alice never bids; when the window closes, every remaining seat is auto-bid.
  const playing = await waitState(aStates, (s) => s.phase === 'playing', 5000);
  assert.ok(playing.bidding.bids.every((b) => Number.isInteger(b)));
  assert.ok(playing.players.every((p) => Number.isInteger(p.bid)));
});

test('disconnect: a bot drives the seat during grace, and rejoin reclaims it', async () => {
  const { a, aStates, roomCode } = await createHostedRoom();
  const { socket: b } = await connect();
  const jb = await emitAck(b, 'room:join', { code: roomCode, name: 'Bob' });

  await emitAck(a, 'room:ready', { ready: true });
  await emitAck(b, 'room:ready', { ready: true });
  assert.equal((await emitAck(a, 'room:start')).ok, true);
  await waitState(aStates, (s) => s.phase === 'bidding');

  // Bob (seat 1) drops mid-game.
  b.disconnect();

  // Alice sees the seat become bot-controlled — still Bob's seat, bot playing.
  const takeover = await waitState(aStates, (s) => s.players[1].botControlled === true);
  assert.equal(takeover.players[1].connected, false);
  assert.equal(takeover.players[1].isBot, false);

  // Bob returns on a fresh socket within the grace window and reclaims the seat.
  const { socket: b2 } = await connect();
  const re = await emitAck(b2, 'room:rejoin', { code: roomCode, playerId: jb.playerId });
  assert.equal(re.ok, true);
  assert.equal(re.seat, 1);

  const reclaimed = await waitState(aStates, (s) => s.players[1].botControlled === false);
  assert.equal(reclaimed.players[1].connected, true);
  assert.equal(reclaimed.players[1].isBot, false);
});

test('disconnect: rejoin reclaims seat even after grace expires (post-grace reconnect)', async () => {
  const { a, aStates, roomCode } = await createHostedRoom();
  const room = manager.get(roomCode);
  const { socket: b, states: bStates } = await connect();
  const jb = await emitAck(b, 'room:join', { code: roomCode, name: 'Bob' });
  const bobPlayerId = jb.playerId;

  await emitAck(a, 'room:ready', { ready: true });
  await emitAck(b, 'room:ready', { ready: true });
  assert.equal((await emitAck(a, 'room:start')).ok, true);
  await waitState(aStates, (s) => s.phase === 'bidding');

  // Bob disconnects — seat becomes botControlled, grace window starts.
  b.disconnect();
  b.io.disconnect();
  const takeover = await waitState(aStates, (s) => s.players[1].botControlled === true);
  assert.equal(takeover.players[1].isBot, false);

  // Manually expire the grace window (skip the 45 s timer).
  room.expireGrace(1);
  const afterGrace = await waitState(aStates, (s) => s.players[1].isBot === true);
  assert.equal(afterGrace.players[1].isBot, true);
  assert.equal(afterGrace.players[1].connected, false);

  // Bob returns on a fresh socket after grace — reclaims the same seat.
  const { socket: b2 } = await connect();
  const re = await emitAck(b2, 'room:rejoin', { code: roomCode, playerId: bobPlayerId });
  assert.equal(re.ok, true);
  assert.equal(re.seat, 1);

  const reclaimed = await waitState(aStates, (s) => s.players[1].connected === true);
  assert.equal(reclaimed.players[1].isBot, false);
  assert.equal(reclaimed.players[1].name, 'Bob');
});

test('reload race: a fresh socket reclaims the seat even while the old one is still connected', async () => {
  const { a, aStates, roomCode } = await createHostedRoom();
  const { socket: b } = await connect();
  const jb = await emitAck(b, 'room:join', { code: roomCode, name: 'Bob' });

  await emitAck(a, 'room:ready', { ready: true });
  await emitAck(b, 'room:ready', { ready: true });
  assert.equal((await emitAck(a, 'room:start')).ok, true);
  await waitState(aStates, (s) => s.phase === 'bidding');

  // Simulate a page reload: Bob's OLD socket is still connected server-side
  // (the unloaded page's disconnect has not been processed yet) while a fresh
  // socket connects and immediately tries to reclaim with the stored playerId.
  // This used to fail with NO_SEAT and strand the reloaded tab.
  const { socket: b2 } = await connect();
  const re = await emitAck(b2, 'room:rejoin', { code: roomCode, playerId: jb.playerId });
  assert.equal(re.ok, true);
  assert.equal(re.seat, 1);

  // The seat now belongs to the new socket.
  const reclaimed = await waitState(aStates, (s) => s.players[1].connected === true);
  assert.equal(reclaimed.players[1].connected, true);
  assert.equal(reclaimed.players[1].isBot, false);
  assert.equal(reclaimed.players[1].botControlled, false);

  // The old socket was evicted: it can no longer act for that seat.
  const oldAck = await emitAck(b, 'game:bid', { bid: 5 });
  assert.equal(oldAck.error, 'NOT_IN_ROOM');

  // When the old socket's disconnect finally lands, the seat must stay intact.
  b.disconnect();
  b.io.disconnect();
  await new Promise((r) => setTimeout(r, 50));
  assert.equal(manager.get(roomCode).state.players[1].connected, true);
  assert.equal(manager.get(roomCode).state.players[1].socketId, b2.id);
});

test('host transfer: leaving host promotes the lowest connected human; seats free up', async () => {
  const { a, aStates, roomCode } = await createHostedRoom();
  const { socket: b } = await connect();
  await emitAck(b, 'room:join', { code: roomCode, name: 'Bob' });

  // Bob leaves in the lobby; his seat frees entirely.
  await emitAck(b, 'room:leave');
  const afterLeave = await waitState(aStates, (s) => s.players[1].name === '');
  assert.equal(afterLeave.players[1].connected, false);
  assert.equal(afterLeave.players[1].isBot, false);

  // Carol joins into the freed seat.
  const { socket: c, states: cStates } = await connect();
  const jc = await emitAck(c, 'room:join', { code: roomCode, name: 'Carol' });
  assert.equal(jc.seat, 1);

  // Host (Alice) leaves; Carol is the only connected human and becomes host.
  await emitAck(a, 'room:leave');
  const transferred = await waitState(cStates, (s) => s.hostSeat === 1);
  assert.equal(transferred.hostSeat, 1);
  assert.equal(transferred.players[1].name, 'Carol');
});

test('host-only lifecycle handlers reject non-host callers and the wrong phase', async () => {
  const { a, roomCode } = await createHostedRoom();
  const { socket: b } = await connect();
  await emitAck(b, 'room:join', { code: roomCode, name: 'Bob' });

  // Non-host cannot advance a round or trigger a rematch.
  assert.deepEqual(await emitAck(b, 'room:nextRound'), { error: 'NOT_HOST' });
  assert.deepEqual(await emitAck(b, 'room:rematch'), { error: 'NOT_HOST' });

  // Host calls them in the wrong phase (lobby, not roundEnd/gameOver).
  assert.deepEqual(await emitAck(a, 'room:nextRound'), { error: 'WRONG_PHASE' });
  assert.deepEqual(await emitAck(a, 'room:rematch'), { error: 'WRONG_PHASE' });
});
