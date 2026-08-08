// JSDoc type definitions for the UNO engine.

/**
 * @typedef {{
 *   id: string,
 *   color: 'red'|'blue'|'green'|'yellow'|'wild',
 *   type: 'number'|'skip'|'reverse'|'draw2'|'wild'|'wild_draw4',
 *   value?: number,
 * }} Card
 */

/**
 * @typedef {{
 *   seat: number,
 *   name: string,
 *   isBot: boolean,
 *   botControlled: boolean,
 *   playerId: string|null,
 *   socketId: string|null,
 *   connected: boolean,
 *   disconnectedAt: number|null,
 *   rejoinGraceUntil: number|null,
 *   disconnectedPlayerId: string|null,
 *   ready: boolean,
 *   hand: Card[],
 *   calledUno: boolean,
 * }} PlayerState
 */

/**
 * @typedef {{
 *   phase: 'lobby'|'dealing'|'playing'|'roundEnd'|'gameOver',
 *   gameType: 'uno',
 *   round: number,
 *   totalRounds: number,
 *   players: PlayerState[],
 *   drawPile: Card[],
 *   discardPile: Card[],
 *   currentColor: string|null,
 *   currentPlayerSeat: number,
 *   direction: 1|-1,
 *   stack: { type: string|null, count: number },
 *   lastAction: { type: string, seat: number, card?: Card }|null,
 *   version: number,
 * }} GameState
 */

export {};
