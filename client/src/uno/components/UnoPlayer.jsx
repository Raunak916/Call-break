import { useEffect, useState } from 'react';
import { Box, Typography } from '@mui/material';

const AVATAR_BG = ['#e6b23c', '#3ddc97', '#7cc4ff', '#f78fb3', '#ff8a5c', '#a78bfa'];

export default function UnoPlayer({ player, position, isTurn, lastAction }) {
  const [flash, setFlash] = useState(false);
  const [shake, setShake] = useState(false);

  useEffect(() => {
    if (lastAction?.type === 'play' && lastAction?.card?.type === 'skip' && lastAction?.targetSeat === player?.seat) {
      setFlash(true); const t = setTimeout(() => setFlash(false), 550); return () => clearTimeout(t);
    }
  }, [lastAction, player?.seat]);

  useEffect(() => {
    if (lastAction?.type === 'drawPenalty' && lastAction?.seat === player?.seat) {
      setShake(true); const t = setTimeout(() => setShake(false), 450); return () => clearTimeout(t);
    }
  }, [lastAction, player?.seat]);

  if (!player || player.isSelf) return null;

  const bg = AVATAR_BG[player.seat % AVATAR_BG.length];
  const count = player.handCount ?? 0;
  const uno = count === 1;

  const pos = {
    top: { top: { xs: 36, sm: 42, md: 48 }, left: '50%', transform: 'translateX(-50%)' },
    left: { left: { xs: 6, sm: 10, md: 18 }, top: '40%', transform: 'translateY(-50%)' },
    right: { right: { xs: 6, sm: 10, md: 18 }, top: '40%', transform: 'translateY(-50%)' },
  };

  return (
    <Box sx={{
      position: 'absolute', ...pos, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.4, zIndex: 12,
      animation: shake ? 'shakeX 0.4s ease' : 'none',
    }}>
      {/* Avatar */}
      <Box sx={{ position: 'relative', width: { xs: 42, sm: 50, md: 56 }, height: { xs: 42, sm: 50, md: 56 } }}>
        {isTurn && (
          <Box sx={{
            position: 'absolute', inset: -4, borderRadius: 999, border: '3px solid #e6b23c',
            animation: 'tglow 1.8s ease-in-out infinite',
          }} />
        )}
        <Box sx={{
          width: '100%', height: '100%', borderRadius: 999, display: 'grid', placeItems: 'center',
          bgcolor: bg, color: '#0a0e0b', fontSize: { xs: 17, sm: 21, md: 23 }, fontWeight: 800,
          border: isTurn ? '3px solid #e6b23c' : '2px solid rgba(255,255,255,0.12)',
          boxShadow: isTurn ? '0 0 14px rgba(230,178,60,0.35)' : '0 3px 10px rgba(0,0,0,0.35)',
          transition: 'all 0.35s ease',
          animation: flash ? 'flashAvatar 0.5s ease' : 'none',
        }}>
          {(player.name || '?')[0]?.toUpperCase()}
        </Box>
        {uno && (
          <Box sx={{
            position: 'absolute', top: -5, right: -5, px: 0.9, py: 0.1, borderRadius: 999,
            bgcolor: '#fbbf24', color: '#1a1a1a', fontSize: 8.5, fontWeight: 900, letterSpacing: 0.5,
            boxShadow: '0 2px 8px rgba(251,191,36,0.4)',
            animation: 'ubounce 1.2s ease-in-out infinite',
          }}>UNO</Box>
        )}
      </Box>

      <Typography sx={{
        fontSize: { xs: 10.5, sm: 11.5, md: 12.5 }, fontWeight: 700, fontFamily: '"Sora", sans-serif',
        color: isTurn ? '#e6b23c' : '#f0ece4', textAlign: 'center', maxWidth: 85, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        textShadow: '0 1px 3px rgba(0,0,0,0.5)', transition: 'color 0.3s ease',
      }}>{player.name}</Typography>

      <Box sx={{
        px: 1, py: 0.2, borderRadius: 999,
        bgcolor: isTurn ? 'rgba(230,178,60,0.1)' : 'rgba(255,255,255,0.05)',
        border: `1px solid ${isTurn ? 'rgba(230,178,60,0.3)' : 'rgba(255,255,255,0.08)'}`,
        display: 'flex', alignItems: 'center', gap: 0.4, transition: 'all 0.3s ease',
      }}>
        <Box sx={{ width: 8, height: 12, borderRadius: 1, bgcolor: 'rgba(255,255,255,0.18)', border: '1px solid rgba(255,255,255,0.12)' }} />
        <Typography sx={{ fontSize: { xs: 9.5, sm: 10.5 }, fontWeight: 800, fontVariantNumeric: 'tabular-nums', color: count <= 2 ? '#ef4444' : '#e8e4dc' }}>{count}</Typography>
      </Box>

      <style>{`
        @keyframes tglow { 0%,100% { box-shadow: 0 0 12px rgba(230,178,60,0.35), 0 0 24px rgba(230,178,60,0.12); } 50% { box-shadow: 0 0 22px rgba(230,178,60,0.55), 0 0 44px rgba(230,178,60,0.25); } }
        @keyframes flashAvatar { 0%,100% { opacity: 1; } 20%,60% { opacity: 0.15; } 40%,80% { opacity: 1; } }
        @keyframes ubounce { 0%,100% { transform: scale(1); } 50% { transform: scale(1.18); } }
        @keyframes shakeX { 0%,100% { transform: translateX(0); } 15%,45%,75% { transform: translateX(-5px); } 30%,60% { transform: translateX(5px); } }
      `}</style>
    </Box>
  );
}
