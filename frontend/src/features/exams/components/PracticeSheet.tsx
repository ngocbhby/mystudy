import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown'
import RadioButtonCheckedIcon from '@mui/icons-material/RadioButtonChecked'
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked'
import {
  Alert,
  Box,
  Button,
  Card,
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
import { Link as RouterLink, useNavigate } from 'react-router'
import { paths } from '@/app/router/paths'
import { colors } from '@/app/theme/theme'
import { subjectName } from '@/features/study/model/catalog'
import { FieldBox } from '@/shared/components/FieldBox'
import { Kicker } from '@/shared/components/PageHeader'
import { Notice } from '@/shared/components/Notice'
import { examApi } from '../api/exam-api'
import { useExamList } from '../hooks/useExams'
import { optionLabel, scoreOf } from '../model/exam-utils'
import type { ExamQuestion, ExamSummary } from '../model/types'

type Phase = 'before' | 'taking' | 'result'

interface Result {
  correct: number
  wrong: number[]
  blank: number[]
  elapsedSeconds: number
}

const clock = (seconds: number) => `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`
const lightOutline = {
  bgcolor: '#fff',
  borderColor: colors.border,
  color: 'text.primary',
  fontWeight: 500,
} as const

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
        <li>Kết quả hiện ngay sau khi nộp.</li>
      </Box>
      <Typography variant="caption" color="text.secondary" component="p" sx={{ mt: 3 }}>
        Đề luyện minh họa, không phải đề thi chính thức.
      </Typography>
    </Card>
  )
}

function BeforeExam({ exam, onStart }: { exam: ExamSummary; onStart: () => void }) {
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
        <Button fullWidth variant="contained" size="large" onClick={onStart} sx={{ py: 1.6 }}>
          Bắt đầu thi
        </Button>
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
  total,
  result,
  onRetry,
}: {
  exam: ExamSummary
  total: number
  result: Result
  onRetry: () => void
}) {
  const score = scoreOf(result.correct, total)
  const good = score >= 5
  const review = [
    ...result.wrong.map((n) => `${n} (sai)`),
    ...result.blank.map((n) => `${n} (bỏ trống)`),
  ].sort((a, b) => parseInt(a) - parseInt(b))
  const stat = (label: string, value: ReactNode, color: string) => (
    <Box>
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
      <Typography sx={{ color, fontWeight: 500, fontSize: '2rem', lineHeight: 1.3 }}>{value}</Typography>
    </Box>
  )

  return (
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
          <Typography sx={{ fontSize: '2.6rem', fontWeight: 600, lineHeight: 1.2 }}>
            {score.toLocaleString('vi-VN', { maximumFractionDigits: 2 })} / 10
          </Typography>
          <Typography sx={{ fontWeight: 600, fontSize: '1.15rem' }}>
            {score >= 8
              ? 'Bạn đang đi đúng hướng!'
              : good
                ? 'Khá tốt, còn vài chỗ cần ôn lại.'
                : 'Hãy xem lại đáp án và thử lại nhé.'}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 5, flexWrap: 'wrap', my: 3 }}>
          {stat('Đúng', result.correct, colors.successText)}
          {stat('Sai', result.wrong.length, colors.danger)}
          {stat('Bỏ trống', result.blank.length, colors.warningText)}
          {stat('Thời gian', clock(result.elapsedSeconds), colors.purple)}
        </Box>
        {review.length > 0 && (
          <Typography color="text.secondary">Câu cần xem lại: {review.join(', ')}.</Typography>
        )}
        <Stack direction="row" spacing={1.5} sx={{ mt: 3 }}>
          <Button component={RouterLink} to={paths.examAnswers(exam.id)} variant="contained">
            Xem đáp án
          </Button>
          <Button variant="outlined" onClick={onRetry} sx={lightOutline}>
            Làm lại đề
          </Button>
        </Stack>
      </Card>
      <Card sx={{ p: 3.5 }}>
        <Typography variant="h2" sx={{ fontWeight: 600, mb: 1.5 }}>
          Bước tiếp theo
        </Typography>
        <Typography color="text.secondary" sx={{ mb: 2.5 }}>
          Dành buổi học tiếp theo cho những câu còn yếu, rồi thử lại để thấy tiến bộ.
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
  )
}

/** Luyện tập có bấm giờ và chấm ngay trong tab; chưa lưu lượt thi vào tài khoản. */
export function PracticeSheet({ exam, questions }: { exam: ExamSummary; questions: ExamQuestion[] }) {
  const [phase, setPhase] = useState<Phase>('before')
  const [deadline, setDeadline] = useState(0)
  const [startedAt, setStartedAt] = useState(0)
  const [now, setNow] = useState(0)
  const [answers, setAnswers] = useState<Record<number, number>>({})
  const [result, setResult] = useState<Result | null>(null)
  const [confirming, setConfirming] = useState(false)
  const [grading, setGrading] = useState(false)
  const [gradeError, setGradeError] = useState('')
  const lock = useRef(false)

  const remaining = phase === 'taking' ? Math.max(0, Math.ceil((deadline - now) / 1000)) : 0
  const blankCount = questions.length - Object.keys(answers).length

  async function grade() {
    if (lock.current || phase === 'result') return
    lock.current = true
    setGrading(true)
    setGradeError('')
    try {
      const { questions: key } = await examApi.answers(exam.id)
      const wrong: number[] = []
      const blank: number[] = []
      let correct = 0
      for (const q of key) {
        const given = answers[q.number]
        if (given === undefined) blank.push(q.number)
        else if (given === q.correctOption) correct++
        else wrong.push(q.number)
      }
      setResult({
        correct,
        wrong,
        blank,
        elapsedSeconds: Math.min(exam.durationMinutes * 60, Math.round((Date.now() - startedAt) / 1000)),
      })
      setConfirming(false)
      setPhase('result')
    } catch {
      setGradeError('Không thể tải đáp án. Vui lòng thử lại.')
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

  function start() {
    const t = Date.now()
    setStartedAt(t)
    setNow(t)
    setDeadline(t + exam.durationMinutes * 60_000)
    setAnswers({})
    setResult(null)
    setGradeError('')
    setPhase('taking')
  }

  const headings: Record<Phase, [string, string]> = {
    before: ['01', 'Chuẩn bị vào phòng thi'],
    taking: ['02', 'Tập trung làm bài'],
    result: ['03', 'Nhìn lại để tiến bộ'],
  }

  return (
    <Stack spacing={3}>
      <Stepper phase={phase} />
      <SectionHeading index={headings[phase][0]}>{headings[phase][1]}</SectionHeading>
      {phase === 'before' && <BeforeExam exam={exam} onStart={start} />}
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
        <ExamResult exam={exam} total={questions.length} result={result} onRetry={() => setPhase('before')} />
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
