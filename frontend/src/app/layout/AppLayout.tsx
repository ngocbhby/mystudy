import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown'
import { AppBar, Box, Button, Container, Menu, MenuItem, Toolbar, Typography } from '@mui/material'
import { useState } from 'react'
import { Link as RouterLink, NavLink, Outlet } from 'react-router'
import { paths } from '@/app/router/paths'
import { useLogout, useSession } from '@/features/auth/hooks/useSession'

const nav = [
  { to: paths.overview, label: 'Tổng quan' },
  { to: paths.plan, label: 'Lộ trình' },
  { to: paths.exams, label: 'Kho đề thi' },
  { to: paths.practice, label: 'Thi thử' },
] as const

function AccountMenu() {
  const { data } = useSession()
  const logout = useLogout()
  const [anchor, setAnchor] = useState<HTMLElement | null>(null)
  const user = data?.user

  if (!user) return <Button component={RouterLink} to={paths.home} variant="outlined" size="small">Đăng nhập</Button>

  return (
    <>
      <Button size="small" endIcon={<KeyboardArrowDownIcon />} onClick={(e) => setAnchor(e.currentTarget)}>Tài khoản</Button>
      <Menu anchorEl={anchor} open={!!anchor} onClose={() => setAnchor(null)}>
        <Typography sx={{ px: 2, py: 1 }} color="text.secondary">{user.displayName || user.email || 'Tài khoản MyStudy'}</Typography>
        <MenuItem disabled={logout.isPending} onClick={() => logout.mutate(undefined, { onSettled: () => setAnchor(null) })}>
          {logout.isPending ? 'Đang đăng xuất…' : 'Đăng xuất'}
        </MenuItem>
        {logout.isError && <Typography role="alert" color="error" sx={{ px: 2, py: 1 }} variant="body2">{logout.error.message}</Typography>}
      </Menu>
    </>
  )
}

/** Khung chung cho các trang bên trong ứng dụng: thanh điều hướng + vùng nội dung. */
export function AppLayout() {
  return (
    <Box sx={{ minHeight: '100svh', bgcolor: 'background.default' }}>
      <AppBar position="sticky" color="inherit" elevation={0} sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Toolbar sx={{ gap: 3, flexWrap: 'wrap' }}>
          <Typography component={RouterLink} to={paths.overview} variant="h2" color="primary" sx={{ textDecoration: 'none', fontWeight: 700 }}>
            MyStudy
          </Typography>
          <Box component="nav" aria-label="Điều hướng chính" sx={{ display: 'flex', gap: 0.5, flexGrow: 1, flexWrap: 'wrap' }}>
            {nav.map(({ to, label }) => (
              <Button key={to} component={NavLink} to={to} end={to === paths.practice ? false : true}
                sx={{ color: 'text.secondary', '&.active': { color: 'primary.main', bgcolor: 'action.selected' } }}>
                {label}
              </Button>
            ))}
            <Button disabled title="Chưa mở">Kho bài mẫu</Button>
          </Box>
          <AccountMenu />
        </Toolbar>
      </AppBar>
      <Container component="main" maxWidth="lg" sx={{ py: 4 }}>
        <Outlet />
      </Container>
    </Box>
  )
}
