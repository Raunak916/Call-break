// UNO client-side derivation helpers.

/**
 * Is it currently the viewer's turn?
 */
export const isMyTurn = (state) => {
  if (!state || state.phase !== 'playing') return false;
  return state.currentPlayerSeat === state.you;
};

/**
 * The viewer's hand, sorted by color then type.
 */
export const myHand = (state) => {
  const hand = state?.players?.[state.you]?.hand ?? [];
  const COLOR_ORDER = { red: 0, blue: 1, green: 2, yellow: 3, wild: 4 };
  const TYPE_ORDER = { number: 0, skip: 1, reverse: 2, draw2: 3, wild: 4, wild_draw4: 5 };
  return [...hand].sort(
    (a, b) =>
      (COLOR_ORDER[a.color] ?? 5) - (COLOR_ORDER[b.color] ?? 5) ||
      (TYPE_ORDER[a.type] ?? 5) - (TYPE_ORDER[b.type] ?? 5) ||
      (a.value ?? 0) - (b.value ?? 0),
  );
};

/**
 * Can the viewer play any card?
 */
export const canPlayAny = (state) => {
  if (!state || state.phase !== 'playing' || state.currentPlayerSeat !== state.you) return false;
  const hand = state.players[state.you]?.hand ?? [];
  const topCard = state.topDiscard;
  if (!topCard) return false;
  return hand.some((c) => isPlayable(c, topCard, state.currentColor, state.stack));
};

/**
 * Is a specific card playable?
 */
export const isPlayable = (card, topCard, currentColor, stack) => {
  if (!card || !topCard) return false;
  if (card.color === 'wild') return true;
  if (stack?.type) return card.type === stack.type;
  if (card.color === currentColor) return true;
  if (card.type === topCard.type && card.type !== 'number') return true;
  if (card.type === 'number' && topCard.type === 'number' && card.value === topCard.value) return true;
  return false;
};

/**
 * Does the viewer need to choose a color? (last card was wild, color is 'wild')
 */
export const needsColorChoice = (state) => {
  if (!state || state.phase !== 'playing') return false;
  return state.currentColor === 'wild' && state.currentPlayerSeat === state.you;
};
