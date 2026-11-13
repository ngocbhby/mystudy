export async function studyRequest(path, options) {
  try {
    const response = await fetch('/api/study/' + path, options)
    const data = await response.json()
    if (response.ok) return data
    const error = new Error(data.error ?? 'Không thể xử lý yêu cầu. Vui lòng thử lại.')
    error.fields = data.errors
    error.status = response.status
    throw error
  } catch (error) {
    if (error.name === 'AbortError' || error.status) throw error
    throw new Error('Không thể kết nối với máy chủ. Vui lòng thử lại.')
  }
}

export const saveGoal = (goal) => studyRequest('goal', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(goal),
})

export const completeTask = (id) => studyRequest('tasks', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ id }),
})
