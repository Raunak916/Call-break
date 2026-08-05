import { useEffect, useState } from 'react';
import { Box } from '@mui/material';
import CardView from './CardView.jsx';

/**
 * Animated trick resolution:4 cards converge to center, stack,
 * fly to the winner's position and fade out.
 * After the animation, holds for2s before declaring done
 * (so the next trick doesn't overlap).
 *
 * Timing: converge (0–600ms) → stack+fly (600–1200ms) → fade (1200–1500ms)
 * → hold (1500–3500ms) → done.
 */

const START_POS = {
  bottom: { x: 0, y: 50 },
  right: { x: 50, y: 0 },
  top: { x: 0, y: -50 },
  left: { x: -50, y: 0 },
};

const WINNER_OFFSET = {
  bottom: { x: 0, y: 70 },
  right: { x: 70, y: 0 },
  top: { x: 0, y: -70 },
  left: { x: -70, y: 0 },
};

export default function TrickAnimation({ lastTrick, positionMap, onDone }) {
  const [phase, setPhase] = useState('converge');

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('stack'), 600);
    const t2 = setTimeout(() => setPhase('fly'), 1200);
    const t3 = setTimeout(() => setPhase('hold'), 1500);
    const t4 = setTimeout(() => {
      onDone?.();
    }, 3500); // animation (1.5s) + hold (2s)
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); };
  }, [onDone]);

  if (!lastTrick?.cards) return null;

  const winnerPos = positionMap[lastTrick.winnerSeat] || 'bottom';
  const winnerOff = WINNER_OFFSET[winnerPos];

  return (
    <Box
      sx={{
        position: 'absolute',
        inset: 0,
        zIndex: 20,
        pointerEvents: 'none',
      }}
    >
      {lastTrick.cards.map(({ seat, card }, i) => {
        const startPos = START_POS[positionMap[seat]] || START_POS.bottom;
        const stackX = 0;
        const stackY = 0;
        const flyX = winnerOff.x;
        const flyY = winnerOff.y;

        let x, y, opacity, scale;
        if (phase === 'converge') {
          x = startPos.x;
          y = startPos.y;
          opacity = 1;
          scale = 1;
        } else if (phase === 'stack') {
          x = stackX;
          y = stackY;
          opacity = 1;
          scale = 0.6;
        } else {
          // fly + hold
          x = flyX;
          y = flyY;
          opacity = phase === 'hold' ? 0 : 0;
          scale = 0.3;
        }

        return (
          <Box
            key={seat}
            sx={{
              position: 'absolute',
              left: `calc(50% + ${x}px)`,
              top: `calc(50% + ${y}px)`,
              transform: `translate(-50%,-50%) scale(${scale})`,
              opacity,
              transition: 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
              transitionDelay: `${i * 40}ms`,
            }}
          >
            <CardView card={card} mini />
          </Box>
        );
      })}
    </Box>
  );
}
