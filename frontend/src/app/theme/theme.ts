import { createTheme } from '@mui/material/styles'

/** Bảng màu thương hiệu MyStudy (tím lavender) áp dụng cho toàn bộ MUI. */
export const theme = createTheme({
  palette: {
    primary: { main: '#6d4dd6', dark: '#5b3dc1', light: '#8d72e6', contrastText: '#ffffff' },
    secondary: { main: '#2e7d4f' },
    background: { default: '#fdfdfd', paper: '#ffffff' },
    text: { primary: '#252237', secondary: '#706e82' },
    divider: '#e8e3f2',
  },
  shape: { borderRadius: 14 },
  typography: {
    fontFamily: "'Be Vietnam Pro', system-ui, sans-serif",
    h1: { fontSize: 'clamp(1.75rem, 3vw, 2.4rem)', fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1.2 },
    h2: { fontSize: '1.25rem', fontWeight: 600 },
    h3: { fontSize: '1.05rem', fontWeight: 600 },
    button: { textTransform: 'none', fontWeight: 600 },
  },
  components: {
    MuiButton: { defaultProps: { disableElevation: true }, styleOverrides: { root: { borderRadius: 999 } } },
    MuiCard: { defaultProps: { variant: 'outlined' } },
    MuiTextField: { defaultProps: { size: 'small', fullWidth: true } },
  },
})
