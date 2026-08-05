// A Room owns one authoritative game. It wraps the pure engine with the
// multiplayer concerns the engine deliberately ignores: seats, sockets,
// hosts, disconnects, bot pacing, and per-viewer broadcasts.

import {
  createState,
  startRound,
  applyBid,
  applyPlay,
  nextRound,
  rematch,
} from '../game/engine.js';
import { createHeuristicBot } from '../game/bots/heuristicBot.js';
import { buildCtx } from '../game/bots/baseBot.js';
import { serializeState } from '../network/serialize.js';
import {
  GRACE_PERIOD_MS,
  TURN_TIMEOUT_MS,
  ROUND_END_AUTO_ADVANCE_MS,
} from '../config.js';

export class Room {
  /**
   * @param {object} opts
   * @param {string} opts.code
   * @param {import('socket.io').Server} opts.io
   * @param {number} [opts.totalRounds]
   * @param {string} [opts.scoringVariant]
   * @param {(seat:number)=>object} [opts.botProfileFactory] for tests: fast bots
   */
  constructor({ code, io, totalRounds, scoringVariant, botProfileFactory }) {
    this.code = code;
    this.io = io;
    this.state = createState({ totalRounds, scoringVariant });
    this.hostSeat = null;
    this.destroyed = false;
    this.createdAt = Date.now();
    this.lastActivityAt = Date.now();
    this.timers = new Map();
    this.botProfiles = Array.from({ length: 4 }, (_, i) =>
      (botProfileFactory || createHeuristicBot)(i),
    );
  }

  touch() {
    this.lastActivityAt = Date.now();
  }

  // ---------- timers ----------
  setTimer(key, ms, fn) {
    this.clearTimer(key);
    const t = setTimeout(() => {
      this.timers.delete(key);
      fn();
    }, ms);
    this.timers.set(key, t);
  }

  clearTimer(key) {
    const t = this.timers.get(key);
    if (t) {
      clearTimeout(t);
      this.timers.delete(key);
    }
  }

  clearAllTimers() {
    for (const t of this.timers.values()) clearTimeout(t);
    this.timers.clear();
  }

  // ---------- broadcasting ----------
  emitToSeat(seat, event, payload) {
    const p = this.state.players[seat];
    if (p && p.socketId) this.io.to(p.socketId).emit(event, payload);
  }

  /** Send each connected player their own snapshot. */
  broadcast() {
    for (const p of this.state.players) {
      if (p.socketId) {
        this.io
          .to(p.socketId)
          .emit('room:state', serializeState(this.state, p.seat, { roomCode: this.code, hostSeat: this.hostSeat }));
      }
    }
  }

  /** A toast everyone in the room sees. */
  notice(message, kind = 'info') {
    for (const p of this.state.players) {
      if (p.socketId) this.io.to(p.socketId).emit('game:notice', { message, kind });
    }
  }

  // ---------- seating ----------
  lowestEmptySeat() {
    return this.state.players.findIndex((p) => !p.name && !p.isBot);
  }

  lowestBotSeat() {
    return this.state.players.findIndex((p) => p.isBot);
  }

  /**
   * Seat a new human: lowest empty seat, else claim the lowest bot seat
   * (inheriting its hand/bid/tricks mid-game), else ROOM_FULL.
   */
  addHuman({ name, socketId, playerId }) {
    this.touch();
    let seat = this.lowestEmptySeat();
    let claimedBot = false;
    let inherited = null;

    if (seat === -1) {
      seat = this.lowestBotSeat();
      if (seat === -1) return { error: 'ROOM_FULL' };
      claimedBot = true;
      const bot = this.state.players[seat];
      inherited = { hand: bot.hand.length, bid: bot.bid, tricksWon: bot.tricksWon };
      this.clearTimer(`bot-${seat}`);
      this.clearTimer(`afk-${seat}`);
    }

    const p = this.state.players[seat];
    p.name = name;
    p.isBot = false;
    p.botControlled = false;
    p.playerId = playerId;
    p.socketId = socketId;
    p.connected = true;
    p.disconnectedAt = null;
    p.rejoinGraceUntil = null;

    if (this.hostSeat == null) this.hostSeat = seat;
    return { seat, isHost: this.hostSeat === seat, claimedBot, inherited };
  }

  findSeatByPlayerId(playerId) {
    if (!playerId) return null;
    const p = this.state.players.find((pl) => pl.playerId === playerId);
    if (!p || p.connected || p.isBot) return null;
    if (p.rejoinGraceUntil && Date.now() < p.rejoinGraceUntil) return p.seat;
    return null;
  }

