import { Box, Button, Dialog, DialogContent, DialogTitle, Stack, Typography } from '@mui/material';
import { useGame } from '../GameContext.jsx';

function ScoreRow({ player, showRound }) {
  return (
    <Stack
      direction="row"
      spacing={1}
      sx={{ py: 0.75, borderBottom: '1px solid', borderColor: 'divider', alignItems: 'center' }}
    >
      <Typography sx={{ flex: 1, fontWeight: 600 }}>
        {player.name}
        {player.isBot && ' 🤖'}
      </Typography>
      {showRound && (
        <>
          <Typography variant="body2" color="text.secondary" sx={{ width: 50, textAlign: 'center' }}>
            bid {player.bid ?? '—'}
          </Typography>
          <Typography variant="body2" sx={{ width: 50, textAlign: 'center' }}>
            {player.tricks} tricks
          </Typography>
        </>
      )}
      <Typography variant="body2" sx={{ width: 40, textAlign: 'right', fontWeight: 700 }}>
        {player.score}
      </Typography>
    </Stack>
  );
}

/**
 * Modal scoreboard shown at roundEnd (round results) and gameOver
 * (final standings + rematch for host).
 */
export default function Scoreboard({ state }) {
  const { isHost, nextRound, rematch } = useGame();

  if (!state) return null;

  const isOpen = state.phase === 'roundEnd' || state.phase === 'gameOver';
  if (!isOpen) return null;

  const isFinal = state.phase === 'gameOver';
  const round = state.roundScores;

  // Build rows from standings or from current players with round scores.
  const rows = isFinal
    ? state.standings
    : state.players.map((p, i) => ({
        name: p.name,
        isBot: p.isBot,
        bid: p.bid,
        tricks: p.tricksWon,
        score: p.score,
      }));

  return (
    <Dialog open={isOpen} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ textAlign: 'center' }}>
        {isFinal ? 'Game Over' : `Round ${state.round} Complete`}
      </DialogTitle>
      <DialogContent>
        <Stack spacing={0}>
          {rows.map((r, i) => (
            <ScoreRow key={r.seat ?? i} player={r} showRound={!isFinal} />
          ))}
        </Stack>

        <Stack direction="row" spacing={1} sx={{ mt: 3, justifyContent: 'center' }}>
          {isFinal && isHost && (
            <Button variant="contained" onClick={rematch}>
              Rematch
            </Button>
          )}
          {!isFinal && isHost && (
            <Button variant="contained" onClick={nextRound}>
              Next round
            </Button>
          )}
          {!isFinal && !isHost && (
            <Typography color="text.secondary">
              Waiting for host to start the next round…
            </Typography>
          )}
        </Stack>
      </DialogContent>
    </Dialog>
  );
}
