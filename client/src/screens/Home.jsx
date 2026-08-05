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
 * Casino-themed Home screen. Subtle suit-pattern background,
 * gold accents, premium serif typography.
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
        p: 2,
        position: 'relative',
        overflow: 'hidden',
        /* Casino green felt background with subtle suit pattern */
        background: `
          radial-gradient(ellipse at 30% 20%, rgba(30,60,40,0.6) 0%, transparent 50%),
          radial-gradient(ellipse at 70% 80%, rgba(30,60,40,0.4) 0%, transparent 50%),
          linear-gradient(160deg, #0f1f16 0%, #1a2b22 30%, #142219 60%, #0d1a12 100%)
        `,
      }}
    >
      {/* Decorative suit symbols — faded in background */}
      {['♠', '♥', '♦', '♣', '♠', '♥', '♦', '♣'].map((s, i) => (
        <Typography
          key={i}
          sx={{
            position: 'absolute',
            fontSize: { xs: 80, sm: 120 },
            opacity: 0.025,
            color: i % 2 === 0 ? '#f0ece2' : '#d4a843',
            top: `${10 + (i * 13) % 80}%`,
            left: `${5 + (i * 17) % 85}%`,
            pointerEvents: 'none',
            transform: `rotate(${-15 + i * 20}deg)`,
          }}
        >
          {s}
        </Typography>
      ))}

      {/* Gold line accent */}
      <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: 'linear-gradient(90deg, transparent, #d4a843, transparent)' }} />

      <Card
        sx={{
          width: '100%',
          maxWidth: 440,
          position: 'relative',
          zIndex: 1,
          bgcolor: 'rgba(26,43,34,0.92)',
          border: '1px solid rgba(212,168,67,0.2)',
          backdropFilter: 'blur(12px)',
          mx: 2,
        }}
      >
        <CardContent sx={{ p: { xs: 3, sm: 5 } }}>
          {/* Title */}
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Typography
              variant="h2"
              sx={{
                fontFamily: '"Georgia", serif',
                fontWeight: 700,
                fontSize: { xs: 32, sm: 38 },
                color: '#f0ece2',
                letterSpacing: 2,
                mb: 0.5,
              }}
            >
              ♠ Call Break ♠
            </Typography>
            <Box sx={{ width: 60, height: 2, bgcolor: '#d4a843', mx: 'auto', mb: 1.5 }} />
            <Typography variant="body2" sx={{ color: '#a8b8ae', fontStyle: 'italic' }}>
              Trick-taking card game with friends
            </Typography>
          </Box>

          <Stack spacing={2.5}>
            <TextField
              label="Your name"
              value={name}
              onChange={(e) => saveName(e.target.value)}
              fullWidth
              autoComplete="nickname"
              slotProps={{ htmlInput: { maxLength: 20 } }}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            />

            <Box>
              <Typography variant="caption" sx={{ color: '#a8b8ae', mb: 0.5, display: 'block', fontStyle: 'italic' }}>
                Rounds: <strong style={{ color: '#d4a843' }}>{rounds}</strong>
              </Typography>
              <Slider
                value={rounds}
                onChange={(_, v) => setRounds(v)}
                step={null}
                marks={ROUND_MARKS}
                min={1}
                max={5}
                valueLabelDisplay="off"
                sx={{
                  color: '#d4a843',
                  '& .MuiSlider-markLabel': { fontFamily: '"Georgia", serif', fontWeight: 700, fontSize: 14, color: '#a8b8ae' },
                  '& .MuiSlider-mark': { height: 8, width: 2, bgcolor: '#d4a843' },
                }}
              />
            </Box>

            <Button
              variant="contained"
              size="large"
              fullWidth
              disabled={busy != null}
              onClick={handleCreate}
              sx={{
                py: 1.5,
                fontFamily: '"Georgia", serif',
                fontSize: 16,
                fontWeight: 700,
                letterSpacing: 2,
                borderRadius: 2,
              }}
            >
              {busy === 'create' ? 'Creating…' : 'Create Room'}
            </Button>

            <Divider sx={{ borderColor: 'rgba(212,168,67,0.2)' }}>
              <Typography variant="caption" sx={{ color: '#a8b8ae', fontStyle: 'italic' }}>or join</Typography>
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
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />
              <Button
                variant="outlined"
                size="large"
                disabled={busy != null || code.length !== 4}
                onClick={handleJoin}
                sx={{ px: 3, fontFamily: '"Georgia", serif', fontWeight: 700, borderRadius: 2 }}
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

      {/* Bottom gold line */}
      <Box sx={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 3, background: 'linear-gradient(90deg, transparent, #d4a843, transparent)' }} />
    </Box>
  );
}
