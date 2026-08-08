import { Box, Button, Dialog, DialogContent, DialogTitle, Stack, Typography } from '@mui/material';
import { useGame } from '../GameContext.jsx';

const TABULAR = { fontVariantNumeric: 'tabular-nums' };

function ScoreRow({ player, showRound }) {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1.5,
        py: 1.25,
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        '&:last-child': { borderBottom: 'none' },
      }}
    >
      <Typography sx={{ flex: 1, fontWeight: 600, fontSize: 14.5 }}>
        {player.name}
        {player.isBot && (
          <Typography component="span" sx={{ ml: 0.75, fontSize: 10, fontWeight: 600, color: 'text.disabled' }}>
            BOT
          </Typography>
        )}
      </Typography>
      {showRound && (
        <Box sx={{ display: 'flex', gap: 1.5 }}>
          <Typography sx={{ ...TABULAR, fontSize: 13, color: 'text.secondary' }}>
            bid {player.bid ?? '—'}
          </Typography>
          <Typography sx={{ ...TABULAR, fontSize: 13 }}>
            {player.tricks} tricks
          </Typography>
        </Box>
      )}
      <Typography sx={{ ...TABULAR, minWidth: 40, textAlign: 'right', fontWeight: 700, fontSize: 16, color: player.score > 0 ? 'success.main' : player.score < 0 ? 'error.main' : 'text.primary' }}>
        {player.score > 0 ? '+' : ''}{player.score}
      </Typography>
    </Box>
  );
}

export default function Scoreboard({ state }) {
  const { isHost, nextRound, rematch } = useGame();

  if (!state) return null;

  const isOpen = state.phase === 'roundEnd' || state.phase === 'gameOver';
  if (!isOpen) return null;

  const isFinal = state.phase === 'gameOver';

  const rows = isFinal
    ? state.standings
    : state.players.map((p) => ({
        name: p.name,
        isBot: p.isBot,
        bid: p.bid,
        tricks: p.tricksWon,
        score: p.score,
      }));

  return (
    <Dialog open={isOpen} maxWidth="xs" fullWidth PaperProps={{ sx: { mx: { xs: 1, sm: 2 } } }}>
      <DialogTitle sx={{ textAlign: 'center', pt: 3, pb: 1 }}>
        <Typography variant="h5" sx={{ fontFamily: '"Sora", "Inter", sans-serif', fontWeight: 700, color: 'primary.main' }}>
          {isFinal ? 'Game Over' : `Round ${state.round}`}
        </Typography>
        <Typography variant="overline" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
          {isFinal ? 'Final standings' : 'Results'}
        </Typography>
      </DialogTitle>
      <DialogContent sx={{ px: 3, pb: 3 }}>
        {rows.map((r, i) => (
          <ScoreRow key={r.seat ?? i} player={r} showRound={!isFinal} />
        ))}
        <Stack direction="row" spacing={1} sx={{ mt: 3, justifyContent: 'center' }}>
          {isFinal && isHost && (
            <Button variant="contained" onClick={rematch}>Rematch</Button>
          )}
          {!isFinal && isHost && (
            <Button variant="contained" onClick={nextRound}>Next round</Button>
          )}
          {!isFinal && !isHost && (
            <Typography color="text.secondary">Waiting for host…</Typography>
          )}
        </Stack>
      </DialogContent>
    </Dialog>
  );
}
