import { useQuery } from '@tanstack/react-query'
import { staleTimes } from '@/lib/query/query-client'
import { examApi } from '../api/exam-api'
import { examKeys } from '../api/keys'
import type { ExamFilters } from '../model/types'

/** Kho đề gần như bất biến: cache dài, giữ dữ liệu cũ khi đổi bộ lọc để danh sách không nhấp nháy. */
export function useExamList(filters: ExamFilters) {
  return useQuery({
    queryKey: examKeys.list(filters),
    queryFn: () => examApi.list(filters),
    staleTime: staleTimes.static,
    placeholderData: (previous) => previous,
  })
}

export function useExamDetail(id: string | undefined, withAnswers: boolean) {
  return useQuery({
    queryKey: withAnswers ? examKeys.answers(id ?? '') : examKeys.detail(id ?? ''),
    queryFn: () => (withAnswers ? examApi.answers(id!) : examApi.detail(id!)),
    staleTime: staleTimes.static,
    enabled: Boolean(id),
  })
}

export function useLatestAttempt(id: string | undefined) {
  return useQuery({
    queryKey: examKeys.latestAttempt(id ?? ''),
    queryFn: () => examApi.latestAttempt(id!),
    enabled: Boolean(id),
    staleTime: 0,
  })
}
