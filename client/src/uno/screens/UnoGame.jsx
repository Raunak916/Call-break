import { useEffect, useRef, useState } from 'react';
import { Box, Button, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useUno } from '../UnoContext.jsx';
import { isMyTurn, myHand, canPlayAny, needsColorChoice } from '../lib/derive.js';
import UnoTable from '../components/UnoTable.jsx';
import UnoHand from '../components/UnoHand.jsx';
import UnoPlayer from '../components/UnoPlayer.jsx';
import UnoCelebration from '../components/UnoCelebration.jsx';
import ColorPicker from '../components/ColorPicker.jsx';

const COLOR_MAP = { red: '#ef4444', blue: '#3b82f6', green: '#22c55e', yellow: '#eab308' };

function HudPill({ children, accent = false }) {
  return (
    <Box sx={{
      display: 'inline-flex', alignItems: 'center', gap: 0.5,
      px: { xs: 0.65, sm: 0.9 }, py: 0.2, borderRadius: 999,
      bgcolor: accent ? 'rgba(239,68,68,0.1)' : 'rgba(255,255,255,0.04)',
      border: `1px solid ${accent ? 'rgba(239,68,68,0.25)' : 'rgba(255,255,255,0.06)'}`,
      whiteSpace: 'nowrap', transition: 'all 0.2s ease',
    }}>{children}</Box>
  );
}

function getOpponentPositions(players, viewerSeat) {
  const n = players.length;
  const out = [];
  for (let i = 1; i < n; i++) {
    const seat = (viewerSeat + i) % n;
    const p = players[seat];
    if (!p || p.isSelf) continue;
    out.push({ player: p, position: i === 1 ? 'top' : i === 2 ? 'left' : 'right' });
  }
  return out;
}

