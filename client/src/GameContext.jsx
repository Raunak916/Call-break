import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { socket, emitAck } from './socket.js';
import { storage } from './lib/storage.js';
import { friendlyError } from './lib/messages.js';

/**
 * Single source of truth for the client. Holds the latest authoritative
 * snapshot (`room:state`), the socket's connection status, identity, and every
 * action the UI can take. Screens read via useGame().
 */
const GameContext = createContext(null);

export function GameProvider({ children }) {
  const [state, setState] = useState(null); // latest room:state snapshot, or null
  const [connected, setConnected] = useState(socket.connected);
  const [notice, setNotice] = useState(null); // latest game:notice
  const [lastError, setLastError] = useState(null); // latest ack error code
  const [chatMessages, setChatMessages] = useState([]); // room chat messages
  const sessionRef = useRef(storage.session); // live identity, survives renders

  const rememberSession = useCallback((s) => {
    sessionRef.current = s;
    storage.session = s;
  }, []);

  const clearError = useCallback(() => setLastError(null), []);
  const clearNotice = useCallback(() => setNotice(null), []);

  useEffect(() => {
    const onState = (s) => setState(s);
    const onNotice = (payload) => setNotice({ ...payload, id: Date.now() });
    const onConnect = () => {
      setConnected(true);
      // Reclaim the seat if this browser held one when the socket dropped.
      const s = sessionRef.current;
      if (s && s.roomCode && s.playerId) {
        emitAck('room:rejoin', { code: s.roomCode, playerId: s.playerId }).catch(() => {});
      }
    };
    const onDisconnect = () => setConnected(false);

    socket.on('room:state', onState);
    socket.on('game:notice', onNotice);
    socket.on('chat:message', (msg) => setChatMessages((prev) => [...prev.slice(-99), msg]));
    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    return () => {
      socket.off('room:state', onState);
      socket.off('game:notice', onNotice);
      socket.off('chat:message');
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
    };
  }, []);

  const remember = useCallback(
    (ack, name) => {
      rememberSession({ roomCode: ack.roomCode, playerId: ack.playerId, name });
      return ack;
    },
    [rememberSession],
  );

  const createRoom = useCallback(
    async (name, opts) => {
      const ack = await emitAck('room:create', {
        name,
        totalRounds: opts?.totalRounds,
        scoringVariant: opts?.scoringVariant,
      });
      if (ack.error) {
        setLastError(ack.error);
        return ack;
      }
      return remember(ack, name);
    },
    [remember],
  );

  const joinRoom = useCallback(
    async (code, name) => {
      const ack = await emitAck('room:join', { code, name });
      if (ack.error) {
        setLastError(ack.error);
        return ack;
      }
      return remember(ack, name);
    },
    [remember],
  );

  const rejoin = useCallback(
    async (code, playerId) => {
      const ack = await emitAck('room:rejoin', { code, playerId });
      if (ack.ok) {
        rememberSession({ roomCode: code, playerId, name: sessionRef.current?.name || '' });
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

  const nextRound = useCallback(async () => {
    const ack = await emitAck('room:nextRound');
    if (ack.error) setLastError(ack.error);
    return ack;
  }, []);

  const rematch = useCallback(async () => {
    const ack = await emitAck('room:rematch');
    if (ack.error) setLastError(ack.error);
    return ack;
  }, []);

  const bid = useCallback(async (n) => {
    const ack = await emitAck('game:bid', { bid: n });
    if (ack.error) setLastError(ack.error);
    return ack;
  }, []);

  const play = useCallback(async (card) => {
    const ack = await emitAck('game:play', { card });
    if (ack.error) setLastError(ack.error);
    return ack;
  }, []);

  const sendChat = useCallback(async (text) => {
    const ack = await emitAck('chat:message', { text });
    if (ack.error) setLastError(ack.error);
    return ack;
  }, []);

  const value = useMemo(() => {
    const me = state?.players[state.you] ?? null;
    return {
      socket,
      state,
      connected,
      notice,
      lastError,
      chatMessages,
      me,
      isHost: state != null && state.hostSeat === state.you,
      friendlyError,
      createRoom,
      joinRoom,
      rejoin,
      ready,
      startGame,
      leaveRoom,
      nextRound,
      rematch,
      bid,
      play,
      sendChat,
      clearError,
      clearNotice,
    };
  }, [
    state,
    connected,
    notice,
    lastError,
    chatMessages,
    createRoom,
    joinRoom,
    rejoin,
    ready,
    startGame,
    leaveRoom,
    nextRound,
    rematch,
    bid,
    play,
    sendChat,
    clearError,
    clearNotice,
  ]);

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export function useGame() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGame must be used inside <GameProvider>');
  return ctx;
}
