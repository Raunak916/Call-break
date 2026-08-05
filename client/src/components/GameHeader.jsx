import { Box, Button, Chip, Stack, Typography } from '@mui/material';
import { useGame } from '../GameContext.jsx';
import { SUIT_SYMBOL, SUIT_LABEL } from '../lib/cardUtils.js';

/**
 * Top info bar during gameplay: room code, round/trick progress, trump badge,
 * my score, and a leave button.
 */
export default function GameHeader({ state }) {
  const { leaveRoom } = useGame();
  const me = state?.players?.[state.you];

  return (
    <Stack
      direction="row"
      alignItems="center"
      spacing={1}
      sx={{
        px: { xs: 1, sm: 2 },
        py: { xs: 0.5, sm: 1 },
        borderBottom: '1px solid',
        borderColor: 'divider',
        bgcolor: 'background.paper',
        flexWrap: 'wrap',
        gap: 0.5,
      }}
    >
      <Typography variant="h6" sx={{ fontWeight: 700, letterSpacing: 2 }}>
        {state.roomCode}
      </Typography>

      <Chip
        label={`${SUIT_SYMBOL.S} ${SUIT_LABEL.S} trump`}
        size="small"
        variant="outlined"
        sx={{ ml: 0.5 }}
      />

      {state.phase !== 'lobby' && (
        <Chip label={`R${state.round}/${state.totalRounds}`} size="small" />
      )}

      {state.phase === 'playing' && state.play && (
        <Chip label={`Trick ${state.play.trickNumber}/13`} size="small" variant="outlined" />
      )}

      <Box sx={{ flex: 1 }} />

      {me && (
        <Chip label={`Score: ${me.score}`} size="small" color="primary" variant="outlined" />
      )}

      {me && (
        <Chip label={`Tricks: ${me.tricksWon}`} size="small" />
      )}

      <Button size="small" color="inherit" onClick={leaveRoom} sx={{ ml: 1 }}>
        Leave
      </Button>
    </Stack>
  );
}
