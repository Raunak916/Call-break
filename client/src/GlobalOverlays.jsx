import { Alert, Box, Snackbar } from '@mui/material';
import { useGame } from './GameContext.jsx';

/**
 * App-wide chrome: a banner while the socket is down (so a disconnect doesn't
 * look like a frozen screen) and a toast for server notices (e.g. "X
 * disconnected — a bot is playing their seat").
 */
export default function GlobalOverlays() {
  const { connected, notice, clearNotice } = useGame();

  return (
    <>
      {!connected && (
        <Box sx={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 2000 }}>
          <Alert severity="warning" variant="filled" sx={{ borderRadius: 0, justifyContent: 'center', boxShadow: '0 2px 12px rgba(0,0,0,0.4)' }}>
            Connection lost — reconnecting… your seat is held for a short grace period.
          </Alert>
        </Box>
      )}

      <Snackbar
        open={!!notice}
        autoHideDuration={5000}
        onClose={clearNotice}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          severity={notice?.kind === 'error' ? 'error' : notice?.kind === 'success' ? 'success' : 'info'}
          variant="filled"
          onClose={clearNotice}
          sx={{ minWidth: 280 }}
        >
          {notice?.message}
        </Alert>
      </Snackbar>
    </>
  );
}
