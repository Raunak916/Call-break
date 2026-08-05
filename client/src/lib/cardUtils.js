// Display helpers for cards. The engine's Card is { s, r } where s is one of
// S/H/D/C (S = spades = trump) and r is 2..14 (14 = Ace).

export const SUIT_SYMBOL = { S: '♠', H: '♥', D: '♦', C: '♣' };
export const SUIT_LABEL = { S: 'Spades', H: 'Hearts', D: 'Diamonds', C: 'Clubs' };
export const RANK_LABEL = { 11: 'J', 12: 'Q', 13: 'K', 14: 'A' };

export const rankLabel = (r) => RANK_LABEL[r] || String(r);
export const cardLabel = (c) => `${rankLabel(c.r)}${SUIT_SYMBOL[c.s]}`;
export const cardKey = (c) => `${c.s}${c.r}`;
export const isRed = (c) => c.s === 'H' || c.s === 'D';
export const isTrump = (c) => c.s === 'S';

// Display order: clubs, diamonds, hearts, then spades (trump) rightmost.
const DISPLAY_SUIT_ORDER = { C: 0, D: 1, H: 2, S: 3 };

/** Sort a hand for display: by suit, then rank descending (A high). */
export const sortHand = (hand) =>
  [...hand].sort((a, b) => DISPLAY_SUIT_ORDER[a.s] - DISPLAY_SUIT_ORDER[b.s] || b.r - a.r);
