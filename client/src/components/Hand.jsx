import { Box, useMediaQuery, useTheme } from '@mui/material';
import CardView from './CardView.jsx';
import { sortHand } from '../lib/cardUtils.js';
import { playCard } from '../lib/sounds.js';

/**
 * The viewer's hand. On desktop: single overlapping row.
 * On mobile: wraps into 2 rows so all 13 cards are visible.
 */
export default function Hand({ cards, legalSet, myTurn, onPlay }) {
  const sorted = sortHand(cards);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        flexWrap: isMobile ? 'wrap' : 'nowrap',
        gap: isMobile ? '2px' : 0,
        px: 1,
        pb: 1,
        pt: 0.5,
        overflowX: isMobile ? 'visible' : 'auto',
        minHeight: isMobile ? 200 : 140,
        maxWidth: isMobile ? '100%' : 'none',
        transition: 'all 0.3s ease',
      }}
    >
      {sorted.map((c) => {
        const key = `${c.s}${c.r}`;
        const legal = !legalSet || legalSet.has(key);
        return (
          <CardView
            key={key}
            card={c}
            mini={isMobile}
            onClick={myTurn && legal ? () => { playCard(); onPlay(c); } : undefined}
            sx={{
              ml: isMobile ? 0 : { sm: -1 },
              mr: 0,
              '&:hover': myTurn && legal
                ? { transform: 'translateY(-14px) scale(1.05)', boxShadow: '0 8px 16px rgba(0,0,0,.55)', zIndex: 10 }
                : undefined,
              transform: !legal ? 'translateY(2px)' : undefined,
              opacity: !legal && myTurn ? 0.35 : 1,
              zIndex: 1,
              '&:hover + &': myTurn && legal ? { ml: 0.5 } : undefined,
              transition: 'all 0.2s ease',
            }}
          />
        );
      })}
    </Box>
  );
}
