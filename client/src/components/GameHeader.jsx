import { Box, Button, Chip, Stack, Typography } from '@mui/material';
import { useGame } from '../GameContext.jsx';
import { SUIT_SYMBOL, SUIT_LABEL } from '../lib/cardUtils.js';

const TABULAR = { fontVariantNumeric: 'tabular-nums' };

/**
 * Top info bar during gameplay: room code, round/trick progress, trump badge,
 * my score, and a leave button.
 */
export default function GameHeader({ state }) {
  const { leaveRoom } = useGame();
  const me = state?.players?.[state.you];

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: { xs: 0.5, sm: 0.75, md: 1 },
        px: { xs: 1.5, sm: 2, md: 2.5, lg: 3 },
        py: { xs: 0.75, sm: 1, md: 1.25 },
        borderBottom: '1px solid',
        borderColor: 'divider',
        bgcolor: 'rgba(13,19,15,0.85)',
        backdropFilter: 'blur(12px)',
      }}
    >
      {/* Room code badge */}
      <Box
        sx={{
          px: 1.5,
          py: 0.5,
          borderRadius: 999,
          background: 'linear-gradient(135deg, #f2c14e, #d9a832)',
          color: '#1c1507',
          fontSize: 14,
          fontWeight: 800,
          letterSpacing: 3,
          fontFamily: '"Sora", "Inter", sans-serif',
          boxShadow: '0 2px 12px rgba(230,178,60,0.3)',
        }}
      >
        {state.roomCode}
      </Box>

      <Chip
        label={`${SUIT_SYMBOL.S} ${SUIT_LABEL.S} trump`}
        size="small"
        variant="outlined"
      />

      {state.phase !== 'lobby' && (
        <Chip label={`Round ${state.round}/${state.totalRounds}`} size="small" />
      )}

      {state.phase === 'playing' && state.play && (
        <Chip label={`Trick ${state.play.trickNumber}/13`} size="small" variant="outlined" />
      )}

      <Box sx={{ flex: 1 }} />

      {me && (
        <Typography sx={{ ...TABULAR, fontSize: 13, fontWeight: 600, color: 'text.secondary' }}>
          Score <Box component="span" sx={{ color: 'primary.main', fontWeight: 700, fontSize: 15 }}>{me.score}</Box>
        </Typography>
      )}

      {me && (
        <Typography sx={{ ...TABULAR, fontSize: 13, fontWeight: 600, color: 'text.secondary' }}>
          Tricks <Box component="span" sx={{ color: 'text.primary', fontWeight: 700, fontSize: 15 }}>{me.tricksWon}</Box>
        </Typography>
      )}

      <Button size="small" color="inherit" onClick={leaveRoom} sx={{ ml: 0.5 }}>
        Leave
      </Button>
    </Box>
  );
}
