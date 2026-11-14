import { Box, Link, Typography } from '@mui/material'
import { Link as RouterLink, useSearchParams } from 'react-router'
import { paths } from '@/app/router/paths'
import { colors } from '@/app/theme/theme'
import { StudyWeekPreview } from '@/features/study/components/StudyWeekPreview'
import { useDocumentTitle } from '@/shared/hooks/useDocumentTitle'
import { SignInPanel } from '../components/SignInPanel'

export default function LoginPage() {
  useDocumentTitle('Đăng nhập')
  const [params] = useSearchParams()

  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', md: '52.85fr 47.15fr' },
        minHeight: '100svh',
        bgcolor: '#fff',
      }}
    >
      <Box
        sx={{
          bgcolor: colors.lavender,
          px: { xs: 3, md: 8 },
          py: { xs: 4, md: 8 },
          display: 'flex',
          flexDirection: 'column',
          gap: 4,
          order: { xs: 2, md: 1 },
        }}
      >
        <Typography
          sx={{ color: 'primary.main', fontWeight: 700, fontSize: '2rem', letterSpacing: '-0.02em' }}
        >
          MyStudy
        </Typography>
        <Box
          sx={{ display: 'flex', flexDirection: 'column', gap: 3, alignItems: 'flex-start', maxWidth: 600 }}
        >
          <Box
            sx={{
              bgcolor: '#fff',
              color: 'primary.main',
              borderRadius: 99,
              px: 1.75,
              py: 1,
              fontSize: 12,
              fontWeight: 500,
              textTransform: 'uppercase',
              mt: 3,
            }}
          >
            Cùng bạn về đích THPT
          </Box>
          <Typography
            variant="h1"
            component="h2"
            sx={{ fontSize: 'clamp(2.2rem, 4vw, 3.4rem)', lineHeight: 1.35 }}
          >
            Mỗi ngày một chút.
            <br />
            Tương lai gần hơn.
          </Typography>
          <Typography color="text.secondary" sx={{ fontSize: '1.05rem' }}>
            Một lộ trình vừa sức, một mục tiêu rõ ràng.
            <br />
            Bắt đầu từ thời gian bạn có hôm nay.
          </Typography>
          <StudyWeekPreview />
          <Typography variant="overline" color="primary">
            Học đều đặn / Tiến bộ bền vững ·{' '}
            <Link component={RouterLink} to={paths.exams} underline="hover">
              Kho đề thi
            </Link>
          </Typography>
        </Box>
      </Box>
      <Box
        sx={{
          px: { xs: 3, md: 10 },
          py: { xs: 5, md: 8 },
          display: 'flex',
          alignItems: 'center',
          order: { xs: 1, md: 2 },
        }}
      >
        <SignInPanel authResult={params.get('auth')} />
      </Box>
    </Box>
  )
}
