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
 * Lifecycle test: creates a 1-round game, disconnects both humans after
 * bidding so fast bots play the rest instantly, then reconnects for
 * rematch. Covers every phase transition the server produces.
 */

let io, manager, httpServer, baseUrl, sockets;

before(async () => {
  httpServer = createServer();
  io = new Server(httpServer, { cors: { origin: '*' } });
  manager = new RoomManager();
  registerHandlers(io, manager);
  await new Promise((r) => httpServer.listen(0, r));
  baseUrl = `http://127.0.0.1:${httpServer.address().port}`;
  sockets = [];
});

after(async () => {
  for (const s of sockets) { s.disconnect(); s.io.disconnect(); }
  await new Promise((r) => setTimeout(r, 100));
  for (const room of manager.rooms.values()) room.close();
  await new Promise((r) => io.close(r));
});

function connect() {
  return new Promise((resolve, reject) => {
    const socket = ioc(baseUrl, { transports: ['websocket'], forceNew: true, timeout: 5000 });
    const states = [];
    socket.on('room:state', (s) => states.push(s));
    sockets.push(socket);
    socket.once('connect', () => resolve({ socket, states }));
    socket.once('connect_error', (e) => reject(new Error(e.message)));
  });
}

function emitAck(socket, event, payload) {
  return new Promise((resolve) => socket.emit(event, payload ?? {}, resolve));
}

function waitState(states, pred, ms = 10000) {
  const hit = states.findLast(pred);
  if (hit) return Promise.resolve(hit);
  return new Promise((resolve, reject) => {
    const dl = Date.now() + ms;
    const iv = setInterval(() => {
      const h = states.findLast(pred);
      if (h) { clearInterval(iv); resolve(h); }
      else if (Date.now() > dl) { clearInterval(iv); reject(new Error('waitState timeout')); }
    }, 5);
  });
}

function fastBots() {
  return Array.from({ length: 4 }, (_, i) => {
    const b = createHeuristicBot({ rng: mulberry32(1000 + i) });
    return { ...b, delayMs: () => 0 };
  });
}

test('1-round game: lobby → bidding → playing → gameOver → rematch → bidding', async () => {
  const { socket: a, states: aStates } = await connect();
  const createAck = await emitAck(a, 'room:create', { name: 'Alice', totalRounds: 1 });
  assert.equal(createAck.ok, true);
  manager.get(createAck.roomCode).botProfiles = fastBots();

  const { socket: b, states: bStates } = await connect();
  await emitAck(b, 'room:join', { code: createAck.roomCode, name: 'Bob' });

  // Ready + start → bidding
  await emitAck(a, 'room:ready', { ready: true });
  await emitAck(b, 'room:ready', { ready: true });
  assert.equal((await emitAck(a, 'room:start')).ok, true);

  // Both humans bid
  await waitState(aStates, (s) => s.phase === 'bidding' && s.bidding?.currentSeat === 0);
  await emitAck(a, 'game:bid', { bid: 2 });
  await waitState(bStates, (s) => s.phase === 'bidding' && s.bidding?.currentSeat === 1);
  await emitAck(b, 'game:bid', { bid: 1 });

  // Disconnect both humans → seats become botControlled → bots play all 13 tricks instantly
  a.disconnect();
  b.disconnect();
  a.io.disconnect();
  b.io.disconnect();

  // Poll the server state directly (broadcasts skip disconnected sockets).
  const room = manager.get(createAck.roomCode);
  const dl = Date.now() + 15000;
  while (room.state.phase !== 'gameOver' && Date.now() < dl) {
    await new Promise((r) => setTimeout(r, 20));
  }
  assert.equal(room.state.phase, 'gameOver');
  assert.equal(room.state.round, 1);
  assert.equal(room.state.totalRounds, 1);
  assert.ok(room.state.standings);

  // Reconnect Alice — she gets a fresh gameOver snapshot on rejoin
  const { socket: aRejoin, states: rejoinStates } = await connect();
  await emitAck(aRejoin, 'room:rejoin', { code: createAck.roomCode, playerId: createAck.playerId });
  await waitState(rejoinStates, (s) => s.phase === 'gameOver');
  assert.equal((await emitAck(aRejoin, 'room:rematch')).ok, true);

  const backToBidding = await waitState(rejoinStates, (s) => s.phase === 'bidding', 10000);
  assert.equal(backToBidding.phase, 'bidding');
  assert.equal(backToBidding.round, 1);
});
