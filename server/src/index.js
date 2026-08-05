import http from 'node:http';
import { Server } from 'socket.io';
import { createApp } from './app.js';
import { PORT, ROOM_SWEEP_INTERVAL_MS } from './config.js';
import { RoomManager } from './room/roomManager.js';
import { registerHandlers } from './network/handlers.js';

const app = createApp();
const httpServer = http.createServer(app);

// Dev: the Vite dev server proxies /socket.io to this backend, so allow that
// cross-origin connection. In production everything is same-origin.
const io = new Server(httpServer, {
  cors: { origin: true, credentials: true },
});

const manager = new RoomManager();
registerHandlers(io, manager);

// Periodically reap idle/abandoned rooms.
setInterval(() => manager.sweep(Date.now()), ROOM_SWEEP_INTERVAL_MS);

httpServer.listen(PORT, () => {
  console.log(`[server] listening on http://localhost:${PORT}`);
});
