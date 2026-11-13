import { useEffect, useState } from 'react'
import { getVietnamDate } from '@mystudy/shared/calendar'
import { purposes, subjects } from '@mystudy/shared/study-goal'
import { formatNumber, weekdays } from '../goal-settings.js'
import { completeTask, saveGoal, studyRequest } from '../study-api.js'
import { getStudyWeek } from '../study-week.js'
import { useCurrentTime } from '../use-current-time.js'
import { formatWeekRange, getPlanPeriod } from './plan-calendar.js'
import './plan.css'

const strategies = [
  ['exam_focused', 'Sát đề', 'Tập trung dạng bài thường gặp, luyện đề và sửa lỗi để tăng tốc.'],
  ['foundation_first', 'Nền tảng → điểm cao', 'Củng cố kiến thức cốt lõi, rồi nâng dần độ khó theo mục tiêu.'],
]

function useWeekTasks(from, to, planId) {
  const [result, setResult] = useState(null)
  const [attempt, setAttempt] = useState(0)
  const key = [from, to, planId, attempt].join('|')

  useEffect(() => {
    const controller = new AbortController()
    studyRequest('tasks?' + new URLSearchParams({ from, to }), { signal: controller.signal })
      .then(({ tasks }) => {
        if (!controller.signal.aborted) setResult({ key, tasks })
      })
      .catch((error) => {
        if (!controller.signal.aborted) setResult({ key, error: error.message })
      })
    return () => controller.abort()
  }, [from, to, key])

  function markCompleted(id) {
    setResult((current) => current?.key === key && current.tasks ? {
      ...current,
      tasks: current.tasks.map((task) => task.id === id ? { ...task, completed: true } : task),
    } : current)
  }

  return {
    ...(result?.key === key ? result : {}),
    reload: () => setAttempt((current) => current + 1),
    markCompleted,
  }
}

