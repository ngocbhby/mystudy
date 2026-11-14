import { describe, expect, it } from 'vitest'
import {
  getWeeklyHoursEstimate,
  goalFormSchema,
  initialGoal,
  toFormField,
  toFormValues,
  toGoalInput,
} from './goal-form'

const valid = () => toFormValues(initialGoal)

describe('goal form schema', () => {
  it('accepts the default goal and converts it back to API input', () => {
    expect(goalFormSchema.safeParse(valid()).success).toBe(true)
    expect(toGoalInput(valid())).toEqual(initialGoal)
  })

  it('accepts decimal commas in scores and hours', () => {
    const values = { ...valid(), scores: { ...valid().scores, math: '8,75' }, dailyHours: '1,5' }
    expect(toGoalInput(values)).toMatchObject({ dailyMinutes: 90, scores: { math: 8.75 } })
  })

  it('reports field-level errors', () => {
    const result = goalFormSchema.safeParse({
      ...valid(),
      electiveCodes: ['physics', 'physics'],
      scores: { math: '11', literature: 'x', physics: '8', english: '8' },
      months: '25',
      dailyHours: '0',
      days: [],
    })
    expect(result.success).toBe(false)
    const paths = result.error!.issues.map((i) => i.path.join('.'))
    expect(paths).toEqual(
      expect.arrayContaining([
        'electiveCodes',
        'scores.math',
        'scores.literature',
        'months',
        'dailyHours',
        'days',
      ]),
    )
  })

  it('rejects fractional months', () => {
    expect(goalFormSchema.safeParse({ ...valid(), months: '6.5' }).success).toBe(false)
  })
})

describe('weekly hours estimate', () => {
  it('scales with purpose, scores and a short deadline', () => {
    const base = {
      purpose: 'university_admission' as const,
      electiveCodes: initialGoal.electiveCodes,
      scores: initialGoal.scores,
      months: 6,
    }
    const normal = getWeeklyHoursEstimate(base)!
    expect(getWeeklyHoursEstimate({ ...base, purpose: 'graduation' })!).toBeLessThan(normal)
    expect(getWeeklyHoursEstimate({ ...base, months: 3 })!).toBeGreaterThan(normal)
  })

  it('returns null when a score is missing', () => {
    expect(
      getWeeklyHoursEstimate({
        purpose: 'graduation',
        electiveCodes: ['physics', 'english'],
        scores: { math: 8 },
        months: 6,
      }),
    ).toBeNull()
  })
})

describe('server field mapping', () => {
  it('maps backend error keys to form fields', () => {
    expect(toFormField('electives')).toBe('electiveCodes')
    expect(toFormField('dailyMinutes')).toBe('dailyHours')
    expect(toFormField('math')).toBe('scores.math')
    expect(toFormField('days')).toBe('days')
  })
})
