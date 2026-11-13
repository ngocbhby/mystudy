import { getVietnamDate } from '@mystudy/shared/calendar'

const labels = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN']

export function getStudyWeek(now = new Date(), offset = 0) {
  // Use UTC for calendar arithmetic on dates converted to Vietnam time.
  const today = getVietnamDate(now)
  const monday = new Date(today + 'T00:00:00Z')
  monday.setUTCDate(monday.getUTCDate() - (monday.getUTCDay() + 6) % 7 + 7 * offset)

  const days = labels.map((label, index) => {
    const date = new Date(monday)
    date.setUTCDate(date.getUTCDate() + index)
    const iso = date.toISOString().slice(0, 10)
    return {
      label,
      iso,
      day: date.getUTCDate(),
      month: date.getUTCMonth() + 1,
      year: date.getUTCFullYear(),
      isToday: iso === today,
    }
  })

  const [first] = days
  const last = days.at(-1)
  let range = `${first.day}–${last.day} tháng ${last.month}`
  if (first.year !== last.year) {
    range = `${first.day}/${first.month}/${first.year} – ${last.day}/${last.month}/${last.year}`
  } else if (first.month !== last.month) {
    range = `${first.day}/${first.month} – ${last.day}/${last.month}`
  }
  return { days, range }
}
