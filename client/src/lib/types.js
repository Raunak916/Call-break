// Client-side mirror of the serialized game snapshot (see
// server/src/network/serialize.js for the authoritative shape). These are
// documentation only — the runtime shape comes straight from the server.

/**
 * A playing card. Suits: S (spades = trump), H, D, C. Rank 2..14 (A=14).
 * @typedef {{ s: string, r: number }} Card
 */

/**
 * One seat as a viewer sees it.
 * @typedef {{
 *   seat: number,
 *   name: string,
 *   isBot: boolean,
 *   botControlled: boolean,   // human seat driven by a bot after a disconnect
 *   connected: boolean,
 *   ready: boolean,
 *   score: number,
 *   totalTricks: number,
 *   roundHistory: { bid: number, tricks: number, score: number }[],
 *   bid: number|null,
 *   tricksWon: number,
 *   handCount: number,
 *   hand: Card[]|null,        // only the viewer's own hand
 *   isSelf: boolean,
 * }} PlayerView
 */

/**
 * The full snapshot a client renders from.
 * @typedef {{
 *   version: number,
 *   roomCode: string,
 *   phase: 'lobby'|'bidding'|'playing'|'roundEnd'|'gameOver',
 *   round: number,
 *   totalRounds: number,
 *   scoringVariant: string,
 *   hostSeat: number|null,
 *   you: number,
 *   players: PlayerView[],
 *   bidding: { bidOrder: number[], bids: (number|null)[] }|null,
 *   play: { trickNumber: number, currentPlayerSeat: number, leaderSeat: number,
 *           ledSuit: string|null, trickCards: { seat: number, card: Card }[],
 *           lastTrick: object|null }|null,
 *   roundScores: object|null,
 *   standings: object|null,
 *   gameOver: boolean,
 * }} GameSnapshot
 */
export {};
