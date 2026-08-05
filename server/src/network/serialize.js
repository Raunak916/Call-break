// Per-viewer serialization of the authoritative GameState.
// The same state is broadcast to every socket in a room, but each viewer
// only receives their own hand (others get a hand count).

/**
 * @param {import('../game/types.js').GameState} state
 * @param {number} viewerSeat
 * @returns {object} the snapshot the viewer's client renders from
 */
export function serializeState(state, viewerSeat, { roomCode, hostSeat }) {
  return {
    version: state.version,
    roomCode,
    phase: state.phase,
    round: state.round,
    totalRounds: state.totalRounds,
    scoringVariant: state.scoringVariant,
    hostSeat,
    you: viewerSeat,

    players: state.players.map((p) => ({
      seat: p.seat,
      name: p.name,
      isBot: p.isBot,
      botControlled: p.botControlled,
      connected: p.connected,
      ready: p.ready,
      score: p.score,
      totalTricks: p.totalTricks,
      roundHistory: p.roundHistory,
      bid: p.bid,
      tricksWon: p.tricksWon,
      handCount: p.hand.length,
      // Only your own hand is visible.
      hand: p.seat === viewerSeat ? p.hand : null,
      isSelf: p.seat === viewerSeat,
    })),

    // Bids, table cards, and scores are all public.
    bidding: state.bidding,
    play: state.play,
    roundScores: state.roundScores,
    standings: state.standings,
    gameOver: state.phase === 'gameOver',
  };
}
