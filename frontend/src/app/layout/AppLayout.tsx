import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown'
import { Box, Button, Container, Divider, Link, Menu, Typography } from '@mui/material'
import { useState } from 'react'
import { Link as RouterLink, NavLink, Outlet } from 'react-router'
import { paths } from '@/app/router/paths'
import { colors } from '@/app/theme/theme'
import { useLogout, useSession } from '@/features/auth/hooks/useSession'

const nav = [
  { to: paths.overview, label: 'Tổng quan' },
  { to: paths.plan, label: 'Lộ trình' },
  { to: paths.analysis, label: 'Phân tích' },
  { to: paths.exams, label: 'Kho đề thi' },
  { to: paths.samples, label: 'Kho bài mẫu' },
  { to: paths.practice, label: 'Thi thử' },
] as const

function AccountMenu() {
  const { data } = useSession()
  const logout = useLogout()
  const [anchor, setAnchor] = useState<HTMLElement | null>(null)
  const user = data?.user

  if (!user)
    return (
      <Button component={RouterLink} to={paths.home} variant="soft">
        Đăng nhập
      </Button>
    )

  return (
    <>
      <Button
        color="inherit"
        endIcon={<KeyboardArrowDownIcon />}
        onClick={(e) => setAnchor(e.currentTarget)}
        sx={{ color: 'text.primary' }}
      >
        Tài khoản
      </Button>
      <Menu
        anchorEl={anchor}
        open={!!anchor}
        onClose={() => setAnchor(null)}
        slotProps={{ paper: { sx: { minWidth: 260, p: 1 } } }}
      >
        <Box sx={{ px: 2, py: 1.5 }}>
          <Typography sx={{ fontWeight: 700, fontSize: '1.05rem' }}>Tài khoản của bạn</Typography>
          <Typography variant="body2" color="text.secondary" noWrap>
            {user.displayName || user.email || 'Tài khoản MyStudy'}
          </Typography>
        </Box>
        <Box sx={{ px: 2, pb: 1.5, display: 'grid', gap: 1.25 }}>
          <Link
            component={RouterLink}
            to={paths.goal}
            underline="none"
            onClick={() => setAnchor(null)}
            sx={{ fontWeight: 600 }}
          >
            Quản lí mục tiêu
          </Link>
          {user.role?.toUpperCase() === 'ADMIN' && (
            <Link
              component={RouterLink}
              to={paths.adminExams}
              underline="none"
              onClick={() => setAnchor(null)}
              sx={{ fontWeight: 600, color: 'primary.main' }}
            >
              Quản trị đề thi
            </Link>
          )}
          <Link
            component="button"
            type="button"
            underline="none"
            disabled={logout.isPending}
            onClick={() => logout.mutate(undefined, { onSettled: () => setAnchor(null) })}
            sx={{ color: colors.danger, fontWeight: 600, textAlign: 'left', font: 'inherit' }}
          >
            {logout.isPending ? 'Đang đăng xuất…' : 'Đăng xuất'}
          </Link>
          {logout.isError && (
            <Typography role="alert" color="error" variant="body2">
              {logout.error.message}
            </Typography>
          )}
        </Box>
        <Divider />
      </Menu>
    </>
  )
}

/** Khung chung: thanh điều hướng trắng + vùng nội dung nền lavender nhạt. */
export function AppLayout() {
  const { data } = useSession()
  const isAdmin = data?.user?.role?.toUpperCase() === 'ADMIN'

  const navigationItems = [
    ...nav,
    ...(isAdmin ? [{ to: paths.adminExams, label: 'Quản trị' }] : []),
  ]

  return (
    <Box sx={{ minHeight: '100svh', bgcolor: 'background.default' }}>
      <Box component="header" sx={{ bgcolor: '#fff' }}>
        <Container
          maxWidth="lg"
          sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1.5, md: 4 }, flexWrap: 'wrap', py: 1.75 }}
        >
          <Typography
            component={RouterLink}
            to={paths.overview}
            sx={{
              textDecoration: 'none',
              color: 'primary.main',
              fontWeight: 700,
              fontSize: '1.75rem',
              letterSpacing: '-0.02em',
            }}
          >
            MyStudy
          </Typography>
          <Box
            component="nav"
            aria-label="Điều hướng chính"
            sx={{ display: 'flex', gap: 0.5, flexGrow: 1, flexWrap: 'wrap' }}
          >
            {navigationItems.map(({ to, label }) => (
              <Button
                key={to}
                component={NavLink}
                to={to}
                end={false}
                color="inherit"
                sx={{
                  color: 'text.secondary',
                  fontWeight: 500,
                  px: 1.75,
                  borderRadius: 2.5,
                  '&.active': { color: 'primary.main', bgcolor: colors.lavender, fontWeight: 600 },
                }}
              >
                {label}
              </Button>
            ))}
          </Box>
          <AccountMenu />
        </Container>
      </Box>
      <Container component="main" maxWidth="lg" sx={{ py: { xs: 3, md: 5 } }}>
        <Outlet />
      </Container>
    </Box>
  )
}
