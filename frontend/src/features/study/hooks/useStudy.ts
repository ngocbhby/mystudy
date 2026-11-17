import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { staleTimes } from '@/lib/query/query-client'
import { studyApi } from '../api/study-api'
import { studyKeys } from '../api/keys'
import type { GoalInput, StudyGoalData } from '../model/types'

export function useStudyGoal(enabled = true) {
  return useQuery({
    queryKey: studyKeys.goal(),
    queryFn: studyApi.getGoal,
    staleTime: staleTimes.goal,
    enabled,
  })
}

/** `today` nằm trong khóa cache nên sang ngày mới dữ liệu tự được nạp lại. */
export function useOverview(today: string, enabled: boolean) {
  return useQuery({
    queryKey: studyKeys.overview(today),
    queryFn: studyApi.getOverview,
    staleTime: staleTimes.tasks,
    enabled,
    refetchOnWindowFocus: true,
  })
}

export function useWeekTasks(from: string, to: string) {
  return useQuery({
    queryKey: studyKeys.tasks(from, to),
    queryFn: () => studyApi.getTasks(from, to),
    staleTime: staleTimes.tasks,
    placeholderData: (previous) => previous,
  })
}

export function useSaveGoal() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (goal: GoalInput) => studyApi.saveGoal(goal),
    onSuccess: async (data) => {
      queryClient.setQueryData<StudyGoalData>(studyKeys.goal(), data)
      // Lịch đã được xếp lại ở backend: bỏ cache nhiệm vụ cũ.
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: studyKeys.overviews() }),
        queryClient.invalidateQueries({ queryKey: studyKeys.allTasks() }),
      ])
    },
  })
}

export function useCompleteTask() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => studyApi.completeTask(id),
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: studyKeys.all }),
      ]),
  })
}

export function useUncompleteTask() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => studyApi.uncompleteTask(id),
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: studyKeys.all }),
      ]),
  })
}
