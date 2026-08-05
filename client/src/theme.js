import { createTheme } from '@mui/material/styles';

// Premium card-table theme: deep felt green, warm accents, serif headings.
export const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: { main: '#d4a843' },      // warm gold
    secondary: { main: '#7fb3a0' },     // light felt
    background: {
      default: '#1a2b22',              // deep forest green
      paper: '#223529',
    },
    text: {
      primary: '#f0ece2',              // warm cream
      secondary: '#a8b8ae',
    },
  },
  shape: { borderRadius: 10 },
  typography: {
    fontFamily: '"Georgia", "Garamond", "Times New Roman", serif',
    h1: { fontFamily: '"Georgia", serif', fontWeight: 700, letterSpacing: 1 },
    h2: { fontFamily: '"Georgia", serif', fontWeight: 700, letterSpacing: 1 },
    h3: { fontFamily: '"Georgia", serif', fontWeight: 700, letterSpacing: 1 },
    h4: { fontFamily: '"Georgia", serif', fontWeight: 600 },
    h5: { fontFamily: '"Georgia", serif', fontWeight: 600 },
    h6: { fontFamily: '"Helvetica Neue", "Segoe UI", sans-serif', fontWeight: 700, letterSpacing: 1.5 },
    subtitle1: { fontFamily: '"Helvetica Neue", sans-serif', fontWeight: 600 },
    subtitle2: { fontFamily: '"Helvetica Neue", sans-serif', fontWeight: 600, fontStyle: 'italic' },
    body1: { fontFamily: '"Helvetica Neue", "Segoe UI", sans-serif' },
    body2: { fontFamily: '"Helvetica Neue", "Segoe UI", sans-serif' },
    button: { fontFamily: '"Helvetica Neue", sans-serif', fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase' },
    caption: { fontFamily: '"Helvetica Neue", sans-serif', fontWeight: 500 },
    overline: { fontFamily: '"Helvetica Neue", sans-serif', fontWeight: 600, letterSpacing: 2 },
  },
  components: {
    MuiChip: {
      styleOverrides: {
        root: { fontFamily: '"Helvetica Neue", sans-serif', fontWeight: 600 },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: { borderRadius: 8 },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: { backgroundImage: 'none' },
      },
    },
  },
});
