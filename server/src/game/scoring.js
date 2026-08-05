// Round scoring. The variant is a room-level config so rules variations are a
// one-line change — this is the intended seam for future variants.

/**
 * Points a single player earns in one round.
 *
 * Variants:
 * - `nepal` (default):  make your call -> +tricks won; miss it -> -bid.
 *      Makes bidding meaningful: over-bidding risks losing your whole call.
 * - `delta`:            literal tricks - bid (note: makes bidding 0 dominant).
 * - `nepal-soft`:       make -> +tricks; miss -> -(bid - tricks), a gentler shortfall.
 */
export function roundScore(bid, tricks, variant) {
  switch (variant) {
    case 'delta':
      return tricks - bid;
    case 'nepal':
      return tricks >= bid ? tricks : -bid;
    case 'nepal-soft':
      return tricks >= bid ? tricks : -(bid - tricks);
    default:
      throw new Error(`Unknown scoring variant: ${variant}`);
  }
}

/** @returns {number[]} per-seat round scores */
export function computeRoundScores(players, variant) {
  return players.map((p) => roundScore(p.bid, p.tricksWon, variant));
}