  /** Reclaim a seat within its grace window. Bot actions taken meanwhile stay. */
  reclaim(seat, socketId) {
    const p = this.state.players[seat];
    p.socketId = socketId;
    p.connected = true;
    p.disconnectedAt = null;
    p.rejoinGraceUntil = null;
    p.botControlled = false;
    p.isBot = false;
    this.clearTimer(`bot-${seat}`);
    this.clearTimer(`grace-${seat}`);
    this.clearTimer(`afk-${seat}`);
    if (this.hostSeat == null) this.hostSeat = seat;
    this.touch();
  }

  // ---------- lifecycle ----------
  setReady(seat, ready) {
    if (this.state.phase !== 'lobby') return { error: 'WRONG_PHASE' };
    this.state.players[seat].ready = ready;
    this.broadcast();
    return { ok: true };
  }

  start(seat) {
    const state = this.state;
    if (state.phase !== 'lobby') return { error: 'WRONG_PHASE' };
    if (seat !== this.hostSeat) return { error: 'NOT_HOST' };

    const humans = state.players.filter((p) => !p.isBot);
    if (humans.length < 1) return { error: 'NOT_ENOUGH_PLAYERS' };
    // A single human can start alone; with 2+ humans everyone connected must be ready.
    if (humans.length >= 2 && humans.some((p) => p.connected && !p.ready)) {
      return { error: 'NOT_ALL_READY' };
    }

    for (const p of state.players) {
      if (!p.name) {
        p.isBot = true;
        p.name = `Bot ${p.seat + 1}`;
      }
    }

    startRound(state);
    this.touch();
    this.broadcast();
    this.pump();
    return { ok: true };
  }

  bid(seat, bid) {
    if (this.state.phase !== 'bidding') return { error: 'WRONG_PHASE' };
    try {
      applyBid(this.state, seat, bid);
    } catch (e) {
      return { error: e.code };
    }
    this.touch();
    this.clearTimer(`afk-${seat}`);
    this.broadcast();
    this.pump();
    return { ok: true };
  }

  play(seat, card) {
    if (this.state.phase !== 'playing') return { error: 'WRONG_PHASE' };
    try {
      applyPlay(this.state, seat, card);
    } catch (e) {
      return { error: e.code };
    }
    this.touch();
    this.clearTimer(`afk-${seat}`);
    this.broadcast();
    this.pump();
    return { ok: true };
  }

  hostNextRound(seat) {
    if (seat !== this.hostSeat) return { error: 'NOT_HOST' };
    if (this.state.phase !== 'roundEnd') return { error: 'WRONG_PHASE' };
    this.clearTimer('roundEnd');
    try {
      nextRound(this.state);
    } catch (e) {
      return { error: e.code };
    }
    this.touch();
    this.broadcast();
    this.pump();
    return { ok: true };
  }

  rematch(seat) {
    if (seat !== this.hostSeat) return { error: 'NOT_HOST' };
    if (this.state.phase !== 'gameOver') return { error: 'WRONG_PHASE' };
    try {
      rematch(this.state);
    } catch (e) {
      return { error: e.code };
    }
    this.touch();
    this.broadcast();
    this.pump();
    return { ok: true };
  }

  // ---------- disconnects ----------
  onDisconnect(socketId) {
    const seat = this.state.players.findIndex((p) => p.socketId === socketId);
    if (seat === -1) return;
    const p = this.state.players[seat];
    if (p.socketId !== socketId) return; // a newer socket already reclaimed this seat

    this.clearTimer(`afk-${seat}`);
    p.socketId = null;
    p.connected = false;
    p.disconnectedAt = Date.now();

    if (this.state.phase === 'lobby') {
      // Reserved during grace so a reconnect can reclaim it.
      p.rejoinGraceUntil = Date.now() + GRACE_PERIOD_MS;
    } else {
      p.botControlled = true;
      p.rejoinGraceUntil = Date.now() + GRACE_PERIOD_MS;
      this.setTimer(`grace-${seat}`, GRACE_PERIOD_MS, () => this.expireGrace(seat));
    }

    this.transferHostIfNeeded();
    this.touch();
    this.broadcast();
    if (this.state.phase !== 'lobby') {
      this.notice(`${p.name || 'A player'} disconnected — a bot is playing their seat.`);
      this.pump();
    }
    this.maybeEndIfNoHumans();
  }

