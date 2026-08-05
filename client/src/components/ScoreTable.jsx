import { Box, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from '@mui/material';

/**
 * Live scoring table above the play area.
 * Shows per-round scores in "tricks/bid" format (e.g. 2/5).
 * During the current round, tricksWon updates live.
 * After each round, the final tricks/bid is shown with color coding.
 * Enlarged for readability.
 */
export default function ScoreTable({ state }) {
  if (!state || state.totalRounds < 1) return null;

  const rounds = Array.from({ length: state.totalRounds }, (_, i) => i);

  return (
    <TableContainer
      component={Paper}
      sx={{
        width: '100%',
        maxWidth: 620,
        mx: 'auto',
        bgcolor: 'rgba(0,0,0,0.35)',
        backdropFilter: 'blur(4px)',
        border: '1px solid rgba(255,255,255,0.06)',
        overflowX: 'auto',
        '&::-webkit-scrollbar': { height: 4 },
        '&::-webkit-scrollbar-thumb': { bgcolor: 'rgba(255,255,255,0.15)', borderRadius: 2 },
      }}
    >
      <Table sx={{ '& .MuiTableCell-root': { py: 1, px: 1.5, fontSize: 14 } }}>
        <TableHead>
          <TableRow>
            <TableCell sx={{ fontWeight: 800, fontFamily: '"Georgia", serif', fontSize: 15, width: 120 }}>
              Player
            </TableCell>
            {rounds.map((i) => {
              const isActive = i + 1 === state.round && state.phase !== 'lobby' && state.phase !== 'gameOver';
              const isDone = i + 1 < state.round || state.phase === 'gameOver';
              return (
                <TableCell
                  key={i}
                  align="center"
                  sx={{
                    fontWeight: 700,
                    fontFamily: '"Georgia", serif',
                    fontSize: 15,
                    borderBottom: isActive ? '2px solid' : 'none',
                    borderColor: 'primary.main',
                  }}
                >
                  <Box
                    sx={{
                      display: 'inline-block',
                      px: 1,
                      py: 0.25,
                      borderRadius: 1,
                      bgcolor: isActive ? 'primary.main' : isDone ? 'rgba(255,255,255,0.08)' : 'transparent',
                      color: isActive ? 'common.black' : 'text.secondary',
                    }}
                  >
                    R{i + 1}
                  </Box>
                </TableCell>
              );
            })}
            <TableCell
              align="center"
              sx={{
                fontWeight: 800,
                fontFamily: '"Georgia", serif',
                fontSize: 15,
                borderLeft: '2px solid rgba(255,255,255,0.12)',
              }}
            >
              Total
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {state.players.map((p) => (
            <TableRow key={p.seat}>
              <TableCell sx={{ fontWeight: 700, whiteSpace: 'nowrap', fontSize: 14 }}>
                {p.name}
                {p.isBot && ' 🤖'}
                {p.isSelf && (
                  <Typography component="span" variant="caption" color="primary" sx={{ ml: 0.5, fontWeight: 600 }}>
                    (you)
                  </Typography>
                )}
              </TableCell>
              {rounds.map((i) => {
                const hist = p.roundHistory[i];
                const isCurrentRound = i + 1 === state.round && state.phase !== 'lobby' && state.phase !== 'gameOver';

                // Live data for the current round
                if (isCurrentRound) {
                  const tricks = p.tricksWon ?? 0;
                  const bid = p.bid;
                  const overBid = bid != null && tricks > bid;
                  return (
                    <TableCell key={i} align="center">
                      <Typography
                        variant="body1"
                        sx={{
                          fontWeight: 700,
                          fontFamily: '"Georgia", serif',
                          fontSize: 16,
                          color: overBid ? 'success.main' : bid != null && tricks >= bid ? 'success.main' : 'text.primary',
                        }}
                      >
                        {tricks}/{bid ?? '—'}
                      </Typography>
                    </TableCell>
                  );
                }

                // Completed round
                if (hist) {
                  const overBid = hist.tricks > hist.bid;
                  return (
                    <TableCell key={i} align="center">
                      <Typography
                        variant="body1"
                        sx={{
                          fontWeight: 700,
                          fontFamily: '"Georgia", serif',
                          fontSize: 16,
                          color: overBid
                            ? 'success.main'
                            : hist.tricks >= hist.bid
                              ? 'success.main'
                              : 'error.main',
                        }}
                      >
                        {hist.tricks}/{hist.bid}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', lineHeight: 1 }}>
                        {hist.score > 0 ? '+' : ''}{hist.score}
                      </Typography>
                    </TableCell>
                  );
                }

                // Future round
                return (
                  <TableCell key={i} align="center">
                    <Typography variant="body2" color="text.disabled">—</Typography>
                  </TableCell>
                );
              })}
              <TableCell
                align="center"
                sx={{
                  fontWeight: 800,
                  fontFamily: '"Georgia", serif',
                  fontSize: 18,
                  borderLeft: '2px solid rgba(255,255,255,0.12)',
                  color: p.score > 0 ? 'success.main' : p.score < 0 ? 'error.main' : 'text.primary',
                }}
              >
                {p.score > 0 ? '+' : ''}{p.score}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
