import { api } from '@/lib/http/client'
import type { GoalInput, Overview, StudyGoalData, Task } from '../model/types'

export const studyApi = {
  getGoal: () => api.get<StudyGoalData>('/api/study/goal'),
  saveGoal: (goal: GoalInput) => api.post<StudyGoalData>('/api/study/goal', goal),
  getOverview: () => api.get<Overview>('/api/study/overview'),
  getTasks: (from: string, to: string) =>
    api.get<{ tasks: Task[] }>('/api/study/tasks', { params: { from, to } }).then((r) => r.tasks),
  completeTask: (id: string) => api.post<void>('/api/study/tasks', { id }),
  uncompleteTask: (id: string) => api.post<void>('/api/study/tasks/uncomplete', { id }),
}
