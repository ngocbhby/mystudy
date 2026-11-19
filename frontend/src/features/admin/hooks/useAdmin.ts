import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { adminApi } from '../api/admin-api'
import type { CreateExamPayload, UpdateExamPayload } from '../types'

export const adminKeys = {
  all: ['admin'] as const,
  exams: () => [...adminKeys.all, 'exams'] as const,
}

export function useAdminExams() {
  return useQuery({
    queryKey: adminKeys.exams(),
    queryFn: adminApi.listExams,
  })
}

export function useCreateExam() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateExamPayload) => adminApi.createExam(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: adminKeys.all })
      void queryClient.invalidateQueries({ queryKey: ['exams'] })
    },
  })
}

export function useUpdateExam() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateExamPayload }) =>
      adminApi.updateExam(id, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: adminKeys.all })
      void queryClient.invalidateQueries({ queryKey: ['exams'] })
    },
  })
}

export function useDeleteExam() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => adminApi.deleteExam(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: adminKeys.all })
      void queryClient.invalidateQueries({ queryKey: ['exams'] })
    },
  })
}

export function useUploadPdf() {
  return useMutation({
    mutationFn: (file: File) => adminApi.uploadPdf(file),
  })
}