export default function UnoGame() {
  let ctx;
  try { ctx = useUno(); } catch (e) { return <Box sx={{ p: 4, bgcolor: '#0a0e0b', color: '#ef4444' }}>Context error: {e.message}</Box>; }
  const { state, playCard, drawCard, callUno, chooseColor, leaveRoom } = ctx;
  const navigate = useNavigate();
  const [showCP, setShowCP] = useState(false);
  const [showCeleb, setShowCeleb] = useState(false);
  const prevPhaseRef = useRef(state?.phase);

  if (!state) return <Box sx={{ display: 'grid', placeItems: 'center', height: '100vh', bgcolor: '#0a0e0b' }}><Typography color="text.secondary">Loading…</Typography></Box>;

  const hand = myHand(state) || [];
  const turn = isMyTurn(state);
  const isPlaying = state.phase === 'playing';
  const isGameOver = state.phase === 'gameOver';
  const isRoundEnd = state.phase === 'roundEnd';
  const showColor = needsColorChoice(state);
  const me = state.players?.[state.you];
  const hasUno = me?.hand?.length === 1;
  const players = state.players || [];
  const you = state.you;
  const curColor = state.currentColor || 'wild';
  const colorDot = COLOR_MAP[curColor];
  const stack = state.stack;

  useEffect(() => { if (showColor && isPlaying) setShowCP(true); }, [showColor, isPlaying]);
  useEffect(() => {
    if ((state?.phase === 'roundEnd' || state?.phase === 'gameOver') && prevPhaseRef.current === 'playing') setShowCeleb(true);
    prevPhaseRef.current = state?.phase;
  }, [state?.phase]);

  const handlePlay = async (c) => playCard(c);
  const handleDraw = async () => drawCard();
  const handleUno = async () => callUno();
  const handleColor = async (c) => { setShowCP(false); await chooseColor(c); };

  return (
    <Box sx={{ height: '100vh', width: '100vw', position: 'relative', overflow: 'hidden', background: 'radial-gradient(ellipse at 50% 45%, rgba(18,40,28,0.35) 0%, transparent 55%), #0a0e0b' }}>

      {/* HUD */}
      <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 20, display: 'flex', alignItems: 'center', gap: { xs: 0.6, sm: 1 }, px: { xs: 1, sm: 2 }, py: { xs: 0.4, sm: 0.6 }, background: 'linear-gradient(180deg, rgba(10,14,11,0.97) 0%, rgba(10,14,11,0.65) 85%, transparent 100%)' }}>
        <Box sx={{ px: 1.25, py: 0.3, borderRadius: 999, background: 'linear-gradient(135deg, #ef4444, #dc2626)', color: '#fff', fontSize: 11, fontWeight: 800, letterSpacing: 1.5, fontFamily: '"Sora", sans-serif', boxShadow: '0 2px 8px rgba(239,68,68,0.3)' }}>{state.roomCode}</Box>
        <Typography sx={{ fontSize: 10, color: 'text.secondary', fontWeight: 600 }}>R{state.round}/{state.totalRounds}</Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0.4, sm: 0.75 }, flex: 1, justifyContent: 'center', minWidth: 0 }}>
          <HudPill><Typography sx={{ fontSize: 12, lineHeight: 1, color: '#f6f3ea' }}>{state.direction === 1 ? '↻' : '↺'}</Typography></HudPill>
          {colorDot && <HudPill><Box sx={{ width: 10, height: 10, borderRadius: 999, bgcolor: colorDot, boxShadow: `0 0 8px ${colorDot}88` }} /><Typography sx={{ fontSize: 9, fontWeight: 700, color: colorDot, textTransform: 'uppercase' }}>{curColor}</Typography></HudPill>}
          {stack?.type && <HudPill accent><Typography sx={{ fontSize: 9, fontWeight: 800, color: '#ef4444' }}>+{stack.count}</Typography></HudPill>}
          <HudPill><Typography sx={{ fontSize: 9, fontWeight: 600, color: 'text.secondary' }}>Deck {state.drawPileCount ?? 0}</Typography></HudPill>
          {isPlaying && <Typography sx={{ fontSize: { xs: 9, sm: 10 }, fontWeight: 700, color: turn ? '#e6b23c' : 'text.secondary', whiteSpace: 'nowrap' }}>{turn ? 'YOUR TURN' : players[state.currentPlayerSeat]?.name || ''}</Typography>}
        </Box>
        <Button size="small" onClick={async () => { await leaveRoom(); navigate('/'); }} sx={{ fontSize: 10, textTransform: 'none', color: 'text.secondary', '&:hover': { color: '#ef4444' } }}>Leave</Button>
      </Box>

      {/* Opponents */}
      {getOpponentPositions(players, you).map(({ player: p, position }) => (
        <UnoPlayer key={p.seat} player={p} position={position} isTurn={isPlaying && state.currentPlayerSeat === p.seat} lastAction={state?.lastAction} />
      ))}

      {/* Table */}
      <Box sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -52%)', width: { xs: '94vw', sm: '80vw', md: '70vw', lg: '62vw', xl: '56vw' }, height: { xs: '56vw', sm: '50vw', md: '44vw', lg: '40vw', xl: '36vw' }, maxWidth: { md: 640, lg: 700 }, maxHeight: { md: 420, lg: 440 }, zIndex: 5 }}>
        <UnoTable state={state} />
      </Box>

      {/* Bottom */}
      <Box sx={{ position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 15, background: 'linear-gradient(0deg, rgba(10,14,11,0.97) 0%, rgba(10,14,11,0.55) 55%, transparent 100%)', pt: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
          <Typography sx={{ fontSize: 13, fontWeight: 700, color: turn ? '#e6b23c' : '#f6f3ea', fontFamily: '"Sora", sans-serif' }}>{me?.name || 'You'}</Typography>
          <Box sx={{ px: 0.75, py: 0.2, borderRadius: 999, bgcolor: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <Typography sx={{ fontSize: 10, fontWeight: 700, color: hand.length <= 2 ? '#ef4444' : 'text.secondary' }}>{hand.length} cards</Typography>
          </Box>
          {hasUno && isPlaying && <Button variant="contained" size="small" onClick={handleUno} sx={{ bgcolor: '#fbbf24', color: '#1a1a1a', fontWeight: 800, fontSize: 10, px: 1.5, py: 0.3, borderRadius: 999, textTransform: 'none', boxShadow: '0 2px 10px rgba(251,191,36,0.35)', animation: 'unoPulse 1.4s ease-in-out infinite', '@keyframes unoPulse': { '0%,100%': { transform: 'scale(1)' }, '50%': { transform: 'scale(1.06)' } } }}>UNO!</Button>}
          {isPlaying && turn && !canPlayAny(state) && !showColor && <Button variant="outlined" size="small" onClick={handleDraw} sx={{ borderColor: 'rgba(255,255,255,0.15)', color: 'text.secondary', fontSize: 10, textTransform: 'none', borderRadius: 999 }}>Draw</Button>}
        </Box>
        {!isGameOver && !isRoundEnd && hand.length > 0 && <UnoHand cards={hand} topCard={state.topDiscard} currentColor={state.currentColor} stack={state.stack} myTurn={turn && isPlaying && !showColor} onPlay={handlePlay} />}
      </Box>

      <UnoCelebration show={showCeleb} winnerName={isRoundEnd && state.lastAction?.seat != null ? players[state.lastAction.seat]?.name : undefined} isGameOver={isGameOver} onDismiss={() => setShowCeleb(false)} />
      <ColorPicker open={showCP} onChoose={handleColor} />
    </Box>
  );
}
