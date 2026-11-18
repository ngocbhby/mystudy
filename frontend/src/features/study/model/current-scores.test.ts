import { describe, expect, it } from 'vitest'
import { goalFormSchema, initialGoal, toFormField, toFormValues, toGoalInput } from './goal-form'

const valid = () => toFormValues(initialGoal)

describe('current scores in the goal form', () => {
  it('sends only the current scores the learner filled in', () => {
    const values = { ...valid(), currentScores: { math: '5,5', literature: '', physics: '6' } }
    expect(goalFormSchema.safeParse(values).success).toBe(true)
    expect(toGoalInput(values).currentScores).toEqual({ math: 5.5, physics: 6 })
  })

  it('rejects current scores outside 0–10 but allows leaving them blank', () => {
    const result = goalFormSchema.safeParse({ ...valid(), currentScores: { math: '11' } })
    expect(result.success).toBe(false)
    expect(result.error?.issues[0]?.path).toEqual(['currentScores', 'math'])
    expect(goalFormSchema.safeParse({ ...valid(), currentScores: {} }).success).toBe(true)
  })

  it('maps backend error keys for current scores to form fields', () => {
    expect(toFormField('current_math')).toBe('currentScores.math')
    expect(toFormField('math')).toBe('scores.math')
  })
})
