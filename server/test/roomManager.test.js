import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { Server } from 'socket.io';
import { RoomManager } from '../src/room/roomManager.js';
import { Room } from '../src/room/room.js';

// Room needs an io to broadcast to; one that is never listening is enough.
const httpServer = createServer();
const io = new Server(httpServer);

after(() => io.close());

test('room codes come from the unambiguous alphabet and are unique', () => {
  const manager = new RoomManager();
  const codes = new Set();
  for (let i = 0; i < 50; i++) {
    const { code } = manager.create({
      io,
      name: `Player ${i}`,
      socketId: `socket-${i}`,
      playerId: `player-${i}`,
    });
    assert.match(code, /^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{4}$/);
    assert.ok(!codes.has(code), `code ${code} duplicated`);
    codes.add(code);
  }
});

test('get() is case-insensitive and trims whitespace', () => {
  const manager = new RoomManager();
  manager.create({ io, name: 'A', socketId: 's', playerId: 'p' });
  const code = [...manager.rooms.keys()][0];
  assert.equal(manager.get(code).code, code);
  assert.equal(manager.get(`  ${code.toLowerCase()}  `).code, code);
  assert.equal(manager.get('ZZZZ'), undefined);
});

test('sweep destroys idle rooms by phase but keeps active ones', () => {
  const manager = new RoomManager();
  const now = Date.now();

  // Empty room with no players, idle past the empty-room threshold.
  const empty = new Room({ code: 'EMPT', io });
  empty.lastActivityAt = now - 20 * 60_000;
  manager.rooms.set('EMPT', empty);

  // Lobby with a player but idle past the lobby threshold.
  const lobby = new Room({ code: 'LOBB', io });
  lobby.addHuman({ name: 'Ada', socketId: 's1', playerId: 'p1' });
  lobby.lastActivityAt = now - 40 * 60_000;
  manager.rooms.set('LOBB', lobby);

  // Active lobby: recent activity, must survive.
  const fresh = new Room({ code: 'FRES', io });
  fresh.addHuman({ name: 'Eve', socketId: 's2', playerId: 'p2' });
  fresh.lastActivityAt = now - 1000;
  manager.rooms.set('FRES', fresh);

  manager.sweep(now);

  assert.equal(manager.rooms.has('EMPT'), false);
  assert.equal(manager.rooms.has('LOBB'), false);
  assert.equal(manager.rooms.has('FRES'), true);
});
