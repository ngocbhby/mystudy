import { Box, Button, Card, Stack, Typography } from '@mui/material'
import { Link as RouterLink } from 'react-router'
import { paths } from '@/app/router/paths'
import { colors } from '@/app/theme/theme'
import { subjectName } from '@/features/study/model/catalog'
import { Kicker } from '@/shared/components/PageHeader'
import { safeDocumentUrl } from '../model/exam-utils'
import type { ExamSummary } from '../model/types'

const light = { bgcolor: '#fff', borderColor: colors.border, color: 'text.primary', fontWeight: 500 } as const

export function ExamCard({ exam }: { exam: ExamSummary }) {
  const online = exam.questionCount > 0
  const practice = exam.kind === 'mystudy_practice'
  const subject = subjectName(exam.subjectCode)
  const paper = safeDocumentUrl(exam.paperUrl)
  const answers = safeDocumentUrl(exam.answerUrl)

  const links = (
    <Stack direction="row" spacing={1.5} sx={{ flexWrap: 'wrap', gap: 1.25 }}>
      {paper && (
        <Button
          variant="outlined"
          href={paper}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Xem đề: ${subject}`}
          sx={light}
        >
          Xem đề
        </Button>
      )}
      {answers && (
        <Button
          variant="outlined"
          href={answers}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Xem đáp án: ${subject}`}
          sx={light}
        >
          Xem đáp án
        </Button>
      )}
    </Stack>
  )

  return (
    <Card
      component="article"
      sx={{
        p: 3.5,
        bgcolor: online ? colors.lavender : '#fff',
        borderColor: online ? colors.lavender : colors.border,
        display: 'flex',
        flexDirection: online ? { xs: 'column', md: 'row' } : 'column',
        justifyContent: 'space-between',
        gap: 3,
      }}
    >
      <Box>
        <Kicker>
          {online ? 'Đề trực tuyến / Chấm tự động' : [subject, exam.year].filter(Boolean).join(' / ')}
        </Kicker>
        <Typography variant="h2" sx={{ mt: 1.5, fontWeight: 600, fontSize: online ? '1.6rem' : '1.35rem' }}>
          {online ? `${subject} · ` : ''}
          {exam.title}
        </Typography>
        <Typography color="text.secondary" sx={{ mt: 1.5 }}>
          {online
            ? [
                exam.year,
                `${exam.questionCount} câu trắc nghiệm`,
                `${exam.durationMinutes} phút`,
                'Thang điểm 10',
              ]
                .filter(Boolean)
                .join(' · ')
            : `${exam.durationMinutes} phút · Bản PDF`}
        </Typography>
        <Typography variant="caption" color="text.secondary" component="p" sx={{ mt: 1.5 }}>
          Nguồn: {exam.source} · {practice ? 'Đề luyện minh họa' : `Đề tham khảo ${exam.year}`}
        </Typography>
      </Box>
      {online ? (
        <Stack spacing={1.25} sx={{ minWidth: 220 }}>
          <Button
            component={RouterLink}
            to={paths.exam(exam.id)}
            variant="contained"
            size="large"
            sx={{ py: 1.4 }}
          >
            Thi thử →
          </Button>
          {links}
        </Stack>
      ) : (
        links
      )}
    </Card>
  )
}
