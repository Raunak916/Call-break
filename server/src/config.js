// Central constants. Everything tunable lives here so rules variants are
// one-line changes (see the scoring section in game/scoring.js).

export const PORT = Number(process.env.PORT) || 3000;

// Game
export const SUITS = ['S', 'H', 'D', 'C']; // S = spades = trump
export const TRUMP_SUIT = 'S';
export const MIN_RANK = 2;
export const MAX_RANK = 14; // 14 = Ace
export const CARDS_PER_HAND = 13;
export const NUM_SEATS = 4;
export const DEFAULT_TOTAL_ROUNDS = 5;
export const SCORING_VARIANT = 'nepal'; // 'nepal' | 'delta' | 'nepal-soft'

// Room codes: unambiguous, no I/O/0/1 to avoid confusion when reading aloud.
export const ROOM_CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
export const ROOM_CODE_LENGTH = 4;
export const MAX_NAME_LENGTH = 20;

// Resilience
export const GRACE_PERIOD_MS = 45_000; // reconnect window after disconnect
export const TURN_TIMEOUT_MS = 15_000; // AFK human -> bot plays that one move
export const ROUND_END_AUTO_ADVANCE_MS = 8_000; // time showing round results

// Room cleanup sweep
export const ROOM_SWEEP_INTERVAL_MS = 60_000;
export const ROOM_IDLE_EMPTY_MS = 10 * 60_000; // no players at all
export const ROOM_IDLE_LOBBY_MS = 30 * 60_000; // lobby with players but idle
export const ROOM_IDLE_GAMEOVER_MS = 10 * 60_000;
