import { useEffect, useEffectEvent, useRef, useState } from 'react'
import { subjects } from '@mystudy/shared/study-goal'
import { ExamError } from './ExamLibrary.jsx'
import { useExamData } from './exam-api.js'

const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
const optionLabel = (number) => letters[number - 1] ?? number

function Practice({ exam, questions }) {
  const [deadline, setDeadline] = useState(null)
  const [now, setNow] = useState(0)
  const [answers, setAnswers] = useState({})
  const [result, setResult] = useState(null)
  const [confirming, setConfirming] = useState(false)
  const [gradeError, setGradeError] = useState('')
  const [grading, setGrading] = useState(false)
  const gradingLock = useRef(false)
  const remaining = deadline === null ? null : Math.max(0, Math.ceil((deadline - now) / 1000))
  const blank = questions.length - Object.keys(answers).length

  useEffect(() => {
    if (deadline === null || result) return
    const timer = setInterval(() => setNow(Date.now()), 250)
    return () => clearInterval(timer)
  }, [deadline, result])

  async function grade() {
    if (gradingLock.current || result) return
    gradingLock.current = true
    setGrading(true)
    setGradeError('')
    try {
      const response = await fetch('/api/exams/' + exam.id + '/answers')
      if (!response.ok) throw new Error()
      const { questions: key } = await response.json()
      const correct = key.filter((question) => answers[question.number] === question.correctOption).length
      setResult({ correct, blank, incorrect: questions.length - correct - blank })
      setConfirming(false)
    } catch {
      setGradeError('Không thể tải đáp án. Vui lòng thử lại.')
    } finally {
      gradingLock.current = false
      setGrading(false)
    }
  }

  const gradeExpired = useEffectEvent(() => { void grade() })
  useEffect(() => {
    if (remaining === 0) gradeExpired()
  }, [remaining])

  if (result) return <section className="exam-card exam-sheet">
    <h2>Kết quả luyện tập</h2>
    <p role="status">{result.correct} đúng · {result.incorrect} sai · {result.blank} bỏ trống</p>
    <p>Điểm: {(result.correct * 10 / questions.length).toLocaleString('vi-VN', { maximumFractionDigits: 2 })}/10</p>
    <a className="workspace-button" href={exam.answerUrl}>Xem đáp án</a>
  </section>

  if (deadline === null) return <section className="exam-card exam-sheet">
    <h2>Trước khi bắt đầu</h2>
    <p>Chọn một đáp án cho mỗi câu. Bài luyện diễn ra trong tab này; tải lại trang sẽ bắt đầu lại.</p>
    <button className="goal-primary" type="button" onClick={() => {
      const start = Date.now()
      setNow(start)
      setDeadline(start + exam.durationMinutes * 60_000)
    }}>Bắt đầu luyện tập</button>
  </section>

  return <section className="exam-card exam-sheet">
    <div className="exam-timer" role="timer" aria-label="Thời gian còn lại">
      {Math.floor(remaining / 60)}:{String(remaining % 60).padStart(2, '0')}
    </div>
    {questions.map((question) => <fieldset key={question.number} disabled={grading || confirming || remaining === 0}>
      <legend>Câu {question.number}. {question.prompt}</legend>
      {question.options.map((option) => <label key={option.number}>
        <input type="radio" name={'q' + question.number} checked={answers[question.number] === option.number}
          onChange={() => setAnswers((current) => ({ ...current, [question.number]: option.number }))} />
        {optionLabel(option.number)}. {option.text}
      </label>)}
    </fieldset>)}
    {remaining === 0 || confirming ? <div className="exam-confirm">
      <p role="status">{remaining === 0 ? 'Đã hết thời gian.' : 'Xác nhận nộp bài.'} Còn {blank} câu bỏ trống.</p>
      {remaining > 0 && <button className="workspace-button" type="button" disabled={grading} onClick={() => setConfirming(false)}>Làm tiếp</button>}
      <button className="workspace-button" type="button" disabled={grading} onClick={grade}>{grading ? 'Đang chấm…' : 'Chấm bài'}</button>
    </div> : <button type="button" className="goal-primary" onClick={() => setConfirming(true)}>Nộp bài</button>}
    {gradeError && <p className="goal-error" role="alert">{gradeError}</p>}
  </section>
}

export function OnlineExam({ examId, view }) {
  const { data, error, retry } = useExamData(examId ? '/' + examId + (view === 'dap-an' ? '/answers' : '') : '')
  if (error) return <ExamError error={error} retry={retry} />
  if (!data) return <p role="status">Đang tải đề thi…</p>
  if (!examId) {
    const exam = data.exams.find((item) => item.questionCount > 0)
    return <section className="exam-card exam-sheet">
      <h1>Thi thử</h1>
      {exam ? <a className="workspace-button" href={'/thi-thu/' + exam.id}>{exam.title}</a> : <p>Chưa có đề trực tuyến.</p>}
    </section>
  }

  const { exam, questions } = data
  return <>
    <header className="goal-intro">
      <a className="workspace-button" href="/kho-de-thi">← Kho đề thi</a>
      <h1>{view === 'dap-an' ? 'Đáp án · ' : ''}{exam.title}</h1>
      <div>{subjects[exam.subjectCode]} · {exam.questionCount} câu · {exam.durationMinutes} phút · {exam.source}</div>
    </header>
    {view ? <section className="exam-card exam-sheet" aria-label={view === 'dap-an' ? 'Đáp án' : 'Nội dung đề'}>
      {questions.map((question) => <section key={question.number}>
        <h2>Câu {question.number}. {question.prompt}</h2>
        <ul>{question.options.map((option) => <li key={option.number} className={question.correctOption === option.number ? 'exam-correct' : undefined}>
          {optionLabel(option.number)}. {option.text}{question.correctOption === option.number && ' ✓ Đáp án đúng'}
        </li>)}</ul>
      </section>)}
    </section> : <Practice key={exam.id} exam={exam} questions={questions} />}
  </>
}
