import { Box, Typography } from '@mui/material';

const C = {
  red:    { bg: 'linear-gradient(155deg, #ff7b7b 0%, #ee5a24 40%, #c0392b 100%)', text: '#fff', shadow: '0 4px 14px rgba(238,90,36,0.35), 0 1px 3px rgba(0,0,0,0.25)', gloss: 'linear-gradient(155deg, rgba(255,255,255,0.32) 0%, rgba(255,255,255,0.06) 35%, transparent 60%)', ring: 'rgba(255,120,100,0.18)' },
  blue:   { bg: 'linear-gradient(155deg, #82c8ff 0%, #0984e3 40%, #2471a3 100%)', text: '#fff', shadow: '0 4px 14px rgba(9,132,227,0.35), 0 1px 3px rgba(0,0,0,0.25)', gloss: 'linear-gradient(155deg, rgba(255,255,255,0.32) 0%, rgba(255,255,255,0.06) 35%, transparent 60%)', ring: 'rgba(130,200,255,0.18)' },
  green:  { bg: 'linear-gradient(155deg, #6ef5c8 0%, #00b894 40%, #27ae60 100%)', text: '#fff', shadow: '0 4px 14px rgba(0,184,148,0.35), 0 1px 3px rgba(0,0,0,0.25)', gloss: 'linear-gradient(155deg, rgba(255,255,255,0.32) 0%, rgba(255,255,255,0.06) 35%, transparent 60%)', ring: 'rgba(110,245,200,0.18)' },
  yellow: { bg: 'linear-gradient(155deg, #fff3b0 0%, #fdcb6e 40%, #f0b429 100%)', text: '#2d3436', shadow: '0 4px 14px rgba(240,180,41,0.35), 0 1px 3px rgba(0,0,0,0.25)', gloss: 'linear-gradient(155deg, rgba(255,255,255,0.38) 0%, rgba(255,255,255,0.08) 35%, transparent 60%)', ring: 'rgba(255,240,170,0.25)' },
  wild:   { bg: 'linear-gradient(155deg, #b8a9fe 0%, #7c3aed 25%, #e17055 50%, #fdcb6e 75%, #00b894 100%)', text: '#fff', shadow: '0 4px 16px rgba(108,92,231,0.35), 0 1px 3px rgba(0,0,0,0.25)', gloss: 'linear-gradient(155deg, rgba(255,255,255,0.28) 0%, rgba(255,255,255,0.04) 40%, transparent 60%)', ring: 'rgba(162,155,254,0.18)' },
};

const SYM = { number: (c) => String(c.value), skip: '⊘', reverse: '⟲', draw2: '+2', wild: '✦', wild_draw4: '+4' };
const SIZES = { mini: { w: 50, h: 72 }, normal: { w: { xs: 62, sm: 76, md: 88 }, h: { xs: 90, sm: 110, md: 126 } } };

