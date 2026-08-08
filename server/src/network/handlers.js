// Socket.IO event wiring. Every client->server event is acknowledged with
// { ok: true } or { error: <CODE> }; the server broadcasts room:state after
// every mutation. Rooms are located by the code stored on the socket.

import { randomUUID } from 'node:crypto';
import { MAX_NAME_LENGTH } from '../config.js';

function sanitizeName(raw) {
  const name = String(raw || '').trim().slice(0, MAX_NAME_LENGTH);
  return name || 'Player';
}

export function registerHandlers(io, manager) {
  io.on('connection', (socket) => {
    socket.data = { code: null, seat: null, playerId: null };

    socket.on('room:create', (payload, ack) => {
      const name = sanitizeName(payload?.name);
      const playerId = randomUUID();
      const room = manager.create({
        io,
        name,
        socketId: socket.id,
        playerId,
        totalRounds: payload?.totalRounds,
        scoringVariant: payload?.scoringVariant,
        gameType: payload?.gameType || 'call-break',
        numSeats: payload?.numSeats,
      });
      socket.data = { code: room.code, seat: room.hostSeat, playerId };
      socket.join(room.code);
      room.broadcast();
      ack?.({ ok: true, roomCode: room.code, seat: room.hostSeat, isHost: true, playerId });
    });

    socket.on('room:join', (payload, ack) => {
      const code = String(payload?.code || '').trim().toUpperCase();
      const room = manager.get(code);
      if (!room) return ack?.({ error: 'ROOM_NOT_FOUND' });

      const name = sanitizeName(payload?.name);
      const playerId = randomUUID();
      const res = room.addHuman({ name, socketId: socket.id, playerId });
      if (res.error) return ack?.({ error: res.error });

      socket.data = { code, seat: res.seat, playerId };
      socket.join(code);

      if (res.claimedBot) {
        room.emitToSeat(res.seat, 'game:notice', {
          message: `You joined mid-game and took over a bot's seat (${res.inherited.hand} cards in hand, bid ${res.inherited.bid ?? '—'}).`,
          kind: 'info',
        });
      }

      room.broadcast();
      room.pump();
      ack?.({ ok: true, roomCode: code, seat: res.seat, isHost: res.isHost, playerId });
    });

    socket.on('room:rejoin', (payload, ack) => {
      const code = String(payload?.code || '').trim().toUpperCase();
      const room = manager.get(code);
      if (!room) return ack?.({ error: 'ROOM_NOT_FOUND' });

      const seat = room.findSeatByPlayerId(payload?.playerId);
      if (seat == null) return ack?.({ error: 'NO_SEAT' });

      room.reclaim(seat, socket.id);
      socket.data = { code, seat, playerId: payload.playerId };
      socket.join(code);
      room.broadcast();
      room.pump();
      ack?.({ ok: true, roomCode: code, seat, isHost: room.hostSeat === seat });
    });

    socket.on('room:ready', (payload, ack) => {
      const room = manager.get(socket.data.code);
      if (!room) return ack?.({ error: 'NOT_IN_ROOM' });
      const res = room.setReady(socket.data.seat, !!payload?.ready);
      if (res.error) return ack?.({ error: res.error });
      ack?.({ ok: true });
    });

    socket.on('room:start', (_payload, ack) => {
      const room = manager.get(socket.data.code);
      if (!room) return ack?.({ error: 'NOT_IN_ROOM' });
      const res = room.start(socket.data.seat);
      if (res.error) return ack?.({ error: res.error });
      ack?.({ ok: true });
    });

    socket.on('game:bid', (payload, ack) => {
      const room = manager.get(socket.data.code);
      if (!room) return ack?.({ error: 'NOT_IN_ROOM' });
      const res = room.bid(socket.data.seat, payload?.bid);
      if (res.error) return ack?.({ error: res.error });
      ack?.({ ok: true });
    });

    socket.on('game:play', (payload, ack) => {
      const room = manager.get(socket.data.code);
      if (!room) return ack?.({ error: 'NOT_IN_ROOM' });
      const res = room.play(socket.data.seat, payload?.card);
      if (res.error) return ack?.({ error: res.error });
      ack?.({ ok: true });
    });

    // UNO-specific events
    socket.on('uno:play-card', (payload, ack) => {
      const room = manager.get(socket.data.code);
      if (!room) return ack?.({ error: 'NOT_IN_ROOM' });
      const res = room.playCard(socket.data.seat, payload?.card);
      if (res.error) return ack?.({ error: res.error });
      ack?.({ ok: true });
    });

    socket.on('uno:draw-card', (payload, ack) => {
      const room = manager.get(socket.data.code);
      if (!room) return ack?.({ error: 'NOT_IN_ROOM' });
      const res = room.drawCard(socket.data.seat);
      if (res.error) return ack?.({ error: res.error });
      ack?.({ ok: true });
    });

    socket.on('uno:call-uno', (payload, ack) => {
      const room = manager.get(socket.data.code);
      if (!room) return ack?.({ error: 'NOT_IN_ROOM' });
      const res = room.callUno(socket.data.seat);
      if (res.error) return ack?.({ error: res.error });
      ack?.({ ok: true });
    });

    socket.on('uno:choose-color', (payload, ack) => {
      const room = manager.get(socket.data.code);
      if (!room) return ack?.({ error: 'NOT_IN_ROOM' });
      const res = room.chooseColor(socket.data.seat, payload?.color);
      if (res.error) return ack?.({ error: res.error });
      ack?.({ ok: true });
    });

    socket.on('room:nextRound', (_payload, ack) => {
      const room = manager.get(socket.data.code);
      if (!room) return ack?.({ error: 'NOT_IN_ROOM' });
      const res = room.hostNextRound(socket.data.seat);
      if (res.error) return ack?.({ error: res.error });
      ack?.({ ok: true });
    });

    socket.on('room:rematch', (_payload, ack) => {
      const room = manager.get(socket.data.code);
      if (!room) return ack?.({ error: 'NOT_IN_ROOM' });
      const res = room.rematch(socket.data.seat);
      if (res.error) return ack?.({ error: res.error });
      ack?.({ ok: true });
    });

    socket.on('room:leave', (_payload, ack) => {
      const room = manager.get(socket.data.code);
      if (room) room.onLeave(socket.id);
      socket.data = { code: null, seat: null, playerId: null };
      ack?.({ ok: true });
    });

    socket.on('chat:message', (payload, ack) => {
      const room = manager.get(socket.data.code);
      if (!room) return ack?.({ error: 'NOT_IN_ROOM' });
      const text = String(payload?.text || '').trim().slice(0, 500);
      if (!text) return ack?.({ error: 'EMPTY_MESSAGE' });
      const sender = room.state.players[socket.data.seat];
      if (!sender) return ack?.({ error: 'NOT_IN_ROOM' });
      io.to(socket.data.code).emit('chat:message', {
        seat: socket.data.seat,
        name: sender.name,
        text,
        ts: Date.now(),
      });
      ack?.({ ok: true });
    });

    socket.on('disconnect', () => {
      const room = manager.get(socket.data.code);
      if (room) room.onDisconnect(socket.id);
    });
  });
}
