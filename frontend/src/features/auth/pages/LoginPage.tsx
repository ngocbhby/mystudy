import { Box, Link, Typography } from '@mui/material'
import { Link as RouterLink, useSearchParams } from 'react-router'
import { paths } from '@/app/router/paths'
import { useDocumentTitle } from '@/shared/hooks/useDocumentTitle'
import { StudyWeekPreview } from '@/features/study/components/StudyWeekPreview'
import { SignInPanel } from '../components/SignInPanel'

export default function LoginPage() {
  useDocumentTitle('Đăng nhập')
  const [params] = useSearchParams()

  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, minHeight: '100svh' }}>
      <Box sx={{ p: { xs: 3, md: 8 }, display: 'flex', flexDirection: 'column', gap: 4, justifyContent: 'center' }}>
        <Typography variant="h2" color="primary" sx={{ fontWeight: 700 }}>MyStudy</Typography>
        <SignInPanel authResult={params.get('auth')} />
      </Box>
      <Box sx={{ bgcolor: 'divider', p: { xs: 3, md: 8 }, display: 'flex', flexDirection: 'column', gap: 3, justifyContent: 'center' }}>
        <Typography variant="overline" color="primary" sx={{ fontWeight: 600 }}>Cùng bạn về đích THPT</Typography>
        <Typography variant="h1" component="h2">Mỗi ngày một chút.<br />Tương lai gần hơn.</Typography>
        <Typography color="text.secondary">
          Một lộ trình vừa sức, một mục tiêu rõ ràng. Bắt đầu từ thời gian bạn có hôm nay.
        </Typography>
        <StudyWeekPreview />
        <Typography variant="caption" color="text.secondary">
          Học đều đặn / Tiến bộ bền vững ·{' '}
          <Link component={RouterLink} to={paths.exams}>Kho đề thi</Link>
        </Typography>
      </Box>
    </Box>
  )
}
