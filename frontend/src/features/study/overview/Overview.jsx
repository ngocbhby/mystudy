import { useEffect, useRef, useState } from 'react'
import { getVietnamDate } from '@mystudy/shared/calendar'
import { purposes, requiredSubjects, subjects } from '@mystudy/shared/study-goal'
import { formatNumber, formatScore } from '../goal-settings.js'
import { completeTask, studyRequest } from '../study-api.js'
import { useCurrentTime } from '../use-current-time.js'
import './overview.css'

const shortSubjects = { literature: 'Văn', english: 'Anh', civics: 'GDKT & PL' }
const taskCategory = (task) => {
  if (task.subjectCode === 'literature' && /^(Viết|Luyện đề)/.test(task.topic)) return 'Luyện viết'
  if (task.subjectCode === 'english' && /^(Đọc|Sắp xếp)/.test(task.topic)) return 'Đọc hiểu'
  return 'Củng cố kiến thức'
}
const fullDate = new Intl.DateTimeFormat('vi-VN', {
  timeZone: 'UTC', weekday: 'long', day: 'numeric', month: 'long',
})
const formatDate = (iso) => fullDate.format(new Date(iso + 'T00:00:00Z'))
const isDerivative = (task) => task.subjectCode === 'math' && task.topic === 'Đạo hàm và khảo sát hàm số'
const taskTitle = (task) => isDerivative(task) ? 'Nhớ quy tắc đạo hàm' : task.topic

function useOverview(today, enabled) {
  const [result, setResult] = useState(null)
  const [attempt, setAttempt] = useState(0)
  useEffect(() => {
    if (!enabled) return
    const controller = new AbortController()
    studyRequest('overview', { signal: controller.signal })
      .then((data) => { if (!controller.signal.aborted) setResult({ today, attempt, data }) })
      .catch((error) => {
        if (!controller.signal.aborted) setResult((previous) => ({
          today, attempt, error: error.message, data: previous?.today === today ? previous.data : null,
        }))
      })
    return () => controller.abort()
  }, [today, attempt, enabled])

  return {
    data: result?.today === today ? result.data : null,
    error: result?.today === today && result.attempt === attempt ? result.error : null,
    pending: enabled && (result?.today !== today || result.attempt !== attempt),
    reload: () => setAttempt((value) => value + 1),
  }
}

function GoalSummary({ goal }) {
  return <section className="overview-card overview-goal" aria-labelledby="overview-goal-title">
    <h2 id="overview-goal-title">Đích đến của bạn</h2>
    <p>{purposes.find(([code]) => code === goal.purpose)?.[1]} · Còn {goal.months} tháng</p>
    <dl className="overview-scores">
      {[...requiredSubjects, ...goal.electiveCodes].map((code) => <div key={code}>
        <dt>{shortSubjects[code] ?? subjects[code]}</dt>
        <dd>{formatScore(goal.scores[code])}</dd>
      </div>)}
    </dl>
    <p>{formatNumber(goal.dailyMinutes * goal.days.length / 60)} giờ/tuần · {goal.days.length} ngày học</p>
  </section>
}

function TodayTasks({ tasks, nextStudyDate, activeTask, select, saving }) {
  if (tasks.length === 0) return <section className="overview-card overview-empty">
    <h2>Hôm nay bạn được nghỉ</h2>
    <p>{nextStudyDate
      ? <>Ngày học tiếp theo: <time dateTime={nextStudyDate}>{formatDate(nextStudyDate)}</time>.</>
      : 'Chưa có nhiệm vụ sắp tới. Bạn có thể cập nhật mục tiêu để tạo lịch mới.'}</p>
  </section>

  const done = tasks.filter((task) => task.completed).length
  return <section className="overview-today" aria-label="Nhiệm vụ hôm nay">
    <div className="overview-progress">
      <p id="overview-progress-label" role="status">{done}/{tasks.length} nhiệm vụ đã hoàn thành</p>
      <progress aria-labelledby="overview-progress-label" value={done} max={tasks.length} />
    </div>
    <ul className="overview-tasks">
      {tasks.map((task) => <li className="overview-card overview-task" key={task.id}
        data-completed={task.completed || undefined}>
        <p className="overview-kicker">{subjects[task.subjectCode]} <span aria-hidden="true">/</span> {taskCategory(task)}</p>
        <h2>{subjects[task.subjectCode]} · {task.topic} · {task.minutes} phút</h2>
        <div className="overview-task-footer">
          <span>{task.minutes} phút</span>
          {task.completed ? <span className="overview-tag"><span aria-hidden="true">✓</span> Đã hoàn thành</span>
            : <button className="overview-tag overview-action" type="button"
                aria-label={`Học ngay: ${task.topic}`} aria-controls="quick-study"
                aria-pressed={activeTask?.id === task.id} disabled={saving} onClick={() => select(task.id)}>Học ngay</button>}
        </div>
      </li>)}
    </ul>
  </section>
}

