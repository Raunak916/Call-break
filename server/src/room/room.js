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

// UNO imports
import {
  createState as createUnoState,
  startRound as unoStartRound,
  applyPlayCard,
  applyDrawCard,
  applyCallUno,
  applyChooseColor,
} from '../uno/engine.js';
import { createUnoBot } from '../uno/bots/unoBot.js';
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
   * @param {string} [opts.gameType] — 'call-break' (default) or 'uno'
   * @param {number} [opts.totalRounds]
   * @param {number} [opts.numSeats] — for UNO: 2-6 (default 4)
   * @param {string} [opts.scoringVariant]
   * @param {(seat:number)=>object} [opts.botProfileFactory] for tests: fast bots
   */
  constructor({ code, io, gameType = 'call-break', totalRounds, numSeats, scoringVariant, botProfileFactory }) {
    this.code = code;
    this.io = io;
    this.gameType = gameType;

    if (gameType === 'uno') {
      this.state = createUnoState({ totalRounds, numSeats: numSeats || 4 });
    } else {
      this.state = createState({ totalRounds, scoringVariant });
    }

    this.hostSeat = null;
    this.destroyed = false;
    this.createdAt = Date.now();
    this.lastActivityAt = Date.now();
    this.timers = new Map();

    const seats = this.state.players.length;
    const botFactory = gameType === 'uno'
      ? (botProfileFactory || (() => createUnoBot()))
      : (botProfileFactory || createHeuristicBot);
    this.botProfiles = Array.from({ length: seats }, (_, i) => botFactory(i));

    // Shared bidding window length; overridable in tests (like botProfiles).
    this.turnTimeoutMs = TURN_TIMEOUT_MS;
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
    p.disconnectedPlayerId = null;

    if (this.hostSeat == null) this.hostSeat = seat;
    return { seat, isHost: this.hostSeat === seat, claimedBot, inherited };
  }

  findSeatByPlayerId(playerId) {
    if (!playerId) return null;
    // 1. During grace window — seat still has the original playerId.
    const graceSeat = this.state.players.find(
      (pl) => pl.playerId === playerId && !pl.connected,
    );
    if (graceSeat && graceSeat.rejoinGraceUntil && Date.now() < graceSeat.rejoinGraceUntil) {
      return graceSeat.seat;
    }
    // 2. Post-grace — seat became a permanent bot; match via disconnectedPlayerId.
    const botSeat = this.state.players.find(
      (pl) => pl.disconnectedPlayerId === playerId && pl.isBot && !pl.connected,
    );
    if (botSeat) return botSeat.seat;
    // 3. Reload race — on a page reload the player's NEW socket can connect and
    //    rejoin before the server has processed the OLD socket's disconnect, so
    //    the seat is still marked `connected` to a socket that is about to die.
    //    The new socket takes the seat over; reclaim() evicts the old socket.
    const liveSeat = this.state.players.find(
      (pl) => pl.playerId === playerId && pl.connected,
    );
    return liveSeat ? liveSeat.seat : null;
  }

  /** Reclaim a seat (within grace, post-grace, or mid-reload-takeover). */
  reclaim(seat, socketId) {
    const p = this.state.players[seat];
    const previousSocketId = p.socketId;
    // Reload race: the seat may still be bound to the unloaded page's socket.
    // Evict it so it can't keep acting or receiving broadcasts.
    if (previousSocketId && previousSocketId !== socketId) {
      const oldSocket = this.io.sockets?.sockets?.get(previousSocketId);
      if (oldSocket) {
        oldSocket.leave(this.code);
        oldSocket.data = { code: null, seat: null, playerId: null };
      }
    }
    p.socketId = socketId;
    p.connected = true;
    p.disconnectedAt = null;
    p.rejoinGraceUntil = null;
    p.botControlled = false;
    p.isBot = false;
    p.disconnectedPlayerId = null;
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

    const humans = state.players.filter((p) => p.name && !p.isBot);
    if (humans.length < 1) return { error: 'NOT_ENOUGH_PLAYERS' };
    if (humans.length >= 2 && humans.some((p) => p.connected && !p.ready)) {
      return { error: 'NOT_ALL_READY' };
    }

    for (const p of state.players) {
      if (!p.name) {
        p.isBot = true;
        p.name = `Bot ${p.seat + 1}`;
      }
    }

    if (this.gameType === 'uno') {
      unoStartRound(state);
    } else {
      startRound(state);
    }

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
    if (this.state.phase !== 'bidding') this.clearTimer('bidding-timeout');
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

  // ---------- UNO actions ----------
  playCard(seat, card) {
    if (this.gameType !== 'uno') return { error: 'WRONG_GAME' };
    try {
      applyPlayCard(this.state, seat, card);
    } catch (e) {
      return { error: e.code };
    }
    this.touch();
    this.clearTimer(`afk-${seat}`);
    this.broadcast();
    this.pump();
    return { ok: true };
  }

  drawCard(seat) {
    if (this.gameType !== 'uno') return { error: 'WRONG_GAME' };
    try {
      applyDrawCard(this.state, seat);
    } catch (e) {
      return { error: e.code };
    }
    this.touch();
    this.clearTimer(`afk-${seat}`);
    this.broadcast();
    this.pump();
    return { ok: true };
  }

  callUno(seat) {
    if (this.gameType !== 'uno') return { error: 'WRONG_GAME' };
    try {
      applyCallUno(this.state, seat);
    } catch (e) {
      return { error: e.code };
    }
    this.touch();
    this.broadcast();
    return { ok: true };
  }

  chooseColor(seat, color) {
    if (this.gameType !== 'uno') return { error: 'WRONG_GAME' };
    try {
      applyChooseColor(this.state, seat, color);
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
    // Preserve the original human's ID so they can reclaim the seat after grace.
    p.disconnectedPlayerId = p.playerId;

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
      p.disconnectedPlayerId = null;
      p.ready = false;
    } else {
      // Become a permanent bot so the game stays 4-handed.
      p.isBot = true;
      p.botControlled = false;
      p.connected = false;
      p.playerId = null;
      p.socketId = null;
      p.disconnectedAt = null;
      p.disconnectedPlayerId = null;
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

    if (this.gameType === 'uno') {
      this.pumpUno();
      return;
    }

    // Call Break specific
    if (state.phase === 'bidding') {
      this.pumpBidding();
      return;
    }
    if (state.phase !== 'playing') return;

    const seat = state.play.currentPlayerSeat;
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

  /** UNO-specific pump: drive bots and AFK for the current UNO player. */
  pumpUno() {
    const state = this.state;
    if (state.phase !== 'playing') return;

    const seat = state.currentPlayerSeat;
    const player = state.players[seat];

    if (player.isBot || player.botControlled) {
      if (!this.timers.has(`bot-${seat}`)) {
        const delay = this.botProfiles[seat].delayMs();
        this.setTimer(`bot-${seat}`, delay, () => this.runUnoBotAction(seat));
      }
    } else if (player.connected) {
      if (!this.timers.has(`afk-${seat}`)) {
        this.setTimer(`afk-${seat}`, TURN_TIMEOUT_MS, () => this.unoAfkMove(seat));
      }
    }
  }

  /**
   * Bidding is simultaneous: every unbidden bot gets its own pacing timer,
   * and all unbidden connected humans share ONE deadline (a single 15s
   * window). When the window expires, every remaining seat is auto-bid.
   */
  pumpBidding() {
    const state = this.state;
    const { bidOrder, bids } = state.bidding;
    let humanPending = false;

    for (const seat of bidOrder) {
      if (bids[seat] != null) continue; // already bid
      const player = state.players[seat];
      if (player.isBot || player.botControlled) {
        if (!this.timers.has(`bot-${seat}`)) {
          const delay = this.botProfiles[seat].delayMs(buildCtx(state, seat));
          this.setTimer(`bot-${seat}`, delay, () => this.runBotAction(seat));
        }
      } else if (player.connected) {
        humanPending = true;
      }
    }

    if (humanPending && !this.timers.has('bidding-timeout')) {
      this.setTimer('bidding-timeout', this.turnTimeoutMs, () => this.closeBidding());
    }
  }

  /** The shared bidding window expired: fill in every remaining bid. */
  closeBidding() {
    if (this.destroyed || this.state.phase !== 'bidding') return;
    const state = this.state;
    let changed = false;
    for (const seat of state.bidding.bidOrder) {
      if (state.bidding.bids[seat] != null) continue;
      try {
        const ctx = buildCtx(state, seat);
        applyBid(state, seat, this.botProfiles[seat].chooseBid(ctx));
        changed = true;
      } catch (e) {
        // ignore — the seat somehow became unbiddable; progress must not stall
      }
    }
    if (changed) {
      this.broadcast();
      this.pump();
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

  /** UNO bot action: choose and execute a move. */
  runUnoBotAction(seat) {
    if (this.destroyed) return;
    const state = this.state;
    const player = state.players[seat];
    if (!(player.isBot || player.botControlled)) return;
    if (state.phase !== 'playing') return;

    try {
      const bot = this.botProfiles[seat];
      const action = bot.chooseAction(state, seat);

      if (action.type === 'play') {
        applyPlayCard(state, seat, action.card);
        // If wild was played, choose color.
        if (state.currentColor === 'wild') {
          const color = bot.chooseColor(player.hand);
          applyChooseColor(state, seat, color);
        }
      } else if (action.type === 'draw') {
        applyDrawCard(state, seat);
      } else if (action.type === 'callUno') {
        applyCallUno(state, seat);
      }
    } catch (e) {
      console.error(`[room ${this.code}] UNO bot action failed:`, e);
      return;
    }
    this.broadcast();
    this.pump();
  }

  /** UNO AFK move: auto-play for a disconnected human. */
  unoAfkMove(seat) {
    if (this.destroyed) return;
    const state = this.state;
    const player = state.players[seat];
    if (!player.connected || player.isBot) return;
    if (state.phase !== 'playing') return;

    try {
      const bot = this.botProfiles[seat];
      const action = bot.chooseAction(state, seat);

      if (action.type === 'play') {
        applyPlayCard(state, seat, action.card);
        if (state.currentColor === 'wild') {
          const color = bot.chooseColor(player.hand);
          applyChooseColor(state, seat, color);
        }
      } else if (action.type === 'draw') {
        applyDrawCard(state, seat);
      } else if (action.type === 'callUno') {
        applyCallUno(state, seat);
      }
    } catch (e) {
      return;
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
