import { createTheme } from '@mui/material/styles'

/** Token màu của thiết kế MyStudy (lavender + tím). */
export const colors = {
  paper: '#fdfdfd',
  surface: '#f7f6fb',
  tile: '#f5f3f9',
  lavender: '#eee8fa',
  purple: '#6d4dd6',
  purpleDark: '#5b3dc1',
  ink: '#252237',
  muted: '#706e82',
  border: '#e8e3f2',
  successBg: '#e8f3ea',
  successText: '#2f6f45',
  warningBg: '#fdf3d4',
  warningText: '#735200',
  danger: '#c13b3b',
} as const

declare module '@mui/material/Button' {
  interface ButtonPropsVariantOverrides {
    soft: true
  }
}

/** Bảng màu, kiểu chữ và kiểu thành phần MUI theo thiết kế (nút chữ nhật bo góc, thẻ viền mảnh, chip lavender). */
export const theme = createTheme({
  palette: {
    primary: { main: colors.purple, dark: colors.purpleDark, light: '#8d72e6', contrastText: '#ffffff' },
    success: { main: colors.successText },
    background: { default: colors.surface, paper: '#ffffff' },
    text: { primary: colors.ink, secondary: colors.muted },
    divider: colors.border,
  },
  // Hệ số của sx `borderRadius`: 1 = 4px (vd. borderRadius: 4 -> 16px).
  shape: { borderRadius: 4 },
  typography: {
    fontFamily: "'Be Vietnam Pro', system-ui, sans-serif",
    h1: {
      fontSize: 'clamp(1.9rem, 3.2vw, 2.5rem)',
      fontWeight: 700,
      letterSpacing: '-0.02em',
      lineHeight: 1.2,
    },
    h2: { fontSize: '1.3rem', fontWeight: 600, lineHeight: 1.3 },
    h3: { fontSize: '1.05rem', fontWeight: 600 },
    subtitle1: { color: colors.muted },
    overline: { fontSize: '0.72rem', fontWeight: 500, letterSpacing: '0.04em', lineHeight: 1.6 },
    button: { textTransform: 'none', fontWeight: 600 },
  },
  components: {
    MuiCssBaseline: { styleOverrides: { body: { backgroundColor: colors.surface } } },
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: { root: { borderRadius: 10, paddingInline: 20 } },
      variants: [
        {
          props: { variant: 'soft' },
          style: {
            backgroundColor: colors.lavender,
            color: colors.purple,
            '&:hover': { backgroundColor: '#e3dbf6' },
          },
        },
      ],
    },
    MuiCard: {
      defaultProps: { variant: 'outlined' },
      styleOverrides: { root: { borderRadius: 18, borderColor: colors.border, backgroundColor: '#fff' } },
    },
    MuiChip: { styleOverrides: { root: { borderRadius: 10, fontWeight: 600 } } },
    MuiTextField: { defaultProps: { size: 'small', fullWidth: true } },
    MuiOutlinedInput: { styleOverrides: { root: { borderRadius: 12, backgroundColor: '#fff' } } },
    MuiMenu: {
      styleOverrides: {
        paper: {
          borderRadius: 18,
          border: `1px solid ${colors.border}`,
          boxShadow: '0 12px 32px rgba(37,34,55,.12)',
        },
      },
    },
    MuiLinearProgress: {
      styleOverrides: {
        root: { backgroundColor: colors.lavender, borderRadius: 4 },
        bar: { borderRadius: 4 },
      },
    },
  },
})
