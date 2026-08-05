import { Box, useMediaQuery, useTheme } from '@mui/material';
import { useGame } from '../GameContext.jsx';
import { isMyTurn, myHand, legalHint } from '../lib/derive.js';
import GameHeader from '../components/GameHeader.jsx';
import ScoreTable from '../components/ScoreTable.jsx';
import Table from '../components/Table.jsx';
import Hand from '../components/Hand.jsx';
import BiddingPanel from '../components/BiddingPanel.jsx';
import Scoreboard from '../components/Scoreboard.jsx';
import Podium from '../components/Podium.jsx';
import Lobby from './Lobby.jsx';

/**
 * Full game screen: header, central table with seat labels and trick cards,
 * the viewer's hand at the bottom, bidding overlay, and round/game-over
 * scoreboard modal.
 */
export default function Game() {
  const { state, play } = useGame();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  if (!state) return null;

  // Phase transition back to lobby between rounds uses the Lobby component.
  if (state.phase === 'lobby') return <Lobby />;

  const hand = myHand(state);
  const legal = legalHint(state);
  const turn = isMyTurn(state);
  const isPlaying = state.phase === 'playing';
  const isGameOver = state.phase === 'gameOver';

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        overflow: 'hidden',
        bgcolor: 'background.default',
        transition: 'all 0.3s ease',
      }}
    >
      <GameHeader state={state} />

      {/* Live scoring table — hidden during game over (podium shows standings) */}
      {!isGameOver && <ScoreTable state={state} />}

      {/* Table area */}
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          minHeight: 0,
        }}
      >
        <Table state={state} />
      </Box>

      {/* Bidding panel — hidden during game over */}
      {!isGameOver && <BiddingPanel state={state} />}

      {/* Hand — hidden during game over, extra padding when bidding panel is visible on mobile */}
      {!isGameOver && hand.length > 0 && (
        <Box sx={{ pb: state.phase === 'bidding' && isMobile ? 80 : 0, transition: 'padding 0.3s ease' }}>
          <Hand
            cards={hand}
            legalSet={isPlaying ? legal : null}
            myTurn={turn}
            onPlay={(card) => play(card)}
          />
        </Box>
      )}

      {/* Scoreboard overlay — only during round end, NOT during game over (podium handles that) */}
      {!isGameOver && <Scoreboard state={state} />}

      {/* Podium with confetti on game over — renders on top of everything */}
      <Podium state={state} />
    </Box>
  );
}
