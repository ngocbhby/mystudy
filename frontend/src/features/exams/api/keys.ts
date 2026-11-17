import type { ExamFilters } from '../model/types'

export const examKeys = {
  all: ['exams'] as const,
  list: (filters: ExamFilters) => [...examKeys.all, 'list', filters] as const,
  detail: (id: string) => [...examKeys.all, 'detail', id] as const,
  answers: (id: string) => [...examKeys.all, 'answers', id] as const,
  latestAttempt: (id: string) => [...examKeys.all, 'latestAttempt', id] as const,
}
