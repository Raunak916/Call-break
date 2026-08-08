import { useMemo } from 'react';
import { Box, Typography } from '@mui/material';

const PIECES = ['#ef4444', '#3b82f6', '#22c55e', '#eab308', '#a855f7', '#f97316', '#ec4899', '#06b6d4', '#fbbf24'];

function Confetti({ delay, left, color, size, rot }) {
  return (
    <Box sx={{
      position: 'fixed', left: `${left}%`, top: -10, width: size, height: size * 0.6,
      borderRadius: 1, bgcolor: color, zIndex: 200, pointerEvents: 'none',
      animation: `confettiFall ${2.2 + Math.random() * 1.5}s ease-in ${delay}s forwards`,
    }} />
  );
}

export default function UnoCelebration({ show, winnerName, isGameOver, onDismiss }) {
  const pieces = useMemo(() => Array.from({ length: 90 }, (_, i) => ({
    id: i, delay: Math.random() * 1.2, left: Math.random() * 100,
    color: PIECES[i % PIECES.length], size: 5 + Math.random() * 9, rot: 360 + Math.random() * 720,
  })), [show]);

  if (!show) return null;

  return (
    <Box onClick={onDismiss} sx={{
      position: 'fixed', inset: 0, zIndex: 150, display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      bgcolor: 'rgba(4,7,5,0.9)', backdropFilter: 'blur(8px)', cursor: 'pointer',
      animation: 'fadeIn 0.3s ease',
    }}>
      {pieces.map((p) => <Confetti key={p.id} {...p} />)}
      <Box sx={{ textAlign: 'center', zIndex: 201, animation: 'popIn 0.4s cubic-bezier(0.34,1.56,0.64,1) 0.15s both' }}>
        <Typography sx={{ fontFamily: '"Sora", sans-serif', fontSize: { xs: 30, sm: 42 }, fontWeight: 900,
          background: 'linear-gradient(135deg, #fbbf24, #f59e0b, #d97706)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', mb: 1 }}>
          {isGameOver ? '🏆 Game Over' : '🎉 Round Complete'}
        </Typography>
        {winnerName && (
          <Box sx={{ animation: 'popIn 0.3s ease 0.4s both' }}>
            <Typography sx={{ fontSize: { xs: 18, sm: 22 }, fontWeight: 700, color: '#f0ece4', mb: 0.5, fontFamily: '"Sora", sans-serif' }}>{winnerName} wins!</Typography>
            <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>{isGameOver ? 'Final standings' : 'Tap to continue'}</Typography>
          </Box>
        )}
      </Box>
      <style>{`
        @keyframes fadeIn { 0% { opacity: 0; } 100% { opacity: 1; } }
        @keyframes popIn { 0% { transform: scale(0.4); opacity: 0; } 100% { transform: scale(1); opacity: 1; } }
        @keyframes confettiFall { 0% { transform: translateY(0) rotate(0deg); opacity: 1; } 100% { transform: translateY(110vh) rotate(${720 + Math.random() * 360}deg); opacity: 0; } }
      `}</style>
    </Box>
  );
}
