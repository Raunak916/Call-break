import { useEffect, useState } from 'react';
import { Box, Button, Stack, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useGame } from '../GameContext.jsx';
import { playGameOver } from '../lib/sounds.js';

const CONFETTI_COLORS = ['#d4a843', '#c4463a', '#4a7c59', '#6b8cae', '#e8c170', '#f0ece2', '#b8922e', '#cd7f32'];

function ConfettiParticle({ delay, left, color, size }) {
  return (
    <Box
      sx={{
        position: 'fixed',
        top: -12,
        left: `${left}%`,
        width: size,
        height: size * 0.6,
        borderRadius: 0.5,
        bgcolor: color,
        opacity: 0.85,
        zIndex: 100,
        animation: `confettiFall ${2.5 + Math.random()}s ease-in ${delay}s forwards`,
        '@keyframes confettiFall': {
          '0%': { transform: 'translateY(0) rotate(0deg) scale(1)', opacity: 0.9 },
          '40%': { opacity: 0.8 },
          '100%': { transform: 'translateY(105vh) rotate(720deg) scale(0.5)', opacity: 0 },
        },
      }}
    />
  );
}

/**
 * Game-over podium: 4 platforms of decreasing height, player names + scores,
 * medal emojis, confetti rain, and rematch / go-home buttons.
 */
export default function Podium({ state }) {
  const { isHost, rematch, leaveRoom } = useGame();
  const navigate = useNavigate();
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (state?.phase === 'gameOver') {
      const t = setTimeout(() => {
        setShow(true);
        playGameOver();
      }, 400);
      return () => clearTimeout(t);
    }
    setShow(false);
  }, [state?.phase]);

  if (!show || state?.phase !== 'gameOver') return null;

  const standings = state.standings || [];

  const platforms = [
    { height: 170, medal: '🥇', color: 'linear-gradient(180deg, #d4a843 0%, #b8922e 100%)', shadow: '0 0 20px rgba(212,168,67,0.3)' },
    { height: 130, medal: '🥈', color: 'linear-gradient(180deg, #b0b0b0 0%, #8a8a8a 100%)', shadow: '0 0 15px rgba(180,180,180,0.2)' },
    { height: 100, medal: '🥉', color: 'linear-gradient(180deg, #cd7f32 0%, #a0622e 100%)', shadow: '0 0 12px rgba(205,127,50,0.2)' },
    { height: 72, medal: '4th', color: 'linear-gradient(180deg, #5a5a5a 0%, #3a3a3a 100%)', shadow: 'none' },
  ];

  const handleHome = async () => {
    await leaveRoom();
    navigate('/');
  };

  return (
    <Box
      sx={{
        position: 'fixed',
        inset: 0,
        zIndex: 50,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'rgba(10,15,10,0.85)',
        backdropFilter: 'blur(8px)',
        animation: 'fadeIn 0.5s ease',
        '@keyframes fadeIn': { from: { opacity: 0 }, to: { opacity: 1 } },
      }}
    >
      {/* Confetti — 60 particles */}
      {Array.from({ length: 60 }).map((_, i) => (
        <ConfettiParticle
          key={i}
          delay={Math.random() * 2.5}
          left={Math.random() * 100}
          color={CONFETTI_COLORS[i % CONFETTI_COLORS.length]}
          size={6 + Math.random() * 8}
        />
      ))}

      <Typography
        variant="h2"
        sx={{
          fontFamily: '"Georgia", serif',
          color: 'primary.main',
          mb: 1,
          fontWeight: 700,
          fontSize: { xs: 28, sm: 36 },
          animation: 'slideUp 0.6s ease',
          '@keyframes slideUp': { from: { opacity: 0, transform: 'translateY(20px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
        }}
      >
        🏆 Game Over
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        {state.totalRounds} rounds completed
      </Typography>

      {/* Podium */}
      <Box sx={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: { xs: 1, sm: 2.5 }, mb: 4, px: 2 }}>
        {standings.map((player, i) => {
          const p = platforms[i] || platforms[3];
          const isWinner = i === 0;
          return (
            <Box
              key={player.seat}
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                animation: `riseUp 0.5s ease ${0.3 + i * 0.15}s both`,
                '@keyframes riseUp': {
                  from: { opacity: 0, transform: 'translateY(40px)' },
                  to: { opacity: 1, transform: 'translateY(0)' },
                },
              }}
            >
              <Typography
                variant="body1"
                sx={{
                  fontFamily: '"Georgia", serif',
                  fontWeight: 700,
                  color: isWinner ? 'primary.main' : 'text.primary',
                  mb: 0.5,
                  textAlign: 'center',
                  fontSize: isWinner ? 17 : 14,
                  maxWidth: 90,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {player.name}
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  fontWeight: 700,
                  color: player.score > 0 ? 'success.main' : player.score < 0 ? 'error.main' : 'text.secondary',
                  mb: 0.75,
                  fontSize: isWinner ? 16 : 13,
                }}
              >
                {player.score > 0 ? '+' : ''}{player.score} pts
              </Typography>

              <Box
                sx={{
                  width: { xs: 56, sm: 88 },
                  height: { xs: p.height * 0.7, sm: p.height },
                  borderRadius: '10px 10px 0 0',
                  background: p.color,
                  boxShadow: p.shadow,
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'center',
                  pt: 1.5,
                  border: isWinner ? '2px solid rgba(212,168,67,0.4)' : 'none',
                }}
              >
                <Typography sx={{ fontSize: isWinner ? 26 : 20, lineHeight: 1 }}>
                  {p.medal}
                </Typography>
              </Box>
            </Box>
          );
        })}
      </Box>

      {/* Buttons */}
      <Stack direction="row" spacing={2} sx={{ mt: 1 }}>
        {isHost && (
          <Button
            variant="contained"
            size="large"
            onClick={rematch}
            sx={{
              fontFamily: '"Georgia", serif',
              fontSize: 15,
              px: 4,
              py: 1.2,
              fontWeight: 700,
            }}
          >
            Play Again
          </Button>
        )}
        <Button
          variant="outlined"
          size="large"
          onClick={handleHome}
          sx={{
            fontFamily: '"Georgia", serif',
            fontSize: 15,
            px: 4,
            py: 1.2,
            fontWeight: 600,
          }}
        >
          Go to Home
        </Button>
      </Stack>

      {!isHost && (
        <Typography color="text.secondary" sx={{ mt: 2, fontStyle: 'italic' }}>
          Waiting for host to start a new game…
        </Typography>
      )}
    </Box>
  );
}
