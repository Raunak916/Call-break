// UNO-specific constants. All tunable values live here.

export const HAND_SIZE = 7;
export const MIN_PLAYERS = 2;
export const MAX_PLAYERS = 6;

// Penalties
export const UNO_PENALTY = 2;          // cards drawn if caught not calling UNO
export const DRAW2_PENALTY = 2;        // cards per Draw Two
export const WILD_DRAW4_PENALTY = 4;   // cards per Wild Draw Four

// Timing (shared with Call Break via room.js, listed here for reference)
// TURN_TIMEOUT_MS, GRACE_PERIOD_MS — imported from ../config.js
