import { Box, Dialog, DialogTitle, Typography } from '@mui/material';

const PALETTE = [
  { color: 'red', bg: 'linear-gradient(135deg, #ff7b7b, #ee5a24)', glow: 'rgba(239,68,68,0.4)' },
  { color: 'blue', bg: 'linear-gradient(135deg, #82c8ff, #0984e3)', glow: 'rgba(59,130,246,0.4)' },
  { color: 'green', bg: 'linear-gradient(135deg, #6ef5c8, #00b894)', glow: 'rgba(34,197,94,0.4)' },
  { color: 'yellow', bg: 'linear-gradient(135deg, #fff3b0, #f0b429)', glow: 'rgba(234,179,8,0.4)' },
];

export default function ColorPicker({ open, onChoose }) {
  return (
    <Dialog open={open} maxWidth="xs" fullWidth
      PaperProps={{ sx: { borderRadius: 5, bgcolor: 'rgba(16,22,18,0.96)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 24px 80px rgba(0,0,0,0.6)' } }}
      slotProps={{ backdrop: { sx: { bgcolor: 'rgba(4,7,5,0.7)', backdropFilter: 'blur(6px)' } } }}>
      <DialogTitle sx={{ textAlign: 'center', pt: 3, pb: 0.5 }}>
        <Typography variant="h6" sx={{ fontFamily: '"Sora", sans-serif', fontWeight: 700, fontSize: 18 }}>Choose a color</Typography>
      </DialogTitle>
      <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2.5, py: 3.5, px: 3 }}>
        {PALETTE.map((p, i) => (
          <Box key={p.color} onClick={() => onChoose(p.color)} sx={{
            width: 68, height: 68, borderRadius: 999, background: p.bg,
            border: '3px solid rgba(255,255,255,0.2)', cursor: 'pointer',
            display: 'grid', placeItems: 'center', boxShadow: `0 4px 16px ${p.glow}`,
            transition: 'all 0.2s cubic-bezier(0.4,0,0.2,1)',
            animation: `colorIn 0.3s cubic-bezier(0.34,1.56,0.64,1) ${i * 0.06}s both`,
            '&:hover': { transform: 'scale(1.15)', boxShadow: `0 0 24px ${p.glow}, 0 0 48px ${p.glow}` },
            '&:active': { transform: 'scale(0.95)' },
          }}>
            <Typography sx={{ color: '#fff', fontWeight: 800, fontSize: 12, textShadow: '0 1px 2px rgba(0,0,0,0.2)', textTransform: 'capitalize' }}>{p.color}</Typography>
          </Box>
        ))}
      </Box>
      <style>{`@keyframes colorIn { 0% { transform: scale(0); opacity: 0; } 100% { transform: scale(1); opacity: 1; } }`}</style>
    </Dialog>
  );
}
