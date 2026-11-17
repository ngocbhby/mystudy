import { api } from '@/lib/http/client'
import type { AttemptDetail, ExamDetail, ExamFilters, ExamList, SubmitAttemptPayload } from '../model/types'

export const examApi = {
  list: ({ subject, year }: ExamFilters) =>
    api.get<ExamList>('/api/exams', { params: { subject: subject || undefined, year: year || undefined } }),
  detail: (id: string) => api.get<ExamDetail>(`/api/exams/${id}`),
  answers: (id: string) => api.get<ExamDetail>(`/api/exams/${id}/answers`),
  submitAttempt: (id: string, payload: SubmitAttemptPayload) =>
    api.post<AttemptDetail>(`/api/exams/${id}/attempts`, payload),
  latestAttempt: (id: string) => api.get<AttemptDetail | null>(`/api/exams/${id}/attempts/latest`),
  getAttempt: (id: string, attemptId: string) =>
    api.get<AttemptDetail>(`/api/exams/${id}/attempts/${attemptId}`),
}
