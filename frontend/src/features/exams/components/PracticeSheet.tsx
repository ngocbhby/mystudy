import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import CancelIcon from '@mui/icons-material/Cancel'
import HelpOutlinedIcon from '@mui/icons-material/HelpOutlined'
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown'
import LightbulbOutlinedIcon from '@mui/icons-material/LightbulbOutlined'
import RadioButtonCheckedIcon from '@mui/icons-material/RadioButtonChecked'
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked'
import {
  Alert,
  Box,
  Button,
  Card,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  MenuItem,
  Select,
  Stack,
  Typography,
} from '@mui/material'
import { useEffect, useEffectEvent, useRef, useState, type ReactNode } from 'react'
import { AiExplainBox } from '@/features/ai/components/AiExplainBox'
import { MathText } from '@/shared/components/MathText'
import { Link as RouterLink, useNavigate } from 'react-router'
import { paths } from '@/app/router/paths'
import { colors } from '@/app/theme/theme'
import { subjectName } from '@/features/study/model/catalog'
import { FieldBox } from '@/shared/components/FieldBox'
import { Kicker } from '@/shared/components/PageHeader'
import { Notice } from '@/shared/components/Notice'
import { examApi } from '../api/exam-api'
import { useExamList, useLatestAttempt } from '../hooks/useExams'
import { optionLabel } from '../model/exam-utils'
import { latestKey, practiceKey, type StorageOwner } from '../model/practice-storage'
import type { AttemptDetail, ExamQuestion, ExamSummary } from '../model/types'

type Phase = 'before' | 'taking' | 'result'

const clock = (seconds: number) => `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`

const lightOutline = {
  bgcolor: '#fff',
  borderColor: colors.border,
  color: 'text.primary',
  fontWeight: 500,
} as const

function formatDateTime(isoString: string): string {
  try {
    const d = new Date(isoString)
    return d.toLocaleString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  } catch {
    return isoString
  }
}

function Stepper({ phase }: { phase: Phase }) {
  const steps: [Phase, string][] = [
    ['before', 'Trước thi'],
    ['taking', 'Đang thi'],
    ['result', 'Kết quả'],
  ]
  return (
    <Box
      component="ol"
      aria-label="Các bước làm bài"
      sx={{
        display: 'flex',
        gap: 4,
        bgcolor: colors.lavender,
        borderRadius: 3,
        px: 2.5,
        py: 1.75,
        m: 0,
        listStyle: 'none',
        flexWrap: 'wrap',
      }}
    >
      {steps.map(([key, label], index) => (
        <Typography
          key={key}
          component="li"
          aria-current={phase === key ? 'step' : undefined}
          sx={{
            color: 'primary.main',
            fontWeight: phase === key ? 700 : 500,
            opacity: phase === key ? 1 : 0.7,
          }}
        >
          0{index + 1}&nbsp; {label}
        </Typography>
      ))}
    </Box>
  )
}

function SectionHeading({ index, children }: { index: string; children: string }) {
  return (
    <Typography variant="h2" component="h2" sx={{ fontSize: '1.6rem', fontWeight: 600 }}>
      <Box component="span" sx={{ color: 'text.secondary', fontWeight: 500, mr: 1.5 }}>
        {index}
      </Box>
      {children}
    </Typography>
  )
}

function TipsCard() {
  return (
    <Card sx={{ p: 3.5 }}>
      <Typography variant="h2" sx={{ fontWeight: 600, mb: 2 }}>
        Một lần thử, một lần tiến bộ
      </Typography>
      <Box component="ul" sx={{ pl: 2.25, m: 0, color: 'text.secondary', display: 'grid', gap: 0.5 }}>
        <li>Đồng hồ chạy khi bạn bắt đầu.</li>
        <li>Có thể chuyển câu để xem lại.</li>
        <li>Hết giờ, bài được tự động nộp.</li>
        <li>Kết quả hiện cả đáp án đúng, sai và cách giải chi tiết.</li>
      </Box>
      <Typography variant="caption" color="text.secondary" component="p" sx={{ mt: 3 }}>
        Đề luyện minh họa, không phải đề thi chính thức.
      </Typography>
    </Card>
  )
}

