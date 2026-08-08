import { Routes, Route } from 'react-router-dom';
import { Box } from '@mui/material';
import { GameProvider, useGame } from './GameContext.jsx';
import { UnoProvider, useUno } from './uno/UnoContext.jsx';
import GameSelector from './screens/GameSelector.jsx';
import Home from './screens/Home.jsx';
import RoomRoute from './screens/RoomRoute.jsx';
import UnoHome from './uno/screens/UnoHome.jsx';
import UnoRoomRoute from './uno/screens/UnoRoomRoute.jsx';
import GlobalOverlays from './GlobalOverlays.jsx';
import ChatSidebar from './components/ChatSidebar.jsx';

function AppLayout() {
  const { state } = useGame();
  const { state: unoState } = useUno();
  const inRoom = state?.roomCode || unoState?.roomCode;

  return (
    <Box sx={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      {inRoom && <ChatSidebar />}
      <Box sx={{ flex: 1, minWidth: 0, overflow: 'hidden', transition: 'all 0.3s ease' }}>
        <Routes>
          <Route path="/" element={<GameSelector />} />
          <Route path="/call-break" element={<Home />} />
          <Route path="/room/:code" element={<RoomRoute />} />
          <Route path="/uno" element={<UnoHome />} />
          <Route path="/uno/room/:code" element={<UnoRoomRoute />} />
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
      <UnoProvider>
        <AppLayout />
      </UnoProvider>
    </GameProvider>
  );
}
