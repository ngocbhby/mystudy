import { useEffect, useState } from 'react'
import { getStudyWeek } from './study-week.js'

export function StudyWeek() {
  const [{ days, range }, setWeek] = useState(getStudyWeek)

  useEffect(() => {
    const update = () => setWeek(getStudyWeek())
    const timer = window.setInterval(update, 30_000)
    window.addEventListener('focus', update)
    return () => {
      window.clearInterval(timer)
      window.removeEventListener('focus', update)
    }
  }, [])

  return (
    <section className="study-week" aria-labelledby="study-week-title">
      <header className="study-week-header">
        <h3 id="study-week-title">Tuần học của bạn</h3>
        <p>{range}</p>
      </header>

      <ul className="week-days" role="list" aria-label="Lịch học minh họa">
        {days.map(({ label, day, iso, isToday }) => (
          <li key={iso} className={isToday ? 'week-day selected-day' : 'week-day'} aria-current={isToday ? 'date' : undefined}>
            <span>{label}</span>
            <strong><time dateTime={iso}>{day}</time></strong>
          </li>
        ))}
      </ul>

      <div className="study-task">
        <span className="task-check" aria-hidden="true">✓</span>
        <div>
          <p className="task-title">Toán · Ôn đạo hàm</p>
          <p className="task-detail">25 phút mỗi ngày, vững vàng hơn mỗi tuần.</p>
        </div>
      </div>
    </section>
  )
}
