import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useGame } from '../GameContext.jsx';
import { storage } from '../lib/storage.js';
import { friendlyError } from '../lib/messages.js';
import Lobby from './Lobby.jsx';
import Game from './Game.jsx';

function LoadingRoom({ text }) {
  return (
    <Box sx={{ display: 'grid', placeItems: 'center', minHeight: '100vh' }}>
      <Stack alignItems="center" spacing={2}>
        <CircularProgress />
        <Typography color="text.secondary">{text}</Typography>
      </Stack>
    </Box>
  );
}

function JoinPrompt({ code }) {
  const { joinRoom, leaveRoom, lastError } = useGame();
  const navigate = useNavigate();
  const [name, setName] = useState(storage.name || '');
  const [busy, setBusy] = useState(false);

  const handleJoin = async () => {
    setBusy(true);
    // This socket may still hold a seat in another room; free it first so the
    // server's single-room-per-socket assumption holds.
    await leaveRoom();
    const ack = await joinRoom(code, name.trim() || 'Player');
    setBusy(false);
    if (ack.ok) navigate(`/room/${ack.roomCode}`, { replace: true });
  };

  return (
    <Box sx={{ display: 'grid', placeItems: 'center', minHeight: '100vh', p: 2 }}>
      <Card sx={{ width: '100%', maxWidth: 380 }}>
        <CardContent sx={{ p: 4 }}>
          <Typography variant="h5" sx={{ mb: 1 }}>
            Join room {code}?
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 3 }}>
            You're not seated in this room yet.
          </Typography>
          <Stack spacing={2}>
            <TextField
              label="Your name"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                storage.name = e.target.value;
              }}
              fullWidth
              slotProps={{ htmlInput: { maxLength: 20 } }}
            />
            <Button variant="contained" size="large" disabled={busy} onClick={handleJoin}>
              {busy ? 'Joining…' : 'Join room'}
            </Button>
            <Button color="inherit" onClick={() => navigate('/')}>
              Back to home
            </Button>
            {lastError && (
              <Typography color="error" variant="body2">
                {friendlyError(lastError)}
              </Typography>
            )}
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
}

/**
 * Route for /room/:code. Decides what to render from the live snapshot:
 * loading while the socket connects / a stored session rejoins, a join prompt
 * when there's no seat in this room, the Lobby, or (once play starts) the game.
 */
export default function RoomRoute() {
  const { code } = useParams();
  const { state } = useGame();

  if (!state || state.roomCode !== code) {
    const session = storage.session;
    // A stored session for exactly this room means the server may be mid-rejoin
    // (GameContext auto-rejoins on socket connect) — wait for the snapshot.
    if (session && session.roomCode === code && session.playerId) {
      return <LoadingRoom text="Reconnecting…" />;
    }
    return <JoinPrompt code={code} />;
  }

  if (state.phase === 'lobby') return <Lobby />;
  return <Game />;
}
