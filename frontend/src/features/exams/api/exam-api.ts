import { api } from '@/lib/http/client'
import type { ExamDetail, ExamFilters, ExamList } from '../model/types'

export const examApi = {
  list: ({ subject, year }: ExamFilters) =>
    api.get<ExamList>('/api/exams', { params: { subject: subject || undefined, year: year || undefined } }),
  detail: (id: string) => api.get<ExamDetail>(`/api/exams/${id}`),
  answers: (id: string) => api.get<ExamDetail>(`/api/exams/${id}/answers`),
}
