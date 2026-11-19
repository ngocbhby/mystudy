import { api } from '@/lib/http/client'
import type {
  AttemptDetail,
  ExamDetail,
  ExamFilters,
  ExamList,
  StartedAttempt,
  SubmitAttemptPayload,
} from '../model/types'

/** Header mang token lượt thi của khách (không đăng nhập); máy chủ chỉ lưu hash của token. */
const ATTEMPT_TOKEN = 'X-Attempt-Token'
const tokenHeader = (token?: string | null) => (token ? { headers: { [ATTEMPT_TOKEN]: token } } : undefined)

export const examApi = {
  list: ({ subject, year }: ExamFilters) =>
    api.get<ExamList>('/api/exams', { params: { subject: subject || undefined, year: year || undefined } }),
  detail: (id: string) => api.get<ExamDetail>(`/api/exams/${id}`),
  /** Chỉ quản trị viên; học sinh xem đáp án qua kết quả lượt thi đã nộp. */
  answers: (id: string) => api.get<ExamDetail>(`/api/exams/${id}/answers`),
  startAttempt: (id: string) => api.post<StartedAttempt>(`/api/exams/${id}/attempts/start`, {}),
  submitAttempt: (id: string, attemptId: string, payload: SubmitAttemptPayload, token?: string | null) =>
    api.post<AttemptDetail>(`/api/exams/${id}/attempts/${attemptId}/submit`, payload, tokenHeader(token)),
  latestAttempt: (id: string) => api.get<AttemptDetail | null>(`/api/exams/${id}/attempts/latest`),
  getAttempt: (id: string, attemptId: string, token?: string | null) =>
    api.get<AttemptDetail>(`/api/exams/${id}/attempts/${attemptId}`, tokenHeader(token)),
}
