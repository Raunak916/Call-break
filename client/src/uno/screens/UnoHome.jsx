import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Button, Card, CardContent, Divider, Slider, Stack, TextField, Typography } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useUno } from '../UnoContext.jsx';
import { storage } from '../../lib/storage.js';
import { friendlyError } from '../../lib/messages.js';

const cleanCode = (v) => v.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 4);
const PLAYER_MARKS = [
  { value: 2, label: '2' },
  { value: 4, label: '4' },
  { value: 6, label: '6' },
];

export default function UnoHome() {
  const { createRoom, joinRoom, lastError, clearError } = useUno();
  const navigate = useNavigate();
  const [name, setName] = useState(storage.name || '');
  const [code, setCode] = useState('');
  const [players, setPlayers] = useState(4);
  const [busy, setBusy] = useState(null);

  const saveName = (v) => { setName(v); storage.name = v; };
  const go = (ack) => { if (ack.ok) navigate(`/uno/room/${ack.roomCode}`); };

  const handleCreate = async () => {
    setBusy('create');
    go(await createRoom(name.trim() || 'Player', { numSeats: players }));
    setBusy(null);
  };

  const handleJoin = async () => {
    if (code.length !== 4) return;
    setBusy('join');
    go(await joinRoom(code, name.trim() || 'Player'));
    setBusy(null);
  };

  return (
    <Box sx={{
      minHeight: '100vh', display: 'grid', placeItems: 'center',
      p: { xs: 2, sm: 3, md: 4 },
      background: 'radial-gradient(ellipse at 50% 40%, rgba(211,47,47,0.12) 0%, transparent 55%), linear-gradient(170deg, #0c1210 0%, #0a0e0b 50%, #0b130e 100%)',
    }}>
      <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/')} sx={{ position: 'absolute', top: { xs: 12, sm: 16 }, left: { xs: 12, sm: 16 }, color: 'text.secondary', textTransform: 'none', fontSize: 13 }}>
        All games
      </Button>

      <Card sx={{ width: '100%', maxWidth: { xs: '100%', sm: 380, md: 400 }, bgcolor: 'rgba(16,23,19,0.8)', border: '1px solid rgba(255,255,255,0.07)', backdropFilter: 'blur(16px)' }}>
        <CardContent sx={{ p: { xs: 3, sm: 3.5, md: 4 } }}>
          <Box sx={{ textAlign: 'center', mb: { xs: 4, sm: 5 } }}>
            <Typography variant="h3" sx={{ fontFamily: '"Sora", "Inter", sans-serif', fontWeight: 700, fontSize: { xs: 24, sm: 28, md: 30 }, color: '#d32f2f', letterSpacing: '-0.01em' }}>
              UNO
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1, fontSize: { xs: 13, sm: 14 } }}>
              Classic card game · 2-6 players
            </Typography>
          </Box>

          <Stack spacing={{ xs: 2.5, sm: 3 }}>
            <TextField label="Your name" value={name} onChange={(e) => saveName(e.target.value)} fullWidth autoComplete="nickname" slotProps={{ htmlInput: { maxLength: 20 } }} size="small" />

            <Box>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.75 }}>
                Players: <strong style={{ color: '#d32f2f' }}>{players}</strong>
              </Typography>
              <Slider value={players} onChange={(_, v) => setPlayers(v)} step={2} marks={PLAYER_MARKS} min={2} max={6} valueLabelDisplay="off" size="small" />
            </Box>

            <Button variant="contained" fullWidth disabled={busy != null} onClick={handleCreate} sx={{ py: { xs: 1.2, lg: 1.4 }, fontSize: { xs: 14, sm: 15 }, bgcolor: '#d32f2f', '&:hover': { bgcolor: '#b71c1c' } }}>
              {busy === 'create' ? 'Creating…' : 'Create Room'}
            </Button>

            <Divider sx={{ my: 0.5, borderColor: 'rgba(255,255,255,0.08)' }}>
              <Typography variant="caption" color="text.secondary">or join</Typography>
            </Divider>

            <Stack direction="row" spacing={1}>
              <TextField label="Room code" value={code} onChange={(e) => setCode(cleanCode(e.target.value))} fullWidth placeholder="e.g. K7QM" slotProps={{ htmlInput: { maxLength: 4 } }} onKeyDown={(e) => e.key === 'Enter' && handleJoin()} size="small" sx={{ '& input': { letterSpacing: 2, textTransform: 'uppercase' } }} />
              <Button variant="outlined" disabled={busy != null || code.length !== 4} onClick={handleJoin} sx={{ px: { xs: 2.5, sm: 3 }, borderColor: 'rgba(211,47,47,0.5)', '&:hover': { borderColor: '#d32f2f', bgcolor: 'rgba(211,47,47,0.08)' } }}>
                {busy === 'join' ? '…' : 'Join'}
              </Button>
            </Stack>

            {lastError && (
              <Typography color="error" variant="body2" onClick={clearError} sx={{ cursor: 'pointer', textAlign: 'center' }}>
                {friendlyError(lastError)}
              </Typography>
            )}
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
}
