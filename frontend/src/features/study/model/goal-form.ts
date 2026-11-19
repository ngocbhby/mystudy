import { z } from 'zod'
import { formatScore, parseDecimal } from '@/lib/format'
import { electives, purposes, requiredSubjects, type SubjectCode } from './catalog'
import type { Goal, GoalInput } from './types'

export const initialGoal: Goal = {
  purpose: 'university_admission',
  electiveCodes: ['physics', 'english'],
  scores: { math: 8, literature: 7.5, physics: 8, english: 8.5 },
  currentScores: {},
  months: 6,
  dailyMinutes: 90,
  days: [1, 2, 3, 4, 5],
}

const purposeCodes = purposes.map((p) => p.code) as [string, ...string[]]

/** Giá trị biểu mẫu: các ô số là chuỗi để người dùng gõ "8,5" tự nhiên. */
export const goalFormSchema = z
  .object({
    purpose: z.enum(purposeCodes, { error: 'Hãy chọn mục đích ôn thi.' }),
    electiveCodes: z
      .tuple([z.enum(electives), z.enum(electives)])
      .refine(([a, b]) => a !== b, 'Hãy chọn hai môn tự chọn khác nhau.'),
    scores: z.record(z.string(), z.string()),
    /** Điểm hiện tại tự đánh giá; bỏ trống được. */
    currentScores: z.record(z.string(), z.string()).optional(),
    months: z.string(),
    dailyHours: z.string(),
    days: z.array(z.number().int().min(1).max(7)).min(1, 'Hãy chọn ít nhất một ngày học trong tuần.'),
  })
  .superRefine((values, ctx) => {
    for (const code of [...requiredSubjects, ...values.electiveCodes]) {
      const score = parseDecimal(values.scores[code] ?? '')
      if (!(score >= 0 && score <= 10))
        ctx.addIssue({ code: 'custom', path: ['scores', code], message: 'Nhập điểm từ 0 đến 10.' })
      const raw = values.currentScores?.[code]?.trim() ?? ''
      const current = parseDecimal(raw)
      if (raw !== '' && !(current >= 0 && current <= 10))
        ctx.addIssue({ code: 'custom', path: ['currentScores', code], message: 'Nhập điểm từ 0 đến 10 hoặc để trống.' })
    }
    const months = /^\d+$/.test(values.months.trim()) ? Number(values.months) : NaN
    if (!(months >= 1 && months <= 24)) {
      ctx.addIssue({ code: 'custom', path: ['months'], message: 'Nhập số tháng nguyên từ 1 đến 24.' })
    }
    const minutes = Math.round(parseDecimal(values.dailyHours) * 60)
    if (!(minutes >= 1 && minutes <= 1440)) {
      ctx.addIssue({
        code: 'custom',
        path: ['dailyHours'],
        message: 'Nhập số giờ tương ứng từ 1 phút đến 24 giờ.',
      })
    }
  })

export type GoalFormValues = z.input<typeof goalFormSchema>

const format = (n: number) => String(n).replace('.', ',')

export function toFormValues(goal: Goal): GoalFormValues {
  return {
    purpose: goal.purpose,
    electiveCodes: goal.electiveCodes as [SubjectCode, SubjectCode] as GoalFormValues['electiveCodes'],
    scores: Object.fromEntries(
      Object.entries(goal.scores).map(([code, value]) => [code, formatScore(value ?? 0)]),
    ),
    currentScores: Object.fromEntries(
      Object.entries(goal.currentScores ?? {}).map(([code, value]) => [code, formatScore(value ?? 0)]),
    ),
    months: String(goal.months),
    dailyHours: format(goal.dailyMinutes / 60),
    days: goal.days,
  }
}

export function toGoalInput(values: GoalFormValues): GoalInput {
  const codes = [...requiredSubjects, ...values.electiveCodes]
  return {
    purpose: values.purpose as Goal['purpose'],
    electiveCodes: [...values.electiveCodes],
    scores: Object.fromEntries(codes.map((code) => [code, parseDecimal(values.scores[code] ?? '')])),
    currentScores: Object.fromEntries(
      codes
        .filter((code) => (values.currentScores?.[code] ?? '').trim() !== '')
        .map((code) => [code, parseDecimal(values.currentScores?.[code] ?? '')]),
    ),
    months: Number(values.months),
    dailyMinutes: Math.round(parseDecimal(values.dailyHours) * 60),
    days: [...values.days].sort((a, b) => a - b),
  }
}

/** Số giờ nên học mỗi tuần theo mục tiêu (ước tính; chỉ để cảnh báo, không chặn tạo lịch). */
export function getWeeklyHoursEstimate(
  goal: Pick<Goal, 'purpose' | 'electiveCodes' | 'scores' | 'months'>,
): number | null {
  const scores = [...requiredSubjects, ...goal.electiveCodes].map((code) => goal.scores[code])
  if (!scores.every((s): s is number => typeof s === 'number' && Number.isFinite(s) && s >= 0 && s <= 10))
    return null
  const average = scores.reduce((total, score) => total + score, 0) / scores.length
  const base = (goal.purpose === 'university_admission' ? 6 : 4) + average / 2
  return Math.ceil(base * (goal.months <= 3 ? 1.2 : 1))
}

/** Ánh xạ khóa lỗi của backend sang tên trường của biểu mẫu. */
export function toFormField(serverField: string): string {
  if (serverField === 'electives') return 'electiveCodes'
  if (serverField === 'dailyMinutes') return 'dailyHours'
  if (serverField === 'purpose' || serverField === 'months' || serverField === 'days') return serverField
  if (serverField.startsWith('current_')) return `currentScores.${serverField.slice('current_'.length)}`
  return `scores.${serverField}`
}
