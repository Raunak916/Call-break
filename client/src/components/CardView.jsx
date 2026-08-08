import { Box, Typography } from '@mui/material';
import { SUIT_SYMBOL, rankLabel, isRed } from '../lib/cardUtils.js';

const SYM = { S: '♠', H: '♥', D: '♦', C: '♣' };
const FACE = new Set([11, 12, 13, 14]);

/**
 * Traditional pip positions for number cards 2–10.
 * Each entry is [x%, y%] within the card's center face area.
 */
const PIPS = {
  2:  [[50,22],[50,78]],
  3:  [[50,22],[50,50],[50,78]],
  4:  [[32,22],[68,22],[32,78],[68,78]],
  5:  [[32,22],[68,22],[50,50],[32,78],[68,78]],
  6:  [[32,22],[68,22],[32,50],[68,50],[32,78],[68,78]],
  7:  [[32,22],[68,22],[50,36],[32,50],[68,50],[32,78],[68,78]],
  8:  [[32,22],[68,22],[50,36],[32,50],[68,50],[50,64],[32,78],[68,78]],
  9:  [[32,18],[68,18],[32,38],[68,38],[50,50],[32,62],[68,62],[32,82],[68,82]],
  10: [[32,18],[68,18],[50,28],[32,38],[68,38],[32,62],[68,62],[50,72],[32,82],[68,82]],
};

function NumberPips({ suit, rank, color }) {
  const positions = PIPS[rank] || [];
  return (
    <>
      {positions.map(([x, y], i) => (
        <Typography
          key={i}
          sx={{
            position: 'absolute',
            left: `${x}%`,
            top: `${y}%`,
            transform: y > 55 ? 'translate(-50%,-50%) rotate(180deg)' : 'translate(-50%,-50%)',
            fontSize: 20,
            lineHeight: 1,
            color,
          }}
        >
          {SYM[suit]}
        </Typography>
      ))}
    </>
  );
}

function AceDesign({ suit, color }) {
  const s = SYM[suit];
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>
      <Typography sx={{ fontSize: 10, opacity: 0.15, lineHeight: 1 }}>✦</Typography>
      <Typography sx={{ fontSize: 44, lineHeight: 1, color, fontWeight: 400 }}>{s}</Typography>
      <Typography sx={{ fontSize: 10, opacity: 0.15, lineHeight: 1 }}>✦</Typography>
    </Box>
  );
}

function FaceDesign({ suit, rank, color }) {
  const s = SYM[suit];
  const label = rank === 14 ? 'A' : rank === 13 ? 'K' : rank === 12 ? 'Q' : 'J';
  const deco = rank === 13 ? '♛' : rank === 12 ? '♕' : rank === 11 ? '♞' : '✦';

  return (
    <Box
      sx={{
        position: 'absolute',
        inset: '16% 14%',
        border: '1.5px solid',
        borderColor: `${color}22`,
        borderRadius: 2,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 0.75,
        overflow: 'hidden',
      }}
    >
      <Typography sx={{ fontSize: 13, lineHeight: 1, opacity: 0.4 }}>{deco}</Typography>
      <Typography sx={{ fontSize: 28, lineHeight: 1, color, fontFamily: '"Georgia", serif', fontWeight: 700 }}>{label}</Typography>
      <Typography sx={{ fontSize: 22, lineHeight: 1, color }}>{s}</Typography>
      <Typography sx={{ fontSize: 13, lineHeight: 1, opacity: 0.4 }}>{deco}</Typography>
      <Typography sx={{ fontSize: 22, lineHeight: 1, color, transform: 'rotate(180deg)' }}>{s}</Typography>
      <Typography sx={{ fontSize: 28, lineHeight: 1, color, fontFamily: '"Georgia", serif', fontWeight: 700, transform: 'rotate(180deg)' }}>{label}</Typography>
      <Typography sx={{ fontSize: 13, lineHeight: 1, opacity: 0.4, transform: 'rotate(180deg)' }}>{deco}</Typography>
    </Box>
  );
}

/**
 * Classic playing card. BIG — 90×126px normal, 64×90px mini.
 * 5:7 aspect ratio, white background, proper pip arrangements.
 */
