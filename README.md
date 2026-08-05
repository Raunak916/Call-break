# Call Break — v1.0.0

Online multiplayer [Call Break](https://en.wikipedia.org/wiki/Call_break) — the trick-taking card game. Play with friends; AI bots fill empty seats.

![Node.js](https://img.shields.io/badge/Node.js-18+-green) ![React](https://img.shields.io/badge/React-19-blue) ![Socket.IO](https://img.shields.io/badge/Socket.IO-4-red)

## Quick Start

```bash
# Install dependencies
npm install

# Run in dev mode (server + client hot-reload)
npm run dev
```

Open **http://localhost:5173** in two browser tabs. Create a room, share the code, play.

## How to Play

1. **Create a room** — enter your name, pick rounds (1/3/5), click Create Room
2. **Share the code** — send the 4-character room code to friends
3. **Join** — friends enter the code and join
4. **Ready up** — everyone clicks Ready, host clicks Start
5. **Bid** — each player bids 0–13 (how many tricks they'll win)
6. **Play** — trick-taking: follow suit if possible, trump to steal tricks
7. **Score** — make your bid = +tricks won; miss = −bid amount
8. **Winner** — highest cumulative score after all rounds wins the podium

## Features

- **Real-time multiplayer** via Socket.IO
- **AI bots** with card-counting heuristics fill empty seats
- **Private rooms** via 4-character codes (no accounts needed)
- **Configurable rounds** — 1, 3, or 5 rounds per game
- **Disconnect/reconnect** — 45s grace window; AI plays while you're away
- **Live scoring** — tricks/bid format updates in real-time
- **Trick animations** — cards fly in, converge, stack, and fly to the winner
- **Game-over podium** — gold/silver/bronze platforms with confetti
- **Premium visuals** — casino-themed Home, wooden table, face-card illustrations

## Tech Stack

| Layer | Stack |
|---|---|
| Server | Express + Socket.IO (ESM JS) |
| Client | React 19 + Vite + MUI 7 |
| Deploy | Single process (serves client + API on one port) |

## Project Structure

```
├── server/
│   ├── src/
│   │   ├── game/          # Engine, cards, scoring, bots
│   │   ├── room/          # Room manager, disconnect/rejoin
│   │   ├── network/       # Socket handlers, serialization
│   │   └── config.js      # All tunable constants
│   └── test/              # 35 tests
├── client/
│   ├── src/
│   │   ├── screens/       # Home, Lobby, Game
│   │   ├── components/    # Cards, Table, Hand, Timer, Podium
│   │   ├── lib/           # Card utils, storage, messages
│   │   └── GameContext.jsx # Single source of truth
│   └── dist/              # Built production client
└── package.json           # npm workspaces root
```

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Server (3000) + Vite dev server (5173) concurrently |
| `npm run build` | Build client into `client/dist/` |
| `npm start` | Serve built client + Socket.IO on port 3000 |
| `npm test` | Run all 35 server tests |

## Deploy (Single Process)

```bash
npm install && npm run build && npm start
```

The server serves `client/dist/` as static files with SPA fallback. Set `PORT` env variable for your host.

### Render

1. Push to GitHub
2. Create a new Render Web Service
3. Build command: `npm install && npm run build`
4. Start command: `npm start`
5. Set environment variable: `PORT=3000` (or leave default)

### Railway / Fly.io / Any Node Host

Same process — one command builds and runs everything. Socket.IO works over WebSocket on the same port.

## Game Rules

- **52 cards**, 4 players (humans + bots), 13 cards each
- **Trump**: Spades always trump
- **Bidding**: each seat bids 0–13, public bids
- **Play**: follow suit if able, otherwise any card (may trump)
- **Trick winner**: highest spade; if none, highest card of the led suit
- **Scoring** (Nepal variant):
  - Made bid → +tricks won
  - Missed bid → −bid amount
- **Winner**: highest cumulative score after all rounds

## Config

All constants in `server/src/config.js`:

- `TURN_TIMEOUT_MS` — AFK timeout: 15s (bot plays for you)
- `GRACE_PERIOD_MS` — Reconnect window: 45s
- `ROUND_END_AUTO_ADVANCE_MS` — Auto-advance: 8s
- `SCORING_VARIANT` — `nepal` (default) | `delta` | `nepal-soft`

## License

Private project — v1.0.0
