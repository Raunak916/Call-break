// Registry of live rooms, plus room-code generation and idle cleanup.

import { randomInt } from 'node:crypto';
import { Room } from './room.js';
import {
  ROOM_CODE_ALPHABET,
  ROOM_CODE_LENGTH,
  ROOM_IDLE_EMPTY_MS,
  ROOM_IDLE_LOBBY_MS,
  ROOM_IDLE_GAMEOVER_MS,
} from '../config.js';

function pickCode() {
  let code = '';
  for (let i = 0; i < ROOM_CODE_LENGTH; i++) {
    code += ROOM_CODE_ALPHABET[randomInt(ROOM_CODE_ALPHABET.length)];
  }
  return code;
}

export class RoomManager {
  constructor() {
    /** @type {Map<string, Room>} */
    this.rooms = new Map();
  }

  create({ io, name, socketId, playerId, totalRounds, scoringVariant, gameType, numSeats }) {
    let code = pickCode();
    while (this.rooms.has(code)) code = pickCode();
    const room = new Room({ code, io, gameType, totalRounds, numSeats, scoringVariant });
    room.addHuman({ name, socketId, playerId });
    this.rooms.set(code, room);
    return room;
  }

  get(code) {
    if (!code) return undefined;
    return this.rooms.get(String(code).trim().toUpperCase());
  }

  destroy(code) {
    const room = this.rooms.get(code);
    if (room) {
      room.close();
      this.rooms.delete(code);
    }
  }

  /** Called on an interval; destroys rooms that have gone idle/stale. */
  sweep(now = Date.now()) {
    for (const [code, room] of this.rooms) {
      const anyConnected = room.state.players.some((p) => p.connected);
      const idle = now - room.lastActivityAt;
      const stale =
        (!anyConnected && idle > ROOM_IDLE_EMPTY_MS) ||
        (room.state.phase === 'lobby' && idle > ROOM_IDLE_LOBBY_MS) ||
        (room.state.phase === 'gameOver' && idle > ROOM_IDLE_GAMEOVER_MS);
      if (stale) this.destroy(code);
    }
  }
}
