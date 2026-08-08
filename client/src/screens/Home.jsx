import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  CardContent,
  Divider,
  Slider,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useGame } from '../GameContext.jsx';
import { storage } from '../lib/storage.js';
import { friendlyError } from '../lib/messages.js';

const cleanCode = (v) => v.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 4);
const ROUND_MARKS = [
  { value: 1, label: '1' },
  { value: 3, label: '3' },
  { value: 5, label: '5' },
];

/**
 * Clean, spacious home screen — scales from phone to ultrawide.
 * Spacing widens with screen size; card stays centred and readable.
 */
export default function Home() {
  const { createRoom, joinRoom, lastError, clearError } = useGame();
  const navigate = useNavigate();
  const [name, setName] = useState(storage.name || '');
  const [code, setCode] = useState('');
  const [rounds, setRounds] = useState(5);
  const [busy, setBusy] = useState(null);

  const saveName = (v) => { setName(v); storage.name = v; };
  const go = (ack) => { if (ack.ok) navigate(`/room/${ack.roomCode}`); };

  const handleCreate = async () => {
    setBusy('create');
    go(await createRoom(name.trim() || 'Player', { totalRounds: rounds }));
    setBusy(null);
  };

  const handleJoin = async () => {
    if (code.length !== 4) return;
    setBusy('join');
    go(await joinRoom(code, name.trim() || 'Player'));
    setBusy(null);
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        p: { xs: 2, sm: 3, md: 4, lg: 5 },
        background: `
          radial-gradient(ellipse at 50% 40%, rgba(24,68,44,0.35) 0%, transparent 60%),
          linear-gradient(170deg, #0c1710 0%, #0a0e0b 50%, #0b130e 100%)
        `,
      }}
    >
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={() => navigate('/')}
        sx={{ position: 'absolute', top: { xs: 12, sm: 16 }, left: { xs: 12, sm: 16 }, color: 'text.secondary', textTransform: 'none', fontSize: 13 }}
      >
        All games
      </Button>

      <Card
        sx={{
          width: '100%',
          maxWidth: { xs: '100%', sm: 380, md: 400, lg: 420, xl: 440 },
          bgcolor: 'rgba(16,23,19,0.8)',
          border: '1px solid rgba(255,255,255,0.07)',
          backdropFilter: 'blur(16px)',
        }}
      >
        <CardContent sx={{ p: { xs: 3, sm: 3.5, md: 4, lg: 5 } }}>
          {/* Title */}
          <Box sx={{ textAlign: 'center', mb: { xs: 4, sm: 5, lg: 6 } }}>
            <Typography
              variant="h3"
              sx={{
                fontFamily: '"Sora", "Inter", sans-serif',
                fontWeight: 700,
                fontSize: { xs: 24, sm: 26, md: 28, lg: 30, xl: 32 },
                color: 'primary.main',
                letterSpacing: '-0.01em',
              }}
            >
              Call Break
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1, fontSize: { xs: 13, sm: 14 } }}>
              Trick-taking card game · 4 players · ♠ trumps
            </Typography>
          </Box>

          <Stack spacing={{ xs: 2.5, sm: 3, lg: 3.5 }}>
            <TextField
              label="Your name"
              value={name}
              onChange={(e) => saveName(e.target.value)}
              fullWidth
              autoComplete="nickname"
              slotProps={{ htmlInput: { maxLength: 20 } }}
              size="small"
            />

            <Box>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.75 }}>
                Rounds: <strong style={{ color: '#e6b23c' }}>{rounds}</strong>
              </Typography>
              <Slider
                value={rounds}
                onChange={(_, v) => setRounds(v)}
                step={null}
                marks={ROUND_MARKS}
                min={1}
                max={5}
                valueLabelDisplay="off"
                size="small"
                sx={{
                  '& .MuiSlider-markLabel': { fontWeight: 600, fontSize: 13, color: 'text.secondary' },
                }}
              />
            </Box>

            <Button
              variant="contained"
              fullWidth
              disabled={busy != null}
              onClick={handleCreate}
              sx={{ py: { xs: 1.2, lg: 1.4 }, fontSize: { xs: 14, sm: 15 } }}
            >
              {busy === 'create' ? 'Creating…' : 'Create Room'}
            </Button>

            <Divider sx={{ my: { xs: 0.5, lg: 1 }, borderColor: 'rgba(255,255,255,0.08)' }}>
              <Typography variant="caption" color="text.secondary">or join</Typography>
            </Divider>

            <Stack direction="row" spacing={1}>
              <TextField
                label="Room code"
                value={code}
                onChange={(e) => setCode(cleanCode(e.target.value))}
                fullWidth
                placeholder="e.g. K7QM"
                slotProps={{ htmlInput: { maxLength: 4 } }}
                onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
                size="small"
                sx={{ '& input': { letterSpacing: 2, textTransform: 'uppercase' } }}
              />
              <Button
                variant="outlined"
                disabled={busy != null || code.length !== 4}
                onClick={handleJoin}
                sx={{ px: { xs: 2.5, sm: 3 } }}
              >
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