function Face({ card, mini }) {
  const s = C[card?.color] || C.wild;
  const sym = SYM[card?.type]?.(card) ?? '?';
  const sz = mini ? SIZES.mini : SIZES.normal;

  return (
    <Box sx={{
      width: sz.w, height: sz.h, borderRadius: mini ? 3.5 : 4.5,
      background: s.bg, color: s.text, position: 'relative', overflow: 'hidden',
      border: '2px solid rgba(255,255,255,0.22)', boxShadow: s.shadow, flexShrink: 0,
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    }}>
      <Box sx={{ position: 'absolute', inset: 0, borderRadius: 'inherit', background: s.gloss, pointerEvents: 'none', zIndex: 2 }} />
      <Box sx={{ position: 'absolute', inset: mini ? 3 : 5, borderRadius: mini ? 2 : 2.5, border: `1.5px solid ${s.ring}`, pointerEvents: 'none', zIndex: 1 }} />
      <Typography sx={{ position: 'absolute', top: mini ? 4 : 7, left: mini ? 5 : 8, fontSize: mini ? 13 : { xs: 17, sm: 20, md: 22 }, fontWeight: 900, lineHeight: 1, zIndex: 3, fontFamily: '"Sora", sans-serif', textShadow: '0 1px 2px rgba(0,0,0,0.18)' }}>{sym}</Typography>
      <Typography sx={{ fontSize: mini ? 22 : { xs: 30, sm: 38, md: 44 }, fontWeight: 900, lineHeight: 1, mt: 0.5, zIndex: 3, fontFamily: '"Sora", sans-serif', textShadow: '0 2px 4px rgba(0,0,0,0.12)' }}>{sym}</Typography>
      <Typography sx={{ position: 'absolute', bottom: mini ? 4 : 7, right: mini ? 5 : 8, fontSize: mini ? 13 : { xs: 17, sm: 20, md: 22 }, fontWeight: 900, lineHeight: 1, transform: 'rotate(180deg)', zIndex: 3, fontFamily: '"Sora", sans-serif', textShadow: '0 1px 2px rgba(0,0,0,0.18)' }}>{sym}</Typography>
    </Box>
  );
}

function Back({ mini }) {
  const sz = mini ? SIZES.mini : SIZES.normal;
  return (
    <Box sx={{
      width: sz.w, height: sz.h, borderRadius: mini ? 3.5 : 4.5,
      background: 'linear-gradient(155deg, #ff7b7b 0%, #ee5a24 40%, #c0392b 100%)',
      border: '2px solid rgba(255,255,255,0.18)', boxShadow: '0 4px 14px rgba(238,90,36,0.3), 0 1px 3px rgba(0,0,0,0.25)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden', flexShrink: 0,
    }}>
      <Box sx={{ position: 'absolute', inset: 0, borderRadius: 'inherit', background: 'linear-gradient(155deg, rgba(255,255,255,0.28) 0%, rgba(255,255,255,0.04) 35%, transparent 60%)', pointerEvents: 'none' }} />
      <Box sx={{ position: 'absolute', inset: mini ? 3 : 5, borderRadius: mini ? 2 : 2.5, border: '1.5px solid rgba(255,255,255,0.18)', pointerEvents: 'none' }} />
      <Box sx={{ position: 'absolute', inset: mini ? 5 : 8, borderRadius: mini ? 1.5 : 2, border: '1px solid rgba(255,255,255,0.1)', background: 'repeating-linear-gradient(45deg, transparent, transparent 3.5px, rgba(255,255,255,0.05) 3.5px, rgba(255,255,255,0.05) 7px)', pointerEvents: 'none' }} />
      <Typography sx={{ fontSize: mini ? 14 : { xs: 18, sm: 22 }, fontWeight: 900, color: '#fff', letterSpacing: 2, textShadow: '0 1px 3px rgba(0,0,0,0.2)', zIndex: 1, fontFamily: '"Sora", sans-serif' }}>UNO</Typography>
    </Box>
  );
}

/**
 * UNO Card — CSS transitions for hover/flip, no framer-motion dependency.
 */
export default function UnoCard({ card, mini = false, faceUp = true, sx }) {
  if (!card && faceUp) return null;

  return (
    <Box sx={{ display: 'inline-flex', flexShrink: 0, perspective: 600, ...sx }}>
      <Box sx={{ transformStyle: 'preserve-3d', position: 'relative', transition: 'transform 0.4s cubic-bezier(0.4,0,0.2,1)', transform: faceUp ? 'rotateY(0deg)' : 'rotateY(180deg)' }}>
        <Box sx={{ backfaceVisibility: 'hidden', position: faceUp ? 'relative' : 'absolute', top: 0, left: 0 }}>
          {faceUp && <Face card={card} mini={mini} />}
        </Box>
        <Box sx={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)', position: !faceUp ? 'relative' : 'absolute', top: 0, left: 0 }}>
          {!faceUp && <Back mini={mini} />}
        </Box>
      </Box>
    </Box>
  );
}
