const vietnamDate = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Ho_Chi_Minh',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})

export function getVietnamDate(now = new Date()) {
  const parts = Object.fromEntries(vietnamDate.formatToParts(now).map(({ type, value }) => [type, value]))
  return `${parts.year}-${parts.month}-${parts.day}`
}

// Return the exclusive end date, clamping the day when the target month is shorter.
export function getStudyEndDate(startsOn, months) {
  const start = new Date(startsOn + 'T00:00:00Z')
  const end = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + months + 1, 0))
  end.setUTCDate(Math.min(start.getUTCDate(), end.getUTCDate()))
  return end
}