function StrategyPicker({ active, onSaved, goal }) {
  const [strategy, setStrategy] = useState(active)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function regenerate(event) {
    event.preventDefault()
    if (saving || strategy === active) return
    setSaving(true)
    setError('')
    try {
      onSaved(await saveGoal({ ...goal, strategy }))
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return <form className="plan-strategy" method="post" onSubmit={regenerate}>
    <fieldset aria-label="Cách ôn tập" disabled={saving}>
      {strategies.map(([code, label, detail]) => (
        <label key={code} className="plan-strategy-option">
          <input type="radio" name="strategy" value={code} checked={strategy === code}
            aria-labelledby={'plan-strategy-' + code} aria-describedby={'plan-detail-' + code}
            onChange={() => { setStrategy(code); setError('') }} />
          <span className="plan-strategy-card">
            <strong id={'plan-strategy-' + code}>{label}</strong>
            <span id={'plan-detail-' + code}>{detail}</span>
          </span>
        </label>
      ))}
    </fieldset>
    {strategy !== active && <div className="plan-strategy-actions">
      <p>Lịch sẽ được xếp lại theo cách ôn đã chọn. Các nhiệm vụ đã học được giữ lại.</p>
      <button className="workspace-button plan-button" type="submit" disabled={saving}>
        {saving ? 'Đang tạo lại…' : 'Tạo lại lịch'}
      </button>
    </div>}
    {error && <p className="goal-error" role="alert">{error}</p>}
  </form>
}

function TaskCard({ task, today, onCompleted }) {
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function complete() {
    setSaving(true)
    setError('')
    try {
      await completeTask(task.id)
      onCompleted(task.id)
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return <li className={task.completed ? 'plan-task is-complete' : 'plan-task'}>
    <details>
      <summary>
        <span className="plan-task-subject">{subjects[task.subjectCode]}</span>
        <strong>{task.topic}</strong>
        <span className="plan-task-duration">{task.minutes} phút</span>
        <span className="plan-task-status">
          {task.completed ? <><span aria-hidden="true">✓ </span>Đã học</> : 'Chưa học'}
        </span>
      </summary>
      <div className="plan-task-content">
        <p>{task.content}</p>
        {!task.completed && task.date <= today && (
          <button className="workspace-button plan-button" type="button" disabled={saving} onClick={complete}>
            {saving ? 'Đang lưu…' : 'Đánh dấu đã học'}
          </button>
        )}
        {error && <p className="goal-error" role="alert">{error}</p>}
      </div>
    </details>
  </li>
}

function DayColumn({ day, index, tasks, today, isStudyDay, withinPlan, onCompleted }) {
  const visible = tasks.slice(0, 2)
  const more = tasks.slice(2)
  const taskCard = (task) => <TaskCard key={task.id} task={task} today={today} onCompleted={onCompleted} />
  const moreLabel = more.length === 1 ? subjects[more[0].subjectCode] : more.length + ' nhiệm vụ'

  return <section className="plan-day" aria-current={day.isToday ? 'date' : undefined}
    aria-labelledby={'plan-day-' + day.iso}>
    <h3 id={'plan-day-' + day.iso}>
      <span>{weekdays[index][1]}{day.isToday && <span className="plan-visually-hidden">, hôm nay</span>}</span>
      <time dateTime={day.iso}>{day.day}</time>
    </h3>
    {visible.length > 0 ? <ul className="plan-day-tasks">{visible.map(taskCard)}</ul>
      : withinPlan && !isStudyDay ? <div className="plan-day-empty">
        <strong>Nghỉ &amp; nạp năng lượng</strong>
        <p>Bạn có thể ôn lại những phần còn vướng.</p>
      </div> : <div className="plan-day-empty">
        <strong>Không có nhiệm vụ</strong>
        {!withinPlan && <p>Ngày này nằm ngoài lộ trình hiện tại.</p>}
      </div>}
    {more.length > 0 && <details className="plan-more">
      <summary>{moreLabel} · {more.reduce((sum, task) => sum + task.minutes, 0)} phút</summary>
      <ul className="plan-day-tasks">{more.map(taskCard)}</ul>
    </details>}
  </section>
}

export function StudyPlan({ data, onSaved, editHref, onEdit }) {
  const now = useCurrentTime()
  const today = getVietnamDate(now)
  const [offset, setOffset] = useState(0)
  const [savedMessage, setSavedMessage] = useState('')
  const { goal, plan } = data
  const { days } = getStudyWeek(now, offset)
  const { week, total, endsBefore } = getPlanPeriod(plan.startsOn, goal.months, days[0].iso)
  const weekLabel = week < 1 ? 'Trước khi bắt đầu' : week > total ? 'Sau khi kết thúc' : 'Tuần ' + week + ' / ' + total
  const purpose = purposes.find(([code]) => code === goal.purpose)?.[1]
  const hours = formatNumber(goal.dailyMinutes * goal.days.length / 60)
  const { tasks, error, reload, markCompleted } = useWeekTasks(days[0].iso, days.at(-1).iso, plan.id)
  const grouped = Object.groupBy(tasks ?? [], (task) => task.date)

  function saveStrategy(result) {
    onSaved(result)
    setOffset(0)
    setSavedMessage('Đã cập nhật cách ôn và lịch học.')
  }

  return <div className="study-plan">
    <header className="plan-intro">
      <p className="plan-kicker">Lộ trình của riêng bạn</p>
      <div className="plan-intro-row">
        <h1>Đi từng bước, đến đúng đích.</h1>
        <a className="workspace-button plan-button" href={editHref} onClick={onEdit}>Chỉnh mục tiêu</a>
      </div>
      <p className="plan-meta">{weekLabel} · {purpose} · Quỹ giờ: {hours} giờ/tuần</p>
    </header>

    <StrategyPicker active={plan.strategy} goal={goal} onSaved={saveStrategy} />
    <span className="plan-visually-hidden" role="status">{savedMessage}</span>

    <section className="goal-card plan-calendar" aria-labelledby="plan-week-title">
      <div className="plan-week">
        <h2 id="plan-week-title" aria-live="polite">{formatWeekRange(days)}</h2>
        <div className="plan-week-controls" role="group" aria-label="Chuyển tuần">
          <button type="button" className="workspace-button plan-button" aria-label="Tuần trước"
            onClick={() => setOffset((value) => value - 1)}><span aria-hidden="true">← </span>Tuần trước</button>
          <button type="button" className="workspace-button plan-button" onClick={() => setOffset(0)}>Tuần này</button>
          <button type="button" className="workspace-button plan-button" aria-label="Tuần sau"
            onClick={() => setOffset((value) => value + 1)}>Tuần sau<span aria-hidden="true"> →</span></button>
        </div>
      </div>
      {error ? <div className="workspace-error">
        <p className="goal-error" role="alert">{error}</p>
        <button type="button" className="workspace-button plan-button" onClick={reload}>Thử lại</button>
      </div> : !tasks ? <p className="plan-meta" role="status">Đang tải lịch học…</p>
        : <div className="plan-grid">
          {days.map((day, index) => <DayColumn key={day.iso} day={day} index={index}
            tasks={grouped[day.iso] ?? []} today={today} isStudyDay={goal.days.includes(index + 1)}
            withinPlan={day.iso >= plan.startsOn && day.iso < endsBefore} onCompleted={markCompleted} />)}
        </div>}
    </section>

    <aside className="plan-tip">
      <strong className="plan-kicker">Nhịp học bền vững</strong>
      <p>Sau mỗi 25 phút tập trung, nghỉ 5 phút. Hoàn thành từng việc nhỏ cũng là tiến bộ.</p>
    </aside>
  </div>
}
