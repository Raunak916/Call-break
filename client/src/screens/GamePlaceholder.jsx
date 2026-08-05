import { useNavigate } from 'react-router-dom';
import { Box, Button, Card, CardContent, Stack, Typography } from '@mui/material';
import { useGame } from '../GameContext.jsx';

// Interim screen for non-lobby phases. The full table view replaces this in
// the next step (Frontend Game screen); for now a mid-game rejoin shows the
// phase and a way out instead of a blank page.
export default function GamePlaceholder() {
  const { state, leaveRoom } = useGame();
  const navigate = useNavigate();

  const handleLeave = async () => {
    await leaveRoom();
    navigate('/');
  };

  return (
    <Box sx={{ display: 'grid', placeItems: 'center', minHeight: '100vh', p: 2 }}>
      <Card sx={{ maxWidth: 400, width: '100%' }}>
        <CardContent sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h5" sx={{ mb: 1 }}>
            Game in progress
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 3 }}>
            Round {state.round} of {state.totalRounds} — {state.phase}. The full
            card table is coming in the next step.
          </Typography>
          <Stack direction="row" spacing={1} justifyContent="center">
            <Button variant="outlined" onClick={handleLeave}>
              Leave room
            </Button>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
}
