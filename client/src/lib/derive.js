// Pure derivation functions: take a snapshot, return computed facts.
// No side-effects, no React — these are usable from any context.

/**
 * Is it currently the viewer's turn?
 */
export const isMyTurn = (state) => {
  if (!state) return false;
  // Bidding is a shared simultaneous window (no per-player turn); the
  // BiddingPanel gates the bid controls on whether the viewer has bid yet.
  if (state.phase === 'playing') return state.play?.currentPlayerSeat === state.you;
  return false;
};

/**
 * The viewer's hand, sorted for display.
 */
export const myHand = (state) => state?.players?.[state.you]?.hand ?? [];

/**
 * Which seats should the server see as the viewer's position?
 * Bottom = self; then rotate clockwise: right, top, left.
 * Returns [{ seat, label, sx }] for each position around the table.
 */
export const SEAT_POSITIONS = ['bottom', 'right', 'top', 'left'];

export const seatLayout = (state) => {
  if (!state) return [];
  const you = state.you;
  return SEAT_POSITIONS.map((label, i) => ({
    seat: (you + i) % 4,
    label,
  }));
};

/**
 * Client-side hint: which cards in the hand are likely legal to play?
 * Server is authoritative — this is for highlighting only.
 */
export const legalHint = (state) => {
  if (!state || state.phase !== 'playing') return null;
  const hand = myHand(state);
  const ledSuit = state.play?.ledSuit;
  if (!ledSuit) return null; // leading: all are legal
  const hasLedSuit = hand.some((c) => c.s === ledSuit);
  if (!hasLedSuit) return null; // void in led suit: anything goes
  return new Set(hand.filter((c) => c.s === ledSuit).map((c) => `${c.s}${c.r}`));
};

/**
 * Map of seat -> { name, isBot, connected, ... } for quick lookup.
 */
export const seatMap = (state) => {
  if (!state) return {};
  const map = {};
  for (const p of state.players) map[p.seat] = p;
  return map;
};
