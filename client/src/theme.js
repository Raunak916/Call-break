import { createTheme } from '@mui/material/styles';

// Premium felt + gold design system.
// Deep ink-felt backgrounds, rich gold primary, mint secondary; Sora for
// display, Inter for UI. All tokens live here so components reference theme
// values instead of hardcoded hex/fonts.

export const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: { main: '#e6b23c', light: '#f2c14e', dark: '#c9962e', contrastText: '#1c1507' },
    secondary: { main: '#3ddc97', light: '#6ce7b2', dark: '#2bb579', contrastText: '#07160f' },
    success: { main: '#4ade80' },
    error: { main: '#ff6b6b' },
    warning: { main: '#fbbf24' },
    info: { main: '#7cc4ff' },
    background: {
      default: '#0a0e0b',
      paper: '#111713',
    },
    text: {
      primary: '#f6f3ea',
      secondary: '#9aa79d',
      disabled: '#56615a',
    },
    divider: 'rgba(255,255,255,0.08)',
  },

  shape: { borderRadius: 8 },

  typography: {
    fontFamily: '"Inter", "Segoe UI", system-ui, sans-serif',
    h1: { fontFamily: '"Sora", "Inter", sans-serif', fontWeight: 700, letterSpacing: '-0.02em' },
    h2: { fontFamily: '"Sora", "Inter", sans-serif', fontWeight: 700, letterSpacing: '-0.02em' },
    h3: { fontFamily: '"Sora", "Inter", sans-serif', fontWeight: 700, letterSpacing: '-0.01em' },
    h4: { fontFamily: '"Sora", "Inter", sans-serif', fontWeight: 700, letterSpacing: '-0.01em' },
    h5: { fontFamily: '"Sora", "Inter", sans-serif', fontWeight: 700 },
    h6: { fontFamily: '"Sora", "Inter", sans-serif', fontWeight: 600 },
    subtitle1: { fontWeight: 600 },
    subtitle2: { fontWeight: 600, fontSize: '0.8125rem' },
    body1: {},
    body2: {},
    button: { fontWeight: 600, letterSpacing: '0.02em', textTransform: 'none' },
    caption: { fontWeight: 500 },
    overline: { fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', fontSize: '0.6875rem' },
  },

  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          padding: '8px 18px',
          textTransform: 'none',
          fontWeight: 600,
          transition: 'all 0.2s ease',
        },
        containedPrimary: {
          background: 'linear-gradient(135deg, #f2c14e 0%, #d9a832 100%)',
          color: '#1c1507',
          boxShadow: '0 6px 20px rgba(230,178,60,0.28)',
          '&:hover': {
            background: 'linear-gradient(135deg, #f7cd63 0%, #e0b03a 100%)',
            boxShadow: '0 8px 26px rgba(230,178,60,0.38)',
            transform: 'translateY(-1px)',
          },
        },
        outlinedPrimary: {
          borderColor: 'rgba(230,178,60,0.5)',
          '&:hover': { borderColor: 'rgba(230,178,60,0.9)', bgcolor: 'rgba(230,178,60,0.08)' },
        },
        text: { '&:hover': { bgcolor: 'rgba(255,255,255,0.06)' } },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { borderRadius: 999, fontWeight: 600 },
        filled: { bgcolor: 'rgba(255,255,255,0.07)' },
        outlined: { borderColor: 'rgba(255,255,255,0.16)' },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: { backgroundImage: 'none', borderRadius: 10 },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: { backgroundImage: 'none' },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 14,
          backgroundImage: 'none',
          backgroundColor: '#101611',
          border: '1px solid rgba(255,255,255,0.08)',
          boxShadow: '0 24px 80px rgba(0,0,0,0.55)',
        },
        backdrop: { bgcolor: 'rgba(4,7,5,0.72)', backdropFilter: 'blur(6px)' },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: '#0d130f',
          backgroundImage: 'none',
          borderLeft: '1px solid rgba(255,255,255,0.08)',
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: { borderRadius: 8 },
        filledSuccess: { bgcolor: '#1f8a55' },
        filledError: { bgcolor: '#c94444' },
        filledWarning: { bgcolor: '#a97b12' },
        filledInfo: { bgcolor: '#2f6ea8' },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 8,
            backgroundColor: 'rgba(255,255,255,0.04)',
          },
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: { borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.04)' },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: { borderRadius: 6, fontSize: '0.75rem' },
      },
    },
    MuiSlider: {
      styleOverrides: {
        root: { color: '#e6b23c' },
        thumb: { boxShadow: '0 0 0 4px rgba(230,178,60,0.18)' },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: { borderColor: 'rgba(255,255,255,0.07)' },
        head: { fontWeight: 600 },
      },
    },
  },
});
