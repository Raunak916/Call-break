import { useState } from 'react';
import { Box, Button, Chip, Stack, Typography, useMediaQuery, useTheme } from '@mui/material';
import { useGame } from '../GameContext.jsx';
import { playBid } from '../lib/sounds.js';
import TurnTimer from './TurnTimer.jsx';

/**
 * Bid input. Responsive: right side on desktop, bottom on mobile.
 * Bidding is simultaneous — every player shares one 15s window and can bid
 * any time. The panel shows the shared countdown and, for the viewer, the
 * bid controls until they've placed a bid.
 */
export default function BiddingPanel({ state }) {
  const { bid } = useGame();
  const [value, setValue] = useState(3);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  if (state?.phase !== 'bidding') return null;

  const canBid = state.players[state.you]?.bid == null;
  const bids = state.bidding.bids;

  return (
    <Box
      sx={{
        position: 'absolute',
        ...(isMobile
          ? { bottom: 0, left: 0, right: 0, transform: 'none' }
          : { top: '50%', right: 16, transform: 'translateY(-50%)' }),
        zIndex: 20,
        bgcolor: 'rgba(16,23,19,0.85)',
        backdropFilter: 'blur(18px)',
        borderRadius: isMobile ? '10px 10px 0 0' : 10,
        border: '1px solid',
        borderColor: canBid ? 'rgba(230,178,60,0.55)' : 'divider',
        px: { xs: 2, sm: 2.5, md: 3 },
        py: { xs: 1.5, sm: 2 },
        minWidth: isMobile ? 'auto' : { md: 240, lg: 260 },
        maxWidth: isMobile ? '100%' : 'none',
        boxShadow: canBid
          ? '0 18px 60px rgba(0,0,0,0.55), 0 0 0 1px rgba(230,178,60,0.14), 0 0 40px rgba(230,178,60,0.08)'
          : '0 18px 60px rgba(0,0,0,0.55)',
        opacity: canBid ? 1 : 0.75,
        transition: 'all 0.3s ease',
      }}
    >
      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1, justifyContent: 'center' }}>
        <Typography variant="subtitle2">
          {canBid ? 'Place your bid' : 'Waiting for others…'}
        </Typography>
        <TurnTimer durationMs={15000} />
      </Stack>

      <Stack direction="row" spacing={0.5} sx={{ mb: 1.5, flexWrap: 'wrap', gap: 0.5, justifyContent: 'center' }}>
        {bids.map((b, i) => (
          <Chip
            key={i}
            label={`${state.players[i]?.name?.slice(0, 4)}: ${b != null ? b : '…'}`}
            size="small"
            variant={b != null ? 'filled' : 'outlined'}
            color={b != null && i === state.you ? 'primary' : 'default'}
          />
        ))}
      </Stack>

      {canBid && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, maxWidth: 300, mx: 'auto' }}>
          <Typography variant="h5" sx={{ fontWeight: 700, minWidth: 40, textAlign: 'center' }}>{value}</Typography>
          <input type="range" min={0} max={13} value={value} onChange={(e) => setValue(Number(e.target.value))} style={{ flex: 1 }} />
          <Button variant="contained" onClick={() => { playBid(); bid(value); }} sx={{ whiteSpace: 'nowrap', px: { xs: 2, sm: 3 } }}>
            Bid {value}
          </Button>
        </Box>
      )}
    </Box>
  );
}
