import { api } from '@/lib/http/client'
import type { AdminExamSummary, CreateExamPayload, UpdateExamPayload } from '../types'

export const adminApi = {
  listExams: () => api.get<AdminExamSummary[]>('/api/admin/exams'),

  createExam: (payload: CreateExamPayload) => api.post<AdminExamSummary>('/api/admin/exams', payload),

  updateExam: (id: string, payload: UpdateExamPayload) =>
    api.put<AdminExamSummary>(`/api/admin/exams/${id}`, payload),

  deleteExam: (id: string) => api.delete<{ deleted: boolean; id: string }>(`/api/admin/exams/${id}`),

  uploadPdf: async (file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    return api.post<{ url: string }>('/api/admin/exams/upload-pdf', formData)
  },
}
