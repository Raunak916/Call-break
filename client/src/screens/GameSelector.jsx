import { useNavigate } from 'react-router-dom';
import { Box, Card, CardActionArea, CardContent, Chip, Stack, Typography } from '@mui/material';

const GAMES = [
  {
    id: 'call-break',
    title: 'Call Break',
    description: 'Trick-taking card game · 4 players · ♠ trumps',
    route: '/call-break',
    icon: '♠',
    color: 'primary.main',
    available: true,
  },
  {
    id: 'uno',
    title: 'UNO',
    description: 'Classic shedding card game · 2-6 players',
    route: '/uno',
    icon: 'UNO',
    color: '#d32f2f',
    available: true,
  },
];

/**
 * Top-level game hub — pick a game to play.
 */
export default function GameSelector() {
  const navigate = useNavigate();

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        p: { xs: 3, sm: 4, md: 5 },
        background: `
          radial-gradient(ellipse at 50% 35%, rgba(24,68,44,0.3) 0%, transparent 55%),
          linear-gradient(170deg, #0c1710 0%, #0a0e0b 50%, #0b130e 100%)
        `,
      }}
    >
      <Typography
        variant="h4"
        sx={{
          fontFamily: '"Sora", "Inter", sans-serif',
          fontWeight: 700,
          color: 'text.primary',
          mb: 1,
          fontSize: { xs: 22, sm: 26, md: 28 },
        }}
      >
        Pick a Game
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: { xs: 4, sm: 5, md: 6 } }}>
        Choose from the collection below
      </Typography>

      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={{ xs: 2.5, sm: 3, md: 4 }}
        sx={{ width: '100%', maxWidth: { xs: 340, sm: 560, md: 640 } }}
      >
        {GAMES.map((game) => (
          <Card
            key={game.id}
            sx={{
              flex: 1,
              bgcolor: 'rgba(16,23,19,0.75)',
              border: '1px solid rgba(255,255,255,0.07)',
              backdropFilter: 'blur(14px)',
              opacity: game.available ? 1 : 0.5,
              transition: 'all 0.2s ease',
              ...(game.available && {
                '&:hover': {
                  borderColor: game.id === 'uno' ? 'rgba(211,47,47,0.4)' : 'rgba(230,178,60,0.4)',
                  boxShadow: '0 8px 30px rgba(0,0,0,0.4)',
                  transform: 'translateY(-2px)',
                },
              }),
            }}
          >
            <CardActionArea
              disabled={!game.available}
              onClick={() => game.route && navigate(game.route)}
              sx={{ minHeight: { xs: 140, sm: 160, md: 180 } }}
            >
              <CardContent sx={{ p: { xs: 3, sm: 3.5, md: 4 }, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 1.5 }}>
                <Box
                  sx={{
                    width: 52,
                    height: 52,
                    borderRadius: 999,
                    display: 'grid',
                    placeItems: 'center',
                    fontSize: game.id === 'uno' ? 16 : 26,
                    fontWeight: 700,
                    color: game.available ? 'primary.main' : 'text.disabled',
                    border: `1px solid ${game.available ? 'rgba(230,178,60,0.4)' : 'rgba(255,255,255,0.12)'}`,
                    bgcolor: game.available ? 'rgba(230,178,60,0.08)' : 'rgba(255,255,255,0.03)',
                  }}
                >
                  {game.icon}
                </Box>

                <Typography
                  variant="h6"
                  sx={{
                    fontFamily: '"Sora", "Inter", sans-serif',
                    fontWeight: 700,
                    fontSize: { xs: 17, sm: 18 },
                    color: game.available ? 'text.primary' : 'text.disabled',
                  }}
                >
                  {game.title}
                </Typography>

                <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: 12.5, sm: 13 } }}>
                  {game.description}
                </Typography>

                {!game.available && (
                  <Chip
                    label="Coming Soon"
                    size="small"
                    variant="outlined"
                    sx={{ mt: 0.5, height: 22, '& .MuiChip-label': { fontSize: 10.5, fontWeight: 600 } }}
                  />
                )}
              </CardContent>
            </CardActionArea>
          </Card>
        ))}
      </Stack>
    </Box>
  );
}
