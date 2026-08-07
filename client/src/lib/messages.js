// Map the server's ack error codes to copy a human can read. Codes not listed
// here fall back to the code itself.

export const ERROR_MESSAGES = {
  ROOM_NOT_FOUND: 'No room with that code.',
  ROOM_FULL: 'That room is full.',
  NOT_IN_ROOM: 'You are not in a room.',
  NOT_HOST: 'Only the host can do that.',
  NOT_ALL_READY: 'Wait for everyone to be ready.',
  NOT_ENOUGH_PLAYERS: 'Need at least one player to start.',
  WRONG_PHASE: 'That action is not allowed right now.',
  NOT_YOUR_TURN: "It isn't your turn yet.",
  ALREADY_BID: 'You already placed your bid.',
  INVALID_BID: 'Enter a bid between 0 and 13.',
  INVALID_CARD: 'That card is not valid.',
  CARD_NOT_IN_HAND: "You don't hold that card.",
  MUST_FOLLOW_SUIT: 'You must follow the led suit.',
  NO_SEAT: 'That seat is no longer available.',
};

export const friendlyError = (code) => ERROR_MESSAGES[code] || `Something went wrong (${code}).`;
