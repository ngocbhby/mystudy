import { requiredSubjects } from '@mystudy/shared/study-goal'

export const weekdays = [
  ['T2', 'Thứ Hai'], ['T3', 'Thứ Ba'], ['T4', 'Thứ Tư'], ['T5', 'Thứ Năm'],
  ['T6', 'Thứ Sáu'], ['T7', 'Thứ Bảy'], ['CN', 'Chủ nhật'],
]

export const initialGoal = {
  purpose: 'university_admission',
  electiveCodes: ['physics', 'english'],
  scores: { math: 8, literature: 7.5, physics: 8, english: 8.5 },
  months: 6,
  dailyMinutes: 90,
  days: [1, 2, 3, 4, 5],
}

export const formatNumber = new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 2 }).format
export const formatScore = new Intl.NumberFormat('vi-VN', {
  minimumFractionDigits: 1, maximumFractionDigits: 2,
}).format
export const parseDecimal = (value) => /^\d+(?:[.,]\d{1,2})?$/.test(String(value).trim())
  ? Number(String(value).trim().replace(',', '.'))
  : NaN

export function getTimeEstimate(goal) {
  const scores = [...requiredSubjects, ...goal.electiveCodes].map((code) => goal.scores[code])
  if (!scores.every((score) => Number.isFinite(score) && score >= 0 && score <= 10)) return null
  const average = scores.reduce((total, score) => total + score, 0) / scores.length
  const base = (goal.purpose === 'university_admission' ? 6 : 4) + average / 2
  return Math.ceil(base * (goal.months <= 3 ? 1.2 : 1))
}
