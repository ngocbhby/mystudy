import { api } from '@/lib/http/client'
import type { AiStatus, ExplanationResult, TopicNote, WeaknessAnalysis } from '../model/types'

/**
 * AI có thể cần 20–60 giây để trả lời (dài hơn hạn 15 giây mặc định của API thường), nên các lệnh gọi AI chờ lâu hơn.
 * Máy chủ chờ Gemini/Claude tối đa 90 giây và thử lại một lần khi quá tải.
 */
const AI_TIMEOUT = { timeout: 150_000 }

interface ExplainRequest {
  examId: string
  attemptId: string
  questionNumber: number
}

export const aiApi = {
  status: () => api.get<AiStatus>('/api/ai/status'),
  explain: (request: ExplainRequest) => api.post<ExplanationResult>('/api/ai/explanations', request, AI_TIMEOUT),
  reportExplanation: (request: ExplainRequest) => api.post<void>('/api/ai/explanations/report', request),
  topicNote: (topicId: string) => api.get<TopicNote>(`/api/topics/${topicId}/note`),
  generateTopicNote: (topicId: string) => api.post<TopicNote>(`/api/ai/topics/${topicId}/note`, {}, AI_TIMEOUT),
  weakness: () => api.get<WeaknessAnalysis>('/api/ai/weakness'),
  generateWeaknessReport: () => api.post<WeaknessAnalysis>('/api/ai/weakness/report', {}, AI_TIMEOUT),
  rebuildPlan: () => api.post<unknown>('/api/study/plan/rebuild', {}),
}

export const aiKeys = {
  all: ['ai'] as const,
  status: () => [...aiKeys.all, 'status'] as const,
  topicNote: (topicId: string) => [...aiKeys.all, 'topicNote', topicId] as const,
  weakness: () => [...aiKeys.all, 'weakness'] as const,
}