  onLeave(socketId) {
    const seat = this.state.players.findIndex((p) => p.socketId === socketId);
    if (seat === -1) return;
    const p = this.state.players[seat];

    this.clearTimer(`bot-${seat}`);
    this.clearTimer(`afk-${seat}`);
    this.clearTimer(`grace-${seat}`);

    if (this.state.phase === 'lobby') {
      // Free the seat entirely; the human is gone for good.
      p.name = '';
      p.isBot = false;
      p.botControlled = false;
      p.playerId = null;
      p.socketId = null;
      p.connected = false;
      p.disconnectedAt = null;
      p.rejoinGraceUntil = null;
      p.ready = false;
    } else {
      // Become a permanent bot so the game stays 4-handed.
      p.isBot = true;
      p.botControlled = false;
      p.connected = false;
      p.playerId = null;
      p.socketId = null;
      p.disconnectedAt = null;
      p.rejoinGraceUntil = null;
    }

    this.transferHostIfNeeded();
    this.touch();
    this.broadcast();
    if (this.state.phase !== 'lobby') this.pump();
    this.maybeEndIfNoHumans();
  }

  expireGrace(seat) {
    const p = this.state.players[seat];
    if (!p || p.connected) return; // reclaimed in time
    p.isBot = true;
    p.botControlled = false;
    p.playerId = null;
    p.rejoinGraceUntil = null;
    this.broadcast();
    this.pump();
  }

  transferHostIfNeeded() {
    if (this.hostSeat == null) return;
    if (this.state.players[this.hostSeat].connected) return;
    const replacement = this.state.players.findIndex((p) => p.connected && !p.isBot);
    this.hostSeat = replacement === -1 ? null : replacement;
  }

  /** If every human is gone mid-game, end it; the sweep cleans up the room. */
  maybeEndIfNoHumans() {
    if (this.state.phase === 'lobby' || this.state.phase === 'gameOver') return;
    if (this.state.players.some((p) => !p.isBot)) return;
    this.state.phase = 'gameOver';
    this.clearAllTimers();
    this.broadcast();
  }

  // ---------- bot driving ----------
  /**
   * After every mutation, keep the game moving: schedule the current
   * seat's action if it's a bot (or a disconnected human being bot-played),
   * or start the AFK countdown for a connected human.
   */
  pump() {
    const state = this.state;
    if (state.phase === 'roundEnd') {
      if (!this.timers.has('roundEnd')) {
        this.setTimer('roundEnd', ROUND_END_AUTO_ADVANCE_MS, () => this.autoAdvanceRound());
      }
      return;
    }
    if (state.phase !== 'bidding' && state.phase !== 'playing') return;

    const seat = state.phase === 'bidding' ? state.bidding.currentSeat : state.play.currentPlayerSeat;
    const player = state.players[seat];

    if (player.isBot || player.botControlled) {
      if (!this.timers.has(`bot-${seat}`)) {
        const delay = this.botProfiles[seat].delayMs(buildCtx(state, seat));
        this.setTimer(`bot-${seat}`, delay, () => this.runBotAction(seat));
      }
    } else if (player.connected) {
      if (!this.timers.has(`afk-${seat}`)) {
        this.setTimer(`afk-${seat}`, TURN_TIMEOUT_MS, () => this.afkMove(seat));
      }
    }
  }

  runBotAction(seat) {
    if (this.destroyed) return;
    const state = this.state;
    const player = state.players[seat];
    if (!(player.isBot || player.botControlled)) return; // reclaimed mid-timer

    try {
      const ctx = buildCtx(state, seat);
      if (state.phase === 'bidding') applyBid(state, seat, this.botProfiles[seat].chooseBid(ctx));
      else if (state.phase === 'playing') applyPlay(state, seat, this.botProfiles[seat].choosePlay(ctx));
      else return;
    } catch (e) {
      console.error(`[room ${this.code}] bot action failed:`, e);
      return;
    }
    this.broadcast();
    this.pump();
  }

  /** One move for a connected-but-AFK human; control then stays with them. */
  afkMove(seat) {
    if (this.destroyed) return;
    const state = this.state;
    const player = state.players[seat];
    if (!player.connected || player.isBot) return;
    try {
      const ctx = buildCtx(state, seat);
      if (state.phase === 'bidding') applyBid(state, seat, this.botProfiles[seat].chooseBid(ctx));
      else if (state.phase === 'playing') applyPlay(state, seat, this.botProfiles[seat].choosePlay(ctx));
      else return;
    } catch (e) {
      return; // stale — the turn passed
    }
    this.broadcast();
    this.pump();
  }

  autoAdvanceRound() {
    if (this.destroyed || this.state.phase !== 'roundEnd') return;
    try {
      nextRound(this.state);
    } catch (e) {
      return;
    }
    this.broadcast();
    this.pump();
  }

  // ---------- teardown ----------
  close() {
    this.destroyed = true;
    this.clearAllTimers();
    for (const p of this.state.players) {
      if (p.socketId) this.io.to(p.socketId).emit('room:closed');
    }
  }
}