function BeforeExam({
  exam,
  latestAttempt,
  onStart,
  onReviewLatest,
}: {
  exam: ExamSummary
  latestAttempt: AttemptDetail | null
  onStart: () => void
  onReviewLatest: (attempt: AttemptDetail) => void
}) {
  const navigate = useNavigate()
  const list = useExamList({ subject: '', year: '' })
  const online = list.data?.exams.filter((e) => e.questionCount > 0) ?? [exam]
  const subjects = [...new Set(online.map((e) => e.subjectCode))]
  const sameSubject = online.filter((e) => e.subjectCode === exam.subjectCode)
  const selectSx = {
    borderRadius: 3.5,
    '& fieldset': { borderColor: colors.border },
    '& .MuiSelect-select': { py: 1.25 },
  } as const

  return (
    <Box
      sx={{ display: 'grid', gap: 3, gridTemplateColumns: { xs: '1fr', md: '2fr 1fr' }, alignItems: 'start' }}
    >
      <Card sx={{ p: { xs: 2.5, md: 4 } }}>
        <Typography variant="h2" sx={{ fontWeight: 600, mb: 3 }}>
          Bạn muốn thử sức với đề nào?
        </Typography>
        <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', sm: '1fr 2fr' }, mb: 2 }}>
          <Box>
            <Typography id="practice-subject" variant="caption" color="text.secondary">
              Môn thi
            </Typography>
            <Select
              fullWidth
              size="small"
              value={exam.subjectCode}
              IconComponent={KeyboardArrowDownIcon}
              inputProps={{ 'aria-labelledby': 'practice-subject' }}
              sx={selectSx}
              onChange={(e) => {
                const next = online.find((x) => x.subjectCode === e.target.value)
                if (next) void navigate(paths.exam(next.id))
              }}
            >
              {subjects.map((code) => (
                <MenuItem key={code} value={code}>
                  {subjectName(code)}
                </MenuItem>
              ))}
            </Select>
          </Box>
          <Box>
            <Typography id="practice-exam" variant="caption" color="text.secondary">
              Đề thi
            </Typography>
            <Select
              fullWidth
              size="small"
              value={exam.id}
              IconComponent={KeyboardArrowDownIcon}
              inputProps={{ 'aria-labelledby': 'practice-exam' }}
              sx={selectSx}
              onChange={(e) => void navigate(paths.exam(String(e.target.value)))}
            >
              {sameSubject.map((e) => (
                <MenuItem key={e.id} value={e.id}>
                  {e.title}
                </MenuItem>
              ))}
            </Select>
          </Box>
        </Box>
        <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' } }}>
          <FieldBox label="Số câu" value={`${exam.questionCount} câu`} readOnly />
          <FieldBox label="Thời lượng" value={`${exam.durationMinutes} phút`} readOnly />
        </Box>
        <Typography variant="caption" color="text.secondary" component="p" sx={{ my: 2.5 }}>
          Trắc nghiệm 4 lựa chọn · Thang điểm 10 · Không trừ điểm câu sai
        </Typography>

        {latestAttempt ? (
          <Box
            sx={{
              p: 2.5,
              borderRadius: 3,
              bgcolor: 'rgba(109, 77, 214, 0.05)',
              border: '1px solid',
              borderColor: 'rgba(109, 77, 214, 0.25)',
              mb: 2,
            }}
          >
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 1,
                mb: 1.5,
              }}
            >
              <Typography sx={{ fontWeight: 700, color: 'primary.main', fontSize: '1.05rem' }}>
                Kết quả bài làm gần nhất của bạn
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Nộp lúc: {formatDateTime(latestAttempt.submittedAt)}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.5, flexWrap: 'wrap', mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.5 }}>
                <Typography sx={{ fontSize: '1.9rem', fontWeight: 700, color: 'primary.main' }}>
                  {latestAttempt.score.toLocaleString('vi-VN', { maximumFractionDigits: 1 })}
                </Typography>
                <Typography color="text.secondary" sx={{ fontWeight: 500 }}>
                  / 10 điểm
                </Typography>
              </Box>
              <Typography variant="body2" sx={{ color: colors.successText, fontWeight: 600 }}>
                ✓ Đúng {latestAttempt.correctCount} / {latestAttempt.questionCount} câu
              </Typography>
              <Typography variant="body2" sx={{ color: colors.danger, fontWeight: 500 }}>
                ✗ Sai {latestAttempt.incorrectCount} câu
              </Typography>
              {latestAttempt.blankCount > 0 && (
                <Typography variant="body2" sx={{ color: colors.warningText, fontWeight: 500 }}>
                  — Bỏ trống {latestAttempt.blankCount} câu
                </Typography>
              )}
              <Typography variant="body2" color="text.secondary">
                ⏱ Thời gian: {clock(latestAttempt.elapsedSeconds)}
              </Typography>
            </Box>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
              <Button
                variant="contained"
                onClick={() => onReviewLatest(latestAttempt)}
                sx={{ py: 1.25, fontWeight: 600 }}
              >
                Xem lại kết quả & cách giải chi tiết
              </Button>
              <Button
                variant="outlined"
                onClick={onStart}
                sx={{ ...lightOutline, py: 1.25 }}
              >
                Làm bài thi mới
              </Button>
            </Stack>
          </Box>
        ) : (
          <Button fullWidth variant="contained" size="large" onClick={onStart} sx={{ py: 1.6 }}>
            Bắt đầu thi
          </Button>
        )}
      </Card>
      <TipsCard />
    </Box>
  )
}

