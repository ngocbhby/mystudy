/** Khóa cache cho dữ liệu học tập. Mọi truy vấn/invalidate đều đi qua đây để tránh lệch chuỗi khóa. */
export const studyKeys = {
  all: ['study'] as const,
  goal: () => [...studyKeys.all, 'goal'] as const,
  overview: (today: string) => [...studyKeys.all, 'overview', today] as const,
  overviews: () => [...studyKeys.all, 'overview'] as const,
  tasks: (from: string, to: string) => [...studyKeys.all, 'tasks', from, to] as const,
  allTasks: () => [...studyKeys.all, 'tasks'] as const,
}
