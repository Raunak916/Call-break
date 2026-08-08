import { Box, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from '@mui/material';

const TABULAR = { fontVariantNumeric: 'tabular-nums' };

/**
 * Live scoring table above the play area.
 * Clean, minimal: plain row/column layout, color-coded scores,
 * no pill backgrounds or decorative elements.
 */
export default function ScoreTable({ state }) {
  if (!state || state.totalRounds < 1) return null;

  const rounds = Array.from({ length: state.totalRounds }, (_, i) => i);
  const inPlay = state.phase !== 'lobby' && state.phase !== 'gameOver';

  return (
    <TableContainer
      component={Paper}
      sx={{
        width: '100%',
        maxWidth: { xs: '100%', sm: 520, md: 600, lg: 680, xl: 760 },
        mx: 'auto',
        my: { xs: 0.5, sm: 1, md: 1.5 },
        bgcolor: 'rgba(14,19,16,0.55)',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: 6,
        overflow: 'hidden',
        boxShadow: '0 8px 30px rgba(0,0,0,0.4)',
        overflowX: 'auto',
        '&::-webkit-scrollbar': { height: 4 },
        '&::-webkit-scrollbar-thumb': { bgcolor: 'rgba(255,255,255,0.12)', borderRadius: 2 },
      }}
    >
      <Table sx={{ borderCollapse: 'separate', borderSpacing: 0 }}>
        <TableHead>
          <TableRow sx={{ '& th': { borderBottom: '1px solid rgba(255,255,255,0.08)' } }}>
            <TableCell sx={{ width: { xs: 100, sm: 120, md: 130 }, py: { xs: 1, sm: 1.25 } }}>
              <Typography sx={{ fontSize: { xs: 9, sm: 10 }, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'text.secondary' }}>
                Player
              </Typography>
            </TableCell>
            {rounds.map((i) => {
              const active = i + 1 === state.round && inPlay;
              const done = i + 1 < state.round || state.phase === 'gameOver';
              return (
                <TableCell key={i} align="center" sx={{ py: { xs: 1, sm: 1.25 }, minWidth: { xs: 40, sm: 48, md: 52 } }}>
                  <Typography
                    sx={{
                      ...TABULAR,
                      fontSize: { xs: 10, sm: 11 },
                      fontWeight: 700,
                      letterSpacing: '0.04em',
                      color: active ? 'primary.main' : done ? 'text.secondary' : 'text.disabled',
                      borderBottom: active ? '2px solid' : 'none',
                      borderColor: 'primary.main',
                      pb: 1.05,
                    }}
                  >
                    R{i + 1}
                  </Typography>
                </TableCell>
              );
            })}
            <TableCell align="center" sx={{ borderLeft: '1px solid rgba(255,255,255,0.1)', py: 1.25, minWidth: 56 }}>
              <Typography sx={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'text.secondary' }}>
                Total
              </Typography>
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {state.players.map((p) => (
            <TableRow
              key={p.seat}
              sx={{
                '& td': { borderBottom: '1px solid rgba(255,255,255,0.05)', py: 0.7 },
                '&:last-child td': { borderBottom: 'none' },
                '&:hover': { bgcolor: 'rgba(255,255,255,0.02)' },
                transition: 'background-color 0.15s ease',
              }}
            >
              <TableCell sx={{ py: { xs: 0.6, sm: 0.85 } }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, whiteSpace: 'nowrap' }}>
                  <Typography sx={{ fontWeight: 600, fontSize: { xs: 12.5, sm: 13.5 } }}>{p.name}</Typography>
                  {p.isSelf && (
                    <Typography sx={{ fontSize: 10, fontWeight: 600, color: 'primary.main' }}>(you)</Typography>
                  )}
                  {p.isBot && !p.isSelf && (
                    <Typography sx={{ fontSize: 9.5, fontWeight: 600, color: 'text.disabled' }}>BOT</Typography>
                  )}
                </Box>
              </TableCell>
              {rounds.map((i) => {
                const isCurrent = i + 1 === state.round && inPlay;
                const hist = p.roundHistory[i];

                if (isCurrent) {
                  const tricks = p.tricksWon ?? 0;
                  const bid = p.bid;
                  const made = bid != null && tricks >= bid;
                  return (
                    <TableCell key={i} align="center" sx={{ py: { xs: 0.6, sm: 0.85 } }}>
                      <Box
                        sx={{
                          px: { xs: 0.75, sm: 1 },
                          py: 0.35,
                          borderRadius: 4,
                          display: 'inline-block',
                          border: '1px solid rgba(230,178,60,0.4)',
                          bgcolor: 'rgba(230,178,60,0.06)',
                        }}
                      >
                        <Typography sx={{ ...TABULAR, fontWeight: 700, fontSize: 14, color: made ? 'success.main' : 'text.primary' }}>
                          {tricks}/{bid ?? '—'}
                        </Typography>
                      </Box>
                    </TableCell>
                  );
                }

                if (hist) {
                  const made = hist.tricks >= hist.bid;
                  return (
                    <TableCell key={i} align="center" sx={{ py: { xs: 0.6, sm: 0.85 } }}>
                      <Typography sx={{ ...TABULAR, fontWeight: 700, fontSize: { xs: 13, sm: 14 }, color: made ? 'success.main' : 'error.main' }}>
                        {hist.tricks}/{hist.bid}
                      </Typography>
                      <Typography sx={{ ...TABULAR, fontSize: 10.5, color: hist.score > 0 ? 'success.main' : 'error.main', lineHeight: 1, mt: 0.25 }}>
                        {hist.score > 0 ? '+' : ''}{hist.score}
                      </Typography>
                    </TableCell>
                  );
                }

                return (
                  <TableCell key={i} align="center" sx={{ py: { xs: 0.6, sm: 0.85 } }}>
                    <Typography sx={{ fontSize: { xs: 12, sm: 13 }, color: 'text.disabled' }}>—</Typography>
                  </TableCell>
                );
              })}
              <TableCell align="center" sx={{ borderLeft: '1px solid rgba(255,255,255,0.1)', py: { xs: 0.6, sm: 0.85 } }}>
                <Typography
                  sx={{
                    ...TABULAR,
                    fontWeight: 800,
                    fontSize: { xs: 13, sm: 15 },
                    color: p.score > 0 ? 'success.main' : p.score < 0 ? 'error.main' : 'text.primary',
                  }}
                >
                  {p.score > 0 ? '+' : ''}{p.score}
                </Typography>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
