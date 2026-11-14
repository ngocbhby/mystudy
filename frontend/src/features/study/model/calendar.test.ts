import { describe, expect, it } from 'vitest'
import { getPlanPeriod, getStudyWeek } from './calendar'

describe('study week', () => {
  it('runs Monday to Sunday and marks today in Vietnam time', () => {
    // 2026-11-14 (Thứ Bảy) 20:00 UTC đã là 03:00 ngày 15 (Chủ nhật) ở Việt Nam.
    const { days, range } = getStudyWeek(new Date('2026-11-14T20:00:00Z'))
    expect(days.map((d) => d.iso)).toEqual([
      '2026-11-09',
      '2026-11-10',
      '2026-11-11',
      '2026-11-12',
      '2026-11-13',
      '2026-11-14',
      '2026-11-15',
    ])
    expect(days.find((d) => d.isToday)?.iso).toBe('2026-11-15')
    expect(range).toBe('9 – 15 tháng 11, 2026')
  })

  it('supports offsets and ranges crossing months or years', () => {
    expect(getStudyWeek(new Date('2026-11-14T05:00:00Z'), 3).range).toBe('30/11 – 6/12, 2026')
    expect(getStudyWeek(new Date('2026-12-30T05:00:00Z')).range).toBe('28/12/2026 – 3/1/2027')
  })
})

describe('plan period', () => {
  it('numbers weeks from the start week and finds the end date', () => {
    const period = getPlanPeriod('2026-11-16', 1, '2026-11-23')
    expect(period).toMatchObject({ week: 2, endsBefore: '2026-12-16' })
    expect(period.total).toBe(5)
    expect(getPlanPeriod('2026-11-16', 1, '2026-11-09').week).toBe(0)
  })

  it('clamps to the end of shorter months', () => {
    expect(getPlanPeriod('2026-01-31', 1, '2026-01-26').endsBefore).toBe('2026-02-28')
  })
})
