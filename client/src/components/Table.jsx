import { useCallback, useEffect, useRef, useState } from 'react';
import { Box, Typography } from '@mui/material';
import CardView from './CardView.jsx';
import { seatLayout } from '../lib/derive.js';
import TurnTimer from './TurnTimer.jsx';
import TrickAnimation from './TrickAnimation.jsx';

const SEAT_EDGE = {
  bottom: { left: '50%', bottom: 0, transform: 'translateX(-50%)' },
  right: { right: 0, top: '50%', transform: 'translateY(-50%)' },
  top: { left: '50%', top: 0, transform: 'translateX(-50%)' },
  left: { left: 0, top: '50%', transform: 'translateY(-50%)' },
};

const CARD_OFFSET = {
  bottom: { x: 0, y: 50 },
  right: { x: 50, y: 0 },
  top: { x: 0, y: -50 },
  left: { x: -50, y: 0 },
};

// Starting position for card fly-in animation (from seat edge toward center)
const START_OFFSETS = {
  bottom: { x: 0, y: 60 },
  right: { x: 60, y: 0 },
  top: { x: 0, y: -60 },
  left: { x: -60, y: 0 },
};

function SeatLabel({ player, position, isTurn, you }) {
  if (!player) return null;
  const style = SEAT_EDGE[position];
  const disconnected = !player.connected && !player.isBot;
  const botDriven = player.botControlled && !player.isBot;
  return (
    <Box sx={{ position: 'absolute', ...style, textAlign: 'center', pointerEvents: 'none', zIndex: 5, m: 1 }}>
      <Box
        sx={{
          px: 1.5, py: 0.5, borderRadius: 999,
          background: isTurn
            ? 'linear-gradient(135deg, #f2c14e, #d9a832)'
            : botDriven
              ? 'rgba(251,191,36,0.16)'
              : 'rgba(8,14,10,0.72)',
          color: isTurn ? '#1c1507' : 'text.secondary',
          transition: 'all .3s',
          border: isTurn
            ? 'none'
            : disconnected
              ? '1px dashed rgba(251,191,36,0.7)'
              : '1px solid rgba(255,255,255,0.08)',
          boxShadow: isTurn ? '0 4px 18px rgba(230,178,60,0.35)' : 'none',
          backdropFilter: 'blur(6px)',
        }}
      >
        <Typography variant="body2" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
          {player.name || '?'}
          {player.isBot && ' 🤖'}
          {botDriven && ' 💤'}
          {player.seat === you && ' (you)'}
        </Typography>
      </Box>
    </Box>
  );
}

function TrickCard({ card, position }) {
  if (!card) return null;
  const off = CARD_OFFSET[position];
  // Fly-in: start from seat edge, animate to center
  const start = START_OFFSETS[position] || { x: 0, y: 80 };
  return (
    <Box
      sx={{
        position: 'absolute',
        left: `calc(50% + ${off.x}px)`,
        top: `calc(50% + ${off.y}px)`,
        transform: 'translate(-50%,-50%)',
        zIndex: 3,
        animation: 'cardFlyIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
        '--fly-x': `${start.x}px`,
        '@keyframes cardFlyIn': {
          from: { opacity: 0, transform: 'translate(calc(-50% + var(--fly-x)), -50%) scale(0.5)' },
          to: { opacity: 1, transform: 'translate(-50%, -50%) scale(1)' },
        },
      }}
    >
      <CardView card={card} />
    </Box>
  );
}

export default function Table({ state }) {
  const trickCards = state?.play?.trickCards ?? [];
  const layout = seatLayout(state);
  const you = state?.you;

  const posMap = {};
  for (const { seat, label } of layout) posMap[seat] = label;

  // Only 'playing' has a current seat; bidding is simultaneous (its shared
  // countdown lives in the BiddingPanel).
  const currentSeat =
    state?.phase === 'playing' ? state?.play?.currentPlayerSeat : null;

  // --- Trick resolution animation ---
  const [animData, setAnimData] = useState(null);
  const [gapActive, setGapActive] = useState(false);
  const lastTrickKeyRef = useRef(null);

  useEffect(() => {
    const lastTrick = state?.play?.lastTrick;
    if (!lastTrick?.cards?.length) return;

    // Unique key for this trick
    const key = `${lastTrick.winnerSeat}:${lastTrick.cards.length}:${lastTrick.cards[0]?.card?.s}${lastTrick.cards[0]?.card?.r}`;

    if (key !== lastTrickKeyRef.current) {
      lastTrickKeyRef.current = key;
      setGapActive(true); // hide incoming trick cards during animation
      setAnimData(lastTrick);
    }
  }, [state?.play?.lastTrick]);

  const clearAnim = useCallback(() => {
    setAnimData(null);
    setGapActive(false);
  }, []);

  // During the animation+hold gap, hide the live trick cards so they
  // don't overlap with the animated ones.
  const visibleCards = gapActive ? [] : trickCards;

  return (
    <Box
      sx={{
        position: 'relative',
        width: { xs: '92vw', sm: '80vw', md: 520, lg: 560, xl: 600 },
        height: { xs: '50vw', sm: '45vw', md: 320, lg: 350, xl: 380 },
        maxWidth: { xs: '100%', sm: 520, md: 560, lg: 600, xl: 640 },
        borderRadius: 16,
        border: '2px solid rgba(230,178,60,0.45)',
        mx: 'auto',
        background: `
          radial-gradient(ellipse at 50% 28%, rgba(40,96,62,0.5) 0%, transparent 58%),
          radial-gradient(ellipse at 50% 85%, rgba(18,48,33,0.65) 0%, transparent 65%),
          linear-gradient(180deg, #133321 0%, #0d2318 50%, #0a1c13 100%)
        `,
        boxShadow:
          '0 0 0 5px rgba(62,42,20,0.85), 0 0 0 8px rgba(0,0,0,0.32), ' +
          'inset 0 0 46px rgba(0,0,0,0.6), inset 0 0 0 1px rgba(255,255,255,0.05), ' +
          '0 16px 50px rgba(0,0,0,0.55)',
      }}
    >
      {layout.map(({ seat, label }) => {
        const p = state?.players?.[seat];
        const isTurn = currentSeat === seat;
        return <SeatLabel key={seat} player={p} position={label} isTurn={isTurn} you={you} />;
      })}

      {/* Live trick cards (hidden during animation gap) */}
      {visibleCards.map(({ seat, card }) => (
        <TrickCard key={seat} card={card} position={posMap[seat] || 'bottom'} />
      ))}

      {/* Trick resolution animation */}
      {animData && (
        <TrickAnimation lastTrick={animData} positionMap={posMap} onDone={clearAnim} />
      )}

      {/* Timer */}
      {currentSeat != null && (
        <Box sx={{ position: 'absolute', top: 8, right: 8, zIndex: 4 }}>
          <TurnTimer key={`timer-${state.version}`} durationMs={15000} isMine={currentSeat === you} />
        </Box>
      )}

      {state?.phase === 'playing' && (
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ position: 'absolute', bottom: 6, left: '50%', transform: 'translateX(-50%)' }}
        >
          Trick {state.play.trickNumber}/13
        </Typography>
      )}
    </Box>
  );
}
