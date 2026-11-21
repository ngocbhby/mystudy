import { api } from '@/lib/http/client'
import type { Sample } from '@/features/samples/model/types'
import type {
  AdminExamSummary,
  ConvertedQuestionItem,
  CreateExamPayload,
  CreateSamplePayload,
  UpdateExamPayload,
} from '../types'

export const adminApi = {
  listExams: () => api.get<AdminExamSummary[]>('/api/admin/exams'),

  createExam: (payload: CreateExamPayload) => api.post<AdminExamSummary>('/api/admin/exams', payload),

  updateExam: (id: string, payload: UpdateExamPayload) =>
    api.put<AdminExamSummary>(`/api/admin/exams/${id}`, payload),

  deleteExam: (id: string) => api.delete<{ deleted: boolean; id: string }>(`/api/admin/exams/${id}`),

  createSample: (payload: CreateSamplePayload) => api.post<Sample>('/api/admin/samples', payload),

  updateSample: (id: string, payload: CreateSamplePayload) =>
    api.put<Sample>(`/api/admin/samples/${id}`, payload),

  deleteSample: (id: string) => api.delete<void>(`/api/admin/samples/${id}`),

  uploadPdf: async (file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    return api.post<{ url: string }>('/api/admin/exams/upload-pdf', formData)
  },

  convertPdf: async (file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    return api.post<ConvertedQuestionItem[]>('/api/admin/exams/convert-pdf', formData)
  },

  convertText: (text: string) =>
    api.post<ConvertedQuestionItem[]>('/api/admin/exams/convert-text', { text }),
}
