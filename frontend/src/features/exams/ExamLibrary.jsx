import { useState } from 'react'
import { subjects } from '@mystudy/shared/study-goal'
import { useExamData } from './exam-api.js'
import './exams.css'

export function ExamError({ error, retry }) {
  return <div className="goal-card workspace-error">
    <p role="alert">{error}</p>
    <button type="button" className="workspace-button" onClick={retry}>Thử lại</button>
  </div>
}

function documentUrl(path) {
  if (typeof path !== 'string') return undefined
  try {
    const url = new URL(path, window.location.origin)
    if (url.protocol === 'https:' || (url.protocol === 'http:' && url.origin === window.location.origin)) return url.href
  } catch {
    return undefined
  }
}

function ExamCard({ exam }) {
  const online = exam.questionCount > 0
  const practice = exam.kind === 'mystudy_practice'
  const subject = subjects[exam.subjectCode] ?? exam.subjectCode
  return <article className={online ? 'exam-card exam-featured' : 'exam-card'}>
    <div>
      <p className="exam-kicker">{online ? 'Đề trực tuyến / Chấm tự động' : [subject, exam.year].filter(Boolean).join(' / ')}</p>
      <h2>{online ? subject + ' · ' : ''}{exam.title}</h2>
      <p className="exam-meta">{online
        ? [exam.year, exam.questionCount + ' câu trắc nghiệm', exam.durationMinutes + ' phút', 'Thang điểm 10'].filter(Boolean).join(' · ')
        : exam.durationMinutes + ' phút · Bản PDF'}</p>
      <p className="exam-source">Nguồn: {exam.source} · {practice ? 'Đề luyện minh họa' : 'Đề tham khảo ' + exam.year}</p>
    </div>
    <div className="exam-actions">
      {online && <a className="goal-primary exam-start" href={'/thi-thu/' + exam.id}>Thi thử <span aria-hidden="true">→</span></a>}
      {documentUrl(exam.paperUrl) && <a className="exam-link" href={documentUrl(exam.paperUrl)}
        aria-label={'Xem đề: ' + subject} target="_blank" rel="noopener noreferrer">Xem đề</a>}
      {documentUrl(exam.answerUrl) && <a className="exam-link" href={documentUrl(exam.answerUrl)}
        aria-label={'Xem đáp án: ' + subject} target="_blank" rel="noopener noreferrer">Xem đáp án</a>}
    </div>
  </article>
}

const tips = [
  ['Làm như thi thật', 'Chọn không gian yên tĩnh và tuân thủ thời gian.'],
  ['Đối chiếu đáp án', 'Xem lại cả câu sai lẫn câu bạn chưa chắc chắn.'],
  ['Quay lại lộ trình', 'Dành buổi học tiếp theo cho phần còn yếu.'],
]

export function ExamLibrary() {
  const [subject, setSubject] = useState('')
  const [year, setYear] = useState('')
  const query = new URLSearchParams()
  if (subject) query.set('subject', subject)
  if (year) query.set('year', year)
  const catalog = useExamData('')
  const filtered = useExamData(query.size ? '?' + query : null)
  const { data, error, retry } = query.size ? filtered : catalog
  const options = data ?? catalog.data
  const online = data?.exams.filter((exam) => exam.questionCount > 0)
  const papers = data?.exams.filter((exam) => exam.questionCount === 0)

  return <div className="exam-library">
    <header className="goal-intro">
      <p>LUYỆN TẬP CÓ CHỌN LỌC</p>
      <h1>Kho đề thi</h1>
      <div>Làm quen cấu trúc, rèn nhịp làm bài và nhìn rõ phần cần cải thiện.</div>
    </header>
    <div className="exam-filters">
      <select aria-label="Môn" value={subject} onChange={(event) => setSubject(event.target.value)}>
        <option value="">Môn: Tất cả</option>
        {[...(options?.subjects ?? [])].sort((a, b) => (subjects[a] ?? a).localeCompare(subjects[b] ?? b, 'vi')).map((code) =>
          <option value={code} key={code}>Môn: {subjects[code] ?? code}</option>)}
      </select>
      <select aria-label="Năm" value={year} onChange={(event) => setYear(event.target.value)}>
        <option value="">Năm: Tất cả</option>
        {options?.years.map((value) => <option value={value} key={value}>Năm: {value}</option>)}
      </select>
      <p role="status">{data ? data.exams.length + ' đề thi' : error ? '' : 'Đang tải đề thi…'}</p>
    </div>
    {error && <ExamError error={error} retry={retry} />}
    {online?.map((exam) => <ExamCard key={exam.id} exam={exam} />)}
    {papers?.length > 0 && <div className="exam-grid">
      {papers.map((exam) => <ExamCard key={exam.id} exam={exam} />)}
    </div>}
    {data?.exams.length === 0 && <div className="exam-card">
      <h2>Không có đề phù hợp</h2>
      <p className="exam-meta">Thử chọn môn hoặc năm khác.</p>
      <button className="workspace-button" type="button" onClick={() => { setSubject(''); setYear('') }}>Xóa bộ lọc</button>
    </div>}
    <section className="exam-card exam-tips" aria-labelledby="exam-tips-title">
      <h2 id="exam-tips-title">Một đề thi, ba bước tiến bộ</h2>
      <ol>{tips.map(([title, detail], index) => <li key={title}>
        <span className="exam-step" aria-hidden="true">0{index + 1}</span>
        <h3>{title}</h3><p>{detail}</p>
      </li>)}</ol>
    </section>
    <p className="exam-footnote">Tài liệu tham khảo dùng để ôn tập. Đề luyện MyStudy không phải đề thi chính thức.</p>
  </div>
}