function QuickStudy({ task, titleRef, complete, saving, error }) {
  return <section className="overview-card overview-quick" id="quick-study" aria-labelledby="quick-study-title">
    <p className="overview-kicker">Học nhanh <span aria-hidden="true">/</span> {task.minutes} phút</p>
    <h2 id="quick-study-title" ref={titleRef} tabIndex={-1}>{taskTitle(task)}</h2>
    {isDerivative(task)
      ? <>
          <p className="overview-formulas">
            (x<sup>n</sup>)′ = n·x<sup>n−1</sup><br />
            (u + v)′ = u′ + v′<br />
            (u·v)′ = u′v + uv′
          </p>
          <p>Ví dụ: y = x³ − 3x + 2<br />⇒ y′ = 3x² − 3.</p>
        </>
      : <p className="overview-instructions">{task.content}</p>}
    {task.completed
      ? <p className="overview-tag overview-quick-done" role="status"><span aria-hidden="true">✓</span> Đã hoàn thành</p>
      : <button className="goal-primary" type="button" disabled={saving} onClick={() => complete(task.id)}>
          {saving ? 'Đang lưu…' : 'Đánh dấu đã học'}
        </button>}
    {error && <p className="goal-error" role="alert">{error}</p>}
  </section>
}

export function Overview({ goal, editHref, onEdit }) {
  const today = getVietnamDate(useCurrentTime())
  const { data, error, pending, reload } = useOverview(today, Boolean(goal))
  const [selected, setSelected] = useState(null)
  const [saved, setSaved] = useState({})
  const [saving, setSaving] = useState(false)
  const [completionError, setCompletionError] = useState(null)
  const titleRef = useRef(null)
  const tasks = data?.tasks.map((task) => saved[task.id] ? { ...task, completed: true } : task)
  const activeTask = tasks?.find((task) => task.id === selected)
    ?? tasks?.find((task) => !task.completed) ?? tasks?.[0]
  const streak = Math.max(data?.streakDays ?? 0, tasks?.some((task) => task.completed) ? 1 : 0)

  function select(id) {
    setSelected(id)
    requestAnimationFrame(() => titleRef.current?.focus())
  }

  async function complete(id) {
    setSaving(true)
    setCompletionError(null)
    try {
      await completeTask(id)
      setSelected(id)
      setSaved((current) => ({ ...current, [id]: true }))
      reload()
      requestAnimationFrame(() => titleRef.current?.focus({ preventScroll: true }))
    } catch (err) {
      setCompletionError({ id, message: err.message })
    } finally {
      setSaving(false)
    }
  }

  return <div className="overview">
    <header className="overview-heading">
      <div>
        <p className="overview-kicker"><time dateTime={today}>{formatDate(today)}</time></p>
        <h1>Hôm nay học gì?</h1>
        <p>Một chút tập trung hôm nay, thêm tự tin ngày thi.</p>
      </div>
      {data && <p className="overview-tag overview-streak" aria-live="polite">
        {streak > 0 ? `${streak} ngày học liên tiếp` : 'Bắt đầu chuỗi học hôm nay'}
      </p>}
    </header>
    {goal && <div className="overview-grid">
      <div>
        {error && <div className="overview-card workspace-error">
          <p className="goal-error" role="alert">{error}</p>
          <button className="workspace-button" type="button" onClick={reload}>Thử lại</button>
        </div>}
        {data ? <TodayTasks tasks={tasks} nextStudyDate={data.nextStudyDate} activeTask={activeTask} select={select} saving={saving} />
          : pending && <p className="overview-card" role="status">Đang tải nhiệm vụ…</p>}
      </div>
      <aside className="overview-sidebar" aria-label="Mục tiêu và nội dung học">
        <GoalSummary goal={goal} />
        {activeTask && <QuickStudy task={activeTask} titleRef={titleRef} saving={saving} complete={complete}
          error={completionError?.id === activeTask.id ? completionError.message : null} />}
      </aside>
    </div>}
    <section className="overview-edit">
      <div>
        <h2>{goal ? 'Cần một lộ trình mới?' : 'Bạn chưa có lộ trình học'}</h2>
        <p>{goal ? 'Cập nhật mục tiêu để điều chỉnh nhịp học của bạn.'
          : 'Chọn môn, điểm mục tiêu và thời gian học để MyStudy lập lịch cho bạn.'}</p>
      </div>
      <a className="goal-primary" href={editHref} onClick={onEdit}>Thiết lập mục tiêu</a>
    </section>
  </div>
}
