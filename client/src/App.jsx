import { Routes, Route } from 'react-router-dom';
import { Box } from '@mui/material';
import { GameProvider } from './GameContext.jsx';
import GameSelector from './screens/GameSelector.jsx';
import Home from './screens/Home.jsx';
import RoomRoute from './screens/RoomRoute.jsx';
import GlobalOverlays from './GlobalOverlays.jsx';
import ChatSidebar from './components/ChatSidebar.jsx';
import { useGame } from './GameContext.jsx';

function AppLayout() {
  const { state } = useGame();
  const inRoom = state?.roomCode;

  return (
    <Box sx={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      {/* Chat sidebar — only visible when in a room */}
      {inRoom && <ChatSidebar />}

      {/* Main content area — smooth transition when sidebar appears/disappears */}
      <Box sx={{ flex: 1, minWidth: 0, overflow: 'hidden', transition: 'all 0.3s ease' }}>
        <Routes>
          <Route path="/" element={<GameSelector />} />
          <Route path="/call-break" element={<Home />} />
          <Route path="/room/:code" element={<RoomRoute />} />
          <Route path="*" element={<GameSelector />} />
        </Routes>
      </Box>

      <GlobalOverlays />
    </Box>
  );
}

export default function App() {
  return (
    <GameProvider>
      <AppLayout />
    </GameProvider>
  );
}
