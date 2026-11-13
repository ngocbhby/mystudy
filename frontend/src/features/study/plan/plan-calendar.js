import { getStudyEndDate } from '@mystudy/shared/calendar'

const weekMs = 7 * 86_400_000

function mondayOf(iso) {
  const date = new Date(iso + 'T00:00:00Z')
  date.setUTCDate(date.getUTCDate() - (date.getUTCDay() + 6) % 7)
  return +date
}

export function getPlanPeriod(startsOn, months, weekStart) {
  const end = getStudyEndDate(startsOn, months)
  const last = new Date(end)
  last.setUTCDate(last.getUTCDate() - 1)
  const firstMonday = mondayOf(startsOn)
  const total = (mondayOf(last.toISOString().slice(0, 10)) - firstMonday) / weekMs + 1
  const week = (mondayOf(weekStart) - firstMonday) / weekMs + 1
  return { week, total, endsBefore: end.toISOString().slice(0, 10) }
}

export function formatWeekRange([first, ...rest]) {
  const last = rest.at(-1)
  if (first.year !== last.year) {
    return first.day + '/' + first.month + '/' + first.year + ' – ' + last.day + '/' + last.month + '/' + last.year
  }
  if (first.month !== last.month) {
    return first.day + '/' + first.month + ' – ' + last.day + '/' + last.month + ', ' + last.year
  }
  return first.day + ' – ' + last.day + ' tháng ' + last.month + ', ' + last.year
}
