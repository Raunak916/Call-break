import { io } from 'socket.io-client';

// Same-origin: the Vite dev server proxies /socket.io to the backend, and in
// production the server serves the built client on the same port.
export const socket = io({ autoConnect: true });

/**
 * Emit an event and resolve with the ack payload ({ ok } or { error }).
 * Always sends an explicit payload slot: socket.io-client v4 only registers a
 * trailing function as the ack when there is also a data arg (a lone
 * `emit(event, fn)` silently drops the ack).
 */
export function emitAck(event, payload) {
  return new Promise((resolve) => {
    socket.emit(event, payload ?? {}, resolve);
  });
}
