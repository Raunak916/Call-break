import { useEffect, useRef, useState } from 'react';
import { Box, Typography } from '@mui/material';
import UnoCard from './UnoCard.jsx';

const COLORS = {
  red: { dot: '#ef4444', glow: 'rgba(239,68,68,0.5)', name: 'Red' },
  blue: { dot: '#3b82f6', glow: 'rgba(59,130,246,0.5)', name: 'Blue' },
  green: { dot: '#22c55e', glow: 'rgba(34,197,94,0.5)', name: 'Green' },
  yellow: { dot: '#eab308', glow: 'rgba(234,179,8,0.5)', name: 'Yellow' },
};

export default function UnoTable({ state }) {
  const topCard = state?.topDiscard;
  const drawCount = state?.drawPileCount ?? 0;
  const curColor = state?.currentColor;
  const direction = state?.direction;
  const stack = state?.stack;
  const ci = COLORS[curColor];

  const [flyCard, setFlyCard] = useState(null);
  const [drawFlash, setDrawFlash] = useState(false);
  const [dirAnim, setDirAnim] = useState(false);
  const prevDirRef = useRef(direction);
  const prevTopRef = useRef(null);

  useEffect(() => {
    if (direction !== prevDirRef.current) {
      setDirAnim(true); const t = setTimeout(() => setDirAnim(false), 500);
      prevDirRef.current = direction; return () => clearTimeout(t);
    }
  }, [direction]);

  useEffect(() => {
    if (!topCard) { prevTopRef.current = null; return; }
    if (prevTopRef.current && topCard.id !== prevTopRef.current.id) {
      setFlyCard({ card: topCard, id: Date.now() });
      const t = setTimeout(() => setFlyCard(null), 500);
      return () => clearTimeout(t);
    }
    prevTopRef.current = topCard;
  }, [topCard?.id]);

  useEffect(() => {
    if (state?.lastAction?.type?.startsWith('draw')) {
      setDrawFlash(true);
      const t = setTimeout(() => setDrawFlash(false), 400);
      return () => clearTimeout(t);
    }
  }, [state?.lastAction]);

  return (
    <Box sx={{
      width: '100%', height: '100%', borderRadius: '50%', position: 'relative',
      background: 'radial-gradient(ellipse at 48% 38%, rgba(42,100,60,0.22) 0%, transparent 50%), radial-gradient(ellipse at 55% 65%, rgba(20,60,35,0.28) 0%, transparent 45%), linear-gradient(175deg, #142a1d 0%, #0f1f17 35%, #0c1812 65%, #0a130e 100%)',
      border: '2px solid rgba(180,160,100,0.22)',
      boxShadow: 'inset 0 0 80px rgba(0,0,0,0.5), inset 0 0 0 1px rgba(255,255,255,0.03), 0 0 40px rgba(180,160,100,0.06), 0 24px 60px rgba(0,0,0,0.55)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      {/* Direction arrow */}
      <Box sx={{
        position: 'absolute', top: { xs: 6, sm: 12 }, left: '50%', transform: 'translateX(-50%)',
        fontSize: { xs: 26, sm: 34 }, color: '#e6b23c', textShadow: '0 0 14px rgba(230,178,60,0.35)', zIndex: 2,
        transition: 'transform 0.4s cubic-bezier(0.4,0,0.2,1), opacity 0.3s ease',
        transform: `translateX(-50%) ${dirAnim ? (direction === 1 ? 'rotate(360deg)' : 'rotate(-360deg)') : ''}`,
        opacity: 0.65,
      }}>
        {direction === 1 ? '↻' : '↺'}
      </Box>

      {/* Color indicator */}
      {ci && (
        <Box sx={{
          position: 'absolute', bottom: { xs: 26, sm: 38 }, left: '50%', transform: 'translateX(-50%)',
          display: 'flex', alignItems: 'center', gap: 0.6, zIndex: 2,
          animation: 'colorPop 0.3s cubic-bezier(0.34,1.56,0.64,1)',
          '@keyframes colorPop': { '0%': { transform: 'translateX(-50%) scale(0)', opacity: 0 }, '100%': { transform: 'translateX(-50%) scale(1)', opacity: 1 } },
        }}>
          <Box sx={{ width: 16, height: 16, borderRadius: 999, bgcolor: ci.dot, border: '2px solid rgba(255,255,255,0.3)', boxShadow: `0 0 12px ${ci.glow}, 0 0 24px ${ci.glow}` }} />
          <Typography sx={{ fontSize: 11, fontWeight: 700, color: ci.dot, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{ci.name}</Typography>
        </Box>
      )}

      {/* Piles */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 4, sm: 6, md: 8 }, position: 'relative' }}>
        {/* Draw pile */}
        <Box sx={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.75,
          transition: 'transform 0.3s ease, filter 0.3s ease',
          transform: drawFlash ? 'scale(1.06)' : 'scale(1)',
          filter: drawFlash ? 'brightness(1.35)' : 'brightness(1)',
        }}>
          <Box sx={{ position: 'relative', width: 48, height: 68 }}>
            {drawCount > 4 && <Box sx={{ position: 'absolute', top: -5, left: -3, opacity: 0.18 }}><UnoCard faceUp={false} mini /></Box>}
            {drawCount > 2 && <Box sx={{ position: 'absolute', top: -2, left: -1, opacity: 0.32 }}><UnoCard faceUp={false} mini /></Box>}
            {drawCount > 0 && <UnoCard faceUp={false} mini />}
          </Box>
          <Typography sx={{ fontSize: 13, fontWeight: 800, color: '#f6f3ea', fontVariantNumeric: 'tabular-nums' }}>{drawCount}</Typography>
          <Typography sx={{ fontSize: 8, color: 'text.secondary', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Draw</Typography>
        </Box>

        {/* Discard */}
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.75 }}>
          <Box sx={{ position: 'relative', width: 52, height: 74 }}>
            {topCard && (
              <Box key={topCard.id} sx={{ position: 'absolute', inset: 0, animation: 'cardLand 0.35s cubic-bezier(0.34,1.56,0.64,1)' }}>
                <UnoCard card={topCard} mini />
              </Box>
            )}
          </Box>
          <Typography sx={{ fontSize: 8, color: 'text.secondary', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Discard</Typography>
        </Box>
      </Box>

      {/* Stack banner */}
      {stack?.type && (
        <Box sx={{
          position: 'absolute', bottom: { xs: 28, sm: 40 }, left: '50%', transform: 'translateX(-50%)',
          px: 2.5, py: 0.65, borderRadius: 999,
          bgcolor: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.35)', boxShadow: '0 0 20px rgba(239,68,68,0.12)',
          animation: 'stackPop 0.3s cubic-bezier(0.34,1.56,0.64,1)',
        }}>
          <Typography sx={{ fontSize: 12, fontWeight: 800, color: '#ef4444', whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}>+{stack.count} penalty!</Typography>
        </Box>
      )}

      {/* Flying card */}
      {flyCard && (
        <Box key={flyCard.id} sx={{
          position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
          zIndex: 30, pointerEvents: 'none', animation: 'flyIn 0.4s cubic-bezier(0.34,1.56,0.64,1)',
        }}>
          <UnoCard card={flyCard.card} mini />
        </Box>
      )}

      {/* CSS keyframes */}
      <style>{`
        @keyframes cardLand { 0% { transform: translateY(-20px) scale(0.7) rotate(-4deg); opacity: 0.5; } 100% { transform: translateY(0) scale(1) rotate(0); opacity: 1; } }
        @keyframes stackPop { 0% { transform: translateX(-50%) scale(0.7); opacity: 0; } 100% { transform: translateX(-50%) scale(1); opacity: 1; } }
        @keyframes flyIn { 0% { transform: translate(-50%,-80%) scale(0.5) rotate(-8deg); opacity: 0; } 60% { opacity: 1; } 100% { transform: translate(-50%,-50%) scale(1) rotate(0); opacity: 0; } }
      `}</style>
    </Box>
  );
}
