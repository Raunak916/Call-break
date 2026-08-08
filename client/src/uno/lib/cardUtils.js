// UNO card display helpers.

export const COLOR_MAP = {
  red: { bg: '#d32f2f', text: '#fff', label: 'Red' },
  blue: { bg: '#1565c0', text: '#fff', label: 'Blue' },
  green: { bg: '#2e7d32', text: '#fff', label: 'Green' },
  yellow: { bg: '#f9a825', text: '#1a1a1a', label: 'Yellow' },
  wild: { bg: '#1a1a1a', text: '#fff', label: 'Wild' },
};

export const TYPE_LABEL = {
  number: (card) => String(card.value),
  skip: () => '⊘',
  reverse: () => '⟲',
  draw2: () => '+2',
  wild: () => 'W',
  wild_draw4: () => '+4',
};

export const cardLabel = (card) => {
  if (!card) return '?';
  const label = TYPE_LABEL[card.type]?.(card) ?? '?';
  return card.color === 'wild' ? label : `${COLOR_MAP[card.color]?.label?.[0] ?? ''}${label}`;
};

export const isRed = (card) => card?.color === 'red' || card?.color === 'yellow';
