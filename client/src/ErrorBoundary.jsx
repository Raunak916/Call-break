import { Component } from 'react';
import { Box, Button, Typography } from '@mui/material';

/**
 * Last line of defense: without a boundary, any render error unmounts the whole
 * React tree and leaves a blank white screen. This catches those errors, shows
 * a friendly message, and offers a reload instead.
 */
export default class ErrorBoundary extends Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary] Unhandled render error:', error, info);
  }

  handleReload = () => {
    this.setState({ error: null });
    window.location.reload();
  };

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'grid',
          placeItems: 'center',
          p: 3,
          bgcolor: 'background.default',
        }}
      >
        <Box sx={{ maxWidth: 420, textAlign: 'center' }}>
          <Typography
            variant="h5"
            sx={{ mb: 1, fontFamily: '"Sora", "Inter", sans-serif', fontWeight: 700 }}
          >
            Something went wrong
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 0.5 }}>
            Your seat is still held for a short grace period.
          </Typography>
          <Typography
            color="text.disabled"
            sx={{ mb: 3, fontSize: 12, wordBreak: 'break-word' }}
          >
            {String(this.state.error?.message || this.state.error)}
          </Typography>
          <Button variant="contained" size="large" onClick={this.handleReload}>
            Reload
          </Button>
        </Box>
      </Box>
    );
  }
}