function ExamRoom({
  questions,
  remaining,
  answers,
  setAnswers,
  grading,
  gradeError,
  onSubmit,
}: {
  questions: ExamQuestion[]
  remaining: number
  answers: Record<number, number>
  setAnswers: (next: (current: Record<number, number>) => Record<number, number>) => void
  grading: boolean
  gradeError: string
  onSubmit: () => void
}) {
  const [index, setIndex] = useState(0)
  const question = questions[index]!
  const blank = questions.filter((q) => answers[q.number] === undefined).map((q) => q.number)
  const locked = grading || remaining === 0

  return (
    <Box
      sx={{ display: 'grid', gap: 3, gridTemplateColumns: { xs: '1fr', md: '2fr 1fr' }, alignItems: 'start' }}
    >
      <Card sx={{ p: { xs: 2.5, md: 4 } }}>
        <Kicker>
          Câu {String(question.number).padStart(2, '0')} / {questions.length}
        </Kicker>
        <Typography variant="h2" component="p" sx={{ fontSize: '1.7rem', fontWeight: 600, mt: 2.5 }}>
          {question.prompt}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2.5, mb: 2 }}>
          Chọn một đáp án đúng.
        </Typography>
        <Box role="radiogroup" aria-label={`Câu ${question.number}`} sx={{ display: 'grid', gap: 1.5 }}>
          {question.options.map((option) => {
            const selected = answers[question.number] === option.number
            return (
              <Box
                key={option.number}
                role="radio"
                aria-checked={selected}
                tabIndex={locked ? -1 : 0}
                aria-disabled={locked}
                onClick={() => {
                  if (!locked) setAnswers((c) => ({ ...c, [question.number]: option.number }))
                }}
                onKeyDown={(e) => {
                  if (!locked && (e.key === ' ' || e.key === 'Enter')) {
                    e.preventDefault()
                    setAnswers((c) => ({ ...c, [question.number]: option.number }))
                  }
                }}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.5,
                  border: 1,
                  borderColor: selected ? 'primary.main' : colors.border,
                  bgcolor: selected ? colors.lavender : '#fff',
                  borderRadius: 3,
                  px: 2.25,
                  py: 1.75,
                  cursor: locked ? 'default' : 'pointer',
                }}
              >
                {selected ? (
                  <RadioButtonCheckedIcon color="primary" fontSize="small" />
                ) : (
                  <RadioButtonUncheckedIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                )}
                <Typography sx={{ fontWeight: 500 }}>{optionLabel(option.number)}</Typography>
                <Typography>{option.text}</Typography>
              </Box>
            )
          })}
        </Box>
        <Stack direction="row" spacing={1.5} sx={{ mt: 3 }}>
          <Button
            variant="outlined"
            disabled={index === 0}
            onClick={() => setIndex((i) => i - 1)}
            sx={lightOutline}
          >
            ← Câu trước
          </Button>
          <Button
            variant="contained"
            disabled={index === questions.length - 1}
            onClick={() => setIndex((i) => i + 1)}
          >
            Câu tiếp →
          </Button>
        </Stack>
      </Card>

      <Card sx={{ p: 3.5 }}>
        <Kicker>Thời gian còn lại</Kicker>
        <Typography
          role="timer"
          aria-label="Thời gian còn lại"
          variant="h1"
          component="p"
          color="primary"
          sx={{ fontSize: '2.8rem', my: 2, fontVariantNumeric: 'tabular-nums' }}
        >
          {clock(remaining)}
        </Typography>
        <Typography sx={{ fontWeight: 600, mb: 2 }}>
          Đã trả lời {questions.length - blank.length} / {questions.length} câu
        </Typography>
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 1, mb: 2 }}>
          {questions.map((q, i) => {
            const current = i === index
            const answered = answers[q.number] !== undefined
            return (
              <Button
                key={q.number}
                aria-label={`Câu ${q.number}${answered ? ' (đã trả lời)' : ''}`}
                aria-current={current ? 'step' : undefined}
                onClick={() => setIndex(i)}
                sx={{
                  minWidth: 0,
                  py: 1,
                  fontWeight: 600,
                  bgcolor: current ? 'primary.main' : answered ? colors.lavender : colors.tile,
                  color: current ? '#fff' : answered ? 'primary.main' : 'text.secondary',
                  '&:hover': { bgcolor: current ? 'primary.dark' : '#e3dbf6' },
                }}
              >
                {q.number}
              </Button>
            )
          })}
        </Box>
        <Typography variant="caption" color="text.secondary" component="p" sx={{ mb: 2 }}>
          Tím nhạt: đã trả lời · Xám: chưa trả lời
        </Typography>
        {blank.length > 0 && (
          <Box sx={{ mb: 2 }}>
            <Notice tone="warning" title={`Bạn còn ${blank.length} câu bỏ trống`}>
              Câu {blank.join(', ')} · Bạn có thể quay lại trước khi nộp.
            </Notice>
          </Box>
        )}
        <Button
          fullWidth
          variant="contained"
          size="large"
          disabled={locked}
          onClick={onSubmit}
          sx={{ py: 1.5 }}
        >
          {grading ? 'Đang chấm…' : 'Nộp bài'}
        </Button>
        {gradeError && (
          <Alert severity="error" role="alert" sx={{ mt: 2 }}>
            {gradeError}
          </Alert>
        )}
      </Card>
    </Box>
  )
}

