const vietnamDate = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Ho_Chi_Minh',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})

/** Ngày hiện tại theo múi giờ Việt Nam, định dạng yyyy-MM-dd. */
export function getVietnamDate(now: Date = new Date()): string {
  const parts = Object.fromEntries(vietnamDate.formatToParts(now).map(({ type, value }) => [type, value]))
  return `${parts.year}-${parts.month}-${parts.day}`
}

/** Ngày kết thúc (không bao gồm) của lộ trình: cộng số tháng và cắt về cuối tháng nếu tháng đích ngắn hơn. */
export function getStudyEndDate(startsOn: string, months: number): Date {
  const start = new Date(startsOn + 'T00:00:00Z')
  const end = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + months + 1, 0))
  end.setUTCDate(Math.min(start.getUTCDate(), end.getUTCDate()))
  return end
}

const fullDate = new Intl.DateTimeFormat('vi-VN', {
  timeZone: 'UTC',
  weekday: 'long',
  day: 'numeric',
  month: 'long',
})

/** "Thứ Hai, 16 tháng 11" cho một ngày yyyy-MM-dd. */
export const formatFullDate = (iso: string) => fullDate.format(new Date(iso + 'T00:00:00Z'))
