import { useEffect, useRef, useState } from 'react';
import { Box, Typography } from '@mui/material';
import { playTick, playTickUrgent } from '../lib/sounds.js';

const SIZE = 56;
const STROKE = 4;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

/**
 * Circular countdown timer. Starts full when mounted, drains over `durationMs`.
 * Pulses red when under 5 seconds. Shows "YOUR TURN" when it's the viewer's.
 */
export default function TurnTimer({ durationMs = 15000, isMine = false }) {
  const [remaining, setRemaining] = useState(durationMs);
  const lastTickRef = useRef(0);

  useEffect(() => {
    const start = Date.now();
    const id = setInterval(() => {
      const left = durationMs - (Date.now() - start);
      if (left <= 0) {
        clearInterval(id);
        setRemaining(0);
      } else {
        setRemaining(left);
        // Play tick sounds in the last 5 seconds
        const secsLeft = Math.ceil(left / 1000);
        if (secsLeft <= 5 && secsLeft !== lastTickRef.current) {
          lastTickRef.current = secsLeft;
          if (secsLeft <= 3) playTickUrgent();
          else playTick();
        }
      }
    }, 100);
    return () => clearInterval(id);
  }, [durationMs]);

  const secs = Math.ceil(remaining / 1000);
  const progress = remaining / durationMs;
  const offset = CIRCUMFERENCE * (1 - progress);
  const low = secs <= 5;
  const color = low ? 'error.main' : isMine ? 'primary.main' : 'text.secondary';

  return (
    <Box sx={{ position: 'relative', width: SIZE, height: SIZE }}>
      <svg
        width={SIZE}
        height={SIZE}
        style={{ transform: 'rotate(-90deg)' }}
      >
        {/* Track */}
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          fill="none"
          stroke="rgba(255,255,255,0.1)"
          strokeWidth={STROKE}
        />
        {/* Progress arc */}
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          fill="none"
          stroke={color}
          strokeWidth={STROKE}
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{
            transition: 'stroke-dashoffset .15s linear, stroke .3s',
            filter: isMine && !low ? 'drop-shadow(0 0 5px rgba(230,178,60,0.55))' : 'none',
          }}
        />
      </svg>
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Typography
          variant="body1"
          sx={{
            fontWeight: 700,
            color,
            fontSize: 18,
            lineHeight: 1,
            fontVariantNumeric: 'tabular-nums',
            animation: low ? 'pulse 0.6s ease-in-out infinite' : 'none',
            '@keyframes pulse': {
              '0%, 100%': { opacity: 1 },
              '50%': { opacity: 0.5 },
            },
          }}
        >
          {secs}
        </Typography>
      </Box>
      {isMine && (
        <Typography
          variant="caption"
          sx={{
            position: 'absolute',
            bottom: -18,
            left: '50%',
            transform: 'translateX(-50%)',
            whiteSpace: 'nowrap',
            color: 'primary.main',
            fontWeight: 600,
            fontSize: 10,
          }}
        >
          YOUR TURN
        </Typography>
      )}
    </Box>
  );
}
