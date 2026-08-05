// Canonical shape documentation for the game state. These JSDoc typedefs are
// the source of truth for the GameState; the client mirrors the serialized
// shape in client/src/lib/types.js.

/**
 * A playing card. Suits are single letters: S (spades = trump), H, D, C.
 * Rank is 2..14 where 14 = Ace.
 * @typedef {{ s: string, r: number }} Card
 */

/**
 * One of the four seats at the table (0-3, clockwise).
 * @typedef {{
 *   seat: number,
 *   name: string,
 *   isBot: boolean,
 *   botControlled: boolean, // human seat temporarily driven by a bot (disconnect)
 *   playerId: string|null,  // persistent human identity for rejoin
 *   socketId: string|null,
 *   connected: boolean,
 *   disconnectedAt: number|null,
 *   rejoinGraceUntil: number|null,
 *   ready: boolean,
 *   score: number,          // cumulative
 *   totalTricks: number,    // cumulative across rounds (tie-break)
 *   roundHistory: { bid: number, tricks: number, score: number }[],
 *   bid: number|null,       // this round
 *   tricksWon: number,      // this round
 *   hand: Card[],
 * }} Player
 */

/**
 * The full authoritative game state for one room.
 * @typedef {{
 *   phase: 'lobby'|'bidding'|'playing'|'roundEnd'|'gameOver',
 *   round: number,
 *   totalRounds: number,
 *   scoringVariant: string,
 *   players: Player[],
 *   bidding: {
 *     currentSeat: number,
 *     bidOrder: number[],   // seats in bidding order
 *     bids: (number|null)[] // indexed by seat
 *   }|null,
 *   play: {
 *     trickNumber: number,
 *     currentPlayerSeat: number,
 *     leaderSeat: number,
 *     ledSuit: string|null,
 *     trickCards: { seat: number, card: Card }[],
 *     lastTrick: {
 *       leaderSeat: number,
 *       cards: { seat: number, card: Card }[],
 *       winnerSeat: number,
 *       ledSuit: string
 *     }|null
 *   }|null,
 *   roundScores: number[]|null,
 *   standings: { seat: number, name: string, score: number, totalTricks: number, bestRound: number }[]|null,
 *   lastRoundWinnerSeat: number|null,
 *   deck: Card[],           // internal, not serialized to clients
 *   playedCards: Set<string>, // internal (cards played this round), for bots
 *   version: number,        // bumped on every mutation for snapshot ordering
 * }} GameState
 */

export {};
