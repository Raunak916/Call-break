import { useMemo } from 'react';
import { Box } from '@mui/material';
import UnoCard from './UnoCard.jsx';
import { isPlayable } from '../lib/derive.js';

export default function UnoHand({ cards, topCard, currentColor, stack, myTurn, onPlay }) {
  const count = cards.length;
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 600;

  const fan = useMemo(() => {
    const spread = isMobile ? 30 : 44;
    const overlap = isMobile ? 22 : 34;
    const step = count > 1 ? spread / (count - 1) : 0;
    const cardW = isMobile
      ? Math.max(44, Math.min(64, 380 / count))
      : Math.max(60, Math.min(86, 680 / count));
    return { maxRot: spread / 2, step, overlap, cardW };
  }, [count, isMobile]);

  if (!count) return null;

  return (
    <Box sx={{ position: 'relative', width: '100%', height: isMobile ? 148 : 195, display: 'flex', justifyContent: 'center', alignItems: 'flex-end', overflow: 'visible', pb: 0.5, px: 1.5 }}>
      {cards.map((card, i) => {
        const legal = myTurn && isPlayable(card, topCard, currentColor, stack);
        const rot = count > 1 ? -fan.maxRot + fan.step * i : 0;
        const x = count > 1 ? (i - (count - 1) / 2) * fan.overlap : 0;

        return (
          <Box
            key={card.id}
            sx={{
              position: 'absolute', left: '50%', bottom: 0,
              transform: `translateX(calc(-50% + ${x}px)) rotate(${rot}deg)`,
              transformOrigin: 'bottom center',
              zIndex: i + (legal ? 100 : 0),
              filter: myTurn && !legal ? 'brightness(0.4) saturate(0.45)' : 'none',
              cursor: legal ? 'pointer' : 'default',
              transition: 'transform 0.25s cubic-bezier(0.4,0,0.2,1), filter 0.2s ease, box-shadow 0.2s ease',
              opacity: 0,
              animation: `handDeal 0.35s cubic-bezier(0.34,1.56,0.64,1) ${i * 0.03}s forwards`,
              '&:hover': legal
                ? { transform: `translateX(calc(-50% + ${x}px)) translateY(-26px) rotate(0deg) scale(1.08)`, zIndex: 200, filter: 'brightness(1.12) drop-shadow(0 4px 12px rgba(0,0,0,0.4))' }
                : { transform: `translateX(calc(-50% + ${x}px)) rotate(${rot}deg) translateY(-4px) scale(1.015)` },
              '&:active': legal ? { transform: `translateX(calc(-50% + ${x}px)) translateY(-30px) rotate(0deg) scale(1.12)` } : {},
              ...(legal && {
                '&::after': {
                  content: '""', position: 'absolute', inset: -3, borderRadius: 10,
                  boxShadow: '0 0 10px rgba(230,178,60,0.3), 0 0 20px rgba(230,178,60,0.12)',
                  pointerEvents: 'none',
                  animation: 'lg 2.2s ease-in-out infinite',
                },
              }),
            }}
            onClick={legal ? () => onPlay(card) : undefined}
          >
            <UnoCard card={card} mini={isMobile} sx={{ width: fan.cardW }} />
          </Box>
        );
      })}
      <style>{`
        @keyframes handDeal { 0% { opacity: 0; transform: translateY(30px) rotate(calc(var(--r, 0deg) - 8deg)) scale(0.75); } 100% { opacity: 1; transform: translateY(0); } }
        @keyframes lg { 0%,100% { box-shadow: 0 0 6px rgba(230,178,60,0.2); } 50% { box-shadow: 0 0 16px rgba(230,178,60,0.4), 0 0 28px rgba(230,178,60,0.12); } }
      `}</style>
    </Box>
  );
}
