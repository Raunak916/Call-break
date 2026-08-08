// Per-viewer serialization of the authoritative GameState.
// The same state is broadcast to every socket in a room, but each viewer
// only receives their own hand (others get a hand count).

/**
 * @param {import('../game/types.js').GameState} state
 * @param {number} viewerSeat
 * @returns {object} the snapshot the viewer's client renders from
 */
export function serializeState(state, viewerSeat, { roomCode, hostSeat }) {
  const base = {
    version: state.version,
    roomCode,
    gameType: state.gameType || 'call-break',
    phase: state.phase,
    round: state.round,
    totalRounds: state.totalRounds,
    hostSeat,
    you: viewerSeat,

    players: state.players.map((p) => ({
      seat: p.seat,
      name: p.name,
      isBot: p.isBot,
      botControlled: p.botControlled,
      connected: p.connected,
      ready: p.ready,
      handCount: p.hand.length,
      hand: p.seat === viewerSeat ? p.hand : null,
      isSelf: p.seat === viewerSeat,
    })),

    gameOver: state.phase === 'gameOver',
  };

  // Call Break-specific fields
  if (state.gameType !== 'uno') {
    base.scoringVariant = state.scoringVariant;
    base.players = base.players.map((p, i) => ({
      ...p,
      score: state.players[i].score,
      totalTricks: state.players[i].totalTricks,
      roundHistory: state.players[i].roundHistory,
      bid: state.players[i].bid,
      tricksWon: state.players[i].tricksWon,
    }));
    base.bidding = state.bidding;
    base.play = state.play;
    base.roundScores = state.roundScores;
    base.standings = state.standings;
  }

  // UNO-specific fields
  if (state.gameType === 'uno') {
    base.currentColor = state.currentColor;
    base.currentPlayerSeat = state.currentPlayerSeat;
    base.direction = state.direction;
    base.stack = state.stack;
    base.lastAction = state.lastAction;
    base.drawPileCount = state.drawPile.length;
    base.topDiscard = state.discardPile[state.discardPile.length - 1] || null;
    base.players = base.players.map((p, i) => ({
      ...p,
      calledUno: state.players[i].calledUno,
    }));
  }

  return base;
}
