import { Box, Button, Card, Stack, Typography } from '@mui/material'
import { Link as RouterLink } from 'react-router'
import { paths } from '@/app/router/paths'
import { subjectName } from '@/features/study/model/catalog'
import { safeDocumentUrl } from '../model/exam-utils'
import type { ExamSummary } from '../model/types'

export function ExamCard({ exam }: { exam: ExamSummary }) {
  const online = exam.questionCount > 0
  const practice = exam.kind === 'mystudy_practice'
  const subject = subjectName(exam.subjectCode)
  const paper = safeDocumentUrl(exam.paperUrl)
  const answers = safeDocumentUrl(exam.answerUrl)

  return (
    <Card component="article" sx={{ p: 2.5, display: 'flex', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap', borderColor: online ? 'primary.main' : 'divider' }}>
      <Box>
        <Typography variant="overline" color={online ? 'primary' : 'text.secondary'}>
          {online ? 'Đề trực tuyến / Chấm tự động' : [subject, exam.year].filter(Boolean).join(' / ')}
        </Typography>
        <Typography variant="h2">{online ? `${subject} · ` : ''}{exam.title}</Typography>
        <Typography variant="body2" color="text.secondary">
          {online
            ? [exam.year, `${exam.questionCount} câu trắc nghiệm`, `${exam.durationMinutes} phút`, 'Thang điểm 10'].filter(Boolean).join(' · ')
            : `${exam.durationMinutes} phút · Bản PDF`}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Nguồn: {exam.source} · {practice ? 'Đề luyện minh họa' : `Đề tham khảo ${exam.year}`}
        </Typography>
      </Box>
      <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
        {online && <Button component={RouterLink} to={paths.exam(exam.id)} variant="contained">Thi thử →</Button>}
        {paper && <Button href={paper} target="_blank" rel="noopener noreferrer" aria-label={`Xem đề: ${subject}`}>Xem đề</Button>}
        {answers && <Button href={answers} target="_blank" rel="noopener noreferrer" aria-label={`Xem đáp án: ${subject}`}>Xem đáp án</Button>}
      </Stack>
    </Card>
  )
}
