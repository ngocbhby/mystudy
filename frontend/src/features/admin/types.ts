import type { ExamSummary } from '@/features/exams/model/types'

export interface CreateQuestionPayload {
  prompt: string
  options: string[]
  correctOptionNumber: number
  explanation?: string
}

export interface CreateExamPayload {
  subjectCode: string
  title: string
  kind: 'past_paper' | 'mystudy_practice'
  examYear: number
  durationMinutes: number
  sourceName?: string
  paperUrl?: string
  answerGuideUrl?: string
  questions?: CreateQuestionPayload[]
}

export interface UpdateExamPayload {
  title: string
  subjectCode?: string
  examYear?: number
  durationMinutes?: number
  sourceName?: string
  paperUrl?: string
  answerGuideUrl?: string
}

export type AdminExamSummary = ExamSummary