function ExamResult({
  exam,
  result,
  onRetry,
}: {
  exam: ExamSummary
  result: AttemptDetail
  onRetry: () => void
}) {
  const [filter, setFilter] = useState<'all' | 'wrong' | 'blank' | 'correct'>('all')
  const score = result.score
  const good = score >= 5

  const stat = (label: string, value: ReactNode, color: string) => (
    <Box>
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
      <Typography sx={{ color, fontWeight: 600, fontSize: '2rem', lineHeight: 1.3 }}>{value}</Typography>
    </Box>
  )

  const filteredQuestions = result.questions.filter((q) => {
    if (filter === 'wrong') return q.userOption !== null && !q.isCorrect
    if (filter === 'blank') return q.userOption === null
    if (filter === 'correct') return q.isCorrect
    return true
  })

  return (
    <Stack spacing={3}>
      <Box
        sx={{ display: 'grid', gap: 3, gridTemplateColumns: { xs: '1fr', md: '2fr 1fr' }, alignItems: 'start' }}
      >
        <Card sx={{ p: { xs: 2.5, md: 4 } }}>
          <Box
            role="status"
            sx={{
              bgcolor: good ? colors.successBg : colors.warningBg,
              color: good ? colors.successText : colors.warningText,
              borderRadius: 3.5,
              p: 2.5,
              display: 'flex',
              alignItems: 'center',
              gap: 3,
              flexWrap: 'wrap',
            }}
          >
            <Typography sx={{ fontSize: '2.6rem', fontWeight: 700, lineHeight: 1.2 }}>
              {score.toLocaleString('vi-VN', { maximumFractionDigits: 1 })} / 10
            </Typography>
            <Typography sx={{ fontWeight: 600, fontSize: '1.15rem' }}>
              {score >= 8
                ? 'Xuất sắc! Bạn đang đi đúng hướng.'
                : good
                  ? 'Khá tốt! Hãy xem kỹ các câu sai để bứt phá điểm số nhé.'
                  : 'Đừng nản lòng! Hãy đọc kỹ cách giải bên dưới và thử lại.'}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 5, flexWrap: 'wrap', my: 3 }}>
            {stat('Đúng', result.correctCount, colors.successText)}
            {stat('Sai', result.incorrectCount, colors.danger)}
            {stat('Bỏ trống', result.blankCount, colors.warningText)}
            {stat('Thời gian', clock(result.elapsedSeconds), colors.purple)}
          </Box>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ mt: 3 }}>
            <Button variant="contained" onClick={onRetry}>
              Làm lại đề
            </Button>
            <Button component={RouterLink} to={paths.analysis} variant="outlined" sx={lightOutline}>
              Phân tích điểm yếu
            </Button>
          </Stack>
        </Card>

        <Card sx={{ p: 3.5 }}>
          <Typography variant="h2" sx={{ fontWeight: 600, mb: 1.5 }}>
            Bước tiếp theo
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 2.5 }}>
            Xem lại các câu sai và đọc kỹ lời giải chi tiết ở bên dưới để khắc sâu kiến thức.
          </Typography>
          <Stack spacing={1.25}>
            <Button component={RouterLink} to={paths.plan} variant="soft">
              Quay lại lộ trình
            </Button>
            <Button component={RouterLink} to={paths.exams} variant="outlined" sx={lightOutline}>
              Kho đề thi
            </Button>
          </Stack>
        </Card>
      </Box>

      {/* Chi tiết từng câu hỏi & Cách giải */}
      <Card sx={{ p: { xs: 2.5, md: 4 } }}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 2,
            mb: 3,
            pb: 2,
            borderBottom: '1px solid',
            borderColor: 'divider',
          }}
        >
          <Typography variant="h2" sx={{ fontSize: '1.4rem', fontWeight: 700 }}>
            Chi tiết bài làm & Cách giải từng câu
          </Typography>

          <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 0.5 }}>
            <Button
              size="small"
              variant={filter === 'all' ? 'contained' : 'outlined'}
              onClick={() => setFilter('all')}
              sx={{ borderRadius: 2 }}
            >
              Tất cả ({result.questionCount})
            </Button>
            <Button
              size="small"
              color="error"
              variant={filter === 'wrong' ? 'contained' : 'outlined'}
              onClick={() => setFilter('wrong')}
              sx={{ borderRadius: 2 }}
            >
              Câu sai ({result.incorrectCount})
            </Button>
            {result.blankCount > 0 && (
              <Button
                size="small"
                color="warning"
                variant={filter === 'blank' ? 'contained' : 'outlined'}
                onClick={() => setFilter('blank')}
                sx={{ borderRadius: 2 }}
              >
                Bỏ trống ({result.blankCount})
              </Button>
            )}
            <Button
              size="small"
              color="success"
              variant={filter === 'correct' ? 'contained' : 'outlined'}
              onClick={() => setFilter('correct')}
              sx={{ borderRadius: 2 }}
            >
              Câu đúng ({result.correctCount})
            </Button>
          </Stack>
        </Box>

        <Stack spacing={3.5}>
          {filteredQuestions.map((q) => {
            const isUserWrong = q.userOption !== null && !q.isCorrect

            return (
              <Box
                key={q.number}
                sx={{
                  p: { xs: 2, sm: 3 },
                  borderRadius: 3,
                  border: '1px solid',
                  borderColor: q.isCorrect
                    ? 'rgba(46, 125, 50, 0.3)'
                    : isUserWrong
                      ? 'rgba(211, 47, 47, 0.3)'
                      : 'divider',
                  bgcolor: '#fff',
                }}
              >
                {/* Header câu hỏi */}
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                    gap: 1.5,
                    mb: 2,
                  }}
                >
                  <Typography variant="h3" component="h2" sx={{ fontSize: '1.15rem', fontWeight: 600 }}>
                    Câu {q.number}. {q.prompt}
                  </Typography>

                  {q.isCorrect ? (
                    <Chip
                      icon={<CheckCircleIcon />}
                      label="Làm đúng"
                      color="success"
                      size="small"
                      sx={{ fontWeight: 600, flexShrink: 0 }}
                    />
                  ) : isUserWrong ? (
                    <Chip
                      icon={<CancelIcon />}
                      label="Làm sai"
                      color="error"
                      size="small"
                      sx={{ fontWeight: 600, flexShrink: 0 }}
                    />
                  ) : (
                    <Chip
                      icon={<HelpOutlinedIcon />}
                      label="Chưa làm"
                      color="warning"
                      size="small"
                      sx={{ fontWeight: 600, flexShrink: 0 }}
                    />
                  )}
                </Box>

                {/* 4 Lựa chọn A, B, C, D */}
                <Stack spacing={1.25} sx={{ mb: 2.5 }}>
                  {q.options.map((opt) => {
                    const isCorrectAnswer = opt.number === q.correctOption
                    const isUserChoice = opt.number === q.userOption

                    let borderStyle = '1px solid'
                    let borderColor: string = colors.border
                    let bgColor = '#fff'
                    let labelNode: ReactNode = null

                    if (isCorrectAnswer) {
                      borderStyle = '2px solid'
                      borderColor = colors.successText
                      bgColor = 'rgba(46, 125, 50, 0.08)'
                      labelNode = (
                        <Typography
                          variant="caption"
                          sx={{
                            color: colors.successText,
                            fontWeight: 700,
                            bgcolor: 'rgba(46, 125, 50, 0.12)',
                            px: 1,
                            py: 0.3,
                            borderRadius: 1.5,
                            flexShrink: 0,
                          }}
                        >
                          {isUserChoice ? '✓ Bạn đã chọn (Đáp án đúng)' : '✓ Đáp án đúng'}
                        </Typography>
                      )
                    } else if (isUserChoice) {
                      borderStyle = '2px solid'
                      borderColor = colors.danger
                      bgColor = 'rgba(211, 47, 47, 0.08)'
                      labelNode = (
                        <Typography
                          variant="caption"
                          sx={{
                            color: colors.danger,
                            fontWeight: 700,
                            bgcolor: 'rgba(211, 47, 47, 0.12)',
                            px: 1,
                            py: 0.3,
                            borderRadius: 1.5,
                            flexShrink: 0,
                          }}
                        >
                          ✕ Bạn đã chọn (Sai)
                        </Typography>
                      )
                    }

                    return (
                      <Box
                        key={opt.number}
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: 1.5,
                          p: 1.5,
                          borderRadius: 2.5,
                          border: borderStyle,
                          borderColor,
                          bgcolor: bgColor,
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <Typography
                            sx={{
                              fontWeight: 700,
                              color: isCorrectAnswer
                                ? colors.successText
                                : isUserChoice
                                  ? colors.danger
                                  : 'text.secondary',
                            }}
                          >
                            {optionLabel(opt.number)}.
                          </Typography>
                          <Typography
                            sx={{
                              fontWeight: isCorrectAnswer || isUserChoice ? 600 : 400,
                              color: isCorrectAnswer
                                ? colors.successText
                                : isUserChoice
                                  ? colors.danger
                                  : 'text.primary',
                            }}
                          >
                            {opt.text}
                          </Typography>
                        </Box>
                        {labelNode}
                      </Box>
                    )
                  })}
                </Stack>

                {/* Khối Cách giải chi tiết */}
                <Box
                  sx={{
                    p: 2,
                    borderRadius: 2.5,
                    bgcolor: 'rgba(109, 77, 214, 0.05)',
                    border: '1px solid',
                    borderColor: 'rgba(109, 77, 214, 0.2)',
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <LightbulbOutlinedIcon sx={{ color: 'primary.main', fontSize: '1.25rem' }} />
                    <Typography sx={{ fontWeight: 700, color: 'primary.main', fontSize: '0.95rem' }}>
                      Cách giải chi tiết:
                    </Typography>
                  </Box>
                  <MathText
                    sx={{ color: 'text.primary', fontSize: '0.92rem', whiteSpace: 'pre-line' }}
                    text={
                      q.explanation
                        ? q.explanation
                        : `Đáp án chính xác là ${optionLabel(q.correctOption)}. Nắm vững kiến thức lý thuyết và các công thức cơ bản để vận dụng giải bài tập này.`
                    }
                  />
                </Box>
                {isUserWrong && <AiExplainBox examId={exam.id} attemptId={result.id} questionNumber={q.number} />}
              </Box>
            )
          })}
        </Stack>
      </Card>
    </Stack>
  )
}

