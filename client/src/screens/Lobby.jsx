import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Grid,
  IconButton,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { useGame } from '../GameContext.jsx';
import { SUIT_LABEL } from '../lib/cardUtils.js';

const ROUNDS_LABEL = { 1: '1 round', 3: '3 rounds', 5: '5 rounds' };

function SeatCard({ player, hostSeat }) {
  const empty = !player.name;
  return (
    <Card
      variant="outlined"
      sx={{
        p: 2,
        minHeight: 100,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 0.5,
        borderRadius: 6,
        bgcolor: 'rgba(255,255,255,0.02)',
        opacity: empty ? 0.5 : 1,
        borderColor: player.isSelf ? 'primary.main' : 'divider',
      }}
    >
      <Typography sx={{ fontWeight: 600, fontSize: 15, textAlign: 'center' }}>
        {empty ? 'Empty seat' : player.name}
      </Typography>

      {!empty && (
        <Stack direction="row" spacing={0.5} alignItems="center" flexWrap="wrap" justifyContent="center">
          {player.isSelf && (
            <Chip label="You" size="small" sx={{ height: 18, '& .MuiChip-label': { px: 0.8, fontSize: 10 } }} color="primary" />
          )}
          {player.isBot && (
            <Chip label="Bot" size="small" variant="outlined" sx={{ height: 18, '& .MuiChip-label': { px: 0.8, fontSize: 10 } }} />
          )}
          {hostSeat === player.seat && (
            <Chip label="Host" size="small" variant="outlined" sx={{ height: 18, '& .MuiChip-label': { px: 0.8, fontSize: 10 } }} />
          )}
          {player.ready && !player.isBot && (
            <Chip label="Ready" size="small" color="success" variant="outlined" sx={{ height: 18, '& .MuiChip-label': { px: 0.8, fontSize: 10 } }} />
          )}
        </Stack>
      )}
    </Card>
  );
}

export default function Lobby() {
  const { state, me, isHost, ready, startGame, leaveRoom } = useGame();
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);

  const humans = state.players.filter((p) => !p.isBot);
  const canStart =
    humans.length >= 1 && !(humans.length >= 2 && humans.some((p) => p.connected && !p.ready));

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(state.roomCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch { /* */ }
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/room/${state.roomCode}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch { /* */ }
  };

  const handleLeave = async () => {
    await leaveRoom();
    navigate('/');
  };

  return (
    <Box sx={{ maxWidth: { xs: '100%', sm: 600, md: 680, lg: 760 }, mx: 'auto', p: { xs: 2, sm: 3, md: 4 }, mt: { xs: 1, sm: 2, md: 3 } }}>
      <Card
        sx={{
          borderRadius: 10,
          bgcolor: 'rgba(16,23,19,0.7)',
          backdropFilter: 'blur(14px)',
          border: '1px solid rgba(255,255,255,0.07)',
          boxShadow: '0 16px 50px rgba(0,0,0,0.45)',
        }}
      >
        <CardContent sx={{ p: { xs: 2.5, sm: 3, md: 4 } }}>
          {/* Room code header */}
          <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems="center" spacing={2} sx={{ mb: 4 }}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="overline" color="text.secondary" sx={{ display: 'block', mb: 0.75 }}>
                Share this code
              </Typography>
              <Typography
                variant="h3"
                sx={{
                  letterSpacing: { xs: 5, sm: 7, md: 8 },
                  fontWeight: 700,
                  fontFamily: '"Sora", "Inter", sans-serif',
                  color: 'primary.main',
                  fontSize: { xs: 24, sm: 28, md: 32, lg: 34 },
                }}
              >
                {state.roomCode}
              </Typography>
            </Box>
            <Stack direction="row" spacing={1}>
              <Tooltip title={copied ? 'Copied!' : 'Copy code'}>
                <IconButton onClick={copyCode} sx={{ border: '1px solid rgba(255,255,255,0.1)' }}>
                  <ContentCopyIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Button variant="outlined" onClick={copyLink} size="small">
                {copied ? 'Copied!' : 'Copy invite link'}
              </Button>
            </Stack>
          </Stack>

          <Typography color="text.secondary" sx={{ mb: 3, textAlign: 'center' }}>
            {humans.length} of 4 players · {ROUNDS_LABEL[state.totalRounds]} · {SUIT_LABEL.S} trump
          </Typography>

          <Grid container spacing={1.5} sx={{ mb: 4 }}>
            {state.players.map((p) => (
              <Grid key={p.seat} size={{ xs: 6, sm: 3 }}>
                <SeatCard player={p} hostSeat={state.hostSeat} />
              </Grid>
            ))}
          </Grid>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} justifyContent="center">
            <Button
              variant={me?.ready ? 'contained' : 'outlined'}
              color={me?.ready ? 'success' : 'primary'}
              onClick={() => ready(!me?.ready)}
            >
              {me?.ready ? 'Ready ✓' : 'Ready up'}
            </Button>

            {isHost && (
              <Button variant="contained" disabled={!canStart} onClick={startGame}>
                Start game
              </Button>
            )}

            <Button color="inherit" onClick={handleLeave}>
              Leave room
            </Button>
          </Stack>

          {isHost && !canStart && (
            <Alert severity="info" sx={{ mt: 3 }}>
              Waiting for everyone to be ready before starting.
            </Alert>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}
