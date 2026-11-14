import { getStudyEndDate, getVietnamDate } from '@/lib/date/vietnam-date'
import { weekdays } from './catalog'

export interface WeekDay {
  label: string
  iso: string
  day: number
  month: number
  year: number
  isToday: boolean
}

/** Tuần Thứ Hai → Chủ nhật quanh ngày hiện tại (múi giờ Việt Nam), lệch `offset` tuần. */
export function getStudyWeek(now: Date = new Date(), offset = 0): { days: WeekDay[]; range: string } {
  const today = getVietnamDate(now)
  const monday = new Date(today + 'T00:00:00Z')
  monday.setUTCDate(monday.getUTCDate() - ((monday.getUTCDay() + 6) % 7) + 7 * offset)

  const days = weekdays.map(({ short }, index) => {
    const date = new Date(monday)
    date.setUTCDate(date.getUTCDate() + index)
    const iso = date.toISOString().slice(0, 10)
    return {
      label: short,
      iso,
      day: date.getUTCDate(),
      month: date.getUTCMonth() + 1,
      year: date.getUTCFullYear(),
      isToday: iso === today,
    }
  })
  return { days, range: formatWeekRange(days) }
}

export function formatWeekRange(days: WeekDay[]): string {
  const first = days[0]
  const last = days[days.length - 1]
  if (!first || !last) return ''
  if (first.year !== last.year)
    return `${first.day}/${first.month}/${first.year} – ${last.day}/${last.month}/${last.year}`
  if (first.month !== last.month)
    return `${first.day}/${first.month} – ${last.day}/${last.month}, ${last.year}`
  return `${first.day} – ${last.day} tháng ${last.month}, ${last.year}`
}

const weekMs = 7 * 86_400_000

function mondayOf(iso: string): number {
  const date = new Date(iso + 'T00:00:00Z')
  date.setUTCDate(date.getUTCDate() - ((date.getUTCDay() + 6) % 7))
  return +date
}

/** Tuần thứ mấy / tổng số tuần của lộ trình, và ngày đầu tiên nằm ngoài lộ trình. */
export function getPlanPeriod(startsOn: string, months: number, weekStart: string) {
  const end = getStudyEndDate(startsOn, months)
  const last = new Date(end)
  last.setUTCDate(last.getUTCDate() - 1)
  const firstMonday = mondayOf(startsOn)
  return {
    week: (mondayOf(weekStart) - firstMonday) / weekMs + 1,
    total: (mondayOf(last.toISOString().slice(0, 10)) - firstMonday) / weekMs + 1,
    endsBefore: end.toISOString().slice(0, 10),
  }
}