export default function CardView({ card, sx, onClick, dim = false, faceUp = true, mini = false }) {
  if (!card && !dim) return null;

  const s = card?.s ?? '?';
  const r = card?.r ?? 0;
  const red = card ? isRed(card) : false;
  const sym = SYM[s] || '?';
  const isFace = FACE.has(r);
  const isAce = r === 14;
  const color = red ? '#c4463a' : '#1a1a1a';

  return (
    <Box
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => e.key === 'Enter' && onClick(e) : undefined}
      sx={{
        width: mini ? 48 : { xs: 62, sm: 90 },
        height: mini ? 68 : { xs: 88, sm: 126 },
        borderRadius: 0,
        border: '1px solid rgba(24,20,12,0.3)',
        background: faceUp
          ? 'radial-gradient(ellipse at 28% 10%, rgba(255,255,255,0.95) 0%, transparent 48%), linear-gradient(180deg, #fffefa 0%, #f7f4ec 100%)'
          : 'radial-gradient(ellipse at 40% 18%, rgba(42,96,66,0.5) 0%, transparent 60%), linear-gradient(145deg, #173624 0%, #0b1e13 100%)',
        color,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: onClick ? 'pointer' : 'default',
        userSelect: 'none',
        opacity: dim ? 0 : 1,
        boxShadow: onClick
          ? '0 6px 20px rgba(0,0,0,0.55)'
          : '0 2px 6px rgba(0,0,0,0.35), 0 1px 2px rgba(0,0,0,0.4)',
        transition: 'transform .15s ease, box-shadow .15s ease, opacity .2s',
        flexShrink: 0,
        position: 'relative',
        overflow: 'hidden',
        ...sx,
      }}
    >
      {faceUp ? (
        <>
          {/* Corner labels — top left */}
          <Box
            sx={{
              position: 'absolute',
              top: mini ? 4 : 7,
              left: mini ? 5 : 8,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              lineHeight: 1,
              zIndex: 1,
            }}
          >
            <Typography sx={{ fontSize: mini ? 12 : 16, fontWeight: 800, fontFamily: '"Sora", "Inter", sans-serif', lineHeight: 1 }}>
              {rankLabel(r)}
            </Typography>
            <Typography sx={{ fontSize: mini ? 9 : 12, lineHeight: 1.3 }}>{sym}</Typography>
          </Box>

          {/* Corner labels — bottom right (inverted) */}
          <Box
            sx={{
              position: 'absolute',
              bottom: mini ? 4 : 7,
              right: mini ? 5 : 8,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              lineHeight: 1,
              transform: 'rotate(180deg)',
              zIndex: 1,
            }}
          >
            <Typography sx={{ fontSize: mini ? 12 : 16, fontWeight: 800, fontFamily: '"Sora", "Inter", sans-serif', lineHeight: 1 }}>
              {rankLabel(r)}
            </Typography>
            <Typography sx={{ fontSize: mini ? 9 : 12, lineHeight: 1.3 }}>{sym}</Typography>
          </Box>

          {/* Center content */}
          {!mini && isAce && <AceDesign suit={s} color={color} />}
          {!mini && isFace && <FaceDesign suit={s} rank={r} color={color} />}
          {!mini && !isAce && !isFace && <NumberPips suit={s} rank={r} color={color} />}
          {mini && (
            <Typography sx={{ fontSize: 24, lineHeight: 1, mt: 1 }}>{sym}</Typography>
          )}
        </>
      ) : (
        <Box
          sx={{
            position: 'absolute',
            inset: mini ? 4 : 7,
            borderRadius: mini ? 4 : 6,
            border: '1px solid rgba(230,178,60,0.5)',
            background: 'repeating-linear-gradient(45deg, rgba(255,255,255,0.03) 0 6px, transparent 6px 12px)',
            display: 'grid',
            placeItems: 'center',
            color: 'rgba(230,178,60,0.55)',
            fontSize: mini ? 16 : 26,
            pointerEvents: 'none',
          }}
        >
          ♠
        </Box>
      )}
    </Box>
  );
}
