import { Box, Button, Card, Stack, Typography } from '@mui/material'
import { Link as RouterLink, Navigate, useParams } from 'react-router'
import { paths } from '@/app/router/paths'
import { useSession } from '@/features/auth/hooks/useSession'
import { subjectName } from '@/features/study/model/catalog'
import { ErrorNotice } from '@/shared/components/ErrorNotice'
import { LoadingState } from '@/shared/components/LoadingState'
import { MathText } from '@/shared/components/MathText'
import { PageHeader } from '@/shared/components/PageHeader'
import { useDocumentTitle } from '@/shared/hooks/useDocumentTitle'
import { PracticeSheet } from '../components/PracticeSheet'
import { ownerOf } from '../model/practice-storage'
import { useExamDetail, useExamList } from '../hooks/useExams'
import { optionLabel } from '../model/exam-utils'

/** /thi-thu: gợi ý đề trực tuyến đầu tiên. */
export function PracticeIndexPage() {
  useDocumentTitle('Thi thử')
  const list = useExamList({ subject: '', year: '' })
  if (list.isPending) return <LoadingState label="Đang tải đề thi…" />
  if (list.isError) return <ErrorNotice error={list.error} onRetry={() => void list.refetch()} />
  const exam = list.data.exams.find((e) => e.questionCount > 0)
  if (exam) return <Navigate to={paths.exam(exam.id)} replace />
  return (
    <Card sx={{ p: 3 }}>
      <Typography variant="h1" component="h1" sx={{ mb: 2 }}>
        Thi thử
      </Typography>
      <Typography>Chưa có đề trực tuyến.</Typography>
    </Card>
  )
}

/** /thi-thu/:id[/de|/dap-an]: luyện tập, xem đề hoặc xem đáp án. */
export default function ExamPracticePage() {
  const { id, view } = useParams<{ id: string; view?: 'de' | 'dap-an' }>()
  const session = useSession()
  const isAdmin = session.data?.user?.role?.toUpperCase() === 'ADMIN'
  const owner = ownerOf(session.data?.user?.id)
  const showAnswers = view === 'dap-an' && isAdmin
  // Đáp án chỉ dành cho quản trị; học sinh xem lời giải sau khi nộp bài (không lộ đáp án trước khi thi).
  const answersLocked = view === 'dap-an' && !session.isPending && !isAdmin
  const detail = useExamDetail(answersLocked ? undefined : id, showAnswers)
  useDocumentTitle(detail.data ? detail.data.exam.title : 'Thi thử')

  if (answersLocked && id) {
    return (
      <Card sx={{ p: 3.5 }}>
        <Typography variant="h1" component="h1" sx={{ mb: 1.5 }}>
          Đáp án hiển thị sau khi nộp bài
        </Typography>
        <Typography color="text.secondary" sx={{ mb: 2.5 }}>
          Để bài thi thử phản ánh đúng năng lực, đáp án và lời giải chi tiết chỉ hiện sau khi bạn làm và nộp bài.
        </Typography>
        <Button component={RouterLink} to={paths.exam(id)} variant="contained">
          Làm bài ngay
        </Button>
      </Card>
    )
  }
  if (detail.isPending || session.isPending) return <LoadingState label="Đang tải đề thi…" />
  if (detail.isError) return <ErrorNotice error={detail.error} onRetry={() => void detail.refetch()} />

  const { exam, questions } = detail.data
  if (!view) {
    return (
      <Stack spacing={3.5}>
        <PageHeader
          eyebrow="LUYỆN NHƯ THI THẬT"
          title="Thi thử, hiểu rõ mình hơn."
          description={`${subjectName(exam.subjectCode)} · ${exam.title} · Nguồn: ${exam.source}`}
        />
        {/* Đổi tài khoản thì dựng lại phần thi để không dùng bài làm, kết quả lưu của người trước. */}
        <PracticeSheet key={`${exam.id}-${owner}`} exam={exam} questions={questions} owner={owner} />
      </Stack>
    )
  }

  return (
    <Stack spacing={3}>
      <PageHeader
        title={`${showAnswers ? 'Đáp án · ' : ''}${exam.title}`}
        description={`${subjectName(exam.subjectCode)} · ${exam.questionCount} câu · ${exam.durationMinutes} phút · ${exam.source}`}
        actions={
          <Button component={RouterLink} to={paths.exams} variant="outlined">
            ← Kho đề thi
          </Button>
        }
      />
      <Card component="section" aria-label={showAnswers ? 'Đáp án' : 'Nội dung đề'} sx={{ p: 3 }}>
        <Stack spacing={3}>
          {questions.map((question) => (
            <Box key={question.number} component="section">
              <Typography variant="h3" component="h2">
                Câu {question.number}. <MathText text={question.prompt} inline />
              </Typography>
              <Box component="ul" sx={{ pl: 2.5, mt: 0.5 }}>
                {question.options.map((option) => {
                  const correct = question.correctOption === option.number
                  return (
                    <Typography
                      component="li"
                      key={option.number}
                      sx={{ color: correct ? 'success.main' : 'inherit', fontWeight: correct ? 700 : 400 }}
                    >
                      {optionLabel(option.number)}. {option.text}
                      {correct && ' ✓ Đáp án đúng'}
                    </Typography>
                  )
                })}
              </Box>
              {showAnswers && question.explanation && (
                <Box
                  sx={{
                    mt: 1.5,
                    p: 1.5,
                    bgcolor: 'rgba(109, 77, 214, 0.05)',
                    borderRadius: 2,
                    border: '1px solid rgba(109, 77, 214, 0.2)',
                  }}
                >
                  <Typography variant="caption" sx={{ fontWeight: 700, color: 'primary.main', display: 'block', mb: 0.5 }}>
                    💡 Cách giải chi tiết:
                  </Typography>
                  <MathText text={question.explanation} sx={{ fontSize: '0.875rem', whiteSpace: 'pre-line' }} />
                </Box>
              )}
            </Box>
          ))}
        </Stack>
      </Card>
    </Stack>
  )
}