interface SavedPractice {
  attemptId: string
  attemptToken: string | null
  deadline: number
  startedAt: number
  answers: Record<number, number>
}

function loadSavedPractice(key: string): SavedPractice | null {
  try {
    const raw = sessionStorage.getItem(key)
    if (!raw) return null
    const data = JSON.parse(raw)
    if (data && typeof data.attemptId === 'string' && typeof data.deadline === 'number' && data.deadline > Date.now()) {
      return data
    }
  } catch {
    // ignore
  }
  return null
}

function loadSavedLatestAttempt(key: string): AttemptDetail | null {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return null
    return JSON.parse(raw) as AttemptDetail
  } catch {
    return null
  }
}

/** Luyện tập có bấm giờ và chấm ngay trong tab; tự động lưu nháp vào sessionStorage tránh mất bài khi tải lại trang. */
export function PracticeSheet({
  exam,
  questions,
  owner,
}: {
  exam: ExamSummary
  questions: ExamQuestion[]
  /** Người đang dùng (id tài khoản hoặc "guest"): bài làm và kết quả lưu trên trình duyệt tách theo người này. */
  owner: StorageOwner
}) {
  const savedKey = practiceKey(owner, exam.id)
  const resultKey = latestKey(owner, exam.id)
  const latestQuery = useLatestAttempt(exam.id)
  const [localAttempt, setLocalAttempt] = useState<AttemptDetail | null>(() => loadSavedLatestAttempt(resultKey))
  const [saved] = useState(() => loadSavedPractice(savedKey))
  const [phase, setPhase] = useState<Phase>(() => (saved ? 'taking' : 'before'))
  const [deadline, setDeadline] = useState(() => (saved ? saved.deadline : 0))
  const [startedAt, setStartedAt] = useState(() => (saved ? saved.startedAt : 0))
  const [attemptId, setAttemptId] = useState<string | null>(() => (saved ? saved.attemptId : null))
  const [attemptToken, setAttemptToken] = useState<string | null>(() => (saved ? saved.attemptToken : null))
  const [starting, setStarting] = useState(false)
  const [startError, setStartError] = useState('')
  const [now, setNow] = useState(0)
  const [answers, setAnswers] = useState<Record<number, number>>(() => (saved ? saved.answers : {}))
  const [result, setResult] = useState<AttemptDetail | null>(null)
  const [confirming, setConfirming] = useState(false)
  const [grading, setGrading] = useState(false)
  const [gradeError, setGradeError] = useState('')
  const lock = useRef(false)

  // Đồng bộ kết quả mới nhất từ server vào localStorage
  useEffect(() => {
    if (latestQuery.data) {
      try {
        localStorage.setItem(resultKey, JSON.stringify(latestQuery.data))
      } catch {
        // ignore
      }
    }
  }, [latestQuery.data, resultKey])

  useEffect(() => {
    if (phase === 'taking' && deadline > 0 && attemptId) {
      try {
        sessionStorage.setItem(
          savedKey,
          JSON.stringify({ attemptId, attemptToken, deadline, startedAt, answers } satisfies SavedPractice),
        )
      } catch {
        // ignore
      }
    } else if (phase === 'result' || phase === 'before') {
      try {
        sessionStorage.removeItem(savedKey)
      } catch {
        // ignore
      }
    }
  }, [phase, savedKey, attemptId, attemptToken, deadline, startedAt, answers])

  const remaining = phase === 'taking' ? Math.max(0, Math.ceil((deadline - now) / 1000)) : 0
  const blankCount = questions.length - Object.keys(answers).length

  async function grade() {
    if (lock.current || phase === 'result' || !attemptId) return
    lock.current = true
    setGrading(true)
    setGradeError('')
    try {
      // Máy chủ tự tính thời gian làm bài theo thời điểm bắt đầu và hạn nộp đã lưu.
      const res = await examApi.submitAttempt(exam.id, attemptId, { answers }, attemptToken)
      try {
        localStorage.setItem(resultKey, JSON.stringify(res))
      } catch {
        // ignore
      }
      setLocalAttempt(res)
      setResult(res)
      setConfirming(false)
      setPhase('result')
    } catch {
      setGradeError('Không thể nộp bài và chấm điểm. Vui lòng thử lại.')
    } finally {
      lock.current = false
      setGrading(false)
    }
  }

  // Mỗi nhịp cập nhật đồng hồ; hết giờ thì tự chấm (một lần, trừ khi chấm lỗi để người dùng bấm thử lại).
  const onTick = useEffectEvent(() => {
    const current = Date.now()
    setNow(current)
    if (current >= deadline && !gradeError) void grade()
  })
  useEffect(() => {
    if (phase !== 'taking') return
    const timer = setInterval(onTick, 250)
    return () => clearInterval(timer)
  }, [phase])

  async function start() {
    if (starting) return
    setStarting(true)
    setStartError('')
    try {
      const attempt = await examApi.startAttempt(exam.id)
      // Đồng hồ đếm theo hạn nộp của máy chủ; bù chênh lệch giữa giờ máy chủ và giờ máy học sinh.
      const t = Date.now()
      const offset = Date.parse(attempt.serverTime) - t
      setAttemptId(attempt.attemptId)
      setAttemptToken(attempt.attemptToken)
      setStartedAt(Date.parse(attempt.startedAt) - offset)
      setNow(t)
      setDeadline(Date.parse(attempt.expiresAt) - offset)
      setAnswers({})
      setResult(null)
      setGradeError('')
      setPhase('taking')
    } catch {
      setStartError('Không thể bắt đầu bài thi. Kiểm tra kết nối mạng rồi thử lại.')
    } finally {
      setStarting(false)
    }
  }

  function handleReviewLatest(attempt: AttemptDetail) {
    setResult(attempt)
    setPhase('result')
  }

  const headings: Record<Phase, [string, string]> = {
    before: ['01', 'Chuẩn bị vào phòng thi'],
    taking: ['02', 'Tập trung làm bài'],
    result: ['03', 'Nhìn lại để tiến bộ'],
  }

  const effectiveLatest = latestQuery.data || localAttempt

  return (
    <Stack spacing={3}>
      <Stepper phase={phase} />
      <SectionHeading index={headings[phase][0]}>{headings[phase][1]}</SectionHeading>

      {phase === 'before' && (
        <BeforeExam
          exam={exam}
          latestAttempt={effectiveLatest}
          onStart={() => void start()}
          onReviewLatest={handleReviewLatest}
        />
      )}
      {phase === 'before' && (starting || startError) && (
        <Typography role={startError ? 'alert' : 'status'} color={startError ? 'error' : 'text.secondary'}>
          {startError || 'Đang mở phòng thi…'}
        </Typography>
      )}

      {phase === 'taking' && (
        <ExamRoom
          questions={questions}
          remaining={remaining}
          answers={answers}
          setAnswers={setAnswers}
          grading={grading}
          gradeError={gradeError}
          onSubmit={() => setConfirming(true)}
        />
      )}

      {phase === 'result' && result && (
        <ExamResult exam={exam} result={result} onRetry={() => setPhase('before')} />
      )}

      <Dialog open={confirming && phase === 'taking'} onClose={() => !grading && setConfirming(false)}>
        <DialogTitle>Xác nhận nộp bài</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {blankCount > 0 ? `Bạn còn ${blankCount} câu bỏ trống. ` : ''}Sau khi nộp, bạn không thể sửa đáp
            án.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button disabled={grading} onClick={() => setConfirming(false)}>
            Làm tiếp
          </Button>
          <Button variant="contained" disabled={grading} onClick={() => void grade()}>
            {grading ? 'Đang chấm…' : 'Chấm bài'}
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  )
}
