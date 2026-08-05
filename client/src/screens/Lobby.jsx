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

function SeatCard({ player, hostSeat, you }) {
  const empty = !player.name;
  return (
    <Card
      variant="outlined"
      sx={{
        p: 2,
        minHeight: 110,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 0.5,
        opacity: empty ? 0.55 : 1,
        borderColor: player.isSelf ? 'primary.main' : 'divider',
      }}
    >
      <Stack direction="row" spacing={0.5} alignItems="center">
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          {empty ? '—' : player.name}
        </Typography>
        {hostSeat === player.seat && <Chip label="Host" size="small" color="primary" variant="outlined" />}
      </Stack>

      {empty ? (
        <Typography variant="body2" color="text.secondary">
          Empty seat
        </Typography>
      ) : (
        <>
          <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" justifyContent="center">
            {player.isSelf && <Chip label="You" size="small" color="secondary" />}
            {player.isBot && <Chip label="Bot" size="small" variant="outlined" />}
            {!player.isBot && !player.connected && <Chip label="Disconnected" size="small" color="warning" variant="outlined" />}
            {player.ready && !player.isBot && <Chip label="Ready ✓" size="small" color="success" variant="outlined" />}
          </Stack>
          {player.isBot && (
            <Typography variant="caption" color="text.secondary">
              AI fills this seat
            </Typography>
          )}
        </>
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
    } catch {
      /* clipboard unavailable (non-secure context) */
    }
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/room/${state.roomCode}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* ignore */
    }
  };

  const handleLeave = async () => {
    await leaveRoom();
    navigate('/');
  };

  return (
    <Box sx={{ maxWidth: 720, mx: 'auto', p: 2, mt: 2 }}>
      <Card>
        <CardContent sx={{ p: 3 }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems="center" spacing={2}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="overline" color="text.secondary">
                Share this code
              </Typography>
              <Typography variant="h3" sx={{ letterSpacing: 6, fontWeight: 700 }}>
                {state.roomCode}
              </Typography>
            </Box>

            <Stack direction="row" spacing={1}>
              <Tooltip title={copied ? 'Copied!' : 'Copy code'}>
                <IconButton onClick={copyCode}>
                  <ContentCopyIcon />
                </IconButton>
              </Tooltip>
              <Button variant="outlined" onClick={copyLink}>
                {copied ? 'Copied!' : 'Copy invite link'}
              </Button>
            </Stack>
          </Stack>

          <Typography color="text.secondary" sx={{ mt: 2, textAlign: 'center' }}>
            {humans.length} of 4 players · {ROUNDS_LABEL[state.totalRounds] || `${state.totalRounds} rounds`} ·{' '}
            {SUIT_LABEL.S} trump
          </Typography>

          <Grid container spacing={1.5} sx={{ mt: 1 }}>
            {state.players.map((p) => (
              <Grid key={p.seat} size={{ xs: 6, sm: 3 }}>
                <SeatCard player={p} hostSeat={state.hostSeat} />
              </Grid>
            ))}
          </Grid>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ mt: 3 }} justifyContent="center">
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
            <Alert severity="info" sx={{ mt: 2 }}>
              Waiting for everyone to be ready before starting.
            </Alert>
          )}
          {!isHost && humans.length >= 1 && (
            <Alert severity="info" sx={{ mt: 2 }}>
              {humans.find((p) => p.seat === state.hostSeat)?.name} can start the game once everyone is ready.
            </Alert>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}
