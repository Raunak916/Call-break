import { useEffect, useState } from 'react';
import { Box, Button, Stack, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useGame } from '../GameContext.jsx';
import { playGameOver } from '../lib/sounds.js';

const CONFETTI_COLORS = ['#e6b23c', '#3ddc97', '#7cc4ff', '#f78fb3', '#f2c14e', '#f6f3ea', '#c9962e', '#ff8a5c'];

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
    { height: { xs: 120, sm: 150, md: 170 }, medal: '🥇', color: 'linear-gradient(180deg, #f6d476 0%, #d9a832 100%)', shadow: '0 0 30px rgba(230,178,60,0.45)' },
    { height: { xs: 90, sm: 110, md: 130 }, medal: '🥈', color: 'linear-gradient(180deg, #e8e6e0 0%, #a8a69f 100%)', shadow: '0 0 18px rgba(200,200,200,0.25)' },
    { height: { xs: 70, sm: 85, md: 100 }, medal: '🥉', color: 'linear-gradient(180deg, #e2a571 0%, #b97a45 100%)', shadow: '0 0 14px rgba(217,138,74,0.25)' },
    { height: { xs: 52, sm: 62, md: 72 }, medal: '4th', color: 'linear-gradient(180deg, #4a4f4a 0%, #2e332e 100%)', shadow: 'none' },
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
          fontFamily: '"Sora", "Inter", sans-serif',
          mb: 1,
          fontWeight: 700,
          fontSize: { xs: 30, sm: 38 },
          letterSpacing: '-0.01em',
          background: 'linear-gradient(180deg, #f6d476 0%, #d9a832 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          animation: 'slideUp 0.6s ease',
          '@keyframes slideUp': { from: { opacity: 0, transform: 'translateY(20px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
        }}
      >
        Game Over
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        {state.totalRounds} rounds completed
      </Typography>

      {/* Podium */}
      <Box sx={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: { xs: 0.75, sm: 1.5, md: 2.5 }, mb: { xs: 3, sm: 4 }, px: { xs: 1, sm: 2 } }}>
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
                  fontFamily: '"Sora", "Inter", sans-serif',
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
                  width: { xs: 52, sm: 72, md: 88 },
                  height: { xs: p.height * 0.7, sm: p.height },
                  borderRadius: '10px 10px 0 0',
                  background: p.color,
                  boxShadow: p.shadow,
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'center',
                  pt: 1.5,
                  border: isWinner ? '2px solid rgba(230,178,60,0.6)' : 'none',
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
