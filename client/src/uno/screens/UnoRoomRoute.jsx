import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Button, Card, CardContent, CircularProgress, Stack, TextField, Typography } from '@mui/material';
import { useUno } from '../UnoContext.jsx';
import { storage } from '../../lib/storage.js';
import { friendlyError } from '../../lib/messages.js';
import UnoLobby from './UnoLobby.jsx';
import UnoGame from './UnoGame.jsx';

function LoadingRoom({ text }) {
  return (
    <Box sx={{ display: 'grid', placeItems: 'center', minHeight: '100vh', p: 2 }}>
      <Stack alignItems="center" spacing={2}>
        <Box sx={{ width: 56, height: 56, borderRadius: 999, display: 'grid', placeItems: 'center', fontSize: 22, fontWeight: 800, color: '#d32f2f', bgcolor: 'rgba(211,47,47,0.12)', border: '1px solid rgba(211,47,47,0.4)' }}>
          UNO
        </Box>
        <CircularProgress size={24} sx={{ color: '#d32f2f' }} />
        <Typography color="text.secondary">{text}</Typography>
      </Stack>
    </Box>
  );
}

function JoinPrompt({ code }) {
  const { joinRoom, leaveRoom, lastError } = useUno();
  const navigate = useNavigate();
  const [name, setName] = useState(storage.name || '');
  const [busy, setBusy] = useState(false);

  const handleJoin = async () => {
    setBusy(true);
    await leaveRoom();
    const ack = await joinRoom(code, name.trim() || 'Player');
    setBusy(false);
    if (ack.ok) navigate(`/uno/room/${ack.roomCode}`, { replace: true });
  };

  return (
    <Box sx={{ display: 'grid', placeItems: 'center', minHeight: '100vh', p: 2 }}>
      <Card sx={{ width: '100%', maxWidth: 400, borderRadius: 12, bgcolor: 'rgba(16,23,19,0.78)', backdropFilter: 'blur(18px)', border: '1px solid rgba(211,47,47,0.16)', boxShadow: '0 24px 80px rgba(0,0,0,0.5)' }}>
        <CardContent sx={{ p: 4 }}>
          <Typography variant="h5" sx={{ mb: 1, fontFamily: '"Sora", "Inter", sans-serif', fontWeight: 700 }}>
            Join UNO room <Box component="span" sx={{ color: '#d32f2f', letterSpacing: 2 }}>{code}</Box>?
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 3 }}>You're not seated in this room yet.</Typography>
          <Stack spacing={2}>
            <TextField label="Your name" value={name} onChange={(e) => { setName(e.target.value); storage.name = e.target.value; }} fullWidth slotProps={{ htmlInput: { maxLength: 20 } }} />
            <Button variant="contained" size="large" disabled={busy} onClick={handleJoin} sx={{ bgcolor: '#d32f2f', '&:hover': { bgcolor: '#b71c1c' } }}>
              {busy ? 'Joining…' : 'Join room'}
            </Button>
            <Button color="inherit" onClick={() => navigate('/')}>Back to home</Button>
            {lastError && <Typography color="error" variant="body2">{friendlyError(lastError)}</Typography>}
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
}

export default function UnoRoomRoute() {
  const { code } = useParams();
  const { state } = useUno();

  if (!state || state.roomCode !== code) {
    const session = storage.session;
    if (session && session.roomCode === code && session.playerId) {
      return <LoadingRoom text="Reconnecting…" />;
    }
    return <JoinPrompt code={code} />;
  }

  if (state.phase === 'lobby') return <UnoLobby />;
  return <UnoGame />;
}
