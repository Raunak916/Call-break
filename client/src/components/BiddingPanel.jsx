import { useState } from 'react';
import { Box, Button, Chip, Stack, Typography, useMediaQuery, useTheme } from '@mui/material';
import { useGame } from '../GameContext.jsx';
import { playBid } from '../lib/sounds.js';

/**
 * Bid input. Responsive: right side on desktop, bottom on mobile.
 */
export default function BiddingPanel({ state }) {
  const { bid } = useGame();
  const [value, setValue] = useState(3);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  if (state?.phase !== 'bidding') return null;

  const myTurn = state.bidding.currentSeat === state.you;
  const bids = state.bidding.bids;

  return (
    <Box
      sx={{
        position: 'absolute',
        ...(isMobile
          ? { bottom: 0, left: 0, right: 0, transform: 'none' }
          : { top: '50%', right: 16, transform: 'translateY(-50%)' }),
        zIndex: 20,
        bgcolor: 'background.paper',
        borderRadius: isMobile ? '12px 12px 0 0' : 2,
        border: '1px solid',
        borderColor: myTurn ? 'primary.main' : 'divider',
        px: { xs: 2, sm: 3 },
        py: { xs: 1.5, sm: 2 },
        minWidth: isMobile ? 'auto' : 220,
        maxWidth: isMobile ? '100%' : 'none',
        boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
        opacity: myTurn ? 1 : 0.7,
        transition: 'all 0.3s ease',
      }}
    >
      <Typography variant="subtitle2" sx={{ mb: 1, textAlign: 'center' }}>
        {myTurn ? 'Your bid' : `${state.players[state.bidding.currentSeat]?.name} is bidding…`}
      </Typography>

      <Stack direction="row" spacing={0.5} sx={{ mb: 1.5, flexWrap: 'wrap', gap: 0.5, justifyContent: 'center' }}>
        {bids.map((b, i) => (
          <Chip
            key={i}
            label={`${state.players[i]?.name?.slice(0, 4)}: ${b != null ? b : '…'}`}
            size="small"
            variant={i === state.bidding.currentSeat ? 'filled' : 'outlined'}
            color={b != null ? (i === state.you ? 'primary' : 'default') : 'default'}
          />
        ))}
      </Stack>

      {myTurn && (
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
