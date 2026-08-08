import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { socket, emitAck } from '../socket.js';
import { storage } from '../lib/storage.js';
import { friendlyError } from '../lib/messages.js';

const UnoContext = createContext(null);

export function UnoProvider({ children }) {
  const [state, setState] = useState(null);
  const [connected, setConnected] = useState(socket.connected);
  const [notice, setNotice] = useState(null);
  const [lastError, setLastError] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const sessionRef = useRef(storage.session);
  const rejoiningRef = useRef(false); // guards overlapping rejoin attempts

  const rememberSession = useCallback((s) => {
    sessionRef.current = s;
    storage.session = s;
  }, []);

  const clearError = useCallback(() => setLastError(null), []);
  const clearNotice = useCallback(() => setNotice(null), []);

  /**
   * Reclaim this browser's UNO seat after a reload / socket drop. Retries a few
   * times (the server may still be closing the old socket right after a reload).
   * If the seat is definitively gone, drop the stale session so the room route
   * offers a fresh join instead of hanging on "Reconnecting…" forever.
   */
  const rejoinSession = useCallback(async () => {
    if (rejoiningRef.current) return;
    rejoiningRef.current = true;
    try {
      for (let attempt = 0; attempt < 5; attempt++) {
        const s = sessionRef.current;
        if (!s || !s.roomCode || !s.playerId) return; // session changed
        if (s.gameType !== 'uno') return; // the call-break context owns it
        try {
          const ack = await emitAck('room:rejoin', { code: s.roomCode, playerId: s.playerId });
          if (ack.ok) return;
          if (ack.error === 'ROOM_NOT_FOUND') break; // room is gone; session is stale
        } catch {
          // emit threw (socket closed mid-flight) — treat as transient and retry
        }
        await new Promise((r) => setTimeout(r, 400 * (attempt + 1)));
      }
      rememberSession(null);
      storage.clearSession();
      setState(null);
    } finally {
      rejoiningRef.current = false;
    }
  }, [rememberSession]);

  useEffect(() => {
    const onState = (s) => setState(s);
    const onNotice = (payload) => setNotice({ ...payload, id: Date.now() });
    const onConnect = () => {
      setConnected(true);
      rejoinSession();
    };
    const onDisconnect = () => setConnected(false);

    socket.on('room:state', onState);
    socket.on('game:notice', onNotice);
    socket.on('chat:message', (msg) => setChatMessages((prev) => [...prev.slice(-99), msg]));
    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);

    // The socket may already be connected by the time this listener is attached
    // (fast localhost connect, StrictMode effect replay) — its 'connect' event
    // fired without us. Rejoin now so the seat is still reclaimed.
    if (socket.connected) rejoinSession();

    return () => {
      socket.off('room:state', onState);
      socket.off('game:notice', onNotice);
      socket.off('chat:message');
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
    };
  }, [rejoinSession]);

  const remember = useCallback(
    (ack, name) => {
      rememberSession({ roomCode: ack.roomCode, playerId: ack.playerId, name, gameType: 'uno' });
      return ack;
    },
    [rememberSession],
  );

  const createRoom = useCallback(
    async (name, opts) => {
      const ack = await emitAck('room:create', {
        name,
        gameType: 'uno',
        totalRounds: opts?.totalRounds,
        numSeats: opts?.numSeats,
      });
      if (ack.error) { setLastError(ack.error); return ack; }
      return remember(ack, name);
    },
    [remember],
  );

  const joinRoom = useCallback(
    async (code, name) => {
      const ack = await emitAck('room:join', { code, name });
      if (ack.error) { setLastError(ack.error); return ack; }
      return remember(ack, name);
    },
    [remember],
  );

  const rejoin = useCallback(
    async (code, playerId) => {
      const ack = await emitAck('room:rejoin', { code, playerId });
      if (ack.ok) {
        rememberSession({
          roomCode: code,
          playerId,
          name: sessionRef.current?.name || '',
          gameType: 'uno',
        });
      } else {
        setLastError(ack.error);
      }
      return ack;
    },
    [rememberSession],
  );

  const ready = useCallback(async (v) => {
    const ack = await emitAck('room:ready', { ready: v });
    if (ack.error) setLastError(ack.error);
    return ack;
  }, []);

  const startGame = useCallback(async () => {
    const ack = await emitAck('room:start');
    if (ack.error) setLastError(ack.error);
    return ack;
  }, []);

  const leaveRoom = useCallback(async () => {
    await emitAck('room:leave');
    rememberSession(null);
    storage.clearSession();
    setState(null);
  }, [rememberSession]);

  const playCard = useCallback(async (card) => {
    const ack = await emitAck('uno:play-card', { card });
    if (ack.error) setLastError(ack.error);
    return ack;
  }, []);

  const drawCard = useCallback(async () => {
    const ack = await emitAck('uno:draw-card');
    if (ack.error) setLastError(ack.error);
    return ack;
  }, []);

  const callUno = useCallback(async () => {
    const ack = await emitAck('uno:call-uno');
    if (ack.error) setLastError(ack.error);
    return ack;
  }, []);

  const chooseColor = useCallback(async (color) => {
    const ack = await emitAck('uno:choose-color', { color });
    if (ack.error) setLastError(ack.error);
    return ack;
  }, []);

  const sendChat = useCallback(async (text) => {
    const ack = await emitAck('chat:message', { text });
    if (ack.error) setLastError(ack.error);
    return ack;
  }, []);

  const value = useMemo(() => {
    const me = state?.players?.[state.you] ?? null;
    return {
      socket, state, connected, notice, lastError, chatMessages, me,
      isHost: state != null && state.hostSeat === state.you,
      friendlyError,
      createRoom, joinRoom, rejoin, ready, startGame, leaveRoom,
      playCard, drawCard, callUno, chooseColor,
      sendChat, clearError, clearNotice,
    };
  }, [
    state, connected, notice, lastError, chatMessages,
    createRoom, joinRoom, rejoin, ready, startGame, leaveRoom,
    playCard, drawCard, callUno, chooseColor,
    sendChat, clearError, clearNotice,
  ]);

  return <UnoContext.Provider value={value}>{children}</UnoContext.Provider>;
}

export function useUno() {
  const ctx = useContext(UnoContext);
  if (!ctx) throw new Error('useUno must be used inside <UnoProvider>');
  return ctx;
}
