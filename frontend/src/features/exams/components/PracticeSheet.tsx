import {
  Alert, Button, Card, FormControl, FormControlLabel, FormLabel, Radio, RadioGroup, Stack, Typography,
} from '@mui/material'
import { useEffect, useEffectEvent, useRef, useState } from 'react'
import { Link as RouterLink } from 'react-router'
import { paths } from '@/app/router/paths'
import { examApi } from '../api/exam-api'
import { optionLabel, scoreOf } from '../model/exam-utils'
import type { ExamQuestion, ExamSummary } from '../model/types'

interface Result {
  correct: number
  incorrect: number
  blank: number
}

/** Luyện tập có bấm giờ và chấm ngay trong tab; chưa lưu lượt thi vào tài khoản. */
export function PracticeSheet({ exam, questions }: { exam: ExamSummary; questions: ExamQuestion[] }) {
  const [deadline, setDeadline] = useState<number | null>(null)
  const [now, setNow] = useState(0)
  const [answers, setAnswers] = useState<Record<number, number>>({})
  const [result, setResult] = useState<Result | null>(null)
  const [confirming, setConfirming] = useState(false)
  const [grading, setGrading] = useState(false)
  const [gradeError, setGradeError] = useState('')
  const lock = useRef(false)

  const remaining = deadline === null ? null : Math.max(0, Math.ceil((deadline - now) / 1000))
  const blank = questions.length - Object.keys(answers).length

  // Mỗi nhịp cập nhật đồng hồ; hết giờ thì tự chấm (một lần, trừ khi chấm lỗi để người dùng bấm thử lại).
  const onTick = useEffectEvent(() => {
    const current = Date.now()
    setNow(current)
    if (deadline !== null && current >= deadline && !gradeError) void grade()
  })
  useEffect(() => {
    if (deadline === null || result) return
    const timer = setInterval(onTick, 250)
    return () => clearInterval(timer)
  }, [deadline, result])

  async function grade() {
    if (lock.current || result) return
    lock.current = true
    setGrading(true)
    setGradeError('')
    try {
      const { questions: key } = await examApi.answers(exam.id)
      const correct = key.filter((q) => answers[q.number] === q.correctOption).length
      setResult({ correct, blank, incorrect: questions.length - correct - blank })
      setConfirming(false)
    } catch {
      setGradeError('Không thể tải đáp án. Vui lòng thử lại.')
    } finally {
      lock.current = false
      setGrading(false)
    }
  }

  if (result) {
    return (
      <Card sx={{ p: 3 }}>
        <Stack spacing={1.5} sx={{ alignItems: 'flex-start' }}>
          <Typography variant="h2">Kết quả luyện tập</Typography>
          <Typography role="status">{result.correct} đúng · {result.incorrect} sai · {result.blank} bỏ trống</Typography>
          <Typography>Điểm: {scoreOf(result.correct, questions.length).toLocaleString('vi-VN', { maximumFractionDigits: 2 })}/10</Typography>
          <Button component={RouterLink} to={paths.examAnswers(exam.id)} variant="outlined">Xem đáp án</Button>
        </Stack>
      </Card>
    )
  }

  if (deadline === null) {
    return (
      <Card sx={{ p: 3 }}>
        <Stack spacing={1.5} sx={{ alignItems: 'flex-start' }}>
          <Typography variant="h2">Trước khi bắt đầu</Typography>
          <Typography color="text.secondary">Chọn một đáp án cho mỗi câu. Bài luyện diễn ra trong tab này; tải lại trang sẽ bắt đầu lại.</Typography>
          <Button variant="contained" onClick={() => { const start = Date.now(); setNow(start); setDeadline(start + exam.durationMinutes * 60_000) }}>
            Bắt đầu luyện tập
          </Button>
        </Stack>
      </Card>
    )
  }

  const left = remaining ?? 0
  return (
    <Card sx={{ p: 3 }}>
      <Stack spacing={3}>
        <Typography role="timer" aria-label="Thời gian còn lại" variant="h1" sx={{ fontVariantNumeric: 'tabular-nums' }}>
          {Math.floor(left / 60)}:{String(left % 60).padStart(2, '0')}
        </Typography>
        {questions.map((question) => (
          <FormControl key={question.number} component="fieldset" disabled={grading || confirming || left === 0}>
            <FormLabel component="legend" sx={{ color: 'text.primary', fontWeight: 600 }}>Câu {question.number}. {question.prompt}</FormLabel>
            <RadioGroup
              value={answers[question.number] ?? ''}
              onChange={(e) => setAnswers((current) => ({ ...current, [question.number]: Number(e.target.value) }))}
            >
              {question.options.map((option) => (
                <FormControlLabel key={option.number} value={option.number} control={<Radio />} label={`${optionLabel(option.number)}. ${option.text}`} />
              ))}
            </RadioGroup>
          </FormControl>
        ))}
        {left === 0 || confirming ? (
          <Stack spacing={1.5} sx={{ alignItems: 'flex-start' }}>
            <Alert severity="info" role="status">{left === 0 ? 'Đã hết thời gian.' : 'Xác nhận nộp bài.'} Còn {blank} câu bỏ trống.</Alert>
            <Stack direction="row" spacing={1}>
              {left > 0 && <Button variant="outlined" disabled={grading} onClick={() => setConfirming(false)}>Làm tiếp</Button>}
              <Button variant="contained" disabled={grading} onClick={() => void grade()}>{grading ? 'Đang chấm…' : 'Chấm bài'}</Button>
            </Stack>
          </Stack>
        ) : (
          <Button variant="contained" sx={{ alignSelf: 'flex-start' }} onClick={() => setConfirming(true)}>Nộp bài</Button>
        )}
        {gradeError && <Alert severity="error" role="alert">{gradeError}</Alert>}
      </Stack>
    </Card>
  )
}
